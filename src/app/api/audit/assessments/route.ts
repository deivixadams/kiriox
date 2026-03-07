import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthContext } from '@/lib/auth-server';

function isAdmin(roleCode: string) {
  return roleCode === 'ADMIN';
}

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const where = isAdmin(auth.roleCode) ? {} : { company_id: auth.tenantId };

    const rows = await prisma.corpusAssessment.findMany({
      where,
      include: {
        company: { select: { name: true } },
        framework_version: { select: { version: true, corpus_framework: { select: { name: true } } } }
      },
      orderBy: { created_at: 'desc' }
    });

    const data = rows.map((row: any) => {
      const frameworkLabel = row.framework_version
        ? `${row.framework_version.corpus_framework?.name ?? 'Marco'} v${row.framework_version.version ?? ''}`.trim()
        : 'Sin marco';
      return {
        id: row.id,
        name: row.name,
        company: row.company?.name ?? 'Sin empresa',
        framework: frameworkLabel,
        status: 'Registrado',
        findings: 0,
        readiness: null,
        createdAt: row.created_at?.toISOString()
      };
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }
}
