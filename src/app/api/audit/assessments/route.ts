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

    const where = isAdmin(auth.roleCode) ? {} : { companyId: auth.tenantId };

    const rows = await prisma.corpusAssessment.findMany({
      where,
      include: {
        company: { select: { name: true } },
        frameworkVersion: { select: { version: true, framework: { select: { name: true } } } },
        corpus_catalog_status: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const data = rows.map((row) => {
      const frameworkLabel = row.frameworkVersion
        ? `${row.frameworkVersion.framework?.name ?? 'Marco'} v${row.frameworkVersion.version ?? ''}`.trim()
        : 'Sin marco';
      return {
        id: row.id,
        name: row.name,
        company: row.company?.name ?? 'Sin empresa',
        framework: frameworkLabel,
        status: row.corpus_catalog_status?.name ?? 'Registrado',
        findings: 0,
        readiness: null,
        createdAt: row.createdAt?.toISOString()
      };
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }
}
