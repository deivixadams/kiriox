import { PrismaClient } from "@prisma/client";

type PrismaCompatClient = PrismaClient & Record<string, any>;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaCompatClient;
};

function createPrismaClient(): PrismaCompatClient {
  const base = new PrismaClient({
    log: ["error", "warn"],
  });

  // Compatibility layer to avoid breaking legacy model access while
  // the modular migration is in progress.
  const aliasMap: Record<string, string> = {
    securityUser: "security_users",
    securityRbac: "security_rbac",
    securityUserScope: "security_user_scope",
    securityUserToken: "security_user_token",
    corpusAssessment: "audit_assessment",
    corpusAssessmentDraft: "audit_assessment_draft",
    corpusEvaluation: "audit_evaluation",
    corpusAuditLog: "audit_log",
    corpusCompany: "company",
    corpusDomain: "domain",
    corpusFramework: "corpus_framework",
    corpusFrameworkVersion: "framework_version",
    corpusJurisdiction: "jurisdiction",
    corpusRisk: "risk",
    corpusCatalogAuditFindingType: "audit_finding_type",
    corpusAuditFinding: "audit_finding",
  };

  const compat = new Proxy(base as Record<string, any>, {
    get(target, prop: string | symbol) {
      if (typeof prop !== "string") return target[prop as any];

      if (prop in aliasMap) {
        return target[aliasMap[prop]];
      }

      if (prop === "corpus") {
        return {
          assessment_draft: target.audit_assessment_draft,
        };
      }

      return target[prop];
    },
  });

  return compat as PrismaCompatClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
