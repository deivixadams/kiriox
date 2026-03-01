import { NextResponse } from 'next/server';
import { getDraft, updateDraft } from '../store';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const draft = getDraft(id);
    if (!draft) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(draft);
  } catch (error: any) {
    console.error('Error loading draft:', error);
    return NextResponse.json({ error: 'Failed to load draft' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const patch = await request.json();
    const draft = updateDraft(id, patch);
    if (!draft) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(draft);
  } catch (error: any) {
    console.error('Error updating draft:', error);
    return NextResponse.json({ error: 'Failed to update draft' }, { status: 500 });
  }
}
