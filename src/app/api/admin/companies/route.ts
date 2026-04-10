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
            legalName: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        }>>(Prisma.sql`
            SELECT id, name, code, legal_name as "legalName", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
            FROM score.company
            WHERE is_active = true
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
        const { name, code, legalName } = body;

        if (!name || !code) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existing = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
            SELECT id
            FROM score.company
            WHERE code = ${code}
            LIMIT 1
        `);
        if (existing.length > 0) {
            return NextResponse.json({ error: 'Company code already exists', companyId: existing[0].id }, { status: 409 });
        }

        const inserted = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
            INSERT INTO score.company (name, code, legal_name, is_active)
            VALUES (${name}, ${code}, ${legalName || null}, true)
            RETURNING id
        `);

        return NextResponse.json({ success: true, companyId: inserted[0].id });
    } catch (error: any) {
        console.error('Error creating company:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(auth.roleCode)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!(await requireCsrf(request))) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });

    try {
        const body = await request.json();
        const { id, name, code, legalName, isActive } = body;

        if (!id || !name || !code) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await prisma.$executeRaw(Prisma.sql`
            UPDATE score.company
            SET name = ${name}, 
                code = ${code}, 
                legal_name = ${legalName || null}, 
                is_active = ${isActive ?? true},
                updated_at = NOW()
            WHERE id = ${id}::uuid
        `);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating company:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(auth.roleCode)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (!(await requireCsrf(request))) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing company ID' }, { status: 400 });
        }

        // Soft delete: set is_active = false
        await prisma.$executeRaw(Prisma.sql`
            UPDATE score.company
            SET is_active = false,
                updated_at = NOW()
            WHERE id = ${id}::uuid
        `);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting company:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

