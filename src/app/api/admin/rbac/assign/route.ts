import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';

function isAdmin(roleCode: string) { return roleCode === 'ADMIN'; }

/**
 * POST /api/admin/rbac/assign
 * Body: { userId, roleId, companyId? }
 * Inserts into security.company_user_role
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

        await prisma.$executeRaw(
            Prisma.sql`
                INSERT INTO security.company_user_role (company_id, user_id, role_id, is_active)
                VALUES (${companyId}::uuid, ${userId}::uuid, ${roleId}::uuid, true)
                ON CONFLICT (company_id, user_id, role_id)
                DO UPDATE SET is_active = true, updated_at = now()
            `
        );

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        console.error('Error assigning user to role:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
