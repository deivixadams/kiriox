type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

type ChatRequest = {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
};

export async function llmStudioChat(request: ChatRequest) {
  const rawBaseUrl =
    process.env.LM_STUDIO_BASE_URL ||
    process.env.LLM_BASE_URL ||
    process.env.llM_BASE_URL ||
    process.env.OLLAMA_BASE_URL ||
    'http://localhost:1234/v1';
  const baseUrl = rawBaseUrl.endsWith('/v1')
    ? rawBaseUrl
    : `${rawBaseUrl.replace(/\/$/, '')}/v1`;
  const apiKey =
    process.env.LM_STUDIO_API_KEY || process.env.OPENAI_API_KEY || 'lm-studio';

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 600000);

  try {
    const r = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        stream: request.stream ?? false,
      }),
    });
    return r;
  } finally {
    clearTimeout(timeoutId);
  }
}
