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

    const dimensionModel = await prisma.$queryRaw(Prisma.sql`
      SELECT
        dimension,
        weight,
        is_gate,
        min_dimension_score
      FROM corpus.control_dimension_model
      ORDER BY dimension
    `);

    const modelColumns = await prisma.$queryRaw<Array<{ column_name: string }>>(Prisma.sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'corpus'
        AND table_name = 'controltest_dimension_model'
    `);
    const columnSet = new Set(modelColumns.map((c) => c.column_name));
    const hasControlId = columnSet.has('control_id');
    const hasId = columnSet.has('id');

    let criteriaByDimension: Record<string, string[]> = {};
    let dimensionTestCounts: Record<string, number> = {};
    const testSeen = new Set<string>();

    if (hasControlId && hasId) {
      const criteriaRows = await prisma.$queryRaw(Prisma.sql`
        SELECT
          cdm.dimension,
          cdm.evidence_min_spec,
          cdt.id AS control_dimension_test_id,
          tcat.code AS test_code,
          tcat.title AS test_title,
          tcat.procedure_text,
          tre.required,
          tre.window_days,
          ec.name AS evidence_name
        FROM corpus.controltest_dimension_model cdm
        LEFT JOIN corpus.controltest_dimension_test cdt
          ON cdt.control_dimension_id = cdm.id
          AND cdt.is_active = true
        LEFT JOIN corpus.controltest_test_catalog tcat
          ON tcat.id = cdt.test_id
        LEFT JOIN corpus.controltest_required_evidence tre
          ON tre.control_dimension_test_id = cdt.id
        LEFT JOIN corpus.controltest_evidence_catalog ec
          ON ec.id = tre.evidence_id
        WHERE cdm.control_id = ${controlId}::uuid
          AND cdm.is_active = true
          AND (cdm.effective_to IS NULL OR cdm.effective_to > NOW())
        ORDER BY cdm.dimension, tcat.code
      `);

      (criteriaRows as any[]).forEach((row) => {
        const dimension = String(row.dimension || '');
        if (!criteriaByDimension[dimension]) criteriaByDimension[dimension] = [];
        dimensionTestCounts[dimension] = (dimensionTestCounts[dimension] || 0) + (row.control_dimension_test_id ? 1 : 0);
        if (row.evidence_min_spec) {
          const spec = String(row.evidence_min_spec);
          if (!criteriaByDimension[dimension].includes(spec)) {
            criteriaByDimension[dimension].push(spec);
          }
        }
        if (row.test_code || row.test_title) {
          const key = `${dimension}:${row.test_code || ''}:${row.test_title || ''}`;
          if (!testSeen.has(key)) {
            testSeen.add(key);
            const meta: string[] = [];
            if (row.required) meta.push('evidencia requerida');
            if (row.evidence_name) meta.push(String(row.evidence_name));
            if (row.window_days) meta.push(`ventana ${row.window_days} dias`);
            const labelBase = row.procedure_text
              ? String(row.procedure_text)
              : row.test_title
                ? `${row.test_code} — ${row.test_title}`
                : `${row.test_code || 'Test'}`;
            const line = meta.length ? `${labelBase} (${meta.join(', ')})` : labelBase;
            criteriaByDimension[dimension].push(line);
          }
        }
      });
    }

    const evaluatorRows = await prisma.$queryRaw(Prisma.sql`
      SELECT
        cdm.dimension,
        cec.evaluator_steps
      FROM corpus.control_evaluation_catalog cec
      JOIN corpus.control_dimension_model cdm
        ON cdm.id = cec.dimension_id
      WHERE cec.control_id = ${controlId}::uuid
        AND cec.is_active = true
        AND (cec.effective_to IS NULL OR cec.effective_to > NOW())
      ORDER BY cdm.dimension
    `);

    (evaluatorRows as any[]).forEach((row) => {
      const dimension = String(row.dimension || '');
      if (!criteriaByDimension[dimension]) criteriaByDimension[dimension] = [];
      if (!row.evaluator_steps) return;
      const steps = String(row.evaluator_steps)
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      steps.forEach((step) => {
        if (!criteriaByDimension[dimension].includes(step)) {
          criteriaByDimension[dimension].push(step);
        }
      });
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

    const evidenceTable = await prisma.$queryRaw<Array<{ rel: string | null }>>(Prisma.sql`
      SELECT to_regclass('score.evidence_score_draft')::text AS rel
    `);
    const hasEvidenceTable = Boolean(evidenceTable[0]?.rel);

    const evidence = hasEvidenceTable
      ? await prisma.evidence_score_draft.findMany({
          where: { run_id: runId, control_id: controlId },
          orderBy: { uploaded_at: 'desc' },
        })
      : [];

    return NextResponse.json({
      runId,
      control,
      dimensionModel,
      tests,
      results,
      evidence,
      criteriaByDimension,
      dimensionTestCounts,
    });
  } catch (error: any) {
    console.error('Error loading control evaluation:', error);
    return NextResponse.json({ error: 'Failed to load control evaluation' }, { status: 500 });
  }
}
