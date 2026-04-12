import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';
import { requireCsrf } from '@/lib/csrf';
import { hashPassword } from '@/lib/auth';
import { getRequestMeta } from '@/lib/request-meta';

function isAdmin(roleCode: string) {
    const code = (roleCode || '').trim().toLowerCase();
    return code === 'admin' || code === 'super_admin';
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
        const body = await request.json();
        const { password } = body;

        if (!password) {
            return NextResponse.json({ error: 'Password is required' }, { status: 400 });
        }

        const existingUser = await prisma.securityUser.findUnique({
            where: { id },
            select: { id: true }
        });

        if (!existingUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const passwordHash = await hashPassword(password);

        await prisma.securityUser.update({
            where: { id },
            data: {
                password_hash: passwordHash,
                must_change_password: true,
                password_updated_at: new Date(),
                updated_at: new Date()
            }
        });

        const meta = getRequestMeta(request);
        try {
            await prisma.corpusAuditLog.create({
                data: {
                    tenant_id: auth.tenantId,
                    entity_name: 'security_users',
                    entity_id: id,
                    action: 'reset_password',
                    new_data: {
                        must_change_password: true
                    },
                    changed_by: auth.userId,
                    ip_address: meta.ipAddress,
                    user_agent: meta.userAgent
                }
            });
        } catch (auditError: any) {
            // Audit logging is best-effort in environments where corpus.audit_log is unavailable.
            console.warn('Skipping audit log for password reset:', auditError?.code || auditError?.message || auditError);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error resetting password:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
