import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

type PrismaCompatClient = PrismaClient & Record<string, any>;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaCompatClient;
};

function createPrismaClient(): PrismaCompatClient {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is required to initialize Prisma client");
  }

  const adapter = new PrismaPg({
    connectionString,
  });

  const base = new PrismaClient({
    adapter,
    log: ["error", "warn"],
  });

  // Compatibility layer to avoid breaking legacy model access while
  // the modular migration is in progress.
  const aliasMap: Record<string, string> = {
    securityUser: "security_users",
    securityUserScope: "security_user_scope",
    securityUserToken: "security_user_token",
    corpusAssessment: "audit_assessment",
    corpusAssessmentDraft: "audit_assessment_draft",
    corpusEvaluation: "audit_evaluation",
    corpusAuditLog: "audit_log",
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
