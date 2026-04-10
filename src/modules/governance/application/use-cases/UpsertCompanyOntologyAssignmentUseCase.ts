import type { OntologyAssignmentRepository } from '@/modules/governance/domain/contracts/OntologyAssignmentRepository';
import type {
  GovernanceOntologyAssignmentResult,
  UpsertCompanyOntologyAssignmentInput,
} from '@/modules/governance/domain/types/OntologyAssignmentTypes';
import { ApiError } from '@/shared/http';

export class UpsertCompanyOntologyAssignmentUseCase {
  constructor(private readonly repository: OntologyAssignmentRepository) {}

  async execute(input: UpsertCompanyOntologyAssignmentInput): Promise<GovernanceOntologyAssignmentResult> {
    const companyId = input.companyId?.trim();
    const ontologyId = input.ontologyId?.trim();

    if (!companyId || !ontologyId) {
      throw ApiError.badRequest('companyId and ontologyId are required');
    }

    const [company, ontology] = await Promise.all([
      this.repository.findActiveCompanyById(companyId),
      this.repository.findActiveOntologyById(ontologyId),
    ]);

    if (!company) {
      throw ApiError.badRequest('Selected company does not exist or is inactive');
    }

    if (!ontology) {
      throw ApiError.badRequest('Selected ontology does not exist or is inactive');
    }

    const assignment = await this.repository.upsertAssignment({
      companyId,
      ontologyId,
      updatedBy: input.updatedBy,
    });

    return { assignment, company, ontology };
  }
}
