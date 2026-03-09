import { NextResponse } from 'next/server';

export async function PUT(request: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const body = await request.json();
    const {
      run_id,
      control_id,
      dimension,
      test_id,
      score,
      passed,
      assessment_method,
      evaluator_notes,
      reasons,
    } = body || {};

    if (!run_id || !control_id || !dimension || !test_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const result = await prisma.score_test_result_draft.upsert({
      where: {
        run_id_control_id_dimension_test_id: {
          run_id,
          control_id,
          dimension,
          test_id,
        },
      },
      update: {
        score,
        passed,
        assessment_method,
        evaluator_notes,
        reasons,
        updated_at: new Date(),
      },
      create: {
        run_id,
        control_id,
        dimension,
        test_id,
        score,
        passed,
        assessment_method,
        evaluator_notes,
        reasons,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    console.error('Error saving test result:', error);
    return NextResponse.json({ error: 'Failed to save test result' }, { status: 500 });
  }
}
