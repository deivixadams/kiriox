import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Payload = {
  title?: string;
  text?: string;
};

function buildPrompt(title: string, text: string) {
  if (text.trim()) {
    return [
      'Responde siempre en español.',
      'Mejora la redaccion de las notas del auditor sin cambiar el significado.',
      'Usa tono profesional y conciso. No excedas 85 palabras.',
      `Aspecto manual: ${title}`,
      `Texto: ${text}`
    ].join('\n');
  }
  return [
    'Responde siempre en español.',
    'Redacta notas del auditor basadas en el aspecto manual provisto.',
    'Usa tono profesional y conciso. No excedas 85 palabras.',
    `Aspecto manual: ${title}`
  ].join('\n');
}

export async function POST(req: Request) {
  const { title = '', text = '' } = (await req.json()) as Payload;
  if (!title.trim() && !text.trim()) {
    return NextResponse.json({ text: '' }, { status: 400 });
  }

  try {
    const origin = new URL(req.url).origin;
    const chatRes = await fetch(`${origin}/api/llm/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: buildPrompt(title.trim(), text.trim()) }],
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
    console.error('AI extension-notes error:', error);
  }

  return NextResponse.json({ text: '' }, { status: 500 });
}
