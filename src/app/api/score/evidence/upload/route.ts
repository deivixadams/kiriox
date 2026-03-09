import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const EVIDENCE_DIR = 'C:\\\\_CRE\\\\evidencias-score';

const sanitize = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '');

export async function POST(request: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const form = await request.formData();
    const file = form.get('file');
    const runId = String(form.get('run_id') || '').trim();
    const controlId = String(form.get('control_id') || '').trim();
    const dimension = String(form.get('dimension') || '').trim();
    const testId = String(form.get('test_id') || '').trim();
    const caption = String(form.get('caption') || '').trim() || null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }
    if (!runId || !controlId || !dimension || !testId) {
      return NextResponse.json({ error: 'Missing run_id/control_id/dimension/test_id' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = createHash('sha256').update(buffer).digest('hex');
    const ext = path.extname(file.name || '');
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStamp = `${yyyy}${mm}${dd}`;

    const safeControl = sanitize(controlId);
    const safeTest = sanitize(testId);
    const safeDim = sanitize(dimension);
    const filename = `score-${dateStamp}-${safeControl}-${safeDim}-${safeTest}-${hash}${ext}`;

    await mkdir(EVIDENCE_DIR, { recursive: true });
    await writeFile(path.join(EVIDENCE_DIR, filename), buffer);

    const evidence = await prisma.evidence_score_draft.create({
      data: {
        run_id: runId,
        control_id: controlId,
        dimension,
        test_id: testId,
        storage_provider_code: 'local',
        bucket: null,
        object_key: filename,
        logical_path: `score/${runId}/${controlId}/${dimension}/${testId}`,
        sha256: hash,
        file_name_original: file.name,
        mime_type: file.type || null,
        size_bytes: BigInt(buffer.length),
        uploaded_by: null,
        caption,
        is_sealed: false,
      },
    });

    return NextResponse.json({ ok: true, evidence });
  } catch (error: any) {
    console.error('Error saving score evidence:', error);
    return NextResponse.json({ error: 'Failed to save evidence' }, { status: 500 });
  }
}
