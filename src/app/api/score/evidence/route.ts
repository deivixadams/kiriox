import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('run_id');
    const controlId = searchParams.get('control_id');
    const dimension = searchParams.get('dimension');
    const testId = searchParams.get('test_id');

    if (!runId || !controlId || !dimension || !testId) {
      return NextResponse.json({ error: 'Missing run_id/control_id/dimension/test_id' }, { status: 400 });
    }

    const evidence = await prisma.evidence_score_draft.findMany({
      where: {
        run_id: runId,
        control_id: controlId,
        dimension,
        test_id: testId,
      },
      orderBy: { uploaded_at: 'desc' },
    });

    return NextResponse.json({ evidence });
  } catch (error: any) {
    console.error('Error loading score evidence:', error);
    return NextResponse.json({ error: 'Failed to load evidence' }, { status: 500 });
  }
}
