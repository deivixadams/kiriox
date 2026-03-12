import { PrismaClient, Prisma } from '@prisma/client';
import {
  classifyCreScore,
  runCreScoreEngine,
  type CreScoreEngineInput,
  type CreScoreEngineOutput,
  type StructuralLevel,
} from './score-engine';

const ENGINE_VERSION = 'cre-score-engine-v1';

type RunSource = {
  id: string;
  framework_version_id: string;
};

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

function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeDimensionName(value: string | null | undefined): string {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[\s/-]+/g, '_');
}

function mapDimensionToAxis(value: string): 'existence' | 'formalization' | 'operating' | null {
  const normalized = normalizeDimensionName(value);

  if (normalized.includes('EXIST')) return 'existence';
  if (
    normalized.includes('FORM') ||
    normalized.includes('DESIGN') ||
    normalized.includes('DOC') ||
    normalized.includes('POLICY')
  ) {
    return 'formalization';
  }
  if (
    normalized.includes('OPER') ||
    normalized.includes('EXEC') ||
    normalized.includes('PERFORM')
  ) {
    return 'operating';
  }

  return null;
}

function mapStructuralLevel(params: {
  isHardGate: boolean;
  hasRootDependency: boolean;
  hasCollapseTrigger: boolean;
  evidenceRequired: boolean;
}): StructuralLevel {
  if (params.isHardGate) return 'EXISTENTIAL';
  if (params.hasRootDependency || params.hasCollapseTrigger) return 'CRITICAL';
  if (params.evidenceRequired) return 'ROBUSTNESS';
  return 'SUPPORT';
}

function mitigationWeightFromLink(link: {
  satisfaction_mode: string;
  min_coverage_threshold: Prisma.Decimal | null;
}): number {
  const threshold = toNumber(link.min_coverage_threshold);
  if (threshold > 0) return threshold;

  const mode = String(link.satisfaction_mode || '').toUpperCase();
  if (mode.includes('PARTIAL') || mode.includes('SHARED')) return 0.75;
  if (mode.includes('SUPPORT') || mode.includes('ADVISORY')) return 0.5;
  return 1;
}

