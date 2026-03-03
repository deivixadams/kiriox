import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

const EVIDENCE_DIR = 'C:\\\\_CRE\\\\evidencias';

const sanitize = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '');

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get('file');
    const riskId = String(form.get('riskId') || '').trim();
    const controlId = String(form.get('controlId') || '').trim();

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }
    if (!riskId || !controlId) {
      return NextResponse.json({ error: 'Missing riskId/controlId' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const hash = createHash('sha256').update(buffer).digest('hex');
    const ext = path.extname(file.name || '');
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStamp = `${yyyy}${mm}${dd}`;

    const safeRisk = sanitize(riskId);
    const safeControl = sanitize(controlId);
    const filename = `auditoria-${dateStamp}-${safeRisk}-${safeControl}-${hash}-evidencia${ext}`;

    await mkdir(EVIDENCE_DIR, { recursive: true });
    await writeFile(path.join(EVIDENCE_DIR, filename), buffer);

    return NextResponse.json({ filename });
  } catch (error: any) {
    console.error('Error saving evidence:', error);
    return NextResponse.json({ error: 'Failed to save evidence' }, { status: 500 });
  }
}
