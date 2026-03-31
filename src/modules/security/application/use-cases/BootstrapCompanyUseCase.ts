import { MODULE_REGISTRY } from "@/shared/modules";
import { Prisma } from "@prisma/client";
import prisma from "@/infrastructure/db/prisma/client";
import {
  PrismaCompanyModuleRepository,
  PrismaCompanyRepository,
  PrismaCompanyUserRepository,
  PrismaPermissionRepository,
  PrismaRoleRepository,
} from "../../infrastructure/repositories";
import { EnableCompanyModuleUseCase } from "./EnableCompanyModuleUseCase";

export type BootstrapCompanyInput = {
  companyCode: string;
  companyName: string;
  adminUserId: string;
};

const BASE_ROLES: Array<{ code: string; name: string; description: string }> = [
  { code: "company_admin", name: "Company Admin", description: "Administracion completa de la empresa" },
  { code: "risk_manager", name: "Risk Manager", description: "Gestion de riesgo lineal y estructural" },
  { code: "auditor", name: "Auditor", description: "Operacion de auditoria y hallazgos" },
  { code: "executive_reader", name: "Executive Reader", description: "Lectura ejecutiva de paneles e historicos" },
];

function getAllRegistryPermissions(): string[] {
  const all = new Set<string>();
  MODULE_REGISTRY.forEach((moduleDef) => {
    moduleDef.permissions.forEach((perm) => all.add(perm));
  });
  return [...all];
}

function getRolePermissionPlan(): Record<string, string[]> {
  const all = getAllRegistryPermissions();
  return {
    company_admin: all,
    risk_manager: all.filter((perm) => perm.startsWith("risk.") || perm.startsWith("governance.") || perm.startsWith("benchmark.")),
    auditor: all.filter((perm) => perm.startsWith("audit.") || perm.startsWith("governance.") || perm.startsWith("benchmark.read")),
    executive_reader: all.filter((perm) => perm.endsWith(".read") || perm.endsWith(".history.read") || perm === "benchmark.compare"),
  };
}

export class BootstrapCompanyUseCase {
  constructor(
    private readonly companyRepository = new PrismaCompanyRepository(),
    private readonly companyModuleRepository = new PrismaCompanyModuleRepository(),
    private readonly companyUserRepository = new PrismaCompanyUserRepository(),
    private readonly roleRepository = new PrismaRoleRepository(),
    private readonly permissionRepository = new PrismaPermissionRepository()
  ) {}

  async execute(input: BootstrapCompanyInput): Promise<{
    companyId: string;
    enabledModules: string[];
  }> {
    const existing = await this.companyRepository.findByCode(input.companyCode);
    const company =
      existing ??
      (await this.companyRepository.createCompany({
        code: input.companyCode,
        name: input.companyName,
      }));

    await this.permissionRepository.syncPermissionsFromRegistry();

    const enableUseCase = new EnableCompanyModuleUseCase(
      this.companyModuleRepository,
      this.companyRepository
    );

    for (const moduleDef of MODULE_REGISTRY.filter((m) => m.defaultEnabled)) {
      await enableUseCase.execute({
        companyId: company.id,
        moduleCode: moduleDef.code,
        changedBy: input.adminUserId,
        reason: "bootstrap_default",
      });
    }

    await this.companyUserRepository.ensureMembership(company.id, input.adminUserId);

    const rolePermissionPlan = getRolePermissionPlan();
    for (const roleSeed of BASE_ROLES) {
      const role = await this.roleRepository.ensureRole(roleSeed);
      const permissionCodes = rolePermissionPlan[roleSeed.code] ?? [];
      const permissionMap = await this.permissionRepository.getPermissionIdsByCode(permissionCodes);
      await this.permissionRepository.attachPermissionsToRole(role.id, [...permissionMap.values()]);
    }

    const adminRole = await this.roleRepository.getRoleByCode("company_admin");
    if (adminRole) {
      await this.roleRepository.assignUserRole({
        userId: input.adminUserId,
        companyId: company.id,
        roleId: adminRole.id,
      });
    }

    // Governance initial profile (idempotent)
    await this.createInitialGovernanceProfile(company.id, input.adminUserId, input.companyCode);

    await this.companyRepository.appendAuditLog({
      companyId: company.id,
      entityName: "security.company_bootstrap",
      entityId: company.id,
      action: "bootstrap_completed",
      changedBy: input.adminUserId,
      newData: {
        companyCode: input.companyCode,
        companyName: input.companyName,
      },
    });

    const enabledModules = await this.companyModuleRepository.getEnabledModules(company.id);
    return {
      companyId: company.id,
      enabledModules,
    };
  }

  private async createInitialGovernanceProfile(
    companyId: string,
    adminUserId: string,
    companyCode: string
  ): Promise<void> {
    const profileCode = `INIT-${companyCode}-GOV`;
    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO params.profile (code, name, company_id, is_active, created_by)
        VALUES (
          ${profileCode},
          ${`Initial Governance Profile - ${companyCode}`},
          ${companyId}::uuid,
          false,
          ${adminUserId}::uuid
        )
        ON CONFLICT (code) DO NOTHING
      `
    );
  }
}
