import { NextResponse } from 'next/server';
import {
  CreateManualAuditFindingUseCase,
  ListAuditFindingsUseCase,
  UpdateAuditFindingStatusUseCase,
} from '@/modules/audit/application/use-cases';
import { PrismaAuditRepository } from '@/modules/audit/infrastructure/repositories/PrismaAuditRepository';

export async function getAuditFindingsHandler(req: Request) {
  const { searchParams } = new URL(req.url);
  const evaluationId = searchParams.get('evaluationId');

  if (!evaluationId) {
    return NextResponse.json({ error: 'evaluationId is required' }, { status: 400 });
  }

  try {
    const useCase = new ListAuditFindingsUseCase(new PrismaAuditRepository());
    const findings = await useCase.execute(evaluationId);
    return NextResponse.json(findings);
  } catch (error) {
    console.error('Audit Findings API Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function postAuditFindingsHandler(req: Request) {
  try {
    const body = await req.json();
    const useCase = new CreateManualAuditFindingUseCase(new PrismaAuditRepository());
    const finding = await useCase.execute(body);
    return NextResponse.json(finding);
  } catch (error: any) {
    console.error('Audit Findings POST Error:', error);
    if (error?.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function patchAuditFindingStatusHandler(id: string, req: Request) {
  try {
    const body = await req.json();
    const useCase = new UpdateAuditFindingStatusUseCase(new PrismaAuditRepository());
    const finding = await useCase.execute({ id, ...body });
    return NextResponse.json(finding);
  } catch (error: any) {
    console.error('Audit Finding PATCH Error:', error);
    if (error?.status) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
