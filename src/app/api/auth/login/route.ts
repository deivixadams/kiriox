import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { signAuthToken, getAuthCookieName, getCsrfCookieName } from '@/lib/auth-server';
import { createCsrfToken } from '@/lib/csrf';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
        }

        // Find the user
        const user = await prisma.securityUser.findUnique({
            where: { email }
        });

        if (!user || !user.isActive) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        await prisma.securityUser.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
        });

        // Return user info (excluding password hash)
        const { passwordHash: _, ...userWithoutPassword } = user;

        const token = await signAuthToken({
            userId: user.id,
            tenantId: user.tenantId,
            roleCode: user.roleCode,
            email: user.email
        });
        const csrfToken = createCsrfToken();

        const response = NextResponse.json({
            success: true,
            user: userWithoutPassword,
            message: 'Login successful'
        });

        response.cookies.set(getAuthCookieName(), token, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            path: '/'
        });

        response.cookies.set(getCsrfCookieName(), csrfToken, {
            httpOnly: false,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            path: '/'
        });

        return response;

    } catch (error: any) {
        console.error('Login error:', error);
        const message = process.env.NODE_ENV === 'production' ? 'Internal server error' : (error?.message || 'Internal server error');
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
