import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

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

    const run = await prisma.run_draft.findUnique({
      where: { id: runId },
      select: { id: true },
    });

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const controls = await prisma.$queryRaw(Prisma.sql`
      SELECT
        c.id,
        c.code,
        c.name,
        c.description,
        rcd.reasons
      FROM score.run_control_draft rcd
      JOIN corpus.control c
        ON c.id = rcd.control_id
      WHERE rcd.run_id = ${runId}::uuid
      ORDER BY c.code
    `);

    const normalized = (controls as any[]).map((row) => {
      const reasons = row.reasons;
      const evaluation = reasons && typeof reasons === 'object' ? reasons.evaluation_4d || null : null;
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        evaluation_4d: evaluation,
      };
    });

    return NextResponse.json({ runId, controls: normalized });
  } catch (error: any) {
    console.error('Error loading run controls:', error);
    return NextResponse.json({ error: 'Failed to load controls' }, { status: 500 });
  }
}
