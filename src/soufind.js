const CABME_LOGIN_PATH = "v1/user-login/";
const CABME_RIDEBOOK_PATH = "v1/ride-book/";

function firstNonEmpty(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null) {
      const t = String(v).trim();
      if (t) return t;
    }
  }
  return "";
}

function normalizePhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if ((digits.length === 10 || digits.length === 11) && !digits.startsWith("55")) {
    digits = `55${digits}`;
  }
  return digits;
}

function parseApiIdFromUrl(rawUrl) {
  const match = String(rawUrl || "").match(/\/v2\/api\/external\/([^/?#]+)/i);
  return match ? match[1] : "";
}

function jsonResp(data, status = 200) {
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

function resolveCabmeConfig(tenant, env) {
  const baseUrl = firstNonEmpty(
    tenant?.cabmeBaseUrl,
    env.CABME_BASE_URL,
    "https://console.mackflow.com.br/api/"
  ).replace(/\/+$/, "");

  return {
    baseUrl,
    token: firstNonEmpty(tenant?.cabmeToken, env.CABME_TOKEN),
    apiKey: firstNonEmpty(tenant?.cabmeApiKey, env.CABME_API_KEY),
    email: firstNonEmpty(tenant?.cabmeEmail, env.CABME_EMAIL),
    senha: firstNonEmpty(tenant?.cabmeSenha, env.CABME_SENHA),
    userId: firstNonEmpty(tenant?.userId, env.CABME_USER_ID, "1"),
    vehicleTypeId: firstNonEmpty(tenant?.vehicleTypeId, "1"),
  };
}

function resolveZProConfig(tenant, env) {
  const rawUrl = String(tenant?.zproApiUrl || "").trim();
  const baseUrl = firstNonEmpty(
    rawUrl.replace(/\/v2\/api.*$/i, ""),
    env.ZPRO_BASE_URL,
    "https://api.soucall.com.br"
  ).replace(/\/+$/, "");

  const apiId = firstNonEmpty(
    tenant?.zproApiId,
    parseApiIdFromUrl(rawUrl),
    env.ZPRO_API_ID
  );

  const token = firstNonEmpty(tenant?.zproToken, env.ZPRO_API_TOKEN);
  return { baseUrl, apiId, token };
}

async function getCabmeToken(cabme) {
  if (cabme.token) return cabme.token;

  if (!cabme.email || !cabme.senha) return "";

  const loginUrl = `${cabme.baseUrl}/${CABME_LOGIN_PATH}`;
  try {
    const r = await fetch(loginUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: cabme.email, password: cabme.senha }),
    });
    const d = await r.json();
    return firstNonEmpty(d?.data?.access_token, d?.access_token, d?.token);
  } catch {
    return "";
  }
}

async function createCabmeOS(cabme, token, data) {
  const url = `${cabme.baseUrl}/${CABME_RIDEBOOK_PATH}`;

  const formData = new FormData();
  formData.append("user_id", cabme.userId);
  formData.append("customer_phone", data.customerPhone || "");
  formData.append("customer_name", data.customerName || "Cliente");
  formData.append("pickup_lat", data.originLat || "-23.4773051");
  formData.append("pickup_lng", data.originLng || "-46.539147");
  formData.append("pickup_address", data.originAddress || "Via SouFind");
  formData.append("drop_lat", data.destinationLat || data.originLat || "-23.4773051");
  formData.append("drop_lng", data.destinationLng || data.originLng || "-46.539147");
  formData.append("drop_address", data.destinationAddress || data.originAddress || "Destino");
  formData.append("total_people", "1");
  formData.append("total_children", "0");
  formData.append("vehicle_type_id", cabme.vehicleTypeId);
  formData.append("sub_total", "0");
  formData.append("distance", "1.2");
  formData.append("duration", "10");
  formData.append("note", data.note || "Solicitacao via SouFind");
  formData.append("service_type", data.serviceType || "socorro");
  formData.append("source", "soufind");
  if (data.vehiclePlate) formData.append("vehicle_plate", data.vehiclePlate);

  const headers = {};
  if (token) headers["authorization"] = `Bearer ${token}`;
  if (cabme.apiKey) headers["x-api-key"] = cabme.apiKey;

  const r = await fetch(url, { method: "POST", headers, body: formData });
  const text = await r.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = { raw: text }; }

  return { ok: r.ok, status: r.status, data: parsed };
}

