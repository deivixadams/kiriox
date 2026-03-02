import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';

function isAdmin(roleCode: string) {
    return roleCode === 'ADMIN';
}

export async function GET(request: Request) {
    const auth = await getAuthContext();
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdmin(auth.roleCode)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const roleCode = searchParams.get('role_code');

    try {
        if (roleCode) {
            const role = await prisma.securityRbac.findFirst({
                where: { roleCode }
            });

            return NextResponse.json({
                roleCode,
                permissions: role ? [role.roleName || roleCode] : []
            });
        }

        // Return all active roles if no specific roleCode requested
        const roles = await prisma.securityRbac.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json(roles);
    } catch (error: any) {
        console.error('Error fetching RBAC:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
