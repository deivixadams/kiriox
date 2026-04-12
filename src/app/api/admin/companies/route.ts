import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';
import { requireCsrf } from '@/lib/csrf';

function isAdmin(roleCode: string) {
    return roleCode === 'ADMIN';
}

export async function GET(request: Request) {
    const auth = await getAuthContext();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isAdmin(auth.roleCode)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(request.url || '', 'http://localhost');
    const status = searchParams.get('status');

    try {
        const sql = status === 'ALL' 
            ? Prisma.sql`
                SELECT id, name, code, description, legal_name as "legalName", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
                FROM core.company
                ORDER BY name ASC
            `
            : Prisma.sql`
                SELECT id, name, code, description, legal_name as "legalName", is_active as "isActive", created_at as "createdAt", updated_at as "updatedAt"
                FROM core.company
                WHERE is_active = true
                ORDER BY name ASC
            `;

        const companies = await prisma.$queryRaw<Array<{
            id: string;
            name: string;
            code: string;
            description: string | null;
            legalName: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        }>>(sql);
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
        let { name, code, description, legalName, isActive } = body;

        if (!name) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!code) {
            // Generar codigo automatico: primeras 4 letras + random 4 digitos
            const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const prefix = cleanName.substring(0, 4);
            const random = Math.floor(1000 + Math.random() * 9000);
            code = `${prefix}${random}`;
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
            INSERT INTO core.company (name, code, description, legal_name, is_active)
            VALUES (${name}, ${code}, ${description || null}, ${legalName || null}, ${isActive ?? true})
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
        const { id, name, code, description, legalName, isActive } = body;

        if (!id || !name || !code) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await prisma.$executeRaw(Prisma.sql`
            UPDATE core.company
            SET name = ${name}, 
                code = ${code}, 
                description = ${description || null},
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

        // Hard delete: remove the record permanently
        await prisma.$executeRaw(Prisma.sql`
            DELETE FROM core.company
            WHERE id = ${id}::uuid
        `);

        return NextResponse.json({ success: true, deleted: true });
    } catch (error: any) {
        console.error('Error deleting company:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

