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
  if (code === 'ADMIN') return 'super_admin';
  return code.toLowerCase();
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

    const roles = await prisma.$queryRaw<{ roleCode: string; roleName: string | null }[]>(
      Prisma.sql`
        SELECT DISTINCT r.code AS "roleCode", r.name AS "roleName"
        FROM security.company_user_role cur
        JOIN security.role r ON r.id = cur.role_id
        WHERE cur.user_id = ${id}::uuid
          AND COALESCE(cur.is_active, true) = true
          AND COALESCE(r.is_active, true) = true
      `
    );

    const scopes = await prisma.securityUserScope.findMany({
      where: { userId: id },
      select: {
        jurisdictionId: true,
        frameworkVersionId: true,
        domainId: true,
        isAllowed: true,
      },
    });

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
        const canonicalRoleCodes = roleCodes.map((code: string) => normalizeRoleCode(code));
        const roleRows = (await tx.$queryRaw(
          Prisma.sql`
            SELECT id, code
            FROM security.role
            WHERE code IN (${Prisma.join(canonicalRoleCodes)})
              AND COALESCE(is_active, true) = true
          `
        )) as { id: string; code: string }[];

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
          where: { userId: id },
        });

        if (scopes.length > 0) {
          await tx.securityUserScope.createMany({
            data: scopes.map((scope: any) => ({
              userId: id,
              jurisdictionId: scope.jurisdictionId || null,
              frameworkVersionId: scope.frameworkVersionId || null,
              domainId: scope.domainId || null,
              isAllowed: scope.isAllowed !== false,
              createdBy: auth.userId,
            })),
            skipDuplicates: true,
          });
        }
      }
    });

    const meta = getRequestMeta(request);
    await prisma.corpusAuditLog.create({
      data: {
        tenantId: auth.tenantId,
        entityName: 'security_users',
        entityId: id,
        action: 'update',
        newData: {
          email,
          name,
          lastName,
          roleCodes,
          isActive,
        },
        changedBy: auth.userId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
