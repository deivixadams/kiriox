export type ModuleDefinition = {
  code: string;
  name: string;
  isCore: boolean;
  defaultEnabled: boolean;
  dependencies: string[];
  basePath: string;
  navigationKey?: string;
  permissions: string[];
};

export const MODULE_REGISTRY: ModuleDefinition[] = [
  {
    code: "core",
    name: "Core",
    isCore: true,
    defaultEnabled: true,
    dependencies: [],
    basePath: "/dashboard",
    navigationKey: "dashboard",
    permissions: [],
  },
  {
    code: "security",
    name: "Security",
    isCore: true,
    defaultEnabled: true,
    dependencies: ["core"],
    basePath: "/security",
    permissions: [],
  },
  {
    code: "governance",
    name: "Governance",
    isCore: true,
    defaultEnabled: true,
    dependencies: ["core"],
    basePath: "/governance",
    navigationKey: "governance",
    permissions: [
      "governance.parameters.read",
      "governance.parameters.write",
      "governance.versioning.read",
      "governance.engine.read",
      "governance.license.read",
      "governance.license.write",
    ],
  },
  {
    code: "benchmark",
    name: "Benchmark",
    isCore: true,
    defaultEnabled: true,
    dependencies: ["core"],
    basePath: "/benchmark",
    navigationKey: "benchmark",
    permissions: ["benchmark.read", "benchmark.compare"],
  },
  {
    code: "linear-risk",
    name: "Linear Risk",
    isCore: false,
    defaultEnabled: false,
    dependencies: ["core", "governance"],
    basePath: "/risk/linear",
    navigationKey: "risk-linear",
    permissions: ["risk.linear.read", "risk.linear.run"],
  },
  {
    code: "structural-risk",
    name: "Structural Risk",
    isCore: false,
    defaultEnabled: false,
    dependencies: ["core", "governance"],
    basePath: "/risk/structural",
    navigationKey: "risk-structural",
    permissions: [
      "risk.structural.read",
      "risk.structural.run",
      "risk.structural.history.read",
    ],
  },
  {
    code: "audit",
    name: "Audit",
    isCore: false,
    defaultEnabled: false,
    dependencies: ["core", "governance"],
    basePath: "/audit",
    navigationKey: "audit",
    permissions: [
      "audit.read",
      "audit.write",
      "audit.findings.read",
      "audit.findings.write",
      "audit.history.read",
      "audit.plan.read",
      "audit.auditors.read",
      "audit.checklists.read",
      "audit.auditees.read",
    ],
  },
  {
    code: "alerts",
    name: "Alerts",
    isCore: false,
    defaultEnabled: false,
    dependencies: ["core", "governance"],
    basePath: "/alerts",
    navigationKey: "alerts",
    permissions: ["alerts.read", "alerts.write"],
  },
  {
    code: "simulation",
    name: "Simulation",
    isCore: false,
    defaultEnabled: false,
    dependencies: ["core", "governance", "structural-risk"],
    basePath: "/simulation",
    navigationKey: "simulation",
    permissions: ["simulation.read", "simulation.run"],
  },
];

export const MODULE_REGISTRY_MAP = new Map<string, ModuleDefinition>(
  MODULE_REGISTRY.map((moduleDef) => [moduleDef.code, moduleDef])
);
