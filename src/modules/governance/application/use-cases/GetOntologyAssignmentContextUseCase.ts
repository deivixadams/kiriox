import type { OntologyAssignmentRepository } from '@/modules/governance/domain/contracts/OntologyAssignmentRepository';
import type { GovernanceOntologyAssignmentContext } from '@/modules/governance/domain/types/OntologyAssignmentTypes';

export class GetOntologyAssignmentContextUseCase {
  constructor(private readonly repository: OntologyAssignmentRepository) {}

  async execute(): Promise<GovernanceOntologyAssignmentContext> {
    const [companies, ontologies, assignments] = await Promise.all([
      this.repository.listActiveCompanies(),
      this.repository.listActiveOntologies(),
      this.repository.listActiveAssignments(),
    ]);

    return { companies, ontologies, assignments };
  }
}
