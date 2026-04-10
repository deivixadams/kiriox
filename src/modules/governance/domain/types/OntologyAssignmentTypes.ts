export type GovernanceCompanyOption = {
  id: string;
  code: string;
  name: string;
};

export type GovernanceOntologyOption = {
  id: string;
  code: string;
  name: string;
  description: string;
  selection: Record<string, unknown>;
  sortOrder: number;
};

export type GovernanceCompanyOntologyAssignment = {
  companyId: string;
  ontologyId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GovernanceOntologyAssignmentContext = {
  companies: GovernanceCompanyOption[];
  ontologies: GovernanceOntologyOption[];
  assignments: GovernanceCompanyOntologyAssignment[];
};

export type UpsertCompanyOntologyAssignmentInput = {
  companyId: string;
  ontologyId: string;
  updatedBy: string;
};

export type GovernanceOntologyAssignmentResult = {
  assignment: GovernanceCompanyOntologyAssignment;
  company: GovernanceCompanyOption;
  ontology: GovernanceOntologyOption;
};
