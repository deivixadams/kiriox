import { NextResponse } from 'next/server';
import { computeRunDraftScore } from '@/lib/score-engine-runner';

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value && 'toNumber' in value && typeof (value as any).toNumber === 'function') {
    return (value as any).toNumber();
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const { runId } = await params;

    if (!runId) {
      return NextResponse.json({ error: 'Missing runId' }, { status: 400 });
    }

    const [runDraft, finalResult] = await Promise.all([
      prisma.run_draft.findUnique({
        where: { id: runId },
        select: { id: true, status: true },
      }),
      prisma.run_result.findUnique({
        where: { run_id: runId },
      }),
    ]);

    if (!runDraft) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    if (finalResult) {
      return NextResponse.json({
        runId,
        finalized: true,
        status: runDraft.status,
        engineVersion: finalResult.engine_version,
        scoreBand: finalResult.score_band,
        scoreTotal: toNumber(finalResult.score_total),
        breakdown: {
          baseExposure: toNumber(finalResult.e_base),
          concentratedExposure: toNumber(finalResult.e_conc),
          propagationExposure: toNumber(finalResult.e_sys),
          finalExposure: toNumber(finalResult.e_final),
        },
        result: finalResult.result_payload,
      });
    }

    const preview = await computeRunDraftScore(prisma, runId);

    return NextResponse.json({
      runId,
      finalized: false,
      status: runDraft.status,
      engineVersion: preview.engineVersion,
      scoreBand: preview.scoreBand,
      scoreTotal: preview.output.score_breakdown.final_score_0_100,
      breakdown: {
        baseExposure: preview.output.score_breakdown.base_exposure,
        concentratedExposure: preview.output.score_breakdown.concentrated_exposure,
        propagationExposure: preview.output.score_breakdown.propagation_exposure,
        finalExposure: preview.output.score_breakdown.final_exposure,
      },
      result: preview.payload,
    });
  } catch (error: any) {
    console.error('Error loading score result:', error);
    return NextResponse.json({ error: error?.message || 'Failed to load result' }, { status: 500 });
  }
}
