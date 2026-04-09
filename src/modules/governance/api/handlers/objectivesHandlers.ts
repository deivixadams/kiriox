import { NextResponse } from 'next/server';
import prisma from '@/infrastructure/db/prisma/client';
import type { AccessContext } from '@/shared/http/withAccess';

type ObjectivePayload = {
  objective_code?: string;
  objective_name?: string;
  objective_description?: string | null;
  rationale?: any | null;
  sequence_order?: number | null;
  is_active?: boolean | null;
};

export async function getObjectivesHandler(access: AccessContext) {
  try {
    const companyId = access.company.id;
    const objectives = await prisma.objective.findMany({
      where: { company_id: companyId },
      orderBy: [{ sequence_order: 'asc' }, { objective_code: 'asc' }],
    });

    return NextResponse.json({ data: objectives });
  } catch (error: any) {
    console.error('Error fetching objectives:', error);
    return NextResponse.json({ error: 'Failed to fetch objectives' }, { status: 500 });
  }
}

export async function putObjectiveHandler(request: Request, access: AccessContext) {
  try {
    const body = (await request.json()) as ObjectivePayload;
    const objectiveCode = body?.objective_code?.trim();
    const objectiveName = body?.objective_name?.trim();

    if (!objectiveCode || !objectiveName) {
      return NextResponse.json(
        { error: 'objective_code and objective_name are required' },
        { status: 400 }
      );
    }

    const companyId = access.company.id;
    const data = {
      company_id: companyId,
      objective_code: objectiveCode,
      objective_name: objectiveName,
      objective_description: body.objective_description?.trim() ?? null,
      rationale: body.rationale ?? null,
      sequence_order: body.sequence_order ?? null,
      is_active: body.is_active ?? true,
      updated_at: new Date(),
    };

    const existing = await prisma.objective.findFirst({
      where: {
        company_id: companyId,
        objective_code: objectiveCode,
      },
    });

    const saved = existing
      ? await prisma.objective.update({
          where: { objective_id: existing.objective_id },
          data,
        })
      : await prisma.objective.create({
          data: {
            ...data,
            created_at: new Date(),
          },
        });

    return NextResponse.json(saved);
  } catch (error: any) {
    console.error('Error saving objective:', error);
    return NextResponse.json({ error: 'Failed to save objective' }, { status: 500 });
  }
}
