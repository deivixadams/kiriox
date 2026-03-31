import { NextResponse } from 'next/server';
import {
  CreateAuditDraftUseCase,
  DeriveAuditScopeUseCase,
  GetAuditDraftUseCase,
  GetAuditStatsUseCase,
  ListAuditAssessmentsUseCase,
  UpdateAuditDraftUseCase,
} from '@/modules/audit/application/use-cases';
import { PrismaAuditOpsRepository } from '@/modules/audit/infrastructure/repositories/PrismaAuditOpsRepository';
import { buildReportData, materializeDraft, renderReportDocx } from '@/lib/audit-report';

export async function getAuditAssessmentsHandler(auth: { roleCode: string; tenantId: string }) {
  try {
    const useCase = new ListAuditAssessmentsUseCase(new PrismaAuditOpsRepository());
    const rows = await useCase.execute(auth);
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json({ error: 'Failed to fetch assessments' }, { status: 500 });
  }
}

export async function getAuditStatsHandler() {
  try {
    const useCase = new GetAuditStatsUseCase(new PrismaAuditOpsRepository());
    const rows = await useCase.execute();
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching corpus stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

export async function postAuditDeriveScopeHandler(request: Request) {
  try {
    const { domainIds = [], obligationIds = [] } = (await request.json()) as {
      domainIds?: string[];
      obligationIds?: string[];
    };

    const useCase = new DeriveAuditScopeUseCase(new PrismaAuditOpsRepository());
    const summary = await useCase.execute(domainIds, obligationIds);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('Error deriving scope:', error);
    return NextResponse.json({ error: 'Failed to derive scope' }, { status: 500 });
  }
}

export async function postCreateAuditDraftHandler(auth: { tenantId: string; userId: string }) {
  try {
    const useCase = new CreateAuditDraftUseCase(new PrismaAuditOpsRepository());
    const draft = await useCase.execute(auth);
    return NextResponse.json(draft);
  } catch (error: any) {
    console.error('Error creating draft:', error);
    return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 });
  }
}

export async function getAuditDraftHandler(auth: { tenantId: string }, id: string) {
  try {
    const useCase = new GetAuditDraftUseCase(new PrismaAuditOpsRepository());
    const draft = await useCase.execute(auth, id);
    if (!draft) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(draft);
  } catch (error: any) {
    console.error('Error loading draft:', error);
    return NextResponse.json({ error: 'Failed to load draft' }, { status: 500 });
  }
}

export async function patchAuditDraftHandler(auth: { tenantId: string }, id: string, request: Request) {
  try {
    const patch = await request.json();
    const useCase = new UpdateAuditDraftUseCase(new PrismaAuditOpsRepository());
    const draft = await useCase.execute(auth, id, patch);
    if (!draft) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(draft);
  } catch (error: any) {
    console.error('Error updating draft:', error);
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
  }
}

export async function postAuditDraftMaterializeHandler(auth: { tenantId: string }, id: string) {
  try {
    const getUseCase = new GetAuditDraftUseCase(new PrismaAuditOpsRepository());
    const draft = await getUseCase.execute(auth, id);
    if (!draft) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const updateUseCase = new UpdateAuditDraftUseCase(new PrismaAuditOpsRepository());
    await updateUseCase.execute(auth, id, { step: Math.max(draft.step || 1, 1) });

    return NextResponse.json({ success: true, draftId: draft.id });
  } catch (error: any) {
    console.error('Error materializing draft:', error);
    return NextResponse.json({ error: 'Failed to materialize draft' }, { status: 500 });
  }
}

export async function postAuditDraftReportHandler(auth: any, id: string) {
  try {
    const data = await buildReportData(auth, id);
    if (!data) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    try {
      await materializeDraft(auth, id);
    } catch (error: any) {
      return NextResponse.json({ error: error?.message || 'Failed to materialize draft' }, { status: 400 });
    }

    const buffer = await renderReportDocx(data);
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Informe_Auditoria_${id}.docx"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating audit report:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
