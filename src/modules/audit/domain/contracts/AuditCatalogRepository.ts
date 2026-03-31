import type { CatalogDomainRow, CatalogMappingRow, CatalogObligationRow, CatalogRiskRow, ControlByRisk } from '../types/AuditCatalogTypes';

export interface AuditCatalogRepository {
  getDomains(): Promise<CatalogDomainRow[]>;
  getReinoDomains(reinoId: string): Promise<string[]>;
  getObligations(domainIds: string[]): Promise<CatalogObligationRow[]>;
  getMappings(): Promise<CatalogMappingRow[]>;
  getRisks(domainIds: string[], obligationIds: string[], riskIds: string[]): Promise<CatalogRiskRow[]>;
  getControlsByRisk(riskIds: string[]): Promise<Record<string, ControlByRisk[]>>;
  getFindingTypes(): Promise<unknown[]>;
  seedFindingTypes(): Promise<void>;
}
