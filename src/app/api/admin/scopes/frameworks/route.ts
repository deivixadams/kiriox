import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';

export async function GET(request: Request) {
    const auth = await getAuthContext();
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jurisdictionId = searchParams.get('jurisdiction_id');
    if (!jurisdictionId) {
        return NextResponse.json({ error: 'Missing jurisdiction_id' }, { status: 400 });
    }

    try {
        const frameworks = await prisma.corpusFramework.findMany({
            where: { jurisdictionId },
            select: { id: true, code: true, name: true },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(frameworks);
    } catch (error: any) {
        console.error('Error fetching frameworks:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
