import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Payload = {
  controlName?: string;
  text?: string;
  howToEvaluate?: string;
  coverageNotes?: string;
  controlDescription?: string;
};

function buildPrompt(controlName: string, text: string, howToEvaluate: string, coverageNotes: string, controlDescription: string) {
  const detail = controlDescription ? `\nDescripcion del control: ${controlDescription}` : '';
  const coverage = coverageNotes ? `\nNotas de cobertura: ${coverageNotes}` : '';
  const howTo = howToEvaluate ? `\nComo evaluar: ${howToEvaluate}` : '';
  if (text.trim()) {
    return [
      'Responde siempre en español.',
      'Mejora la redaccion de estas observaciones de evaluacion de control en auditoria AML/CFT.',
      'Mantén el significado original, no inventes datos, usa tono profesional y conciso.',
      `Control: ${controlName}`,
      `${detail}${coverage}${howTo}`,
      `Texto: ${text}`
    ].join('\n');
  }
  return [
    'Responde siempre en español.',
    'Redacta observaciones y hallazgos iniciales para evaluar este control en auditoria AML/CFT.',
    'No inventes datos que no esten en el contexto. Usa tono profesional y conciso.',
    `Control: ${controlName}`,
    `${detail}${coverage}${howTo}`
  ].join('\n');
}

export async function POST(req: Request) {
  const { controlName = '', text = '', howToEvaluate = '', coverageNotes = '', controlDescription = '' } = (await req.json()) as Payload;
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
          content: buildPrompt(
            controlName.trim(),
            text.trim(),
            howToEvaluate.trim(),
            coverageNotes.trim(),
            controlDescription.trim()
          )
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
    console.error('AI control-notes error:', error);
  }

  return NextResponse.json({ text: '' }, { status: 500 });
}
