import { NextResponse } from 'next/server';
import { buildScoreSummary } from '@/lib/score-summary';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const { runId } = await params;

    if (!runId) {
      return NextResponse.json({ error: 'Missing runId' }, { status: 400 });
    }

    const summary = await buildScoreSummary(prisma, runId, { persistControlScores: true });
    return NextResponse.json(summary.payload);
  } catch (error: any) {
    console.error('Error building score summary:', error);
    const status = error?.message === 'Run not found' ? 404 : 500;
    return NextResponse.json({ error: error?.message || 'Failed to build summary' }, { status });
  }
}
