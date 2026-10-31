import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { chatCompletion, parseJsonObject } from "../convex/llm";

const messages = [{ role: "user" as const, content: "hi" }];

function reply(content: string, extra: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ choices: [{ message: { content, ...extra } }] }), {
    status: 200,
  });
}
function badRequest(message: string) {
  return new Response(JSON.stringify({ error: { message } }), { status: 400 });
}

describe("chatCompletion", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    process.env.LLM_API_KEY = "test-key";
    process.env.LLM_MODEL = "test-model";
    delete process.env.LLM_BASE_URL;
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => vi.unstubAllGlobals());

  const sentBody = (call = 0) => JSON.parse(fetchMock.mock.calls[call][1].body);

  test("defaults to OpenAI and sends the configured model and key", async () => {
    fetchMock.mockResolvedValue(reply("hello"));
    await expect(chatCompletion({ messages })).resolves.toBe("hello");
    expect(fetchMock.mock.calls[0][0]).toBe("https://api.openai.com/v1/chat/completions");
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("Bearer test-key");
    expect(sentBody().model).toBe("test-model");
  });

  test("uses LLM_BASE_URL and ignores a trailing slash", async () => {
    process.env.LLM_BASE_URL = "https://example.test/v1/";
    fetchMock.mockResolvedValue(reply("ok"));
    await chatCompletion({ messages });
    expect(fetchMock.mock.calls[0][0]).toBe("https://example.test/v1/chat/completions");
  });

  test("asks for JSON mode only when requested", async () => {
    fetchMock.mockImplementation(async () => reply("{}"));
    await chatCompletion({ messages });
    await chatCompletion({ messages, json: true });
    expect(sentBody(0).response_format).toBeUndefined();
    expect(sentBody(1).response_format).toEqual({ type: "json_object" });
  });

  test("retries with max_completion_tokens when max_tokens is rejected", async () => {
    fetchMock
      .mockResolvedValueOnce(
        badRequest("Unsupported parameter: 'max_tokens'. Use 'max_completion_tokens' instead.")
      )
      .mockResolvedValueOnce(reply("ok"));
    await expect(chatCompletion({ messages, maxTokens: 321 })).resolves.toBe("ok");
    expect(sentBody(0).max_tokens).toBe(321);
    expect(sentBody(1).max_tokens).toBeUndefined();
    expect(sentBody(1).max_completion_tokens).toBe(321);
  });

  test("drops temperature when the model does not support it", async () => {
    fetchMock
      .mockResolvedValueOnce(badRequest("Unsupported value: 'temperature' does not support 0.2"))
      .mockResolvedValueOnce(reply("ok"));
    await chatCompletion({ messages });
    expect(sentBody(0).temperature).toBe(0.2);
    expect(sentBody(1).temperature).toBeUndefined();
  });

  test("drops JSON mode when the provider does not support it", async () => {
    fetchMock
      .mockResolvedValueOnce(badRequest("response_format json_object is not supported"))
      .mockResolvedValueOnce(reply("{}"));
    await chatCompletion({ messages, json: true });
    expect(sentBody(1).response_format).toBeUndefined();
  });

  test("can adapt several parameters in a row", async () => {
    fetchMock
      .mockResolvedValueOnce(badRequest("use max_completion_tokens"))
      .mockResolvedValueOnce(badRequest("temperature is not supported"))
      .mockResolvedValueOnce(reply("ok"));
    await expect(chatCompletion({ messages })).resolves.toBe("ok");
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  test("does not retry errors it cannot work around", async () => {
    fetchMock.mockResolvedValue(new Response("invalid api key", { status: 401 }));
    await expect(chatCompletion({ messages })).rejects.toThrow("LLM API error: 401 invalid api key");
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockClear();
    fetchMock.mockResolvedValue(badRequest("context length exceeded"));
    await expect(chatCompletion({ messages })).rejects.toThrow("LLM API error: 400");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test("reads the answer from reasoning_content when content is empty", async () => {
    fetchMock.mockResolvedValue(reply("", { reasoning_content: '{"a":1}' }));
    await expect(chatCompletion({ messages })).resolves.toBe('{"a":1}');
  });

  test("fails clearly when the response is empty or settings are missing", async () => {
    fetchMock.mockResolvedValue(reply(""));
    await expect(chatCompletion({ messages })).rejects.toThrow("empty response");
    delete process.env.LLM_MODEL;
    await expect(chatCompletion({ messages })).rejects.toThrow("LLM_MODEL not set");
    process.env.LLM_MODEL = "m";
    delete process.env.LLM_API_KEY;
    await expect(chatCompletion({ messages })).rejects.toThrow("LLM_API_KEY not found");
  });
});

describe("parseJsonObject", () => {
  test("parses plain JSON", () => {
    expect(parseJsonObject('{"a":1}')).toEqual({ a: 1 });
  });
  test("ignores code fences, think blocks and surrounding text", () => {
    expect(parseJsonObject('<think>hmm {x}</think>Here you go:\n```json\n{"a":{"b":2}}\n```')).toEqual({
      a: { b: 2 },
    });
  });
  test("throws when there is no JSON", () => {
    expect(() => parseJsonObject("no json here")).toThrow("No JSON object");
  });
});
