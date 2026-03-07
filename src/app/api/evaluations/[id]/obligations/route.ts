import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Get evaluation to know the framework version
        const evaluation = await prisma.corpusEvaluation.findUnique({
            where: { id },
            include: { assessment: { select: { frameworkVersionId: true } } }
        });

        if (!evaluation) return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });

        // 2. Fetch Obligations and their Controls for this framework/evaluation
        // Note: We use corpus.obligation -> pendiente.corpus.control_obligation -> corpus.control
        const obligations = await prisma.corpusObligation.findMany({
            where: {
                // We could filter by domain if scope is by domain, but for now fetch all
            },
            include: {
                domain: true,
                controls: {
                    include: {
                        control: {
                            include: {
                                evaluationStates: {
                                    where: { evaluationId: id }
                                }
                            }
                        }
                    }
                }
            }
        });

        return NextResponse.json(obligations);
    } catch (error: any) {
        console.error('Error fetching obligations:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
