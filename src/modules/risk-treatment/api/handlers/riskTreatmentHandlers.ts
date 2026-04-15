import { Prisma } from '@prisma/client';
import prisma from '@/infrastructure/db/prisma/client';
import { ApiError } from '@/shared/http';

export async function getRisksByProcessHandler(request: Request) {
  const url = new URL(request.url);
  const processId = url.searchParams.get('processId');
  const companyId = url.searchParams.get('companyId');

  if (!processId || !companyId) {
    throw ApiError.badRequest('processId and companyId are required');
  }

  // Get risks associated with the process through its activities (elements)
  const risks = await prisma.$queryRaw<any[]>(Prisma.sql`
    SELECT DISTINCT
      r.id,
      r.code,
      r.name,
      r.description,
      r.risk_type,
      cp.name as probability_name,
      cp.numeric_value as probability_value,
      ci.name as impact_name,
      ci.numeric_value as impact_value
    FROM core.risk r
    JOIN core.map_elements_risk mer ON mer.risk_id = r.id
    JOIN core.map_domain_element mde ON mde.element_id = mer.element_id
    LEFT JOIN core.catalog_probability cp ON cp.catalog_probability_id = r.catalog_probability_id
    LEFT JOIN core.catalog_impact ci ON ci.catalog_impact_id = r.catalog_impact_id
    WHERE mde.domain_id = ${processId}::uuid
      AND COALESCE(r.is_active, true) = true
    ORDER BY r.name ASC
  `);

  return Response.json({ items: risks });
}

export async function postRiskTreatmentHandler(request: Request) {
  const body = await request.json();
  const { risk_id, title, treatment_type, status, justification, description, decision_date, planned_start_date, planned_end_date, next_review_date, residual_risk_expected, notes } = body;

  if (!risk_id || !title || !treatment_type || !status) {
    throw ApiError.badRequest('risk_id, title, treatment_type and status are required');
  }

  try {
    const treatment = await prisma.risk_treatment.create({
      data: {
        risk_id,
        title,
        treatment_type,
        status,
        justification,
        description,
        decision_date: decision_date ? new Date(decision_date) : null,
        planned_start_date: planned_start_date ? new Date(planned_start_date) : null,
        planned_end_date: planned_end_date ? new Date(planned_end_date) : null,
        next_review_date: next_review_date ? new Date(next_review_date) : null,
        residual_risk_expected: residual_risk_expected?.toString(),
        notes
      }
    });

    return Response.json(treatment, { status: 201 });
  } catch (error: any) {
    console.error('Error creating risk treatment:', error);
    return Response.json(
      { error: 'Error creating risk treatment', details: error.message },
      { status: 500 }
    );
  }
}

export async function getRiskTreatmentsHandler(request: Request) {
  const url = new URL(request.url);
  const riskId = url.searchParams.get('riskId');

  if (!riskId) {
    throw ApiError.badRequest('riskId is required');
  }

  try {
    const treatments = await prisma.risk_treatment.findMany({
      where: { risk_id: riskId },
      include: {
        actions: true,
        responsibles: true,
        evidences: true
      },
      orderBy: { created_at: 'desc' }
    });

    return Response.json({ items: treatments });
  } catch (error: any) {
    console.error('Error fetching risk treatments:', error);
    return Response.json(
      { error: 'Error fetching risk treatments', details: error.message },
      { status: 500 }
    );
  }
}

export async function updateRiskTreatmentHandler(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();

  const updated = await prisma.risk_treatment.update({
    where: { id },
    data: {
      ...body,
      decision_date: body.decision_date ? new Date(body.decision_date) : undefined,
      planned_start_date: body.planned_start_date ? new Date(body.planned_start_date) : undefined,
      planned_end_date: body.planned_end_date ? new Date(body.planned_end_date) : undefined,
      next_review_date: body.next_review_date ? new Date(body.next_review_date) : undefined,
      updated_at: new Date()
    }
  });

  return Response.json(updated);
}
