import { renderPainel } from "./painel.js";
import { handleWebhook } from "./webhook.js";

const ADMIN_PANEL_SECRET = "Soufind@1234";
const KV_PREFIX = "client:";

function corsHeaders() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-admin-secret",
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders(),
    },
  });
}

function html(content, status = 200) {
  return new Response(content, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...corsHeaders(),
    },
  });
}

function normalizePhone(value) {
  return String(value || "").replace(/\D/g, "");
}

function hasAdminAccess(request) {
  const url = new URL(request.url);
  const querySecret = String(url.searchParams.get("secret") || "").trim();
  const headerSecret = String(request.headers.get("x-admin-secret") || "").trim();
  return querySecret === ADMIN_PANEL_SECRET || headerSecret === ADMIN_PANEL_SECRET;
}

async function parseJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function parseApiIdFromUrl(rawUrl) {
  const text = String(rawUrl || "").trim();
  const match = text.match(/\/v2\/api\/external\/([^/?#]+)/i);
  return match ? match[1] : "";
}

function clientPublicView(client) {
  return {
    nome: client.nome || "",
    whatsapp: client.whatsapp || "",
    zproApiUrl: client.zproApiUrl || "",
    zproApiId: client.zproApiId || "",
    updatedAt: client.updatedAt || "",
  };
}

async function kvListAll(env, prefix = KV_PREFIX) {
  const items = [];
  let cursor;
  let page = 0;

  while (page < 50) {
    const listed = await env.CLIENTS_KV.list({ prefix, cursor });
    for (const key of listed.keys || []) {
      items.push(key.name);
    }
    if (listed.list_complete) break;
    cursor = listed.cursor;
    page += 1;
  }

  return items;
}

async function listClients(env) {
  if (!env.CLIENTS_KV) return [];

  const keys = await kvListAll(env, KV_PREFIX);
  const clients = [];

  for (const key of keys) {
    const record = await env.CLIENTS_KV.get(key, { type: "json" });
    if (record && typeof record === "object") {
      clients.push(clientPublicView(record));
    }
  }

  clients.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
  return clients;
}

async function saveClient(request, env) {
  if (!env.CLIENTS_KV) {
    return json({ ok: false, error: "CLIENTS_KV_not_bound" }, 500);
  }

  const body = await parseJson(request);
  if (!body || typeof body !== "object") {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const nome = String(body.nome || "").trim();
  const whatsapp = normalizePhone(body.whatsapp);
  const zproApiUrl = String(body.zproApiUrl || "").trim();
  const zproApiId = String(body.zproApiId || parseApiIdFromUrl(zproApiUrl) || "").trim();
  const zproToken = String(body.zproToken || "").trim();
  const openaiKey = String(body.openaiKey || "").trim();
  const cabmeEmail = String(body.cabmeEmail || "").trim();
  const cabmeSenha = String(body.cabmeSenha || "").trim();

  if (!nome || !whatsapp || !zproToken || (!zproApiId && !zproApiUrl)) {
    return json({
      ok: false,
      error: "required_fields_missing",
      required: ["nome", "whatsapp", "zproToken", "zproApiId_or_zproApiUrl"],
    }, 400);
  }

  const payload = {
    nome,
    whatsapp,
    zproApiUrl,
    zproApiId,
    zproToken,
    openaiKey,
    cabmeEmail,
    cabmeSenha,
    updatedAt: new Date().toISOString(),
  };

  await env.CLIENTS_KV.put(`${KV_PREFIX}${whatsapp}`, JSON.stringify(payload));
  return json({ ok: true, cliente: clientPublicView(payload) });
}

async function deleteClient(request, env) {
  if (!env.CLIENTS_KV) {
    return json({ ok: false, error: "CLIENTS_KV_not_bound" }, 500);
  }

  const url = new URL(request.url);
  const whatsapp = normalizePhone(url.searchParams.get("whatsapp"));

  if (!whatsapp) {
    return json({ ok: false, error: "whatsapp_required" }, 400);
  }

  await env.CLIENTS_KV.delete(`${KV_PREFIX}${whatsapp}`);
  return json({ ok: true, deleted: whatsapp });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    if (method === "POST" && (path === "/" || path === "/webhook")) {
      return handleWebhook(request, env);
    }

    if (method === "GET" && path === "/health") {
      return json({ ok: true, service: "mackflow-bridge" });
    }

    if (method === "GET" && path === "/painel") {
      if (!hasAdminAccess(request)) {
        return html("<h1>Acesso negado</h1>", 403);
      }

      return html(
        renderPainel({
          secret: ADMIN_PANEL_SECRET,
          webhookUrl: "https://bridge.mackflow.com.br/webhook",
        }),
      );
    }

    if (path === "/api/clientes") {
      if (!hasAdminAccess(request)) {
        return json({ ok: false, error: "unauthorized" }, 403);
      }

      if (method === "GET") {
        const clientes = await listClients(env);
        return json({ ok: true, clientes });
      }

      if (method === "POST") {
        return saveClient(request, env);
      }

      if (method === "DELETE") {
        return deleteClient(request, env);
      }
    }

    return json({ ok: false, error: "not_found" }, 404);
  },
};
