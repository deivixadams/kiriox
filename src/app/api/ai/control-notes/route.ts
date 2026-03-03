import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Payload = {
  controlName?: string;
  text?: string;
};

function buildPrompt(controlName: string, text: string) {
  return [
    'Mejora la redaccion de estas observaciones de evaluacion de control en auditoria AML/CFT.',
    'Mantén el significado original, no inventes datos, usa tono profesional y conciso.',
    `Control: ${controlName}`,
    `Texto: ${text}`
  ].join('\n');
}

export async function POST(req: Request) {
  const { controlName = '', text = '' } = (await req.json()) as Payload;
  if (!controlName.trim() || !text.trim()) {
    return NextResponse.json({ text: '' }, { status: 400 });
  }

  try {
    const origin = new URL(req.url).origin;
    const chatRes = await fetch(`${origin}/api/llm/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: buildPrompt(controlName.trim(), text.trim()) }],
      }),
    });

    if (chatRes.ok) {
      const data = await chatRes.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === 'string' && content.trim()) {
        return NextResponse.json({ text: content.trim() });
      }
    }
  } catch (error) {
    console.error('AI control-notes error:', error);
  }

  return NextResponse.json({ text: '' }, { status: 500 });
}
