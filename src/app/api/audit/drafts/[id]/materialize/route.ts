import { NextResponse } from 'next/server';
import { getDraft } from '../../store';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const draft = getDraft(id);
    if (!draft) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, draftId: draft.id });
  } catch (error: any) {
    console.error('Error materializing draft:', error);
    return NextResponse.json({ error: 'Failed to materialize draft' }, { status: 500 });
  }
}
