import { NextResponse } from 'next/server';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ runId: string; controlId: string }> }
) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const { runId, controlId } = await params;
    const body = await request.json();
    const evaluation = body?.evaluation;

    if (!runId || !controlId || !evaluation) {
      return NextResponse.json({ error: 'Missing runId/controlId/evaluation' }, { status: 400 });
    }

    const existing = await prisma.run_control_draft.findUnique({
      where: { run_id_control_id: { run_id: runId, control_id: controlId } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Control draft not found' }, { status: 404 });
    }

    let reasons: any = existing.reasons ?? {};
    if (Array.isArray(reasons)) {
      reasons = { selection: reasons };
    }
    reasons.evaluation_4d = evaluation;

    await prisma.run_control_draft.update({
      where: { run_id_control_id: { run_id: runId, control_id: controlId } },
      data: { reasons },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error saving 4D control evaluation:', error);
    return NextResponse.json({ error: 'Failed to save evaluation' }, { status: 500 });
  }
}
