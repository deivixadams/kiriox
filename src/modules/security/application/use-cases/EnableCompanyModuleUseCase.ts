import { MODULE_REGISTRY_MAP, resolveModuleDependencies } from "@/shared/modules";
import {
  PrismaCompanyModuleRepository,
  PrismaCompanyRepository,
} from "../../infrastructure/repositories";

export type EnableCompanyModuleInput = {
  companyId: string;
  moduleCode: string;
  licenseStatus?: string;
  startsAt?: Date | null;
  endsAt?: Date | null;
  metadata?: Record<string, unknown>;
  changedBy?: string;
  reason?: string;
};

export class EnableCompanyModuleUseCase {
  constructor(
    private readonly companyModuleRepository = new PrismaCompanyModuleRepository(),
    private readonly companyRepository = new PrismaCompanyRepository()
  ) {}

  async execute(input: EnableCompanyModuleInput): Promise<{ enabledModules: string[] }> {
    const moduleDef = MODULE_REGISTRY_MAP.get(input.moduleCode);
    if (!moduleDef) {
      throw new Error(`Module not found: ${input.moduleCode}`);
    }

    const resolved = resolveModuleDependencies(input.moduleCode);

    for (const moduleCode of resolved) {
      await this.companyModuleRepository.enableModule({
        companyId: input.companyId,
        moduleCode,
        licenseStatus: input.licenseStatus ?? "active",
        startsAt: input.startsAt ?? null,
        endsAt: input.endsAt ?? null,
        metadata: {
          ...(input.metadata ?? {}),
          activated_reason: input.reason ?? "manual_enable",
          requested_module: input.moduleCode,
        },
      });
    }

    await this.companyRepository.appendAuditLog({
      companyId: input.companyId,
      entityName: "security.company_module",
      entityId: input.companyId,
      action: "module_enabled",
      changedBy: input.changedBy ?? null,
      newData: {
        requestedModule: input.moduleCode,
        resolvedDependencies: resolved,
      },
    });

    const enabledModules = await this.companyModuleRepository.getEnabledModules(input.companyId);
    return { enabledModules };
  }
}

