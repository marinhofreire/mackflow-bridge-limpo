// webhook.js - Módulo mínimo funcional para Cloudflare Worker

export async function handleWebhook(request, env) {
  // Exemplo de resposta simples
  return new Response(JSON.stringify({ ok: true, msg: "Webhook recebido" }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

export async function loadClientConfig(kv, phone) {
  if (!kv || !phone) return null;
  const raw = await kv.get(phone);
  return raw ? JSON.parse(raw) : null;
}

export async function saveClientConfig(kv, phone, config) {
  if (!kv || !phone) return false;
  await kv.put(phone, JSON.stringify(config));
  return true;
}
