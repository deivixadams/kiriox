import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';
import { requireCsrf } from '@/lib/csrf';
import { getRequestMeta } from '@/lib/request-meta';

function isAdmin(roleCode: string) {
  const code = (roleCode || '').trim().toLowerCase();
  const allowed = code === 'admin' || code === 'super_admin';
  if (!allowed) console.log(`[AUTH] Access denied for role: "${roleCode}"`);
  return allowed;
}

function normalizeRoleCode(code: string): string {
  const value = String(code || '').trim();
  if (!value) return '';
  if (value.toUpperCase() === 'ADMIN' || value.toLowerCase() === 'super_admin') return 'super_admin';
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
    const user = await prisma.security_users.findUnique({
      where: { id },
      include: {
        user_x_rbac: {
          where: { is_active: true },
          include: {
            security_rbac: {
              select: { code: true, name: true }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const roles = user.user_x_rbac.map(r => ({
      roleCode: r.security_rbac.code,
      roleName: r.security_rbac.name
    }));

    const rawScopes = await prisma.security_user_scope.findMany({
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
        roleCode: roles[0]?.roleCode || 'OPERATOR'
      },
      scopes,
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
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
    const { email, name, lastName, whatsapp, roleCodes, isActive, scopes, tenantId } = body;

    const existingUser = await prisma.security_users.findUnique({
      where: { id },
      select: { id: true, email: true, company_id: true }
    });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (email && email !== existingUser.email) {
      const emailExistsUser = await prisma.security_users.findUnique({
        where: { email },
        select: { id: true }
      });
      if (emailExistsUser) {
        return NextResponse.json({ error: 'Email already exists', userId: emailExistsUser.id }, { status: 409 });
      }
    }

    await prisma.$transaction(async (tx) => {
      const targetCompanyId = tenantId || existingUser.company_id || auth.tenantId;

      const dataToUpdate: any = { updated_at: new Date() };
      if (tenantId !== undefined) dataToUpdate.company_id = tenantId;
      if (email !== undefined) dataToUpdate.email = email;
      if (name !== undefined) dataToUpdate.name = name;
      if (lastName !== undefined) dataToUpdate.last_name = lastName;
      if (whatsapp !== undefined) dataToUpdate.whatsapp = whatsapp;
      if (isActive !== undefined) {
        dataToUpdate.is_active = isActive;
        dataToUpdate.activation_status = isActive ? 'active' : 'inactive';
      }

      await tx.security_users.update({
        where: { id },
        data: dataToUpdate
      });

      if (Array.isArray(roleCodes)) {
        const canonicalRoleCodes = Array.from(
          new Set(
            roleCodes
              .map((code: string) => normalizeRoleCode(code))
              .filter((code: string) => Boolean(code))
          )
        );

        const roleRows = await tx.security_rbac.findMany({
          where: {
            code: { in: canonicalRoleCodes, mode: 'insensitive' },
            is_active: true
          },
          select: { id: true, code: true }
        });

        await tx.user_x_rbac.deleteMany({
          where: { user_id: id }
        });

        if (roleRows.length > 0) {
          await tx.user_x_rbac.createMany({
            data: roleRows.map(role => ({
              user_id: id,
              role_id: role.id,
              is_active: true
            }))
          });
        }

        await tx.security_company_user_role.deleteMany({
          where: { user_id: id }
        });

        if (roleRows.length > 0) {
          await tx.security_company_user_role.createMany({
            data: roleRows.map(role => ({
              company_id: targetCompanyId,
              user_id: id,
              role_id: role.id,
              is_active: true
            }))
          });
        }
      }

      if (Array.isArray(scopes)) {
        await tx.security_user_scope.deleteMany({
          where: { user_id: id },
        });

        if (scopes.length > 0) {
          await tx.security_user_scope.createMany({
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
      console.warn('Skipping audit log for user update:', auditError?.message);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    await prisma.$transaction(async (tx) => {
      // Clean up relations first
      await tx.user_x_rbac.deleteMany({ where: { user_id: id } });
      await tx.security_company_user_role.deleteMany({ where: { user_id: id } });
      await tx.security_user_scope.deleteMany({ where: { user_id: id } });
      await tx.security_user_token.deleteMany({ where: { user_id: id } });
      
      // Finally delete the user
      await tx.security_users.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