export async function computeRunDraftScore(
  prisma: PrismaClient,
  runId: string
): Promise<ScoreRunResult> {
  const run = await prisma.run_draft.findUnique({
    where: { id: runId },
    select: { id: true, framework_version_id: true },
  });

  if (!run) {
    throw new Error('Run draft not found');
  }

  const input = await buildEngineInput(prisma, run);
  const output = runCreScoreEngine(input);
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

async function buildEngineInput(
  prisma: PrismaClient,
  run: RunSource
): Promise<CreScoreEngineInput> {
  const selectedObligations = await prisma.run_obligation_draft.findMany({
    where: { run_id: run.id },
    select: {
      obligation_id: true,
      score: true,
      obligation: {
        select: {
          id: true,
          code: true,
          title: true,
          domain_id: true,
          criticality: true,
          evidence_strength: true,
          is_hard_gate: true,
        },
      },
    },
  });

  if (selectedObligations.length === 0) {
    throw new Error('Run draft has no selected obligations');
  }

  const selectedControls = await prisma.run_control_draft.findMany({
    where: { run_id: run.id },
    select: {
      control_id: true,
      score: true,
      control: {
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          evidence_required: true,
          is_hard_gate: true,
        },
      },
    },
  });

  if (selectedControls.length === 0) {
    throw new Error('Run draft has no selected controls');
  }

  const obligationIds = selectedObligations.map((row) => row.obligation_id);
  const obligationCodes = selectedObligations.map((row) => row.obligation.code);
  const controlIds = selectedControls.map((row) => row.control_id);

  const [
    obligationControlLinks,
    obligationGraph,
    dimensionModels,
    testResults,
    evidenceRows,
    riskControlLinksScoped,
    riskControlLinksFallback,
  ] = await Promise.all([
    prisma.map_obligation_control.findMany({
      where: {
        obligation_id: { in: obligationIds },
        control_id: { in: controlIds },
      },
      select: {
        obligation_id: true,
        control_id: true,
        satisfaction_mode: true,
        min_coverage_threshold: true,
      },
    }),
    prisma.obligation_graph.findMany({
      where: {
        OR: [
          { parent_obligation_code: { in: obligationCodes } },
          { child_obligation_code: { in: obligationCodes } },
        ],
      },
      select: {
        parent_obligation_code: true,
        child_obligation_code: true,
        dependency_strength: true,
        collapse_trigger: true,
        propagation_multiplier: true,
      },
    }),
    prisma.controltest_dimension_model.findMany({
      where: {
        control_id: { in: controlIds },
        is_active: true,
      },
      select: {
        control_id: true,
        dimension: true,
        weight: true,
        is_gate: true,
        min_dimension_score: true,
        evidence_required: true,
      },
    }),
    prisma.score_test_result_draft.findMany({
      where: {
        run_id: run.id,
        control_id: { in: controlIds },
      },
      select: {
        control_id: true,
        dimension: true,
        test_id: true,
        score: true,
        passed: true,
      },
    }),
    prisma.evidence_score_draft.findMany({
      where: {
        run_id: run.id,
        control_id: { in: controlIds },
      },
      select: {
        control_id: true,
        dimension: true,
        test_id: true,
      },
    }),
    prisma.map_risk_control.findMany({
      where: {
        framework_version_id: run.framework_version_id,
        control_id: { in: controlIds },
      },
      select: {
        control_id: true,
        mitigation_strength: true,
      },
    }),
    prisma.map_risk_control.findMany({
      where: {
        control_id: { in: controlIds },
      },
      select: {
        control_id: true,
        mitigation_strength: true,
      },
    }),
  ]);

  const testGraphRows = (await prisma.$queryRaw(Prisma.sql`
    SELECT
      control_id,
      dimension,
      test_id,
      test_weight,
      is_key,
      required
    FROM corpus.controltest_graph_view
    WHERE control_id IN (${Prisma.join(controlIds.map((id) => Prisma.sql`${id}::uuid`))})
  `)) as Array<{
    control_id: string;
    dimension: string;
    test_id: string;
    test_weight: Prisma.Decimal | number | null;
    is_key: boolean | null;
    required: boolean | null;
  }>;

  const riskControlLinks =
    riskControlLinksScoped.length > 0 ? riskControlLinksScoped : riskControlLinksFallback;

  const obligationGraphByCode = new Map<
    string,
    Array<{
      parent_obligation_code: string;
      child_obligation_code: string;
      dependency_strength: Prisma.Decimal;
      collapse_trigger: boolean | null;
      propagation_multiplier: Prisma.Decimal | null;
    }>
  >();
  const parents = new Set<string>();
  const children = new Set<string>();

  for (const row of obligationGraph) {
    parents.add(row.parent_obligation_code);
    children.add(row.child_obligation_code);
    const list = obligationGraphByCode.get(row.parent_obligation_code) ?? [];
    list.push(row);
    obligationGraphByCode.set(row.parent_obligation_code, list);
  }

  const rootCodes = new Set(
    Array.from(parents).filter((code) => obligationCodes.includes(code) && !children.has(code))
  );

  const dimensionModelsByControl = new Map<string, typeof dimensionModels>();
  for (const row of dimensionModels) {
    const list = dimensionModelsByControl.get(row.control_id) ?? [];
    list.push(row);
    dimensionModelsByControl.set(row.control_id, list);
  }

  const testResultsByKey = new Map<string, typeof testResults[number]>();
  for (const row of testResults) {
    testResultsByKey.set(`${row.control_id}:${row.dimension}:${row.test_id}`, row);
  }

  const evidenceKeys = new Set(
    evidenceRows.map((row) => `${row.control_id}:${row.dimension}:${row.test_id}`)
  );

  const testGraphByControlDimension = new Map<string, typeof testGraphRows>();
  for (const row of testGraphRows) {
    const key = `${row.control_id}:${row.dimension}`;
    const list = testGraphByControlDimension.get(key) ?? [];
    list.push(row);
    testGraphByControlDimension.set(key, list);
  }

  const linksByControl = new Map<string, typeof obligationControlLinks>();
  const linksByObligation = new Map<string, typeof obligationControlLinks>();
  for (const link of obligationControlLinks) {
    const controlList = linksByControl.get(link.control_id) ?? [];
    controlList.push(link);
    linksByControl.set(link.control_id, controlList);

    const obligationList = linksByObligation.get(link.obligation_id) ?? [];
    obligationList.push(link);
    linksByObligation.set(link.obligation_id, obligationList);
  }

  const riskStrengthByControl = new Map<string, number>();
  for (const row of riskControlLinks) {
    riskStrengthByControl.set(
      row.control_id,
      (riskStrengthByControl.get(row.control_id) ?? 0) + Number(row.mitigation_strength || 0)
    );
  }

  const obligations = selectedObligations.map((row) => ({
    id: row.obligation.id,
    code: row.obligation.code,
    title: row.obligation.title,
    risk_weight: Math.max(
      1,
      toNumber(row.score) ||
        row.obligation.criticality +
          row.obligation.evidence_strength +
          (row.obligation.is_hard_gate ? 2 : 0)
    ),
  }));

  const controls = selectedControls.map((row) => {
    const controlLinks = linksByControl.get(row.control_id) ?? [];
    const linkedObligations = controlLinks
      .map((link) => selectedObligations.find((obligationRow) => obligationRow.obligation_id === link.obligation_id))
      .filter(Boolean);

    const hasRootDependency = linkedObligations.some((obligationRow) =>
      rootCodes.has(obligationRow!.obligation.code)
    );
    const graphRows = linkedObligations.flatMap((obligationRow) =>
      obligationGraphByCode.get(obligationRow!.obligation.code) ?? []
    );
    const hasCollapseTrigger = graphRows.some((graphRow) => Boolean(graphRow.collapse_trigger));
    const cascadeFactor = Math.max(
      1,
      graphRows.reduce((acc, graphRow) => {
        return (
          acc +
          toNumber(graphRow.dependency_strength) *
            Math.max(toNumber(graphRow.propagation_multiplier), 1)
        );
      }, 0)
    );
    const isHardGate =
      row.control.is_hard_gate || linkedObligations.some((obligationRow) => obligationRow!.obligation.is_hard_gate);

    return {
      id: row.control.id,
      code: row.control.code,
      rationale: {
        risk_weight: Math.max(
          1,
          toNumber(row.score) / 4 +
            (riskStrengthByControl.get(row.control_id) ?? 0) +
            controlLinks.length * 0.5
        ),
        structural_level: mapStructuralLevel({
          isHardGate,
          hasRootDependency,
          hasCollapseTrigger,
          evidenceRequired: row.control.evidence_required,
        }),
        cascade_factor: cascadeFactor,
        is_dependency_root: hasRootDependency,
        failure_mode: hasCollapseTrigger ? 'dependency_collapse' : undefined,
        design_intent: row.control.description || row.control.name,
      },
    };
  });

  const assessments = selectedControls.map((row) => {
    const models = dimensionModelsByControl.get(row.control_id) ?? [];
    const axisAccumulator = {
      existence: { weightedScore: 0, weight: 0, gatePassed: true, evidencePassed: true },
      formalization: { weightedScore: 0, weight: 0, gatePassed: true, evidencePassed: true },
      operating: { weightedScore: 0, weight: 0, gatePassed: true, evidencePassed: true },
    };

    for (const model of models) {
      const axis = mapDimensionToAxis(model.dimension);
      if (!axis) continue;

      const key = `${row.control_id}:${model.dimension}`;
      const testsForDimension = testGraphByControlDimension.get(key) ?? [];
      const weightedTotal = testsForDimension.reduce((acc, testRow) => {
        const result = testResultsByKey.get(
          `${row.control_id}:${testRow.dimension}:${testRow.test_id}`
        );
        const weight = Math.max(toNumber(testRow.test_weight), 0);
        return acc + clamp01(toNumber(result?.score)) * weight;
      }, 0);
      const totalWeight = testsForDimension.reduce(
        (acc, testRow) => acc + Math.max(toNumber(testRow.test_weight), 0),
        0
      );
      const dimensionScore = totalWeight > 0 ? weightedTotal / totalWeight : 0;

      const keyTests = testsForDimension.filter((testRow) => Boolean(testRow.is_key));
      const keyTestsPassed =
        keyTests.length === 0 ||
        keyTests.every((testRow) => {
          const result = testResultsByKey.get(
            `${row.control_id}:${testRow.dimension}:${testRow.test_id}`
          );
          return result?.passed !== false;
        });

      const thresholdPassed =
        model.min_dimension_score === null ||
        model.min_dimension_score === undefined ||
        dimensionScore >= toNumber(model.min_dimension_score);

      const requiredEvidenceTests = testsForDimension.filter((testRow) => Boolean(testRow.required));
      const evidencePassed =
        !model.evidence_required ||
        requiredEvidenceTests.length === 0 ||
        requiredEvidenceTests.every((testRow) =>
          evidenceKeys.has(`${row.control_id}:${testRow.dimension}:${testRow.test_id}`)
        );

      const modelWeight = Math.max(toNumber(model.weight), 0);
      axisAccumulator[axis].weightedScore += dimensionScore * modelWeight;
      axisAccumulator[axis].weight += modelWeight;
      if (model.is_gate) {
        axisAccumulator[axis].gatePassed = axisAccumulator[axis].gatePassed && keyTestsPassed && thresholdPassed;
      }
      axisAccumulator[axis].evidencePassed = axisAccumulator[axis].evidencePassed && evidencePassed;
    }

    const existence_score =
      axisAccumulator.existence.weight > 0
        ? axisAccumulator.existence.weightedScore / axisAccumulator.existence.weight
        : 0;
    const formalization_score =
      axisAccumulator.formalization.weight > 0
        ? axisAccumulator.formalization.weightedScore / axisAccumulator.formalization.weight
        : 0;
    const operating_score =
      axisAccumulator.operating.weight > 0
        ? axisAccumulator.operating.weightedScore / axisAccumulator.operating.weight
        : 0;

    return {
      control_id: row.control_id,
      existence_score: clamp01(existence_score),
      formalization_score: clamp01(formalization_score),
      operating_score: clamp01(operating_score),
      evidence_gate_passed:
        axisAccumulator.existence.evidencePassed &&
        axisAccumulator.formalization.evidencePassed &&
        axisAccumulator.operating.evidencePassed,
      existence_gate_passed:
        axisAccumulator.existence.weight === 0 ? false : axisAccumulator.existence.gatePassed,
    };
  });

  return {
    controls,
    obligations,
    map_obligation_control: obligationControlLinks.map((link) => ({
      obligation_id: link.obligation_id,
      control_id: link.control_id,
      mitigation_weight: mitigationWeightFromLink(link),
      min_coverage_threshold: link.min_coverage_threshold
        ? toNumber(link.min_coverage_threshold)
        : null,
    })),
    assessments,
    obligation_domain_map: selectedObligations.map((row) => ({
      obligation_id: row.obligation.id,
      domain_id: row.obligation.domain_id,
    })),
  };
}
