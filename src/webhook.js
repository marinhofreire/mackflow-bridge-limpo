const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_REPLY = "Dados recebidos. Iniciando busca...";
const SYSTEM_PROMPT = "Voce e o Assistente MackFlow. Extraia PLACA, LOCAL e PROBLEMA. Seja ultra curto (maximo 150 caracteres). Ao confirmar os dados, responda: 'Dados recebidos. Iniciando busca...'.";
const KV_PREFIX = "client:";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
    },
  });
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) {
      const text = String(value).trim();
      if (text) return text;
    }
  }
  return "";
}

function byPath(source, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), source);
}

function parseJsonSafely(text) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function parseResponse(response) {
  const raw = await response.text();
  return {
    status: response.status,
    ok: response.ok,
    raw,
    parsed: raw ? parseJsonSafely(raw) : null,
  };
}

function unwrapPayload(payload) {
  if (payload && typeof payload.body === "object" && payload.body !== null) {
    return payload.body;
  }
  return payload;
}

function extractIncomingData(payload) {
  const root = unwrapPayload(payload);

  const number = normalizePhone(
    firstNonEmpty(
      byPath(root, "ticket.contact.number"),
      byPath(root, "msg.key.sender_pn"),
      byPath(root, "ticket.number"),
      byPath(root, "contact.number"),
    ),
  );

  const text = firstNonEmpty(
    byPath(root, "msg.message.conversation"),
    byPath(root, "msg.message.extendedTextMessage.text"),
    byPath(root, "ticket.lastMessage"),
    byPath(root, "msg.body"),
  );

  const apiHint = firstNonEmpty(
    byPath(root, "ApiID"),
    byPath(root, "apiId"),
    byPath(root, "ticket.whatsapp.apiId"),
    byPath(payload, "ApiID"),
    byPath(payload, "apiId"),
  );

  return { root, number, text, apiHint };
}

function parseApiUrlParts(rawUrl) {
  const text = String(rawUrl || "").trim();
  if (!text) return { baseUrl: "", apiIdFromUrl: "" };

  const fullMatch = text.match(/^(https?:\/\/[^/]+)\/v2\/api\/external\/([^/?#]+)/i);
  if (fullMatch) {
    return {
      baseUrl: fullMatch[1],
      apiIdFromUrl: fullMatch[2],
    };
  }

  const baseMatch = text.match(/^(https?:\/\/[^/]+)/i);
  return {
    baseUrl: baseMatch ? baseMatch[1] : text.replace(/\/+$/, ""),
    apiIdFromUrl: "",
  };
}

function withBearer(token) {
  const clean = String(token || "").trim();
  if (!clean) return "";
  return /^Bearer\s+/i.test(clean) ? clean : `Bearer ${clean}`;
}

function keyVariants(phone) {
  const normalized = normalizePhone(phone);
  const set = new Set();

  if (!normalized) return [];

  set.add(normalized);

  if (normalized.startsWith("55")) {
    set.add(normalized.slice(2));
  } else {
    set.add(`55${normalized}`);
  }

  if (normalized.length > 11) set.add(normalized.slice(-11));
  if (normalized.length > 10) set.add(normalized.slice(-10));

  return [...set].filter(Boolean);
}

async function findClientConfig(env, number, apiHint) {
  if (!env.CLIENTS_KV) return null;

  for (const variant of keyVariants(number)) {
    const direct = await env.CLIENTS_KV.get(`${KV_PREFIX}${variant}`, { type: "json" });
    if (direct && typeof direct === "object") {
      return { source: "phone", config: direct };
    }
  }

  let cursor;
  let firstRecord = null;
  let scanned = 0;

  while (scanned < 200) {
    const listed = await env.CLIENTS_KV.list({ prefix: KV_PREFIX, cursor });

    for (const key of listed.keys || []) {
      const record = await env.CLIENTS_KV.get(key.name, { type: "json" });
      if (!record || typeof record !== "object") continue;

      if (!firstRecord) {
        firstRecord = record;
      }

      if (apiHint) {
        const apiFromField = String(record.zproApiId || "").trim();
        const apiFromUrl = parseApiUrlParts(record.zproApiUrl).apiIdFromUrl;
        if (apiHint === apiFromField || apiHint === apiFromUrl) {
          return { source: "apiHint", config: record };
        }
      }
    }

    scanned += 1;
    if (listed.list_complete) break;
    cursor = listed.cursor;
  }

  if (firstRecord) {
    return { source: "fallback_first", config: firstRecord };
  }

  return null;
}

async function generateAIReply(messageText, openaiKey) {
  if (!messageText) return DEFAULT_REPLY;

  const key = String(openaiKey || "").trim();
  if (!key) return DEFAULT_REPLY;

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: messageText },
        ],
        max_tokens: 100,
        temperature: 0,
      }),
    });

    const parsed = await parseResponse(response);
    const text = firstNonEmpty(parsed.parsed?.choices?.[0]?.message?.content, DEFAULT_REPLY);
    return text.slice(0, 150);
  } catch (error) {
    console.log("OPENAI_ERROR", String(error));
    return DEFAULT_REPLY;
  }
}

