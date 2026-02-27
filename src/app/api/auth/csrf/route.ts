import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-server';
import { createCsrfToken } from '@/lib/csrf';
import { getCsrfCookieName } from '@/lib/auth-server';

export async function GET() {
    const auth = await getAuthContext();
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const csrfToken = createCsrfToken();
    const response = NextResponse.json({ success: true });
    response.cookies.set(getCsrfCookieName(), csrfToken, {
        httpOnly: false,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 2
    });
    return response;
}
