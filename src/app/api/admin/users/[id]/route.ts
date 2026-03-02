import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';
import { requireCsrf } from '@/lib/csrf';
import { getRequestMeta } from '@/lib/request-meta';

function isAdmin(roleCode: string) {
    return roleCode === 'ADMIN';
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
        const user = await prisma.securityUser.findFirst({
            where: { id: id },
            select: {
                id: true,
                tenantId: true,
                email: true,
                name: true,
                lastName: true,
                whatsapp: true,
                roleId: true,
                isActive: true,
                activationStatus: true,
                mustChangePassword: true,
                createdAt: true,
                updatedAt: true,
                user_x_rbac: {
                    where: { isActive: true },
                    select: {
                        role: {
                            select: {
                                roleCode: true,
                                roleName: true
                            }
                        }
                    }
                }
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Flatten roles
        const formattedUser = {
            ...user,
            roles: user.user_x_rbac.map(ux => ux.role)
        };

        const scopes = await prisma.securityUserScope.findMany({
            where: { userId: id },
            select: {
                jurisdictionId: true,
                frameworkVersionId: true,
                domainId: true,
                isAllowed: true
            }
        });

        return NextResponse.json({ user: formattedUser, scopes });
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

        const existingUser = await prisma.securityUser.findFirst({
            where: { id: id },
            include: { user_x_rbac: { include: { role: true } } }
        });

        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (email && email !== existingUser.email) {
            const emailExists = await prisma.securityUser.findUnique({ where: { email } });
            if (emailExists) {
                return NextResponse.json({ error: 'Email already exists', userId: emailExists.id }, { status: 409 });
            }
        }

        // Use transaction for user and role updates
        await prisma.$transaction(async (tx) => {
            // Update base user info
            await tx.securityUser.update({
                where: { id: id },
                data: {
                    email: email ?? existingUser.email,
                    name: name ?? existingUser.name,
                    lastName: lastName ?? existingUser.lastName,
                    whatsapp: whatsapp ?? existingUser.whatsapp,
                    isActive: typeof isActive === 'boolean' ? isActive : existingUser.isActive
                }
            });

            // Update roles if provided
            if (Array.isArray(roleCodes)) {
                // Delete existing mappings
                await tx.user_x_rbac.deleteMany({
                    where: { userId: id }
                });

                // Get new role IDs
                const rawRoles = await tx.securityRbac.findMany({
                    where: { roleCode: { in: roleCodes } }
                });

                if (rawRoles.length > 0) {
                    await tx.user_x_rbac.createMany({
                        data: rawRoles.map(r => ({
                            userId: id,
                            roleId: r.id,
                            isActive: true
                        }))
                    });
                }
            }

            // Update scopes if provided
            if (Array.isArray(scopes)) {
                await tx.securityUserScope.deleteMany({
                    where: { userId: id }
                });

                if (scopes.length > 0) {
                    await tx.securityUserScope.createMany({
                        data: scopes.map((scope: any) => ({
                            userId: params.id,
                            jurisdictionId: scope.jurisdictionId || null,
                            frameworkVersionId: scope.frameworkVersionId || null,
                            domainId: scope.domainId || null,
                            isAllowed: scope.isAllowed !== false,
                            createdBy: auth.userId
                        })),
                        skipDuplicates: true
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
                    isActive
                },
                changedBy: auth.userId,
                ipAddress: meta.ipAddress,
                userAgent: meta.userAgent
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