function extractDriverPhone(cabmeData) {
  if (!cabmeData || typeof cabmeData !== "object") return "";
  const candidates = [
    cabmeData?.driver?.phone,
    cabmeData?.driver?.mobile,
    cabmeData?.data?.driver?.phone,
    cabmeData?.data?.driver?.mobile,
    cabmeData?.selected_driver?.phone,
    cabmeData?.selected_driver?.mobile,
  ];
  for (const c of candidates) {
    const phone = String(c || "").replace(/\D/g, "");
    if (phone) return phone;
  }
  return "";
}

function extractFromCabme(cabmeData, ...paths) {
  for (const path of paths) {
    const val = path.split(".").reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), cabmeData);
    if (val !== undefined && val !== null && String(val).trim()) return String(val).trim();
  }
  return "";
}

async function sendZProMessage({ baseUrl, apiId, token, number, body }) {
  if (!baseUrl || !apiId || !token || !number) return { ok: false, reason: "missing_zpro_params" };

  const normalizedNumber = normalizePhone(number);
  if (!normalizedNumber) return { ok: false, reason: "invalid_number" };

  const url = `${baseUrl}/v2/api/external/${apiId}`;
  const payload = { number: normalizedNumber, body, text: body, externalKey: "soufind-bridge", isClosed: false };

  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  return { ok: r.ok, status: r.status };
}

async function findFirstTenant(env) {
  if (!env.CLIENTS_KV) return null;
  let cursor;
  for (let page = 0; page < 5; page++) {
    const listed = await env.CLIENTS_KV.list({ prefix: "client:", cursor });
    for (const key of listed.keys || []) {
      const rec = await env.CLIENTS_KV.get(key.name, { type: "json" });
      if (rec && typeof rec === "object") return rec;
    }
    if (listed.list_complete) break;
    cursor = listed.cursor;
  }
  return null;
}

function buildProviderMessage(data, bookingNumber) {
  const lines = [
    "🚨 *Novo chamado SouFind!*",
    "",
    `📋 Serviço: ${data.serviceType || data.tipoServico || "socorro"}`,
    `📍 Local: ${data.originAddress || data.endereco || "ver OS"}`,
    `👤 Cliente: ${data.customerName || data.nomeCliente || ""}`,
  ];
  if (bookingNumber) lines.push(`🔖 OS: #${bookingNumber}`);
  lines.push("", "_Acesse o painel para aceitar o chamado._");
  return lines.join("\n");
}

