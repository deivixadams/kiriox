import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';
import { requireCsrf } from '@/lib/csrf';
import { hashPassword } from '@/lib/auth';
import { randomBytes } from 'crypto';
import { getRequestMeta } from '@/lib/request-meta';

function isAdmin(roleCode: string) {
    return roleCode === 'ADMIN';
}

function generateTempPassword() {
    return randomBytes(8).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
        const userRows = await prisma.$queryRaw<{ id: string }[]>(
            Prisma.sql`
              SELECT u.id
              FROM security.security_users u
              JOIN security.company_user cu ON cu.user_id = u.id
              WHERE u.id = ${id}::uuid
                AND cu.company_id = ${auth.tenantId}::uuid
                AND COALESCE(u.is_active, true) = true
                AND COALESCE(cu.is_active, true) = true
              LIMIT 1
            `
        );

        if (userRows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const tempPassword = generateTempPassword();
        const passwordHash = await hashPassword(tempPassword);

        await prisma.securityUser.update({
            where: { id: id },
            data: {
                passwordHash,
                mustChangePassword: true,
                passwordUpdatedAt: new Date()
            }
        });

        const meta = getRequestMeta(request);
        await prisma.corpusAuditLog.create({
            data: {
                tenantId: auth.tenantId,
                entityName: 'security_users',
                entityId: id,
                action: 'reset_password',
                newData: {
                    mustChangePassword: true
                },
                changedBy: auth.userId,
                ipAddress: meta.ipAddress,
                userAgent: meta.userAgent
            }
        });

        return NextResponse.json({ success: true, tempPassword });
    } catch (error: any) {
        console.error('Error resetting password:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
