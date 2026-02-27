import { NextResponse } from 'next/server';
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
        const companies = await prisma.corpusCompany.findMany({
            select: { id: true, name: true, code: true, statusId: true, createdAt: true, updatedAt: true },
            orderBy: { name: 'asc' }
        });
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
        const { name, code, legalName, statusId } = body;

        if (!name || !code) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const existing = await prisma.corpusCompany.findUnique({ where: { code } });
        if (existing) {
            return NextResponse.json({ error: 'Company code already exists', companyId: existing.id }, { status: 409 });
        }

        const company = await prisma.corpusCompany.create({
            data: {
                name,
                code,
                legalName: legalName || null,
                statusId: typeof statusId === 'number' ? statusId : 1
            }
        });

        return NextResponse.json({ success: true, companyId: company.id });
    } catch (error: any) {
        console.error('Error creating company:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
