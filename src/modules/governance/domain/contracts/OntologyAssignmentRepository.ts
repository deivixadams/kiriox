import type {
  GovernanceCompanyOption,
  GovernanceCompanyOntologyAssignment,
  GovernanceOntologyOption,
  UpsertCompanyOntologyAssignmentInput,
} from '@/modules/governance/domain/types/OntologyAssignmentTypes';

export interface OntologyAssignmentRepository {
  listActiveCompanies(): Promise<GovernanceCompanyOption[]>;
  listActiveOntologies(): Promise<GovernanceOntologyOption[]>;
  listActiveAssignments(): Promise<GovernanceCompanyOntologyAssignment[]>;
  findActiveCompanyById(companyId: string): Promise<GovernanceCompanyOption | null>;
  findActiveOntologyById(ontologyId: string): Promise<GovernanceOntologyOption | null>;
  upsertAssignment(input: UpsertCompanyOntologyAssignmentInput): Promise<GovernanceCompanyOntologyAssignment>;
}
