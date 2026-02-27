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
    if (!roleCode) {
        return NextResponse.json({ error: 'Missing role_code' }, { status: 400 });
    }

    try {
        const permissions = await prisma.securityRbac.findMany({
            where: { roleCode },
            select: { permissionCode: true }
        });

        return NextResponse.json({
            roleCode,
            permissions: permissions.map((p) => p.permissionCode)
        });
    } catch (error: any) {
        console.error('Error fetching RBAC:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
