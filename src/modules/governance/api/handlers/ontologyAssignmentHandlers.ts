import { GetOntologyAssignmentContextUseCase, UpsertCompanyOntologyAssignmentUseCase } from '@/modules/governance/application/use-cases';
import { PrismaOntologyAssignmentRepository } from '@/modules/governance/infrastructure/repositories';

export async function getGovernanceOntologyAssignmentContextHandler() {
  const useCase = new GetOntologyAssignmentContextUseCase(new PrismaOntologyAssignmentRepository());
  const result = await useCase.execute();
  return Response.json(result);
}

export async function putGovernanceOntologyAssignmentHandler(
  request: Request,
  access: { userId: string }
) {
  const body = (await request.json()) as {
    companyId?: string;
    ontologyId?: string;
  };

  const useCase = new UpsertCompanyOntologyAssignmentUseCase(new PrismaOntologyAssignmentRepository());
  const result = await useCase.execute({
    companyId: String(body.companyId ?? ''),
    ontologyId: String(body.ontologyId ?? ''),
    updatedBy: access.userId,
  });

  return Response.json(result);
}
