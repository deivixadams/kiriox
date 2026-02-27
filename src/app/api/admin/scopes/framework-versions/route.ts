import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';

export async function GET(request: Request) {
    const auth = await getAuthContext();
    if (!auth) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const frameworkId = searchParams.get('framework_id');
    if (!frameworkId) {
        return NextResponse.json({ error: 'Missing framework_id' }, { status: 400 });
    }

    try {
        const versions = await prisma.corpusFrameworkVersion.findMany({
            where: { frameworkId },
            select: { id: true, version: true, status: true, statusId: true, createdAt: true },
            orderBy: { createdAt: 'desc' }
        });
        const response = versions.map((v) => ({
            ...v,
            isActive: v.statusId === 1 || v.status === 'active'
        }));
        return NextResponse.json(response);
    } catch (error: any) {
        console.error('Error fetching framework versions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
