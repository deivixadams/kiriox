import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-server';
import { buildReportData, renderReportDocx } from '@/lib/audit-report';

export const runtime = 'nodejs';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const data = await buildReportData(auth, id);
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    const buffer = await renderReportDocx(data);
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Informe_Auditoria_${id}.docx"`
      }
    });
  } catch (error: any) {
    console.error('Error generating audit report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
