import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';

function isAdmin(roleCode: string) {
    const code = (roleCode || '').trim().toLowerCase();
    return code === 'admin' || code === 'super_admin';
}

/**
 * POST /api/admin/rbac/assign
 * Body: { userId, roleId }
 */
export async function POST(request: Request) {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(auth.roleCode)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    try {
        const { userId, roleId } = await request.json();
        if (!userId || !roleId) {
            return NextResponse.json({ error: 'userId y roleId son obligatorios' }, { status: 400 });
        }

        const companyId = auth.tenantId;

        // Use native Prisma to handle upsert/assignment
        await prisma.security_company_user_role.upsert({
            where: {
                company_id_user_id_role_id: {
                    company_id: companyId,
                    user_id: userId,
                    role_id: roleId
                }
            },
            update: {
                is_active: true,
                updated_at: new Date()
            },
            create: {
                company_id: companyId,
                user_id: userId,
                role_id: roleId,
                is_active: true
            }
        });

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('Error assigning user to role:', error);
        return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
    }
}
