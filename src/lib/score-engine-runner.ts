import { PrismaClient } from '@prisma/client';
import { classifyCreScore, type CreScoreEngineOutput } from './score-engine';
import { buildScoreSummary } from './score-summary';

const ENGINE_VERSION = 'cre-score-engine-v1';

type ScoreRunResult = {
  engineVersion: string;
  scoreBand: ReturnType<typeof classifyCreScore>;
  output: CreScoreEngineOutput;
  payload: {
    engineVersion: string;
    scoreBand: ReturnType<typeof classifyCreScore>;
    generatedAt: string;
    output: CreScoreEngineOutput;
  };
};

export async function computeRunDraftScore(
  prisma: PrismaClient,
  runId: string
): Promise<ScoreRunResult> {
  const summary = await buildScoreSummary(prisma, runId);

  const output: CreScoreEngineOutput = {
    control_effectiveness: summary.controlEffectiveness,
    obligation_effectiveness: summary.obligationEffectiveness,
    score_breakdown: {
      base_exposure: summary.payload.score.base_exposure,
      concentration_index: summary.payload.score.concentration_index_h,
      concentration_factor: summary.payload.score.concentration_factor,
      concentrated_exposure: summary.payload.score.concentrated_exposure,
      propagation_exposure: summary.payload.score.propagation_exposure,
      final_exposure: summary.payload.score.final_exposure,
      final_score_0_100: summary.payload.score.final_score,
    },
  };

  const scoreBand = classifyCreScore(output.score_breakdown.final_score_0_100);

  return {
    engineVersion: ENGINE_VERSION,
    scoreBand,
    output,
    payload: {
      engineVersion: ENGINE_VERSION,
      scoreBand,
      generatedAt: new Date().toISOString(),
      output,
    },
  };
}
