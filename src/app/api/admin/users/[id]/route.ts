import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';
import { requireCsrf } from '@/lib/csrf';
import { getRequestMeta } from '@/lib/request-meta';

function isAdmin(roleCode: string) {
  return roleCode === 'ADMIN';
}

function normalizeRoleCode(code: string): string {
  const value = String(code || '').trim();
  if (!value) return '';
  if (value.toUpperCase() === 'ADMIN') return 'super_admin';
  return value.toLowerCase();
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await getAuthContext();
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!isAdmin(auth.roleCode)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const users = await prisma.$queryRaw<
      {
        id: string;
        email: string;
        name: string | null;
        last_name: string | null;
        whatsapp: string | null;
        is_active: boolean | null;
        activation_status: string | null;
        must_change_password: boolean | null;
        created_at: Date | null;
        updated_at: Date | null;
        company_id: string | null;
        direct_role_id: string | null;
      }[]
    >(Prisma.sql`
      SELECT
        u.id,
        u.email,
        u.name,
        u.last_name,
        u.whatsapp,
        u.is_active,
        u.activation_status,
        u.must_change_password,
        u.created_at,
        u.updated_at,
        u.role_id as direct_role_id,
        cu.company_id
      FROM security.security_users u
      LEFT JOIN security.company_user cu
        ON cu.user_id = u.id
       AND COALESCE(cu.is_active, true) = true
      WHERE u.id = ${id}::uuid
      ORDER BY COALESCE(cu.is_primary, false) DESC, cu.created_at ASC
      LIMIT 1
    `);

    const user = users[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Primary source: new user-role mapping table
    let roles = await prisma.$queryRaw<{ roleCode: string; roleName: string | null }[]>(
      Prisma.sql`
        SELECT DISTINCT r.code AS "roleCode", r.name AS "roleName"
        FROM security.map_users_x_roles mur
        JOIN security.role r ON r.id = mur.role_id
        WHERE mur.user_id = ${id}::uuid
          AND COALESCE(mur.is_active, true) = true
          AND COALESCE(r.is_active, true) = true
      `
    );

    // Backward-compat fallback with legacy table.
    if (roles.length === 0) {
      roles = await prisma.$queryRaw<{ roleCode: string; roleName: string | null }[]>(
        Prisma.sql`
          SELECT DISTINCT r.code AS "roleCode", r.name AS "roleName"
          FROM security.company_user_role cur
          JOIN security.role r ON r.id = cur.role_id
          WHERE cur.user_id = ${id}::uuid
            AND COALESCE(cur.is_active, true) = true
            AND COALESCE(r.is_active, true) = true
        `
      );
    }

    // Final fallback: direct role_id column on security_users.
    if (roles.length === 0 && user.direct_role_id) {
       const directRoles = await prisma.$queryRaw<{ roleCode: string; roleName: string | null }[]>(
         Prisma.sql`SELECT code as "roleCode", name as "roleName" FROM security.role WHERE id = ${user.direct_role_id}::uuid`
       );
       if (directRoles.length > 0) roles = directRoles;
    }

    const rawScopes = await prisma.securityUserScope.findMany({
      where: { user_id: id },
      select: {
        jurisdiction_id: true,
        framework_version_id: true,
        domain_id: true,
        is_allowed: true,
      },
    });

    const scopes = rawScopes.map(s => ({
      jurisdictionId: s.jurisdiction_id,
      frameworkVersionId: s.framework_version_id,
      domainId: s.domain_id,
      isAllowed: s.is_allowed
    }));

    return NextResponse.json({
      user: {
        id: user.id,
        tenantId: user.company_id,
        email: user.email,
        name: user.name,
        lastName: user.last_name,
        whatsapp: user.whatsapp,
        isActive: Boolean(user.is_active),
        activationStatus: user.activation_status ?? 'active',
        mustChangePassword: Boolean(user.must_change_password),
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        roles,
        roleCode: roles[0]?.roleCode || 'OPERATOR' // Add a direct roleCode field for convenience
      },
      scopes,
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    const { email, name, lastName, whatsapp, roleCodes, isActive, scopes } = body;

    const existingRows = await prisma.$queryRaw<{ id: string; email: string }[]>(
      Prisma.sql`SELECT id, email FROM security.security_users WHERE id = ${id}::uuid LIMIT 1`
    );
    if (existingRows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const existingUser = existingRows[0];

    if (email && email !== existingUser.email) {
      const emailExists = await prisma.securityUser.findUnique({ where: { email } });
      if (emailExists) {
        return NextResponse.json({ error: 'Email already exists', userId: emailExists.id }, { status: 409 });
      }
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.$executeRaw(
        Prisma.sql`
          UPDATE security.security_users
          SET
            email = COALESCE(${email ?? null}, email),
            name = COALESCE(${name ?? null}, name),
            last_name = ${lastName ?? null},
            whatsapp = ${whatsapp ?? null},
            is_active = COALESCE(${typeof isActive === 'boolean' ? isActive : null}, is_active),
            updated_at = NOW()
          WHERE id = ${id}::uuid
        `
      );

      if (Array.isArray(roleCodes)) {
        const canonicalRoleCodes = Array.from(
          new Set(
            roleCodes
              .map((code: string) => normalizeRoleCode(code))
              .filter((code: string) => Boolean(code))
          )
        );

        const normalizedLookupCodes = canonicalRoleCodes.map((code: string) => code.toLowerCase());
        const roleRows = normalizedLookupCodes.length
          ? ((await tx.$queryRaw(
              Prisma.sql`
                SELECT id, code
                FROM security.role
                WHERE LOWER(code) IN (${Prisma.join(normalizedLookupCodes)})
                  AND COALESCE(is_active, true) = true
              `
            )) as { id: string; code: string }[])
          : [];

        await tx.$executeRaw(
          Prisma.sql`
            DELETE FROM security.map_users_x_roles
            WHERE user_id = ${id}::uuid
          `
        );

        if (roleRows.length > 0) {
          for (const role of roleRows) {
            await tx.$executeRaw(
              Prisma.sql`
                INSERT INTO security.map_users_x_roles (user_id, role_id, is_active, created_at, updated_at)
                VALUES (${id}::uuid, ${role.id}::uuid, true, NOW(), NOW())
              `
            );
          }
        }

        // Keep legacy table aligned to avoid breaking existing authorization queries.
        await tx.$executeRaw(
          Prisma.sql`
            DELETE FROM security.company_user_role
            WHERE user_id = ${id}::uuid
              AND company_id = ${auth.tenantId}::uuid
          `
        );

        for (const role of roleRows) {
          await tx.$executeRaw(
            Prisma.sql`
              INSERT INTO security.company_user_role (company_id, user_id, role_id, is_active)
              VALUES (${auth.tenantId}::uuid, ${id}::uuid, ${role.id}::uuid, true)
              ON CONFLICT (company_id, user_id, role_id)
              DO UPDATE SET is_active = true, updated_at = NOW()
            `
          );
        }
      }

      if (Array.isArray(scopes)) {
        await tx.securityUserScope.deleteMany({
          where: { user_id: id },
        });

        if (scopes.length > 0) {
          await tx.securityUserScope.createMany({
            data: scopes.map((scope: any) => ({
              user_id: id,
              jurisdiction_id: scope.jurisdictionId || null,
              framework_version_id: scope.frameworkVersionId || null,
              domain_id: scope.domainId || null,
              is_allowed: scope.isAllowed !== false,
              created_by: auth.userId,
            })),
            skipDuplicates: true,
          });
        }
      }
    });

    const meta = getRequestMeta(request);
    try {
      await prisma.corpusAuditLog.create({
        data: {
          tenant_id: auth.tenantId,
          entity_name: 'security_users',
          entity_id: id,
          action: 'update',
          new_data: {
            email,
            name,
            lastName,
            roleCodes: roleCodes ?? null,
            isActive: typeof isActive === 'boolean' ? isActive : null,
          },
          changed_by: auth.userId,
          ip_address: meta.ipAddress,
          user_agent: meta.userAgent,
        },
      });
    } catch (auditError: any) {
      // Audit logging is best-effort in environments where corpus.audit_log is unavailable.
      console.warn('Skipping audit log for user update:', auditError?.code || auditError?.message || auditError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
