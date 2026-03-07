import { NextResponse } from 'next/server';
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domainIds = searchParams.getAll('domain_id');
    if (domainIds.length === 0) {
      return NextResponse.json([]);
    }

    const prisma = (await import('@/lib/prisma')).default;
    const obligations = await prisma.$queryRaw<
      { id: string; title: string; code: string | null; domain_id: string }[]
    >`
      SELECT id, title, code, domain_id
      FROM corpus.obligation
      WHERE domain_id = ANY(${domainIds}::uuid[])
      ORDER BY title ASC
    `;

    const normalized = (obligations || []).map((o) => ({
      id: o.id,
      title: o.title,
      code: o.code,
      domainId: o.domain_id,
    }));
    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error('Error fetching obligations:', error);
    return NextResponse.json({ error: 'Failed to fetch obligations' }, { status: 500 });
  }
}
