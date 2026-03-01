import { NextResponse } from 'next/server';
import { llmStudioChat } from '@/lib/llm/llmstudio';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { model, messages, stream = false } = await req.json();
  const resolvedModel =
    model || process.env.LLM_MODEL || process.env.OLLAMA_MODEL || 'deepseek-r1-7b';

  const supportsSystemRole = process.env.LLM_SYSTEM_ROLE !== 'false';
  const normalizedMessages = supportsSystemRole
    ? messages
    : [
        {
          role: 'user',
          content: messages
            .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
            .join('\n\n'),
        },
      ];

  const r = await llmStudioChat({
    model: resolvedModel,
    messages: normalizedMessages,
    stream,
  });

  if (!r.ok) {
    const err = await r.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  if (!stream) {
    const data = await r.json();
    return NextResponse.json(data);
  }

  return new Response(r.body, {
    headers: {
      'Content-Type':
        r.headers.get('content-type') || 'text/event-stream; charset=utf-8',
    },
  });
}
