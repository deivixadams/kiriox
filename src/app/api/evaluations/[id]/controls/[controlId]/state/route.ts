import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string, controlId: string }> }
) {
    try {
        const { id: evaluationId, controlId } = await params;
        const body = await request.json();

        // Fields allowed to update
        const {
            design,
            formalization,
            coverage,
            recency,
            evidenceValidated,
            applicability,
            notApplicableReason,
            state // fail/pass/warning
        } = body;

        // Upsert the state record
        const updatedState = await (prisma as any).corpusEvaluationControlState.upsert({
            where: {
                evaluationId_controlId: {
                    evaluationId,
                    controlId
                }
            },
            create: {
                evaluationId,
                controlId,
                state: state || 'fail',
                formalizationEffectiveness: formalization,
                coverageEffectiveness: coverage,
                recencyEffectiveness: recency,
                evidenceValidated: evidenceValidated || false,
                applicability: applicability || 'applicable',
                notApplicableReason: notApplicableReason,
                computedAt: new Date()
            },
            update: {
                state,
                formalizationEffectiveness: formalization,
                coverageEffectiveness: coverage,
                recencyEffectiveness: recency,
                evidenceValidated,
                applicability,
                notApplicableReason,
                computedAt: new Date()
            }
        });

        return NextResponse.json(updatedState);
    } catch (error: any) {
        console.error('Error updating control state:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
