export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ProviderConfig = {
  id: string;
  apiKey: string;
  baseUrl: string;
  model: string;
};

type ChatOptions = {
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
};

function getProviders(): ProviderConfig[] {
  const providers: ProviderConfig[] = [];

  if (process.env.OLLAMA_API_KEY) {
    providers.push({
      id: "ollama",
      apiKey: process.env.OLLAMA_API_KEY,
      baseUrl: (process.env.OLLAMA_BASE_URL || "https://ollama.com/v1").replace(/\/$/, ""),
      model: process.env.OLLAMA_MODEL || "deepseek-v4.1-flash",
    });
  }

  if (process.env.GROQ_API_KEY) {
    providers.push({
      id: "groq",
      apiKey: process.env.GROQ_API_KEY,
      baseUrl: "https://api.groq.com/openai/v1",
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
    });
  }

  return providers;
}

export function isAiConfigured(): boolean {
  return getProviders().length > 0;
}

export function aiProviderSummary(): string {
  return getProviders().map((p) => `${p.id} (${p.model})`).join(" → ") || "none";
}

type ChatCompletionResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

async function chatWithProvider(
  provider: ProviderConfig,
  messages: ChatMessage[],
  opts: ChatOptions,
): Promise<string> {
  const response = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens,
    }),
    signal: AbortSignal.timeout(opts.timeoutMs ?? 45_000),
  });

  const data = (await response.json()) as ChatCompletionResponse;

  if (!response.ok || data.error) {
    throw new Error(
      `${provider.id} API error: ${data.error?.message || response.status}`,
    );
  }

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error(`${provider.id} returned an empty response`);
  return content;
}

export async function chat(
  messages: ChatMessage[],
  opts: ChatOptions = {},
): Promise<string> {
  const providers = getProviders();

  if (providers.length === 0) {
    throw new Error(
      "No AI provider configured. Set OLLAMA_API_KEY (Ollama Cloud) or GROQ_API_KEY.",
    );
  }

  let lastError: unknown = null;
  for (const provider of providers) {
    try {
      return await chatWithProvider(provider, messages, opts);
    } catch (error) {
      lastError = error;
      console.error(`AI provider ${provider.id} failed:`, error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("All AI providers failed");
}

export async function chatJson<T>(
  messages: ChatMessage[],
  opts: ChatOptions = {},
): Promise<T> {
  const raw = await chat(
    [
      ...messages,
      {
        role: "user",
        content: "Respond with ONLY a single valid JSON object. No markdown, no code fences, no extra text.",
      },
    ],
    { temperature: opts.temperature ?? 0.2, ...opts },
  );

  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const jsonSlice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;

  try {
    return JSON.parse(jsonSlice) as T;
  } catch {
    throw new Error(`AI returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }
}