import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';
import { requireCsrf } from '@/lib/csrf';
import { getRequestMeta } from '@/lib/request-meta';

function isAdmin(roleCode: string) {
    return roleCode === 'ADMIN';
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
    const auth = await getAuthContext();
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdmin(auth.roleCode)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const user = await prisma.securityUser.findFirst({
            where: { id: params.id },
            select: {
                id: true,
                tenantId: true,
                email: true,
                name: true,
                lastName: true,
                whatsapp: true,
                roleCode: true,
                isActive: true,
                activationStatus: true,
                mustChangePassword: true,
                createdAt: true,
                updatedAt: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const scopes = await prisma.securityUserScope.findMany({
            where: { userId: params.id },
            select: {
                jurisdictionId: true,
                frameworkVersionId: true,
                domainId: true,
                isAllowed: true
            }
        });

        return NextResponse.json({ user, scopes });
    } catch (error: any) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
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
        const { email, name, lastName, whatsapp, roleCode, isActive, scopes } = body;

        const existingUser = await prisma.securityUser.findFirst({
            where: { id: params.id }
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

        const updatedUser = await prisma.securityUser.update({
            where: { id: params.id },
            data: {
                email: email ?? existingUser.email,
                name: name ?? existingUser.name,
                lastName: lastName ?? existingUser.lastName,
                whatsapp: whatsapp ?? existingUser.whatsapp,
                roleCode: roleCode ?? existingUser.roleCode,
                isActive: typeof isActive === 'boolean' ? isActive : existingUser.isActive
            }
        });

        if (Array.isArray(scopes)) {
            await prisma.securityUserScope.deleteMany({
                where: { userId: params.id }
            });

            if (scopes.length > 0) {
                await prisma.securityUserScope.createMany({
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

        const meta = getRequestMeta(request);
        await prisma.corpusAuditLog.create({
            data: {
                tenantId: auth.tenantId,
                entityName: 'security_users',
                entityId: updatedUser.id,
                action: 'update',
                newData: {
                    email: updatedUser.email,
                    name: updatedUser.name,
                    lastName: updatedUser.lastName,
                    roleCode: updatedUser.roleCode,
                    isActive: updatedUser.isActive
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
