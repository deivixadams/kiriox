import {
  GetCompanyRealmContextUseCase,
  GetCompanyRealmSelectionUseCase,
  SaveCompanyRealmSelectionUseCase,
} from '@/modules/governance/application/use-cases';
import { PrismaCompanyRealmAssignmentRepository } from '@/modules/governance/infrastructure/repositories';

export async function getGovernanceCompanyRealmContextHandler(request: Request) {
  const repository = new PrismaCompanyRealmAssignmentRepository();
  const contextUseCase = new GetCompanyRealmContextUseCase(repository);
  const selectionUseCase = new GetCompanyRealmSelectionUseCase(repository);

  const url = new URL(request.url);
  const companyId = (url.searchParams.get('companyId') ?? '').trim();

  const context = await contextUseCase.execute();
  const selection = companyId
    ? await selectionUseCase.execute(companyId)
    : null;

  return Response.json({
    ...context,
    selection,
  });
}

export async function putGovernanceCompanyRealmSelectionHandler(
  request: Request,
  access: { userId: string }
) {
  const body = (await request.json()) as {
    companyId?: string;
    realmIds?: string[];
  };

  const useCase = new SaveCompanyRealmSelectionUseCase(new PrismaCompanyRealmAssignmentRepository());
  const result = await useCase.execute({
    companyId: String(body.companyId ?? ''),
    realmIds: Array.isArray(body.realmIds) ? body.realmIds.map((value) => String(value)) : [],
    updatedBy: access.userId,
  });

  return Response.json(result);
}

