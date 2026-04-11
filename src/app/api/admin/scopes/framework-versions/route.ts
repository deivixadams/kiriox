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
        const versions = await prisma.frameworkVersion.findMany({
            where: { framework_id: frameworkId },
            select: { id: true, version: true, status: true, status_id: true, created_at: true },
            orderBy: { created_at: 'desc' }
        });
        const response = versions.map((v: any) => ({
            id: v.id,
            version: v.version,
            status: v.status,
            statusId: v.status_id,
            createdAt: v.created_at,
            isActive: v.status_id === 1 || v.status === 'active'
        }));
        return NextResponse.json(response);
    } catch (error: any) {
        console.error('Error fetching framework versions:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
