import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Payload = {
  controlName?: string;
  controlDescription?: string;
  coverageNotes?: string;
  text?: string;
};

function buildPrompt(controlName: string, controlDescription: string, coverageNotes: string, text: string) {
  const detail = controlDescription ? `\nDescripcion del control: ${controlDescription}` : '';
  const coverage = coverageNotes ? `\nNotas de cobertura: ${coverageNotes}` : '';
  if (text.trim()) {
    return [
      'Responde siempre en español.',
      'Mejora la redaccion del siguiente texto sobre como evaluar el control en auditoria AML/CFT.',
      'Mantén el significado original, no inventes datos y usa menos de 80 palabras.',
      `Control: ${controlName}`,
      `${detail}${coverage}`,
      `Texto: ${text}`
    ].join('\n');
  }
  return (
    'Responde siempre en español. ' +
    'Actua como un experto en Auditoria de Prevencion de lavado de Activos y describe en como evaluar el control. ' +
    'Usa menos de 80 palabras. No agregues explicaciones.' +
    `\nControl: ${controlName}${detail}${coverage}`
  );
}

export async function POST(req: Request) {
  const { controlName = '', controlDescription = '', coverageNotes = '', text = '' } = (await req.json()) as Payload;
  if (!controlName.trim()) {
    return NextResponse.json({ text: '' }, { status: 400 });
  }

  try {
    const origin = new URL(req.url).origin;
    const chatRes = await fetch(`${origin}/api/llm/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: buildPrompt(controlName.trim(), controlDescription.trim(), coverageNotes.trim(), text.trim())
        }],
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
    console.error('AI control-evaluation error:', error);
  }

  return NextResponse.json({ text: '' }, { status: 500 });
}
