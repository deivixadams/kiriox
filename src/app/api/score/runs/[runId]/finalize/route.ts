import { NextResponse } from 'next/server';
import { computeRunDraftScore } from '@/lib/score-engine-runner';

export async function POST(
  _: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const { runId } = await params;

    if (!runId) {
      return NextResponse.json({ error: 'Missing runId' }, { status: 400 });
    }

    const runDraft = await prisma.run_draft.findUnique({
      where: { id: runId },
    });

    if (!runDraft) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const engineResult = await computeRunDraftScore(prisma, runId);

    const result = await prisma.$transaction(async (tx: any) => {
      const run = await tx.run.upsert({
        where: { id: runId },
        update: {
          company_id: runDraft.company_id,
          framework_version_id: runDraft.framework_version_id,
          period_start: runDraft.period_start,
          period_end: runDraft.period_end,
          mode: runDraft.mode,
          status: 'active',
          updated_at: new Date(),
        },
        create: {
          id: runDraft.id,
          company_id: runDraft.company_id,
          framework_version_id: runDraft.framework_version_id,
          period_start: runDraft.period_start,
          period_end: runDraft.period_end,
          mode: runDraft.mode,
          status: 'active',
        },
      });

      const [obligations, risks, controls, tests, testResultsDraft, evidenceDraft] = await Promise.all([
        tx.run_obligation_draft.findMany({ where: { run_id: runId } }),
        tx.run_risk_draft.findMany({ where: { run_id: runId } }),
        tx.run_control_draft.findMany({ where: { run_id: runId } }),
        tx.run_test_draft.findMany({ where: { run_id: runId } }),
        tx.score_test_result_draft.findMany({ where: { run_id: runId } }),
        tx.evidence_score_draft.findMany({ where: { run_id: runId } }),
      ]);

      await Promise.all([
        tx.run_obligation.deleteMany({ where: { run_id: runId } }),
        tx.run_risk.deleteMany({ where: { run_id: runId } }),
        tx.run_control.deleteMany({ where: { run_id: runId } }),
        tx.run_test.deleteMany({ where: { run_id: runId } }),
        tx.score_test_result.deleteMany({ where: { run_id: runId } }),
        tx.evidence_score.deleteMany({ where: { run_id: runId } }),
      ]);

      if (obligations.length) {
        await tx.run_obligation.createMany({
          data: obligations.map((row: any) => ({
            run_id: row.run_id,
            obligation_id: row.obligation_id,
            score: row.score,
            rank: row.rank,
            reasons: row.reasons,
          })),
        });
      }

      if (risks.length) {
        await tx.run_risk.createMany({
          data: risks.map((row: any) => ({
            run_id: row.run_id,
            risk_id: row.risk_id,
            score: row.score,
            rank: row.rank,
            reasons: row.reasons,
          })),
        });
      }

      if (controls.length) {
        await tx.run_control.createMany({
          data: controls.map((row: any) => ({
            run_id: row.run_id,
            control_id: row.control_id,
            score: row.score,
            rank: row.rank,
            reasons: row.reasons,
          })),
        });
      }

      if (tests.length) {
        await tx.run_test.createMany({
          data: tests.map((row: any) => ({
            run_id: row.run_id,
            test_id: row.test_id,
            score: row.score,
            rank: row.rank,
            reasons: row.reasons,
          })),
        });
      }

      if (testResultsDraft.length) {
        await tx.score_test_result.createMany({
          data: testResultsDraft.map((row: any) => ({
            run_id: row.run_id,
            control_id: row.control_id,
            dimension: row.dimension,
            test_id: row.test_id,
            score: row.score,
            passed: row.passed,
            assessment_method: row.assessment_method,
            evaluator_notes: row.evaluator_notes,
            reasons: row.reasons,
            updated_at: row.updated_at,
          })),
        });
      }

      if (evidenceDraft.length) {
        await tx.evidence_score.createMany({
          data: evidenceDraft.map((row: any) => ({
            id: row.id,
            run_id: row.run_id,
            control_id: row.control_id,
            dimension: row.dimension,
            test_id: row.test_id,
            storage_provider_code: row.storage_provider_code,
            bucket: row.bucket,
            object_key: row.object_key,
            logical_path: row.logical_path,
            sha256: row.sha256,
            file_name_original: row.file_name_original,
            mime_type: row.mime_type,
            size_bytes: row.size_bytes,
            uploaded_at: row.uploaded_at,
            uploaded_by: row.uploaded_by,
            caption: row.caption,
            is_sealed: row.is_sealed,
          })),
        });
      }

      await tx.run_result.upsert({
        where: { run_id: runId },
        update: {
          engine_version: engineResult.engineVersion,
          score_total: engineResult.output.score_breakdown.final_score_0_100,
          score_band: engineResult.scoreBand,
          e_base: engineResult.output.score_breakdown.base_exposure,
          e_conc: engineResult.output.score_breakdown.concentrated_exposure,
          e_sys: engineResult.output.score_breakdown.propagation_exposure,
          e_final: engineResult.output.score_breakdown.final_exposure,
          result_payload: engineResult.payload,
          updated_at: new Date(),
        },
        create: {
          run_id: runId,
          engine_version: engineResult.engineVersion,
          score_total: engineResult.output.score_breakdown.final_score_0_100,
          score_band: engineResult.scoreBand,
          e_base: engineResult.output.score_breakdown.base_exposure,
          e_conc: engineResult.output.score_breakdown.concentrated_exposure,
          e_sys: engineResult.output.score_breakdown.propagation_exposure,
          e_final: engineResult.output.score_breakdown.final_exposure,
          result_payload: engineResult.payload,
        },
      });

      await tx.run_draft.update({
        where: { id: runId },
        data: { status: 'finalized', updated_at: new Date() },
      });

      return run;
    });

    return NextResponse.json({ ok: true, run: result, result: engineResult.payload });
  } catch (error: any) {
    console.error('Error finalizing score run:', error);
    return NextResponse.json({ error: 'Failed to finalize run' }, { status: 500 });
  }
}
