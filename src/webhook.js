const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const FALLBACK_REPLY = "Dados recebidos. Iniciando busca...";
const SYSTEM_PROMPT = "Voce e o Assistente MackFlow. Extraia PLACA, LOCAL e PROBLEMA. Seja ultra curto (maximo 150 caracteres). Ao confirmar os dados, responda: 'Dados recebidos. Iniciando busca...'.";

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

function extractPhone(payload) {
  const candidates = [
    byPath(payload, "number"),
    byPath(payload, "phone"),
    byPath(payload, "from"),
    byPath(payload, "sender"),
    byPath(payload, "sender.phone"),
    byPath(payload, "contact.phone"),
    byPath(payload, "message.from"),
    byPath(payload, "message.phone"),
    byPath(payload, "data.from"),
    byPath(payload, "data.phone"),
    byPath(payload, "body.from"),
    byPath(payload, "body.phone"),
  ];

  for (const value of candidates) {
    const digits = normalizePhone(value);
    if (digits) return digits;
  }

  return "";
}

function extractIncomingText(payload) {
  return firstNonEmpty(
    byPath(payload, "text"),
    byPath(payload, "body"),
    byPath(payload, "message.text"),
    byPath(payload, "message.body"),
    byPath(payload, "data.text"),
    byPath(payload, "data.body"),
    byPath(payload, "msg"),
  );
}

async function parseResponseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function generateReplyWithOpenAI(messageText, env) {
  if (!messageText) return FALLBACK_REPLY;

  const apiKey = String(env.OPENAI_API_KEY || env.OPENAI_KEY || "").trim();
  if (!apiKey) return FALLBACK_REPLY;

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
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

    const parsed = await parseResponseBody(response);
    const content = firstNonEmpty(parsed?.choices?.[0]?.message?.content, FALLBACK_REPLY);
    return content.slice(0, 150);
  } catch (error) {
    console.log("OPENAI_ERROR", String(error));
    return FALLBACK_REPLY;
  }
}

export async function handleWebhook(request, env) {
  let payload;

  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json_payload" }, 400);
  }

  console.log("DADOS RECEBIDOS DO WEBHOOK:", JSON.stringify(payload));

  const phone = extractPhone(payload);
  if (!phone) {
    return json({ ok: false, error: "sender_phone_not_found" }, 400);
  }

  const incomingText = extractIncomingText(payload);
  const aiReply = await generateReplyWithOpenAI(incomingText, env);

  // Formato exigido para envio de mensagem na API Z-PRO
  return json({
    body: aiReply,
    number: phone,
    isClosed: false,
  });
}
