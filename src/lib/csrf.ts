import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';
import { getCsrfCookieName } from './auth-server';

const CSRF_HEADER = 'x-csrf-token';

export function createCsrfToken(): string {
    return randomBytes(32).toString('hex');
}

export function getCsrfHeaderName(): string {
    return CSRF_HEADER;
}

export async function getCsrfTokenFromCookie(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(getCsrfCookieName())?.value || null;
}

export async function requireCsrf(request: Request): Promise<boolean> {
    if (process.env.NODE_ENV !== 'production') {
        return true;
    }
    const cookieToken = await getCsrfTokenFromCookie();
    const headerToken = request.headers.get(CSRF_HEADER);
    if (!cookieToken || !headerToken) return false;
    return cookieToken === headerToken;
}
