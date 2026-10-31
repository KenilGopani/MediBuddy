// Shared LLM client for any OpenAI-compatible chat completions API (OpenAI, Gemini's OpenAI
// compatibility endpoint, and others). Provider, model and key come from Convex env vars, so
// switching providers is a configuration change:
//   LLM_API_KEY   required
//   LLM_MODEL     required, e.g. "gpt-4" or "gemini-flash-latest"
//   LLM_BASE_URL  optional, defaults to OpenAI: https://api.openai.com/v1
//                 (Gemini: https://generativelanguage.googleapis.com/v1beta/openai)

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

interface ChatOptions {
  messages: ChatMessage[];
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}

const MAX_ADAPTATIONS = 3;

// Providers disagree on a few request parameters. When one is rejected, adjust the request
// and try again. Returns false if the error isn't one we know how to work around.
function adaptRequest(body: Record<string, unknown>, errorText: string): boolean {
  const message = errorText.toLowerCase();
  if ("max_tokens" in body && message.includes("max_completion_tokens")) {
    body.max_completion_tokens = body.max_tokens;
    delete body.max_tokens;
    return true;
  }
  if ("temperature" in body && message.includes("temperature")) {
    delete body.temperature;
    return true;
  }
  if (
    "response_format" in body &&
    (message.includes("response_format") || message.includes("json_object"))
  ) {
    // The prompts already ask for JSON only, and parseJsonObject tolerates extra text.
    delete body.response_format;
    return true;
  }
  return false;
}

export async function chatCompletion({
  messages,
  json = false,
  temperature = 0.2,
  maxTokens = 4000,
}: ChatOptions): Promise<string> {
  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error("LLM_API_KEY not found");
  }
  const model = process.env.LLM_MODEL;
  if (!model) {
    throw new Error("LLM_MODEL not set");
  }
  const baseUrl = (process.env.LLM_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  if (json) body.response_format = { type: "json_object" };

  for (let attempt = 0; ; attempt++) {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(280_000),
    });

    if (response.ok) {
      const result = await response.json();
      const message = result.choices?.[0]?.message;
      // Some reasoning models put the answer in reasoning_content when content is empty.
      const text = message?.content || message?.reasoning_content || message?.reasoning;
      if (!text) {
        throw new Error("LLM API returned an empty response");
      }
      return text;
    }

    const errorText = await response.text();
    if (response.status === 400 && attempt < MAX_ADAPTATIONS && adaptRequest(body, errorText)) {
      continue;
    }
    throw new Error(`LLM API error: ${response.status} ${errorText}`);
  }
}

// Pull the JSON object out of a reply that may include <think> blocks or code fences.
export function parseJsonObject(text: string): any {
  const cleaned = text
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/```json|```/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("No JSON object found in model response");
  }
  return JSON.parse(cleaned.slice(start, end + 1));
}
