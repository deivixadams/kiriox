import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';

export async function GET() {
    const auth = await getAuthContext();
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const jurisdictions = await prisma.jurisdiction.findMany({
            select: { id: true, code: true, name: true },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(jurisdictions);
    } catch (error: any) {
        console.error('Error fetching jurisdictions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
