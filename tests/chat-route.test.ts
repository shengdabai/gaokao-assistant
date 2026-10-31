import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../src/app/api/chat/route";

const SERVER_KEY = "server-side-glm-key-test";

interface RecordedCall {
  url: string;
  authorization: string | null;
}

const originalFetch = globalThis.fetch;
const originalGlmKey = process.env.GLM_API_KEY;
let calls: RecordedCall[] = [];

function completionResponse(): Response {
  return new Response(
    JSON.stringify({
      id: "chatcmpl-test",
      object: "chat.completion",
      created: 0,
      model: "stub",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "stubbed reply" },
          finish_reason: "stop",
        },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

function chatRequest(body: Record<string, unknown>): Request {
  return new Request("http://localhost/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: "hi" }], ...body }),
  });
}

beforeEach(() => {
  calls = [];
  process.env.GLM_API_KEY = SERVER_KEY;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = input instanceof Request ? input.url : String(input);
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    calls.push({ url, authorization: headers.get("authorization") });
    return completionResponse();
  }) as typeof fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalGlmKey === undefined) {
    delete process.env.GLM_API_KEY;
  } else {
    process.env.GLM_API_KEY = originalGlmKey;
  }
});

for (const provider of ["openai", "claude", "gemini", "kimi", "openrouter", "deepseek"]) {
  test(`provider=${provider} without apiKey is rejected and never uses the server key`, async () => {
    const res = await POST(chatRequest({ provider }));

    assert.ok(res.status === 400 || res.status === 401, `expected 400/401, got ${res.status}`);
    const json = (await res.json()) as { error?: unknown };
    assert.equal(typeof json.error, "string");
    assert.equal(calls.length, 0, `unexpected outbound request(s): ${JSON.stringify(calls)}`);
  });
}

test("provider=glm without apiKey falls back to the server key", async () => {
  const res = await POST(chatRequest({ provider: "glm", model: "glm-4-flash" }));

  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { message: "stubbed reply" });
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.startsWith("https://open.bigmodel.cn/api/paas/v4/"), calls[0].url);
  assert.equal(calls[0].authorization, `Bearer ${SERVER_KEY}`);
});

test("omitted provider defaults to glm and may use the server key", async () => {
  const res = await POST(chatRequest({}));

  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.startsWith("https://open.bigmodel.cn/"), calls[0].url);
  assert.equal(calls[0].authorization, `Bearer ${SERVER_KEY}`);
});

test("provider=glm without apiKey rejects models outside the configured list", async () => {
  const res = await POST(chatRequest({ provider: "glm", model: "glm-some-unlisted-model" }));

  assert.equal(res.status, 400);
  assert.equal(calls.length, 0, `unexpected outbound request(s): ${JSON.stringify(calls)}`);
});

test("client-supplied apiKey is still forwarded to the chosen provider", async () => {
  const res = await POST(chatRequest({ provider: "openai", apiKey: "client-key-test" }));

  assert.equal(res.status, 200);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].url.startsWith("https://api.openai.com/v1/"), calls[0].url);
  assert.equal(calls[0].authorization, "Bearer client-key-test");
});
