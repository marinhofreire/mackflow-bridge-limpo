import { handleWebhook, loadClientConfig, saveClientConfig } from "./webhook.js";
import { renderPainel } from "./painel.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
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
  return String(value ?? "").replace(/\D/g, "");
}

function isPainelAuthorized(url, env) {
  const secret = url.searchParams.get("secret");
  return Boolean(secret && env.ADMIN_SECRET_PASSWORD && secret === env.ADMIN_SECRET_PASSWORD);
}

function redirectToPainel(secret, params = {}) {
  const url = new URL("http://localhost/painel");
  url.searchParams.set("secret", secret);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();

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
=======
  return new Response(null, {
    status: 302,
    headers: {
      location: `${url.pathname}${url.search}`,
>>>>>>> parent of 0d452c3 (Deploy final - Integração ZPRO e OpenAI)
    },
  });
}

async function handlePainelGet(request, env) {
  const url = new URL(request.url);
  if (!isPainelAuthorized(url, env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const secret = url.searchParams.get("secret");
  const selectedPhone = normalizePhone(url.searchParams.get("phone"));
  const client = selectedPhone && env.CLIENTS_KV ? await loadClientConfig(env.CLIENTS_KV, selectedPhone) : null;
  const saved = url.searchParams.get("saved") === "1";
  const error = url.searchParams.get("error") || "";

  return new Response(
    renderPainel({
      secret,
      client: client || {},
      selectedPhone,
      saved,
      error,
    }),
    {
      headers: { "content-type": "text/html; charset=utf-8" },
    },
  );
}

async function handlePainelSave(request, env) {
  const url = new URL(request.url);
  if (!isPainelAuthorized(url, env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!env.CLIENTS_KV) {
    return json({ ok: false, error: "CLIENTS_KV_not_bound" }, 500);
  }

  const form = await request.formData();
  const keyPhone = normalizePhone(form.get("keyPhone"));
  const secret = url.searchParams.get("secret");

  if (!keyPhone) {
    return redirectToPainel(secret, {
      error: "Telefone obrigatorio para salvar.",
    });
  }

  const config = {
    keyPhone,
    tenantId: String(form.get("tenantId") || "").trim(),
    companyName: String(form.get("companyName") || "").trim(),
    userId: String(form.get("userId") || "").trim(),
    cabmeBaseUrl: String(form.get("cabmeBaseUrl") || "").trim(),
    cabmeRideBookPath: String(form.get("cabmeRideBookPath") || "").trim(),
    cabmeToken: String(form.get("cabmeToken") || "").trim(),
    cabmeApiKey: String(form.get("cabmeApiKey") || "").trim(),
    whatsappSendUrl: String(form.get("whatsappSendUrl") || "").trim(),
    whatsappToken: String(form.get("whatsappToken") || "").trim(),
    zproToken: String(form.get("whatsappToken") || "").trim(),
    zproApiId: String(form.get("zproApiId") || "").trim(),
    zproInstanceId: String(form.get("zproInstanceId") || "").trim(),
    defaultPickupLat: String(form.get("defaultPickupLat") || "").trim(),
    defaultPickupLng: String(form.get("defaultPickupLng") || "").trim(),
    defaultDropLat: String(form.get("defaultDropLat") || "").trim(),
    defaultDropLng: String(form.get("defaultDropLng") || "").trim(),
    defaultDropName: String(form.get("defaultDropName") || "").trim(),
    vehicleTypeId: String(form.get("vehicleTypeId") || "").trim(),
    totalPeople: String(form.get("totalPeople") || "").trim(),
    totalChildren: String(form.get("totalChildren") || "").trim(),
    driverMessageTemplate: String(form.get("driverMessageTemplate") || "").trim(),
  };

  await saveClientConfig(env.CLIENTS_KV, keyPhone, config);

  return redirectToPainel(secret, {
    saved: "1",
    phone: keyPhone,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers": "content-type,authorization",
        },
      });
    }

    if (method === "GET" && path === "/") {
      return json({
        ok: true,
        service: "mackflow-bridge",
        routes: ["/webhook", "/painel"],
        timestamp: new Date().toISOString(),
      });
    }

    if (method === "GET" && path === "/health") {
      return json({ ok: true, status: "healthy" });
    }

    if (method === "GET" && path === "/painel") {
      return handlePainelGet(request, env);
    }

    if (method === "POST" && path === "/painel/salvar") {
      return handlePainelSave(request, env);
    }

    if (method === "POST" && path === "/webhook") {
      return handleWebhook(request, env);
    }

    return json({ ok: false, error: "not_found" }, 404);
  },
};
