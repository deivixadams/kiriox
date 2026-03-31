import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

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
        userId: process.env.DEV_AUTH_USER_ID || '11111111-1111-1111-1111-111111111111',
        tenantId: process.env.DEV_AUTH_TENANT_ID || '22222222-2222-2222-2222-222222222222',
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
