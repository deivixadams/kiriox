import { MODULE_REGISTRY, MODULE_REGISTRY_MAP } from "@/shared/modules";
import {
  PrismaCompanyModuleRepository,
  PrismaCompanyRepository,
} from "../../infrastructure/repositories";

export type DisableCompanyModuleInput = {
  companyId: string;
  moduleCode: string;
  changedBy?: string;
};

export class DisableCompanyModuleUseCase {
  constructor(
    private readonly companyModuleRepository = new PrismaCompanyModuleRepository(),
    private readonly companyRepository = new PrismaCompanyRepository()
  ) {}

  async execute(input: DisableCompanyModuleInput): Promise<{ enabledModules: string[] }> {
    const moduleDef = MODULE_REGISTRY_MAP.get(input.moduleCode);
    if (!moduleDef) {
      throw new Error(`Module not found: ${input.moduleCode}`);
    }

    if (moduleDef.isCore) {
      throw new Error(`Module "${input.moduleCode}" is core and cannot be disabled`);
    }

    const enabled = await this.companyModuleRepository.getEnabledModules(input.companyId);
    const dependants = MODULE_REGISTRY.filter(
      (mod) =>
        mod.dependencies.includes(input.moduleCode) && enabled.includes(mod.code)
    ).map((mod) => mod.code);

    if (dependants.length > 0) {
      throw new Error(
        `Cannot disable "${input.moduleCode}" because enabled modules depend on it: ${dependants.join(", ")}`
      );
    }

    await this.companyModuleRepository.disableModule(input.companyId, input.moduleCode);

    await this.companyRepository.appendAuditLog({
      companyId: input.companyId,
      entityName: "security.company_module",
      entityId: input.companyId,
      action: "module_disabled",
      changedBy: input.changedBy ?? null,
      newData: {
        moduleCode: input.moduleCode,
      },
    });

    const enabledModules = await this.companyModuleRepository.getEnabledModules(input.companyId);
    return { enabledModules };
  }
}

