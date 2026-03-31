import type { GraphFilters } from '@/modules/structural-risk/domain/types/GraphTypes';

function parseMultiValue(searchParams: URLSearchParams, key: string): string[] {
  const directValues = searchParams.getAll(key);
  const csvValue = searchParams.get(key);
  const values = [...directValues];

  if (csvValue && !directValues.includes(csvValue)) {
    values.push(csvValue);
  }

  return [
    ...new Set(
      values
        .flatMap((value) => String(value).split(','))
        .map((value) => value.trim())
        .filter(Boolean)
    ),
  ];
}

function parseBooleanFlag(value: string | null): boolean {
  return value === 'true' || value === '1';
}

export function parseGraphFilters(searchParams: URLSearchParams): GraphFilters {
  const criticalityMinRaw = Number(searchParams.get('criticality_min'));

  return {
    nodeTypes: parseMultiValue(searchParams, 'node_type'),
    edgeTypes: parseMultiValue(searchParams, 'edge_type'),
    statuses: parseMultiValue(searchParams, 'status'),
    search: searchParams.get('search')?.trim() ?? '',
    onlyHardGate: parseBooleanFlag(searchParams.get('hard_gate')),
    onlyDependencyRoot: parseBooleanFlag(searchParams.get('dependency_root')),
    onlyPrimary: parseBooleanFlag(searchParams.get('primary')),
    onlyMandatory: parseBooleanFlag(searchParams.get('mandatory')),
    criticalityMin: Number.isFinite(criticalityMinRaw) ? criticalityMinRaw : null,
  };
}
