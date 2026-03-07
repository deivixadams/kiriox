import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';

const JWT_COOKIE = 'cre_auth';
const CSRF_COOKIE = 'csrf_token';

export type AuthContext = {
    userId: string;
    tenantId: string;
    roleCode: string;
    email?: string;
};

function getDevBypassFallback(): AuthContext {
    return {
        userId: process.env.DEV_AUTH_USER_ID || '00000000-0000-0000-0000-000000000001',
        tenantId: process.env.DEV_AUTH_TENANT_ID || '00000000-0000-0000-0000-000000000001',
        roleCode: process.env.DEV_AUTH_ROLE_CODE || 'ADMIN',
        email: process.env.DEV_AUTH_EMAIL || 'dev@local'
    };
}

function getJwtSecret(): Uint8Array {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not configured');
    }
    return new TextEncoder().encode(secret);
}

export async function signAuthToken(payload: AuthContext): Promise<string> {
    const secret = getJwtSecret();
    return new SignJWT({
        tenant_id: payload.tenantId,
        role_code: payload.roleCode,
        email: payload.email
    })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(payload.userId)
        .setIssuedAt()
        .setExpirationTime('30m')
        .sign(secret);
}

export async function getAuthContext(): Promise<AuthContext | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get(JWT_COOKIE)?.value;
    if (!token) {
        if (process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_BYPASS === '1') {
            try {
                const adminUser = await prisma.securityUser.findFirst({
                    where: {
                        is_active: true,
                        user_x_rbac: { some: { security_rbac: { role_code: 'ADMIN', is_active: true } } }
                    },
                    include: { user_x_rbac: { include: { security_rbac: true } } },
                    orderBy: { created_at: 'asc' }
                });
                const fallbackUser = adminUser ?? await prisma.securityUser.findFirst({
                    where: { is_active: true },
                    include: { user_x_rbac: { include: { security_rbac: true } } },
                    orderBy: { created_at: 'asc' }
                });
                if (fallbackUser) {
                    const rbac = fallbackUser.user_x_rbac?.find((r: any) => r.security_rbac?.role_code)?.security_rbac;
                    return {
                        userId: fallbackUser.id,
                        tenantId: fallbackUser.tenant_id,
                        roleCode: rbac?.role_code || 'ADMIN',
                        email: fallbackUser.email
                    };
                }
            } catch (error) {
                console.warn('DEV_AUTH_BYPASS fallback used due to auth lookup error:', error);
                return getDevBypassFallback();
            }
            return getDevBypassFallback();
        }
        return null;
    }

    try {
        const secret = getJwtSecret();
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.sub;
        const tenantId = payload.tenant_id;
        const roleCode = payload.role_code;
        if (!userId || !tenantId || !roleCode) return null;

        return {
            userId: String(userId),
            tenantId: String(tenantId),
            roleCode: String(roleCode),
            email: payload.email ? String(payload.email) : undefined
        };
    } catch {
        if (process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_BYPASS === '1') {
            try {
                const adminUser = await prisma.securityUser.findFirst({
                    where: {
                        is_active: true,
                        user_x_rbac: { some: { security_rbac: { role_code: 'ADMIN', is_active: true } } }
                    },
                    include: { user_x_rbac: { include: { security_rbac: true } } },
                    orderBy: { created_at: 'asc' }
                });
                const fallbackUser = adminUser ?? await prisma.securityUser.findFirst({
                    where: { is_active: true },
                    include: { user_x_rbac: { include: { security_rbac: true } } },
                    orderBy: { created_at: 'asc' }
                });
                if (fallbackUser) {
                    const rbac = fallbackUser.user_x_rbac?.find((r: any) => r.security_rbac?.role_code)?.security_rbac;
                    return {
                        userId: fallbackUser.id,
                        tenantId: fallbackUser.tenant_id,
                        roleCode: rbac?.role_code || 'ADMIN',
                        email: fallbackUser.email
                    };
                }
            } catch (error) {
                console.warn('DEV_AUTH_BYPASS fallback used due to auth lookup error:', error);
                return getDevBypassFallback();
            }
            return getDevBypassFallback();
        }
        return null;
    }
}

export function getAuthCookieName() {
    return JWT_COOKIE;
}

export function getCsrfCookieName() {
    return CSRF_COOKIE;
}
