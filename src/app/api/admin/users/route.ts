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
  if (!code) return 'super_admin';
  if (code === 'ADMIN') return 'super_admin';
  return code.toLowerCase();
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
      LEFT JOIN security.company_user_role cur
        ON cur.user_id = u.id
       AND COALESCE(cur.is_active, true) = true
      LEFT JOIN security.role r
        ON r.id = cur.role_id
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
    const { tenantId, email, name, lastName, whatsapp, roleCode, scopes, password, mustChangePassword } = body;

    if (!email || !name || !tenantId || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const companyRows = await prisma.$queryRaw<{ id: string }[]>(
      Prisma.sql`SELECT id FROM security.company WHERE id = ${tenantId}::uuid LIMIT 1`
    );
    if (companyRows.length === 0) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    const existingUser = await prisma.securityUser.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists', userId: existingUser.id }, { status: 409 });
    }

    const canonicalRoleCode = normalizeRoleCode(roleCode);
    const roleRows = await prisma.$queryRaw<{ id: string; code: string }[]>(
      Prisma.sql`
        SELECT id, code
        FROM security.role
        WHERE code = ${canonicalRoleCode}
          AND COALESCE(is_active, true) = true
        LIMIT 1
      `
    );
    if (roleRows.length === 0) {
      return NextResponse.json({ error: `Role not found: ${canonicalRoleCode}` }, { status: 400 });
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

    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO security.company_user_role (company_id, user_id, role_id, is_active)
        VALUES (${tenantId}::uuid, ${userId}::uuid, ${roleRows[0].id}::uuid, true)
        ON CONFLICT (company_id, user_id, role_id)
        DO UPDATE SET is_active = true, updated_at = NOW()
      `
    );

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
    await prisma.corpusAuditLog.create({
      data: {
        tenantId,
        entityName: 'security_users',
        entityId: userId,
        action: 'create',
        newData: {
          email,
          name,
          lastName: lastName || null,
          roleCode: canonicalRoleCode,
          isActive: true,
          activationStatus: 'active',
        },
        changedBy: auth.userId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    return NextResponse.json({ success: true, userId });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

