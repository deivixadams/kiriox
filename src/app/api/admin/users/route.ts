import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';
import { requireCsrf } from '@/lib/csrf';
import { hashPassword } from '@/lib/auth';
import { getRequestMeta } from '@/lib/request-meta';

function isAdmin(roleCode: string) {
  return roleCode === 'ADMIN';
}

function normalizeRoleCode(code?: string): string {
  const value = String(code || '').trim();
  if (!value) return 'super_admin';
  if (value.toUpperCase() === 'ADMIN') return 'super_admin';
  return value.toLowerCase();
}

export async function GET() {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdmin(auth.roleCode)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const rows = await prisma.$queryRaw<
      {
        id: string;
        email: string;
        name: string | null;
        last_name: string | null;
        is_active: boolean | null;
        activation_status: string | null;
        created_at: Date | null;
        role_code: string | null;
        role_name: string | null;
      }[]
    >(Prisma.sql`
      SELECT
        u.id,
        u.email,
        u.name,
        u.last_name,
        u.is_active,
        u.activation_status,
        u.created_at,
        r.code AS role_code,
        r.name AS role_name
      FROM security.security_users u
      LEFT JOIN security.map_users_x_roles mur
        ON mur.user_id = u.id
       AND COALESCE(mur.is_active, true) = true
      LEFT JOIN security.role r
        ON r.id = mur.role_id
       AND COALESCE(r.is_active, true) = true
      ORDER BY u.created_at DESC NULLS LAST
    `);

    const grouped = new Map<
      string,
      {
        id: string;
        email: string;
        name: string | null;
        lastName: string | null;
        isActive: boolean;
        activationStatus: string;
        createdAt: Date | null;
        roles: { roleCode: string; roleName: string | null }[];
      }
    >();

    for (const row of rows) {
      if (!grouped.has(row.id)) {
        grouped.set(row.id, {
          id: row.id,
          email: row.email,
          name: row.name,
          lastName: row.last_name,
          isActive: Boolean(row.is_active),
          activationStatus: row.activation_status ?? 'active',
          createdAt: row.created_at,
          roles: [],
        });
      }

      if (row.role_code) {
        grouped.get(row.id)!.roles.push({
          roleCode: row.role_code,
          roleName: row.role_name,
        });
      }
    }

    return NextResponse.json(Array.from(grouped.values()));
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdmin(auth.roleCode)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!(await requireCsrf(request))) {
    return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { tenantId, email, name, lastName, whatsapp, roleCode, roleCodes, scopes, password, mustChangePassword } = body;

    if (!email || !name || !tenantId || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const companyRows = await prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`SELECT id FROM core.company WHERE id = ${tenantId}::uuid LIMIT 1`
    );
    if (companyRows.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    const existingUser = await prisma.securityUser.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists', userId: existingUser.id }, { status: 409 });
    }

    const requestedRoleCodes = Array.from(
      new Set(
        (Array.isArray(roleCodes) && roleCodes.length > 0 ? roleCodes : [roleCode])
          .map((code: string) => normalizeRoleCode(code))
          .filter((code: string) => Boolean(code))
      )
    );
    if (requestedRoleCodes.length === 0) {
      return NextResponse.json({ error: 'At least one role is required' }, { status: 400 });
    }

    const normalizedLookupCodes = requestedRoleCodes.map((code) => code.toLowerCase());
    const roleRows = await prisma.$queryRaw<{ id: string; code: string }[]>(
      Prisma.sql`
        SELECT id, code
        FROM security.role
        WHERE LOWER(code) IN (${Prisma.join(normalizedLookupCodes)})
          AND COALESCE(is_active, true) = true
      `
    );
    if (roleRows.length === 0) {
      return NextResponse.json({ error: `Roles not found: ${requestedRoleCodes.join(', ')}` }, { status: 400 });
    }

    const passwordHash = await hashPassword(password);

    const userRows = await prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`
        INSERT INTO security.security_users (
          email, password_hash, name, last_name, whatsapp, is_active, activation_status, must_change_password, password_updated_at
        )
        VALUES (
          ${email}, ${passwordHash}, ${name}, ${lastName || null}, ${whatsapp || null}, true, 'active', ${
            mustChangePassword !== false
          }, NOW()
        )
        RETURNING id
      `
    );
    const userId = userRows[0].id;

    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO security.company_user (company_id, user_id, is_active, is_primary)
        VALUES (${tenantId}::uuid, ${userId}::uuid, true, true)
        ON CONFLICT DO NOTHING
      `
    );

    for (const role of roleRows) {
      await prisma.$executeRaw(
        Prisma.sql`
          INSERT INTO security.map_users_x_roles (user_id, role_id, is_active, created_at, updated_at)
          VALUES (${userId}::uuid, ${role.id}::uuid, true, NOW(), NOW())
        `
      );
    }

    // Keep legacy table aligned to avoid breaking existing authorization queries.
    for (const role of roleRows) {
      await prisma.$executeRaw(
        Prisma.sql`
          INSERT INTO security.company_user_role (company_id, user_id, role_id, is_active)
          VALUES (${tenantId}::uuid, ${userId}::uuid, ${role.id}::uuid, true)
          ON CONFLICT (company_id, user_id, role_id)
          DO UPDATE SET is_active = true, updated_at = NOW()
        `
      );
    }

    if (Array.isArray(scopes) && scopes.length > 0) {
      await prisma.securityUserScope.createMany({
        data: scopes.map((scope: any) => ({
          userId,
          jurisdictionId: scope.jurisdictionId || null,
          frameworkVersionId: scope.frameworkVersionId || null,
          domainId: scope.domainId || null,
          isAllowed: scope.isAllowed !== false,
          createdBy: auth.userId,
        })),
        skipDuplicates: true,
      });
    }

    const meta = getRequestMeta(request);
    try {
      await prisma.corpusAuditLog.create({
        data: {
          tenant_id: tenantId,
          entity_name: 'security_users',
          entity_id: userId,
          action: 'create',
          new_data: {
            email,
            name,
            lastName: lastName || null,
            roleCodes: requestedRoleCodes,
            isActive: true,
            activationStatus: 'active',
          },
          changed_by: auth.userId,
          ip_address: meta.ipAddress,
          user_agent: meta.userAgent,
        },
      });
    } catch (auditError: any) {
      // Audit logging is best-effort in environments where corpus.audit_log is unavailable.
      console.warn('Skipping audit log for user create:', auditError?.code || auditError?.message || auditError);
    }

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


