import { MODULE_REGISTRY_MAP } from "./module-registry";

export function resolveModuleDependencies(moduleCode: string): string[] {
  const visited = new Set<string>();

  function visit(code: string) {
    if (visited.has(code)) return;

    const moduleDef = MODULE_REGISTRY_MAP.get(code);
    if (!moduleDef) {
      throw new Error(`Module not found: ${code}`);
    }

    visited.add(code);
    moduleDef.dependencies.forEach(visit);
  }

  visit(moduleCode);
  return [...visited];
}

