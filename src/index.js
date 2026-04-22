import { handleWebhook } from "./webhook.js";
import { renderPainel } from "./painel.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
      "access-control-allow-headers": "content-type,authorization,x-admin-secret",
    },
  });
}

function normalizePhone(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function isAuthorized(request, env) {
  const url = new URL(request.url);
  const secretFromQuery = url.searchParams.get("secret");
  const secretFromHeader = request.headers.get("x-admin-secret");
  const providedSecret = secretFromQuery || secretFromHeader || "";
  return Boolean(env.ADMIN_SECRET_PASSWORD && providedSecret === env.ADMIN_SECRET_PASSWORD);
}

function requireKv(env) {
  return Boolean(env && env.CLIENTS_KV);
}

function maskSensitive(value) {
  return value ? "********" : "";
}

function mapClientRecord(record, keyName) {
  if (!record || typeof record !== "object") {
    return null;
  }

  const whatsappFromKey = keyName.startsWith("client:") ? keyName.slice("client:".length) : keyName;
  const whatsapp = normalizePhone(record.whatsapp || record.keyPhone || whatsappFromKey);
  if (!whatsapp) {
    return null;
  }

  const nome = String(record.nome || record.companyName || record.tenantId || "Sem nome").trim();
  const zproApiUrl = String(record.zproApiUrl || record.whatsappSendUrl || "").trim();
  const zproInstance = String(record.zproInstance || record.zproInstanceId || "").trim();
  const zproToken = String(record.zproToken || record.whatsappToken || record.zproToken || "").trim();
  const cabmeEmail = String(record.cabmeEmail || record.soufindEmail || "").trim();
  const cabmeSenha = String(record.cabmeSenha || record.soufindSenha || "").trim();

  return {
    key: keyName,
    nome: nome || "Sem nome",
    whatsapp,
    zproApiUrl,
    zproInstance,
    zproToken: maskSensitive(zproToken),
    cabmeEmail,
    cabmeSenha: maskSensitive(cabmeSenha),
    updatedAt: record.updatedAt || null,
  };
}

async function listAllKeys(kv) {
  const allKeys = [];
  let cursor;

  do {
    const page = await kv.list({ cursor });
    allKeys.push(...page.keys);
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  return allKeys;
}

async function handleCreateClient(request, env) {
  if (!isAuthorized(request, env)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  if (!requireKv(env)) {
    return json({ ok: false, error: "CLIENTS_KV_not_bound" }, 500);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json_payload" }, 400);
  }

  const nome = String(payload.nome || "").trim();
  const whatsapp = normalizePhone(payload.whatsapp);
  const zproApiUrl = String(payload.zproApiUrl || "").trim();
  const zproInstance = String(payload.zproInstance || "").trim();
  const zproToken = String(payload.zproToken || "").trim();
  const cabmeEmail = String(payload.cabmeEmail || "").trim();
  const cabmeSenha = String(payload.cabmeSenha || "").trim();

  if (!nome || !whatsapp || !zproApiUrl || !zproInstance || !zproToken || !cabmeEmail || !cabmeSenha) {
    return json(
      {
        ok: false,
        error: "missing_required_fields",
        required: ["nome", "whatsapp", "zproApiUrl", "zproInstance", "zproToken", "cabmeEmail", "cabmeSenha"],
      },
      400,
    );
  }


  const openaiKey = String(payload.openaiKey || payload.openAIKey || payload.openai_key || "").trim();
  const dataToStore = {
    nome,
    whatsapp,
    zproApiUrl,
    zproInstance,
    zproToken,
    cabmeEmail,
    cabmeSenha,
    openaiKey,
    // Campos legados para manter compatibilidade do fluxo webhook atual.
    soufindEmail: cabmeEmail,
    soufindSenha: cabmeSenha,
    zproInstanceId: zproInstance,
    whatsappToken: zproToken,
    updatedAt: new Date().toISOString(),
  };

  await env.CLIENTS_KV.put(whatsapp, JSON.stringify(dataToStore));

  return json({
    ok: true,
    cliente: {
      nome,
      whatsapp,
      zproApiUrl,
      zproInstance,
      zproToken: "********",
      cabmeEmail,
      cabmeSenha: "********",
    },
  });
}

async function handleListClients(request, env) {
  if (!isAuthorized(request, env)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  if (!requireKv(env)) {
    return json({ ok: false, error: "CLIENTS_KV_not_bound" }, 500);
  }

  const keys = await listAllKeys(env.CLIENTS_KV);
  const candidates = keys
    .map((entry) => entry.name)
    .filter((name) => /^\d{9,15}$/.test(name) || name.startsWith("client:"));

  const values = await Promise.all(
    candidates.map(async (keyName) => {
      try {
        const data = await env.CLIENTS_KV.get(keyName, { type: "json" });
        return mapClientRecord(data, keyName);
      } catch {
        return null;
      }
    }),
  );

  const clientes = values
    .filter((item) => item && item.whatsapp)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return json({
    ok: true,
    total: clientes.length,
    clientes,
  });
}

async function handleDeleteClient(request, env) {
  if (!isAuthorized(request, env)) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  if (!requireKv(env)) {
    return json({ ok: false, error: "CLIENTS_KV_not_bound" }, 500);
  }

  const url = new URL(request.url);
  const whatsapp = normalizePhone(url.searchParams.get("whatsapp"));
  if (!whatsapp) {
    return json({ ok: false, error: "whatsapp_required" }, 400);
  }

  await env.CLIENTS_KV.delete(whatsapp);
  await env.CLIENTS_KV.delete(`client:${whatsapp}`);

  return json({
    ok: true,
    deleted: whatsapp,
  });
}

async function handlePainelGet(request, env) {
  if (!isAuthorized(request, env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const secret = url.searchParams.get("secret") || "";

  return new Response(renderPainel({ secret }), {
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const path = url.pathname;

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,DELETE,OPTIONS",
          "access-control-allow-headers": "content-type,authorization,x-admin-secret",
        },
      });
    }

    if (method === "GET" && path === "/") {
      return json({
        ok: true,
        service: "mackflow-bridge",
        routes: ["/webhook", "/painel", "/api/clientes"],
        timestamp: new Date().toISOString(),
      });
    }

    if (method === "GET" && path === "/health") {
      return json({ ok: true, status: "healthy" });
    }

    if (method === "GET" && path === "/webhook") {
      return json({
        ok: true,
        webhook: "ready",
        method: "POST",
        path: "/webhook",
      });
    }

    if (method === "GET" && path === "/painel") {
      return handlePainelGet(request, env);
    }

    if (path === "/api/clientes" && method === "POST") {
      return handleCreateClient(request, env);
    }

    if (path === "/api/clientes" && method === "GET") {
      return handleListClients(request, env);
    }

    if (path === "/api/clientes" && method === "DELETE") {
      return handleDeleteClient(request, env);
    }

    if (method === "POST" && path === "/webhook") {
      return handleWebhook(request, env);
    }

    return json({ ok: false, error: "not_found" }, 404);
  },
};
