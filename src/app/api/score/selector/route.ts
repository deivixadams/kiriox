import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value);
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

export async function POST(request: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const body = await request.json();
    const {
      companyId,
      frameworkSourceId,
      periodStart,
      periodEnd,
      mode,
      draftId,
    } = body || {};

    if (!companyId || !frameworkSourceId || !periodStart || !periodEnd || !mode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const source = await prisma.framework_source.findUnique({
      where: { id: frameworkSourceId },
      select: { framework_version_id: true },
    });
    const frameworkVersionId = source?.framework_version_id || frameworkSourceId;

    const obligations = await prisma.obligation.findMany({
      where: {
        status: 'active',
        domain: { framework_version_id: frameworkVersionId },
      },
      select: {
        id: true,
        code: true,
        title: true,
        domain_id: true,
        criticality: true,
        evidence_strength: true,
        is_hard_gate: true,
      },
    });

    const obligationIds = obligations.map((o) => o.id);
    const obligationCodes = obligations.map((o) => o.code);

    const [obligationRisks, obligationControls, obligationGraph] = await Promise.all([
      prisma.map_obligation_risk.findMany({
        where: { obligation_id: { in: obligationIds } },
      }),
      prisma.map_obligation_control.findMany({
        where: { obligation_id: { in: obligationIds } },
      }),
      prisma.obligation_graph.findMany({
        where: {
          parent_obligation_code: { in: obligationCodes },
        },
      }),
    ]);

    const controlIds = unique(obligationControls.map((c) => c.control_id));
    const controls = await prisma.control.findMany({
      where: { id: { in: controlIds }, status: 'active' },
      select: { id: true, code: true, name: true, is_hard_gate: true, evidence_required: true },
    });

    let riskControls = await prisma.map_risk_control.findMany({
      where: {
        framework_version_id: frameworkVersionId,
        control_id: { in: controlIds },
      },
    });

    if (riskControls.length === 0) {
      riskControls = await prisma.map_risk_control.findMany({
        where: {
          control_id: { in: controlIds },
        },
      });
    }

    const riskIdsFromObligations = obligationRisks.map((r) => r.risk_id);
    const riskIdsFromControls = riskControls.map((r) => r.risk_id);
    const riskIds = unique([...riskIdsFromObligations, ...riskIdsFromControls]);

    const risks = await prisma.risk.findMany({
      where: { id: { in: riskIds } },
      select: { id: true, code: true, name: true, description: true, risk_layer_id: true },
    });

    const riskMap = new Map(risks.map((r) => [r.id, r]));

    const controlTests = await prisma.old_corpus_test_control_procedure.findMany({
      where: {
        control_id: { in: controlIds },
      },
      select: { control_id: true, test_id: true },
    });

    const testIds = unique(controlTests.map((t) => t.test_id));
    const tests = await prisma.old_corpus_test.findMany({
      where: { id: { in: testIds }, status: 'active' },
      select: { id: true, code: true, name: true, severity_if_fail: true },
    });

    const riskByObligation = new Map<string, typeof obligationRisks>();
    obligationRisks.forEach((r) => {
      const list = riskByObligation.get(r.obligation_id) || [];
      list.push(r);
      riskByObligation.set(r.obligation_id, list);
    });

    const controlByObligation = new Map<string, typeof obligationControls>();
    obligationControls.forEach((c) => {
      const list = controlByObligation.get(c.obligation_id) || [];
      list.push(c);
      controlByObligation.set(c.obligation_id, list);
    });

    const riskByControl = new Map<string, typeof riskControls>();
    riskControls.forEach((c) => {
      const list = riskByControl.get(c.control_id) || [];
      list.push(c);
      riskByControl.set(c.control_id, list);
    });

    const dependencyMap = new Map<string, typeof obligationGraph>();
    const parents = new Set<string>();
    const children = new Set<string>();
    obligationGraph.forEach((d) => {
      parents.add(d.parent_obligation_code);
      children.add(d.child_obligation_code);
      const list = dependencyMap.get(d.parent_obligation_code) || [];
      list.push(d);
      dependencyMap.set(d.parent_obligation_code, list);
    });

    const rootCodes = new Set(Array.from(parents).filter((code) => !children.has(code)));

    const obligationScores = obligations.map((o) => {
      const risksForObligation = riskByObligation.get(o.id) || [];
      const controlsForObligation = controlByObligation.get(o.id) || [];
      const deps = dependencyMap.get(o.code) || [];

      const intrinsic =
        (o.criticality || 1) +
        (o.evidence_strength || 1) +
        (o.is_hard_gate ? 5 : 0);

      const dependencyScore = deps.reduce((sum, d) => {
        return sum + toNumber(d.dependency_strength) * toNumber(d.propagation_multiplier || 1);
      }, 0) + (deps.some((d) => d.collapse_trigger) ? 5 : 0) + (rootCodes.has(o.code) ? 3 : 0);

      const riskScore = risksForObligation.reduce((sum, r) => {
        const risk = riskMap.get(r.risk_id);
        const layerWeight = risk ? 1 + Math.max(0, (risk.risk_layer_id || 1) - 1) * 0.5 : 1;
        return sum + (r.link_strength || 1) * layerWeight;
      }, 0);

      const controlCoverage = controlsForObligation.length;

      const score =
        0.30 * intrinsic +
        0.25 * dependencyScore +
        0.20 * riskScore +
        0.15 * controlCoverage +
        0.10 * (o.is_hard_gate ? 1 : 0);

      const reasons = [] as string[];
      if (o.is_hard_gate) reasons.push('hard_gate');
      if (rootCodes.has(o.code)) reasons.push('dependency_root');
      if (deps.some((d) => d.collapse_trigger)) reasons.push('collapse_trigger');
      if (riskScore > 0) reasons.push('risk_linked');
      if (controlCoverage > 0) reasons.push('control_covered');

      return { ...o, selectorScore: score, reasons };
    });

    const maxPerDomain = Math.ceil(20 * 0.35);
    const domainCounts = new Map<string, number>();

    const mandatory = new Set<string>();
    obligationScores.forEach((o) => {
      const deps = dependencyMap.get(o.code) || [];
      if (o.is_hard_gate || deps.some((d) => d.collapse_trigger)) {
        mandatory.add(o.id);
      }
    });

    const sorted = [...obligationScores].sort((a, b) => b.selectorScore - a.selectorScore);
    const selectedObligations: typeof obligationScores = [];

    for (const o of sorted) {
      if (selectedObligations.length >= 20 && !mandatory.has(o.id)) continue;
      const count = domainCounts.get(o.domain_id) || 0;
      if (count >= maxPerDomain && !mandatory.has(o.id)) continue;
      if (!selectedObligations.find((x) => x.id === o.id)) {
        selectedObligations.push(o);
        domainCounts.set(o.domain_id, count + 1);
      }
      if (selectedObligations.length >= 20 && mandatory.size === 0) break;
    }

    if (selectedObligations.length < 20) {
      for (const o of sorted) {
        if (selectedObligations.length >= 20) break;
        if (!selectedObligations.find((x) => x.id === o.id)) {
          selectedObligations.push(o);
        }
      }
    }

    const selectionObligations = mode === 'all' ? obligationScores : selectedObligations;
    const selectedObligationIds = new Set(selectionObligations.map((o) => o.id));

    const selectedControlIds = new Set(
      obligationControls
        .filter((c) => selectedObligationIds.has(c.obligation_id))
        .map((c) => c.control_id)
    );

    const selectedRiskIds = new Set([
      ...obligationRisks
        .filter((r) => selectedObligationIds.has(r.obligation_id))
        .map((r) => r.risk_id),
      ...riskControls
        .filter((rc) => selectedControlIds.has(rc.control_id))
        .map((rc) => rc.risk_id),
    ]);


    const controlScores = controls
      .filter((c) => selectedControlIds.has(c.id))
      .map((control) => {
        const obligationsCovered = obligationControls.filter(
          (c) => c.control_id === control.id && selectedObligationIds.has(c.obligation_id)
        );
        const risksCovered = (riskByControl.get(control.id) || []).filter((r) => selectedRiskIds.has(r.risk_id));

        const obligationCoverageScore = obligationsCovered.length;
        const riskMitigationScore = risksCovered.reduce((s, r) => s + (r.mitigation_strength || 1), 0);
        const hardGateBonus = control.is_hard_gate ? 5 : 0;
        const evidenceBonus = control.evidence_required ? 2 : 0;

        const score =
          0.35 * obligationCoverageScore +
          0.30 * riskMitigationScore +
          0.20 * obligationsCovered.length +
          0.10 * hardGateBonus +
          0.05 * evidenceBonus;

        const reasons = [] as string[];
        if (control.is_hard_gate) reasons.push('hard_gate');
        if (control.evidence_required) reasons.push('evidence_required');
        if (obligationsCovered.length >= 2) reasons.push('covers_multiple_obligations');
        if (riskMitigationScore > 0) reasons.push('risk_mitigation');

        return { ...control, selectorScore: score, reasons };
      });

    const controlScoresSorted = [...controlScores].sort((a, b) => b.selectorScore - a.selectorScore);
    const percentileIndex = Math.floor(controlScoresSorted.length * 0.2);
    const percentileThreshold = controlScoresSorted[percentileIndex]?.selectorScore ?? 0;

    const selectedControls = mode === 'all'
      ? controlScoresSorted
      : controlScoresSorted.filter((c) =>
          c.selectorScore >= percentileThreshold || c.reasons.includes('covers_multiple_obligations')
        ).slice(0, 15);

    const selectedControlIdsFinal = new Set(selectedControls.map((c) => c.id));

    const selectedRisks = risks
      .filter((r) => selectedRiskIds.has(r.id))
      .map((risk) => ({
        ...risk,
        selectorScore: (risk.risk_layer_id || 1) * 1.0,
        reasons: ['linked_to_obligations'],
      }));

    const testScores = tests
      .filter((t) => {
        const links = controlTests.filter((c) => c.test_id === t.id && selectedControlIdsFinal.has(c.control_id));
        return links.length > 0;
      })
      .map((test) => {
        const links = controlTests.filter((c) => c.test_id === test.id && selectedControlIdsFinal.has(c.control_id));
        const coverageScore = links.length;
        const criticalExposure = links.reduce((sum, link) => {
          const ctrl = selectedControls.find((c) => c.id === link.control_id);
          return sum + (ctrl?.selectorScore || 0);
        }, 0);
        const severityBonus = (test.severity_if_fail || 1) >= 4 ? 5 : 1;
        const score = 0.40 * coverageScore + 0.25 * criticalExposure + 0.20 * severityBonus + 0.15 * (coverageScore === 1 ? 2 : 1);
        const reasons = [] as string[];
        if (coverageScore >= 2) reasons.push('covers_multiple_controls');
        if ((test.severity_if_fail || 1) >= 4) reasons.push('high_severity');
        return { ...test, selectorScore: score, reasons };
      });

    const selectedTests = mode === 'all'
      ? testScores
      : [...testScores].sort((a, b) => b.selectorScore - a.selectorScore).slice(0, 12);

    const payload = {
      obligations: selectionObligations.map((o, idx) => ({
        id: o.id,
        code: o.code,
        title: o.title,
        score: o.selectorScore,
        rank: idx + 1,
        reasons: o.reasons,
      })),
      risks: selectedRisks.map((r, idx) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        description: r.description,
        score: r.selectorScore,
        rank: idx + 1,
        reasons: r.reasons,
      })),
      controls: selectedControls.map((c, idx) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        score: c.selectorScore,
        rank: idx + 1,
        reasons: c.reasons,
      })),
      tests: selectedTests.map((t, idx) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        score: t.selectorScore,
        rank: idx + 1,
        reasons: t.reasons,
      })),
    };

    const run = await prisma.$transaction(async (tx) => {
      const runDraft = draftId
        ? await tx.run_draft.update({
            where: { id: draftId },
            data: {
              company_id: companyId,
              framework_version_id: frameworkVersionId,
              period_start: new Date(periodStart),
              period_end: new Date(periodEnd),
              mode,
              updated_at: new Date(),
            },
          })
        : await tx.run_draft.create({
            data: {
              company_id: companyId,
              framework_version_id: frameworkVersionId,
              period_start: new Date(periodStart),
              period_end: new Date(periodEnd),
              mode,
            },
          });

      await Promise.all([
        tx.run_obligation_draft.deleteMany({ where: { run_id: runDraft.id } }),
        tx.run_risk_draft.deleteMany({ where: { run_id: runDraft.id } }),
        tx.run_control_draft.deleteMany({ where: { run_id: runDraft.id } }),
        tx.run_test_draft.deleteMany({ where: { run_id: runDraft.id } }),
      ]);

      if (payload.obligations.length) {
        await tx.run_obligation_draft.createMany({
          data: payload.obligations.map((o) => ({
            run_id: runDraft.id,
            obligation_id: o.id,
            score: o.score,
            rank: o.rank,
            reasons: o.reasons,
          })),
        });
      }
      if (payload.risks.length) {
        await tx.run_risk_draft.createMany({
          data: payload.risks.map((r) => ({
            run_id: runDraft.id,
            risk_id: r.id,
            score: r.score,
            rank: r.rank,
            reasons: r.reasons,
          })),
        });
      }
      if (payload.controls.length) {
        await tx.run_control_draft.createMany({
          data: payload.controls.map((c) => ({
            run_id: runDraft.id,
            control_id: c.id,
            score: c.score,
            rank: c.rank,
            reasons: c.reasons,
          })),
        });
      }
      if (payload.tests.length) {
        await tx.run_test_draft.createMany({
          data: payload.tests.map((t) => ({
            run_id: runDraft.id,
            test_id: t.id,
            score: t.score,
            rank: t.rank,
            reasons: t.reasons,
          })),
        });
      }

      return runDraft;
    });

    return NextResponse.json({
      draftId: run.id,
      selection: payload,
    });
  } catch (error: any) {
    console.error('Error selecting score scope:', error);
    return NextResponse.json({ error: 'Failed to build selection' }, { status: 500 });
  }
}
