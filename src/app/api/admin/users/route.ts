import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';
import { requireCsrf } from '@/lib/csrf';
import { hashPassword } from '@/lib/auth';
import { getRequestMeta } from '@/lib/request-meta';

function isAdmin(roleCode: string) {
    return roleCode === 'ADMIN';
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
        const users = await prisma.securityUser.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                lastName: true,
                isActive: true,
                activationStatus: true,
                createdAt: true,
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
            },
            orderBy: { createdAt: 'desc' }
        });

        // Flatten roles for the frontend
        const formattedUsers = users.map(u => ({
            ...u,
            roles: u.user_x_rbac.map(ux => ux.role)
        }));

        return NextResponse.json(formattedUsers);
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

        const companyExists = await prisma.corpusCompany.findUnique({
            where: { id: tenantId }
        });
        if (!companyExists) {
            return NextResponse.json({ error: 'Company not found' }, { status: 400 });
        }

        const existingUser = await prisma.securityUser.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists', userId: existingUser.id }, { status: 409 });
        }

        const passwordHash = await hashPassword(password);

        const role = await prisma.securityRbac.findUnique({
            where: { roleCode: roleCode || 'OPERATOR' }
        });

        const newUser = await prisma.securityUser.create({
            data: {
                tenantId,
                email,
                passwordHash,
                name,
                lastName: lastName || null,
                whatsapp: whatsapp || null,
                roleId: role ? role.id : null,
                isActive: true,
                activationStatus: 'active',
                mustChangePassword: mustChangePassword !== false,
                passwordUpdatedAt: new Date()
            }
        });

        if (Array.isArray(scopes) && scopes.length > 0) {
            await prisma.securityUserScope.createMany({
                data: scopes.map((scope: any) => ({
                    userId: newUser.id,
                    jurisdictionId: scope.jurisdictionId || null,
                    frameworkVersionId: scope.frameworkVersionId || null,
                    domainId: scope.domainId || null,
                    isAllowed: scope.isAllowed !== false,
                    createdBy: auth.userId
                })),
                skipDuplicates: true
            });
        }

        const meta = getRequestMeta(request);
        await prisma.corpusAuditLog.create({
            data: {
                tenantId,
                entityName: 'security_users',
                entityId: newUser.id,
                action: 'create',
                newData: {
                    email: newUser.email,
                    name: newUser.name,
                    lastName: newUser.lastName,
                    roleCode: roleCode || 'OPERATOR',
                    isActive: newUser.isActive,
                    activationStatus: newUser.activationStatus
                },
                changedBy: auth.userId,
                ipAddress: meta.ipAddress,
                userAgent: meta.userAgent
            }
        });

        return NextResponse.json({
            success: true,
            userId: newUser.id
        });
    } catch (error: any) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
