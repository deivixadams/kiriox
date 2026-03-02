import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { getAuthContext } from '@/lib/auth-server';
import { requireCsrf } from '@/lib/csrf';
import { randomBytes } from 'crypto';

function isAdmin(roleCode: string) {
    return roleCode === 'ADMIN';
}

function generateTempPassword() {
    return randomBytes(8).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
}

export async function POST(request: Request) {
    try {
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

        const { email, name, lastName, whatsapp, roleCode } = await request.json();

        if (!email || !name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.securityUser.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        const tempPassword = generateTempPassword();
        const passwordHash = await hashPassword(tempPassword);

        const role = await prisma.securityRbac.findUnique({
            where: { roleCode: roleCode || 'OPERATOR' }
        });

        // Create the user
        const newUser = await prisma.securityUser.create({
            data: {
                tenantId: auth.tenantId,
                email,
                passwordHash,
                name,
                lastName: lastName || null,
                whatsapp: whatsapp || null,
                roleId: role ? role.id : null,
                isActive: true,
                activationStatus: 'active',
                mustChangePassword: true,
                passwordUpdatedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            userId: newUser.id,
            tempPassword,
            message: 'User created successfully'
        });

    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
