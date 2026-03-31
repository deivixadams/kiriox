import { NextResponse } from 'next/server';
import {
  GetAuditCatalogControlsByRiskUseCase,
  GetAuditCatalogDomainsUseCase,
  GetAuditCatalogMappingsUseCase,
  GetAuditCatalogObligationsUseCase,
  GetAuditCatalogReinoDomainsUseCase,
  GetAuditCatalogRisksUseCase,
  GetAuditFindingTypesUseCase,
  SeedAuditFindingTypesUseCase,
} from '@/modules/audit/application/use-cases';
import { PrismaAuditRepository } from '@/modules/audit/infrastructure/repositories/PrismaAuditRepository';

export async function getAuditCatalogDomainsHandler() {
  try {
    const useCase = new GetAuditCatalogDomainsUseCase(new PrismaAuditRepository());
    const rows = await useCase.execute();
    return NextResponse.json(rows || []);
  } catch (error: any) {
    console.error('Error fetching reinos:', error);
    return NextResponse.json({ error: 'Failed to fetch reinos' }, { status: 500 });
  }
}

export async function getAuditCatalogReinoDomainsHandler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reinoId = searchParams.get('reino_id');
    if (!reinoId) {
      return NextResponse.json({ error: 'reino_id is required' }, { status: 400 });
    }

    const useCase = new GetAuditCatalogReinoDomainsUseCase(new PrismaAuditRepository());
    const rows = await useCase.execute(reinoId);
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching reino domains:', error);
    return NextResponse.json({ error: 'Failed to fetch reino domains' }, { status: 500 });
  }
}

export async function getAuditCatalogObligationsHandler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domainIds = searchParams.getAll('domain_id');

    const useCase = new GetAuditCatalogObligationsUseCase(new PrismaAuditRepository());
    const rows = await useCase.execute(domainIds);
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching obligations:', error);
    return NextResponse.json({ error: 'Failed to fetch obligations' }, { status: 500 });
  }
}

export async function getAuditCatalogMappingsHandler() {
  try {
    const useCase = new GetAuditCatalogMappingsUseCase(new PrismaAuditRepository());
    const rows = await useCase.execute();
    return NextResponse.json(rows || []);
  } catch (error: any) {
    console.error('Error fetching element-risk mappings:', error);
    return NextResponse.json({ error: 'Failed to fetch mappings' }, { status: 500 });
  }
}

export async function getAuditCatalogRisksHandler(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domainIds = searchParams.getAll('domain_id');
    const obligationIds = searchParams.getAll('obligation_id');
    const riskIds = searchParams.getAll('risk_id');

    const useCase = new GetAuditCatalogRisksUseCase(new PrismaAuditRepository());
    const rows = await useCase.execute(domainIds, obligationIds, riskIds);
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching risks:', error);
    return NextResponse.json({ error: 'Failed to fetch risks' }, { status: 500 });
  }
}

export async function postAuditCatalogRisksHandler(request: Request) {
  try {
    const payload = (await request.json()) as {
      domainIds?: string[];
      obligationIds?: string[];
      riskIds?: string[];
    };

    const useCase = new GetAuditCatalogRisksUseCase(new PrismaAuditRepository());
    const rows = await useCase.execute(payload.domainIds ?? [], payload.obligationIds ?? [], payload.riskIds ?? []);
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Error fetching risks:', error);
    return NextResponse.json({ error: 'Failed to fetch risks' }, { status: 500 });
  }
}

export async function postAuditCatalogControlsByRiskHandler(request: Request) {
  try {
    const payload = (await request.json()) as { riskIds?: string[] };
    const useCase = new GetAuditCatalogControlsByRiskUseCase(new PrismaAuditRepository());
    const byRisk = await useCase.execute(payload.riskIds ?? []);
    return NextResponse.json({ byRisk });
  } catch (error: any) {
    console.error('Error fetching controls by risk:', error);
    return NextResponse.json({ error: 'Failed to fetch controls' }, { status: 500 });
  }
}

export async function getAuditCatalogTypesHandler() {
  try {
    const useCase = new GetAuditFindingTypesUseCase(new PrismaAuditRepository());
    const rows = await useCase.execute();
    return NextResponse.json(rows);
  } catch (error: any) {
    console.error('Audit Catalog API Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function postAuditCatalogTypesSeedHandler() {
  try {
    const useCase = new SeedAuditFindingTypesUseCase(new PrismaAuditRepository());
    await useCase.execute();
    return NextResponse.json({ message: 'Catalog seeded' });
  } catch {
    return NextResponse.json({ error: 'Seeding failed' }, { status: 500 });
  }
}
