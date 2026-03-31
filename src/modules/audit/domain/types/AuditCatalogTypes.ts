export type CatalogDomainRow = { id: string; name: string; code: string | null };
export type CatalogObligationRow = { id: string; title: string; code: string | null; domainId: string };
export type CatalogMappingRow = { element_id: string; risk_id: string };

export type CatalogRiskRow = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  status: string;
  riskTypeName: string | null;
  riskLayerName: string | null;
  domainIds: string[];
};

export type ControlByRisk = {
  id: string;
  name: string;
  description?: string | null;
  controlObjective?: string | null;
  failureMode?: string | null;
  designIntent?: string | null;
  coverageNotes?: string | null;
};
