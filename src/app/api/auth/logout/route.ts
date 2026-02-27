import { NextResponse } from 'next/server';
import { getAuthCookieName, getCsrfCookieName } from '@/lib/auth-server';

export async function POST() {
    const response = NextResponse.json({ success: true });

    response.cookies.set(getAuthCookieName(), '', {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0
    });

    response.cookies.set(getCsrfCookieName(), '', {
        httpOnly: false,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0
    });

    return response;
}
