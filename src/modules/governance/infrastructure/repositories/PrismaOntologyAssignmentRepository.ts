import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import type { OntologyAssignmentRepository } from '@/modules/governance/domain/contracts/OntologyAssignmentRepository';
import type {
  GovernanceCompanyOption,
  GovernanceCompanyOntologyAssignment,
  GovernanceOntologyOption,
  UpsertCompanyOntologyAssignmentInput,
} from '@/modules/governance/domain/types/OntologyAssignmentTypes';

function toCompanyOption(row: { id: string; code: string; name: string }): GovernanceCompanyOption {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
  };
}

function toOntologyOption(row: {
  id: string;
  code: string;
  name: string;
  description: string;
  selection: unknown;
  sort_order: number;
}): GovernanceOntologyOption {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    selection: row.selection && typeof row.selection === 'object' ? (row.selection as Record<string, unknown>) : {},
    sortOrder: row.sort_order,
  };
}

function toAssignment(row: {
  company_id: string;
  ontology_id: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}): GovernanceCompanyOntologyAssignment {
  return {
    companyId: row.company_id,
    ontologyId: row.ontology_id,
    isActive: row.is_active,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export class PrismaOntologyAssignmentRepository implements OntologyAssignmentRepository {
  async listActiveCompanies(): Promise<GovernanceCompanyOption[]> {
    const rows = await prisma.$queryRaw<{ id: string; code: string; name: string }[]>(Prisma.sql`
      SELECT c.id, c.code, c.name
      FROM core.company c
      WHERE c.is_active = true
      ORDER BY c.name ASC
    `);

    return rows.map(toCompanyOption);
  }

  async listActiveOntologies(): Promise<GovernanceOntologyOption[]> {
    const rows = await prisma.$queryRaw<{
      id: string;
      code: string;
      name: string;
      description: string;
      selection: unknown;
      sort_order: number;
    }[]>(Prisma.sql`
      SELECT o.id, o.code, o.name, o.description, o.selection, o.sort_order
      FROM core.company_ontology o
      WHERE o.is_active = true
      ORDER BY o.sort_order ASC, o.name ASC
    `);

    return rows.map(toOntologyOption);
  }

  async listActiveAssignments(): Promise<GovernanceCompanyOntologyAssignment[]> {
    const rows = await prisma.$queryRaw<{
      company_id: string;
      ontology_id: string;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
    }[]>(Prisma.sql`
      SELECT a.company_id, a.ontology_id, a.is_active, a.created_at, a.updated_at
      FROM core.company_ontology_assignment a
      WHERE a.is_active = true
      ORDER BY a.updated_at DESC
    `);

    return rows.map(toAssignment);
  }

  async findActiveCompanyById(companyId: string): Promise<GovernanceCompanyOption | null> {
    const rows = await prisma.$queryRaw<{ id: string; code: string; name: string }[]>(Prisma.sql`
      SELECT c.id, c.code, c.name
      FROM core.company c
      WHERE c.id = ${companyId}::uuid
        AND c.is_active = true
      LIMIT 1
    `);

    if (!rows[0]) return null;
    return toCompanyOption(rows[0]);
  }

  async findActiveOntologyById(ontologyId: string): Promise<GovernanceOntologyOption | null> {
    const rows = await prisma.$queryRaw<{
      id: string;
      code: string;
      name: string;
      description: string;
      selection: unknown;
      sort_order: number;
    }[]>(Prisma.sql`
      SELECT o.id, o.code, o.name, o.description, o.selection, o.sort_order
      FROM core.company_ontology o
      WHERE o.id = ${ontologyId}::uuid
        AND o.is_active = true
      LIMIT 1
    `);

    if (!rows[0]) return null;
    return toOntologyOption(rows[0]);
  }

  async upsertAssignment(input: UpsertCompanyOntologyAssignmentInput): Promise<GovernanceCompanyOntologyAssignment> {
    const rows = await prisma.$queryRaw<{
      company_id: string;
      ontology_id: string;
      is_active: boolean;
      created_at: Date;
      updated_at: Date;
    }[]>(Prisma.sql`
      INSERT INTO core.company_ontology_assignment (
        company_id,
        ontology_id,
        is_active,
        created_at,
        updated_at,
        updated_by
      )
      VALUES (
        ${input.companyId}::uuid,
        ${input.ontologyId}::uuid,
        true,
        now(),
        now(),
        ${input.updatedBy}::uuid
      )
      ON CONFLICT (company_id)
      DO UPDATE SET
        ontology_id = EXCLUDED.ontology_id,
        is_active = true,
        updated_at = now(),
        updated_by = EXCLUDED.updated_by
      RETURNING company_id, ontology_id, is_active, created_at, updated_at
    `);

    return toAssignment(rows[0]);
  }
}
