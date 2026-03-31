import type { AuditCatalogRepository } from '@/modules/audit/domain/contracts/AuditCatalogRepository';

export class GetAuditCatalogDomainsUseCase {
  constructor(private readonly repository: AuditCatalogRepository) {}
  execute() { return this.repository.getDomains(); }
}

export class GetAuditCatalogReinoDomainsUseCase {
  constructor(private readonly repository: AuditCatalogRepository) {}
  execute(reinoId: string) { return this.repository.getReinoDomains(reinoId); }
}

export class GetAuditCatalogObligationsUseCase {
  constructor(private readonly repository: AuditCatalogRepository) {}
  execute(domainIds: string[]) { return this.repository.getObligations(domainIds); }
}

export class GetAuditCatalogMappingsUseCase {
  constructor(private readonly repository: AuditCatalogRepository) {}
  execute() { return this.repository.getMappings(); }
}

export class GetAuditCatalogRisksUseCase {
  constructor(private readonly repository: AuditCatalogRepository) {}
  execute(domainIds: string[], obligationIds: string[], riskIds: string[]) {
    return this.repository.getRisks(domainIds, obligationIds, riskIds);
  }
}

export class GetAuditCatalogControlsByRiskUseCase {
  constructor(private readonly repository: AuditCatalogRepository) {}
  execute(riskIds: string[]) { return this.repository.getControlsByRisk(riskIds); }
}

export class GetAuditFindingTypesUseCase {
  constructor(private readonly repository: AuditCatalogRepository) {}
  execute() { return this.repository.getFindingTypes(); }
}

export class SeedAuditFindingTypesUseCase {
  constructor(private readonly repository: AuditCatalogRepository) {}
  execute() { return this.repository.seedFindingTypes(); }
}
