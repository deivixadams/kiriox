import { NextResponse } from 'next/server';
import { createDraft } from './store';

export async function POST() {
  try {
    const draft = createDraft();
    return NextResponse.json(draft);
  } catch (error: any) {
    console.error('Error creating draft:', error);
    return NextResponse.json({ error: 'Failed to create draft' }, { status: 500 });
  }
}
