import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';
import { requireCsrf } from '@/lib/csrf';

function isAdmin(roleCode: string) {
    return roleCode === 'ADMIN';
}

export async function GET() {
    const auth = await getAuthContext();
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!isAdmin(auth.roleCode)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const companies = await prisma.$queryRaw<Array<{
            id: string;
            name: string;
            code: string;
            is_active: boolean;
            created_at: Date;
            updated_at: Date;
        }>>(Prisma.sql`
            SELECT id, name, code, is_active, created_at, updated_at
            FROM core.company
            ORDER BY name ASC
        `);
        return NextResponse.json(companies);
    } catch (error: any) {
        console.error('Error fetching companies:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
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
        const { name, code } = body;

        if (!name || !code) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existing = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
            SELECT id
            FROM core.company
            WHERE code = ${code}
            LIMIT 1
        `);
        if (existing.length > 0) {
            return NextResponse.json({ error: 'Company code already exists', companyId: existing[0].id }, { status: 409 });
        }

        const inserted = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
            INSERT INTO core.company (name, code, is_active)
            VALUES (${name}, ${code}, true)
            RETURNING id
        `);

        return NextResponse.json({ success: true, companyId: inserted[0].id });
    } catch (error: any) {
        console.error('Error creating company:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

