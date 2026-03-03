import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-server';
import { getDraft, updateDraft } from '../../store';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { id } = await params;
    const draft = await getDraft(auth, id);
    if (!draft) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    await updateDraft(auth, id, { step: Math.max(draft.step || 1, 1) });
    return NextResponse.json({ success: true, draftId: draft.id });
  } catch (error: any) {
    console.error('Error materializing draft:', error);
    return NextResponse.json({ error: 'Failed to materialize draft' }, { status: 500 });
  }
}
