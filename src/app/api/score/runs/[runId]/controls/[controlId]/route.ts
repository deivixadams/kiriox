import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ runId: string; controlId: string }> }
) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const { runId, controlId } = await params;

    if (!runId || !controlId) {
      return NextResponse.json({ error: 'Missing runId/controlId' }, { status: 400 });
    }

    const control = await prisma.control.findUnique({
      where: { id: controlId },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        control_objective: true,
        owner_role: true,
        evidence_required: true,
      },
    });

    if (!control) {
      return NextResponse.json({ error: 'Control not found' }, { status: 404 });
    }

    const dimensionModel = await prisma.controltest_dimension_model.findMany({
      select: {
        dimension: true,
        weight: true,
        is_gate: true,
        min_dimension_score: true,
        evidence_required: true,
        evidence_min_spec: true,
      },
      orderBy: { dimension: 'asc' },
    });

    const tests = await prisma.$queryRaw(Prisma.sql`
      SELECT
        control_id,
        dimension,
        test_id,
        test_code,
        test_title,
        test_weight,
        is_key,
        evidence_type,
        evidence_name,
        required,
        min_quantity,
        window_days
      FROM corpus.controltest_graph_view
      WHERE control_id = ${controlId}::uuid
      ORDER BY dimension, test_code
    `);

    const results = await prisma.score_test_result_draft.findMany({
      where: { run_id: runId, control_id: controlId },
    });

    const evidence = await prisma.evidence_score_draft.findMany({
      where: { run_id: runId, control_id: controlId },
      orderBy: { uploaded_at: 'desc' },
    });

    return NextResponse.json({
      runId,
      control,
      dimensionModel,
      tests,
      results,
      evidence,
    });
  } catch (error: any) {
    console.error('Error loading control evaluation:', error);
    return NextResponse.json({ error: 'Failed to load control evaluation' }, { status: 500 });
  }
}