export async function handlePublicRescue(request, env) {
  let body;
  try { body = await request.json(); } catch {
    return jsonResp({ success: false, error: "invalid_json" }, 400);
  }

  const tenant = await findFirstTenant(env);
  if (!tenant) return jsonResp({ success: false, error: "tenant_not_configured" }, 500);

  const cabmeCfg = resolveCabmeConfig(tenant, env);
  const token = await getCabmeToken(cabmeCfg);

  const osData = {
    customerPhone: normalizePhone(body.customerPhone || ""),
    customerName: body.customerName || "Cliente",
    originAddress: body.originAddress || "",
    originLat: String(body.originLat || ""),
    originLng: String(body.originLng || ""),
    destinationAddress: body.destinationAddress || "",
    destinationLat: String(body.destinationLat || ""),
    destinationLng: String(body.destinationLng || ""),
    serviceType: body.serviceType || "socorro",
    vehiclePlate: body.vehiclePlate || "",
    note: body.note || "",
  };

  const cabmeResult = await createCabmeOS(cabmeCfg, token, osData);

  const bookingNumber = extractFromCabme(cabmeResult.data, "booking_number", "data.booking_number", "ride.id", "data.ride.id", "id");
  const requeteId = extractFromCabme(cabmeResult.data, "requete_id", "data.requete_id", "id", "data.id");
  const driverPhone = extractDriverPhone(cabmeResult.data);

  let whatsapp = null;
  if (driverPhone) {
    const zproCfg = resolveZProConfig(tenant, env);
    const msg = buildProviderMessage({ serviceType: osData.serviceType, originAddress: osData.originAddress, customerName: osData.customerName }, bookingNumber);
    whatsapp = await sendZProMessage({ ...zproCfg, number: driverPhone, body: msg });
  }

  console.log("SOUFIND_PUBLIC_RESCUE", JSON.stringify({
    ok: cabmeResult.ok,
    bookingNumber,
    requeteId,
    driverPhone: driverPhone ? "found" : "none",
  }));

  return jsonResp({
    success: cabmeResult.ok,
    booking_number: bookingNumber || null,
    requete_id: requeteId || null,
    driver_notified: !!whatsapp?.ok,
    _cabme_status: cabmeResult.status,
  });
}

export async function handleChatflowDemand(request, env) {
  let body;
  try { body = await request.json(); } catch {
    return jsonResp({ ok: false, error: "invalid_json" }, 400);
  }

  const customerPhone = normalizePhone(body.whatsapp || body.customerPhone || "");
  if (!customerPhone) return jsonResp({ ok: false, error: "whatsapp_required" }, 400);

  const tenant = await findFirstTenant(env);
  if (!tenant) return jsonResp({ ok: false, error: "tenant_not_configured" }, 500);

  const cabmeCfg = resolveCabmeConfig(tenant, env);
  const token = await getCabmeToken(cabmeCfg);

  const osData = {
    customerPhone,
    customerName: body.nome_cliente || body.contact_name || "Cliente WhatsApp",
    originAddress: body.endereco || "Via WhatsApp",
    serviceType: body.tipo_servico || "socorro_veicular",
    note: `Chamado via WhatsApp. Ticket ZPro: ${body.ticket_id || "N/A"}`,
  };

  const cabmeResult = await createCabmeOS(cabmeCfg, token, osData);

  const bookingNumber = extractFromCabme(cabmeResult.data, "booking_number", "data.booking_number", "ride.id", "id");
  const requeteId = extractFromCabme(cabmeResult.data, "requete_id", "data.requete_id", "id", "data.id");
  const driverPhone = extractDriverPhone(cabmeResult.data);

  let whatsapp = null;
  if (driverPhone) {
    const zproCfg = resolveZProConfig(tenant, env);
    const msg = buildProviderMessage({ tipoServico: osData.serviceType, endereco: osData.originAddress, nomeCliente: osData.customerName }, bookingNumber);
    whatsapp = await sendZProMessage({ ...zproCfg, number: driverPhone, body: msg });
  }

  console.log("SOUFIND_CHATFLOW_DEMAND", JSON.stringify({
    customerPhone,
    ok: cabmeResult.ok,
    bookingNumber,
    driverPhone: driverPhone ? "found" : "none",
  }));

  return jsonResp({
    ok: cabmeResult.ok,
    booking_number: bookingNumber || null,
    requete_id: requeteId || null,
    driver_notified: !!whatsapp?.ok,
    _cabme_status: cabmeResult.status,
  });
}

export async function handleDemoClose(request, env) {
  let body;
  try { body = await request.json(); } catch {
    return jsonResp({ success: false, error: "invalid_json" }, 400);
  }
  return jsonResp({
    success: true,
    message: "OS demo marcada para encerramento.",
    requete_id: body.requete_id || null,
    status: "demo_closed",
  });
}
