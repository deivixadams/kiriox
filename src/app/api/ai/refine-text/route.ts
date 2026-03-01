import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

type Payload = {
  text?: string;
  field?: string;
  promptCode?: string;
};

const FIELD_PROMPTS: Record<string, string> = {
  objetivo: 'Redacta un objetivo general claro y formal para un acta de auditoria.',
  alcance: 'Describe el alcance de la auditoria con lenguaje tecnico y especifico.',
  metodologia: 'Redacta la metodologia de trabajo en tono profesional y conciso.',
};

function normalizeText(input: string) {
  const trimmed = input.replace(/\s+/g, ' ').trim();
  if (!trimmed) return '';
  const withCap = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?]$/.test(withCap) ? withCap : `${withCap}.`;
}

export async function POST(req: Request) {
  const { text = '', field = '', promptCode = '' } = (await req.json()) as Payload;
  const baseText = String(text ?? '').trim();

  const prisma = (await import('@/lib/prisma')).default;
  let dbPrompt: { prompt: string; name: string; text_area: string | null } | null = null;
  if (promptCode) {
    const rows = await prisma.$queryRaw<
      { prompt: string; name: string; text_area: string | null }[]
    >`
      SELECT prompt, name, text_area
      FROM corpus.llm_master_prompts
      WHERE code = ${promptCode}
        AND is_active = true
      ORDER BY version DESC
      LIMIT 1
    `;
    dbPrompt = rows?.[0] ?? null;
  }

  const fallbackPrompt =
    'Eres un asistente experto en redaccion de actas de auditoria AML/CFT. ' +
    'Reescribe o redacta el contenido con tono formal, claro y sin redundancias. ' +
    'Manten el contenido original sin inventar datos.';

  const contextLabel = dbPrompt?.text_area || dbPrompt?.name || field || 'contenido del acta';
  const baseInstruction = dbPrompt?.prompt || FIELD_PROMPTS[field] || fallbackPrompt;
  const envSystemPrompt =
    process.env.SYSTEM_PROMPT || process.env.GUIAS_REVISION_SYSTEM_PROMPT || '';
  const corePrompt = baseText
    ? `${baseInstruction}\n\nTexto:\n${baseText}`
    : `${baseInstruction}\n\nGenera un texto profesional para: ${contextLabel}.`;
  const userPrompt = envSystemPrompt ? `${envSystemPrompt}\n\n${corePrompt}` : corePrompt;

  try {
    const origin = new URL(req.url).origin;
    const chatRes = await fetch(`${origin}/api/llm/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });

    if (chatRes.ok) {
      const data = await chatRes.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content === 'string' && content.trim()) {
        return NextResponse.json({ refinedText: content.trim() });
      }
    }
  } catch (error) {
    console.error('AI refine-text error:', error);
  }

  return NextResponse.json({ refinedText: baseText ? normalizeText(baseText) : '' });
}