function resolveOutboundConfig(client, env) {
  const parsed = parseApiUrlParts(client?.zproApiUrl || "");
  const baseUrl = firstNonEmpty(parsed.baseUrl, env.ZPRO_BASE_URL, "https://api.soucall.com.br");
  const apiId = firstNonEmpty(client?.zproApiId, parsed.apiIdFromUrl, env.ZPRO_API_ID);
  const token = firstNonEmpty(client?.zproToken, env.ZPRO_API_TOKEN, env.ZPRO_TOKEN);
  const openaiKey = firstNonEmpty(client?.openaiKey, env.OPENAI_API_KEY, env.OPENAI_KEY);

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiId, token, openaiKey };
}

async function sendMessageToZPRO({ baseUrl, apiId, token, number, body }) {
  if (!baseUrl || !apiId || !token) {
    return {
      ok: false,
      reason: "missing_zpro_credentials",
      details: { hasBaseUrl: !!baseUrl, hasApiId: !!apiId, hasToken: !!token },
    };
  }

  const url = `${baseUrl}/v2/api/external/${apiId}`;
  const requestPayload = {
    body,
    number,
    isClosed: false,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: withBearer(token),
      "content-type": "application/json",
    },
    body: JSON.stringify(requestPayload),
  });

  const parsed = await parseResponse(response);
  return {
    ok: response.ok,
    status: response.status,
    url,
    requestPayload,
    response: parsed.parsed,
    raw: parsed.raw,
  };
}

export async function handleWebhook(request, env) {
  if (request.method.toUpperCase() !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json_payload" }, 400);
  }

  console.log("DADOS RECEBIDOS DO WEBHOOK:", JSON.stringify(payload));

  const incoming = extractIncomingData(payload);

  if (!incoming.number) {
    return json({ ok: false, error: "number_not_found", expected: "body.ticket.contact.number" }, 400);
  }

  if (!incoming.text) {
    return json({ ok: false, error: "text_not_found", expected: "body.msg.message.conversation" }, 400);
  }

  const foundClient = await findClientConfig(env, incoming.number, incoming.apiHint);
  if (!foundClient) {
    return json({ ok: false, error: "client_not_found_in_kv", number: incoming.number }, 404);
  }

  const outboundConfig = resolveOutboundConfig(foundClient.config, env);
  const replyText = await generateAIReply(incoming.text, outboundConfig.openaiKey);
  const outbound = await sendMessageToZPRO({
    baseUrl: outboundConfig.baseUrl,
    apiId: outboundConfig.apiId,
    token: outboundConfig.token,
    number: incoming.number,
    body: replyText,
  });

  if (!outbound.ok) {
    return json(
      {
        ok: false,
        error: "zpro_outbound_failed",
        matchSource: foundClient.source,
        outbound,
      },
      502,
    );
  }

  return json({
    ok: true,
    matchSource: foundClient.source,
    number: incoming.number,
    incomingText: incoming.text,
    reply: replyText,
    outbound,
  });
}
