import { NextResponse } from 'next/server';
export async function GET(request: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    const rdRows = await prisma.$queryRaw<
      { id: string; name: string; code: string }[]
    >`
      SELECT id, name, code
      FROM corpus.jurisdiction
      WHERE code = 'DO' OR name ILIKE '%dominicana%'
      ORDER BY name ASC
      LIMIT 1
    `;

    const rd = rdRows?.[0];
    if (!rd) {
      return NextResponse.json({ found: false, error: 'Jurisdiccion RD no encontrada' }, { status: 404 });
    }

    if (companyId) {
      const versionRow = await prisma.$queryRaw<
        { id: string; framework_id: string }[]
      >`
        SELECT fv.id, fv.framework_id
        FROM corpus.framework_version fv
        JOIN pendiente.corpus_framework f ON f.id = fv.framework_id
        WHERE f.jurisdiction_id = ${rd.id}
        ORDER BY fv.created_at DESC NULLS LAST, fv.version DESC NULLS LAST
        LIMIT 1
      `;

      if (!versionRow || versionRow.length === 0) {
        return NextResponse.json({ found: false });
      }

      return NextResponse.json({
        found: true,
        jurisdictionId: rd.id,
        frameworkId: versionRow[0].framework_id,
        frameworkSourceId: versionRow[0].id,
        frameworkVersionId: versionRow[0].framework_version_id,
      });
    }

    const companies = await prisma.$queryRaw`
      SELECT id, name, code
      FROM corpus.company
      WHERE status_id = 1
        AND jurisdiction_id = ${rd.id}
    `;
    const jurisdictions = [rd];
    const frameworks = await prisma.$queryRaw`
      SELECT id, name, code
      FROM pendiente.corpus_framework
      WHERE jurisdiction_id = ${rd.id}
    `;
    const frameworkSourcesRaw = await prisma.$queryRaw`
      SELECT fs.id, fs.citation, fs.framework_version_id, fv.framework_id
      FROM corpus.framework_source fs
      JOIN corpus.framework_version fv ON fv.id = fs.framework_version_id
      JOIN pendiente.corpus_framework f ON f.id = fv.framework_id
      WHERE f.jurisdiction_id = ${rd.id}
      ORDER BY fs.created_at DESC NULLS LAST, fs.id DESC
    `;
    const frameworkSources = (frameworkSourcesRaw as any[]).map((v) => ({
      id: v.id,
      citation: v.citation,
      frameworkVersionId: v.framework_version_id,
      frameworkId: v.framework_id,
    }));

    const frameworkVersionsRaw = await prisma.$queryRaw`
      SELECT fv.id, fv.version, fv.framework_id
      FROM corpus.framework_version fv
      JOIN pendiente.corpus_framework f ON f.id = fv.framework_id
      WHERE f.jurisdiction_id = ${rd.id}
      ORDER BY fv.created_at DESC NULLS LAST, fv.version DESC NULLS LAST
    `;
    const frameworkVersions = (frameworkVersionsRaw as any[]).map((v) => ({
      id: v.id,
      version: v.version,
      frameworkId: v.framework_id,
    }));

    return NextResponse.json({
      companies,
      jurisdictions,
      frameworks,
      frameworkSources,
      frameworkVersions,
    });
  } catch (error: any) {
    console.error('Error fetching superintendence context:', error);
    return NextResponse.json({ error: 'Failed to fetch context' }, { status: 500 });
  }
}
