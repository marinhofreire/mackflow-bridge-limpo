// webhook.js - Módulo mínimo para Cloudflare Worker

export async function handleWebhook(request, env) {
  if (!env.CLIENTS_KV) {
    return json({ ok: false, error: "CLIENTS_KV_not_bound" }, 500);
  }

  let webhookPayload;
  try {
    webhookPayload = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json_payload" }, 400);
  }

  const callerPhone = extractPhone(webhookPayload);
  if (!callerPhone) {
    return json({ ok: false, error: "caller_phone_not_found" }, 400);
  }

  const tenant = await loadClientConfig(env.CLIENTS_KV, callerPhone);
  if (!tenant) {
    return json(
      {
        ok: false,
        error: "tenant_not_found",
        callerPhone,
        expectedKey: `client:${callerPhone}`,
      },
      404,
    );
  }

  const cabmeUrl = buildCabmeUrl(tenant, env);
  const cabmeHeaders = {};
  if (tenant.cabmeToken) {
    cabmeHeaders.authorization = `Bearer ${tenant.cabmeToken}`;
  }
  if (tenant.cabmeApiKey) {
    cabmeHeaders["x-api-key"] = tenant.cabmeApiKey;
  }

  const cabmeResponse = await fetch(cabmeUrl, {
    method: "POST",
    headers: cabmeHeaders,
    body: buildCabmeFormData(webhookPayload, tenant, callerPhone, env),
  });

  const cabmeBody = await parseResponse(cabmeResponse);

  if (!cabmeResponse.ok) {
    return json(
      {
        ok: false,
        error: "cabme_request_failed",
        status: cabmeResponse.status,
        cabmeUrl,
        response: cabmeBody,
      },
      502,
    );
  }

  const driverPhone = extractDriverPhone(cabmeBody);
  let whatsapp = { sent: false, reason: "driver_phone_not_found" };
  if (driverPhone) {
    whatsapp = await sendWhatsappToDriver(driverPhone, webhookPayload, tenant, cabmeBody, env);
  }

  return json({
    ok: true,
    tenant: tenant.tenantId || tenant.companyName || tenant.keyPhone,
    callerPhone,
    cabme: {
      status: cabmeResponse.status,
      response: cabmeBody,
    },
    whatsapp,
  });
}

const TENANT_PREFIX = "client:";
const DEFAULT_SOUCALL_ORIGIN = "https://api.soucall.com.br";

const OPENAI_SYSTEM_PROMPT =
  "Você é o Assistente MackFlow. Extraia PLACA, LOCAL e PROBLEMA. Seja ultra curto (máximo 150 caracteres). Ao confirmar os dados, responda: 'Dados recebidos. Iniciando busca...'.";

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

function normalizePhone(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function pickFirst(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }
  return "";
}

function getByPath(source, path) {
  return path.split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), source);
}

function extractPhone(payload) {
  const candidates = [
    getByPath(payload, "from"),
    getByPath(payload, "phone"),
    getByPath(payload, "sender"),
    getByPath(payload, "sender.phone"),
    getByPath(payload, "contact.phone"),
    getByPath(payload, "message.from"),
    getByPath(payload, "message.phone"),
    getByPath(payload, "data.from"),
    getByPath(payload, "data.phone"),
    getByPath(payload, "body.from"),
    getByPath(payload, "body.phone"),
  ];

  for (const candidate of candidates) {
    const digits = normalizePhone(candidate);
    if (digits) {
      return digits;
    }
  }

  return "";
}

function buildCabmeUrl(tenant, env) {
  const base = pickFirst(tenant.cabmeBaseUrl, env.CABME_BASE_URL, "https://console.mackflow.com.br/api/");
  const path = pickFirst(tenant.cabmeRideBookPath, env.CABME_CREATE_OS_PATH, "v1/ride-book/");
  const sanitizedBase = base.replace(/\/+$/, "");
  const sanitizedPath = path.replace(/^\/+/, "");
  return `${sanitizedBase}/${sanitizedPath}`;
}

function jsonToFormData(input, formData = new FormData(), parentKey = "") {
  if (input === null || input === undefined) {
    return formData;
  }

  if (Array.isArray(input)) {
    input.forEach((value, index) => {
      const key = `${parentKey}[${index}]`;
      jsonToFormData(value, formData, key);
    });
    return formData;
  }

  if (typeof input === "object") {
    Object.entries(input).forEach(([key, value]) => {
      const nextKey = parentKey ? `${parentKey}[${key}]` : key;
      jsonToFormData(value, formData, nextKey);
    });
    return formData;
  }

  formData.append(parentKey, String(input));
  return formData;
}

function buildCabmeFormData(payload, tenant, callerPhone, env) {
  const pickupLat = pickFirst(
    getByPath(payload, "pickup.lat"),
    getByPath(payload, "location.lat"),
    getByPath(payload, "data.location.lat"),
    tenant.defaultPickupLat,
    env.CABME_DEFAULT_LAT,
    "-23.4773051",
  );

  const pickupLng = pickFirst(
    getByPath(payload, "pickup.lng"),
    getByPath(payload, "location.lng"),
    getByPath(payload, "data.location.lng"),
    tenant.defaultPickupLng,
    env.CABME_DEFAULT_LNG,
    "-46.539147",
  );

  const dropLat = pickFirst(
    getByPath(payload, "destination.lat"),
    tenant.defaultDropLat,
    env.CABME_DEFAULT_DEST_LAT,
    pickupLat,
  );

  const dropLng = pickFirst(
    getByPath(payload, "destination.lng"),
    tenant.defaultDropLng,
    env.CABME_DEFAULT_DEST_LNG,
    pickupLng,
  );

  const payloadMap = {
    user_id: pickFirst(tenant.userId, env.CABME_DEFAULT_USER_ID, "1"),
    customer_phone: callerPhone,
    customer_name: pickFirst(
      getByPath(payload, "contact.name"),
      getByPath(payload, "sender.name"),
      getByPath(payload, "name"),
      "Cliente WhatsApp",
    ),
    pickup_lat: pickupLat,
    pickup_lng: pickupLng,
    pickup_address: pickFirst(
      getByPath(payload, "pickup.address"),
      getByPath(payload, "location.address"),
      getByPath(payload, "address"),
      "Origem enviada via WhatsApp",
    ),
    drop_lat: dropLat,
    drop_lng: dropLng,
    drop_address: pickFirst(
      getByPath(payload, "destination.address"),
      tenant.defaultDropName,
      env.CABME_DEFAULT_DEST_NAME,
      "Destino",
    ),
    total_people: pickFirst(tenant.totalPeople, env.CABME_DEFAULT_TOTAL_PEOPLE, "1"),
    total_children: pickFirst(tenant.totalChildren, env.CABME_DEFAULT_TOTAL_CHILDREN, "0"),
    vehicle_type_id: pickFirst(tenant.vehicleTypeId, env.CABME_DEFAULT_VEHICLE_TYPE_ID, "1"),
    sub_total: pickFirst(tenant.subTotal, env.CABME_DEFAULT_SUB_TOTAL, "0"),
    distance: pickFirst(tenant.distance, env.CABME_DEFAULT_DISTANCE, "1.2"),
    duration: pickFirst(tenant.duration, env.CABME_DEFAULT_DURATION, "10"),
    source: "zpro-webhook",
    note: pickFirst(
      getByPath(payload, "message.text"),
      getByPath(payload, "text"),
      getByPath(payload, "body.message"),
      "Solicitacao recebida via mackflow-bridge",
    ),
  };

  const formData = jsonToFormData(payloadMap);
  formData.append("raw_payload", JSON.stringify(payload));
  return formData;
}

async function parseResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractDriverPhone(cabmeResponse) {
  const candidates = [
    getByPath(cabmeResponse, "driver.phone"),
    getByPath(cabmeResponse, "driver.mobile"),
    getByPath(cabmeResponse, "data.driver.phone"),
    getByPath(cabmeResponse, "data.driver.mobile"),
    getByPath(cabmeResponse, "selected_driver.phone"),
    getByPath(cabmeResponse, "selected_driver.mobile"),
    getByPath(cabmeResponse, "driver_phone"),
    getByPath(cabmeResponse, "driver_mobile"),
  ];

  for (const candidate of candidates) {
    const phone = normalizePhone(candidate);
    if (phone) {
      return phone;
    }
  }

  return "";
}

function composeDriverMessage(payload, tenant, cabmeResponse) {
  const template =
    pickFirst(tenant.driverMessageTemplate) ||
    "Nova ocorrencia enviada para voce. Cliente: {{customer_phone}}. Protocolo: {{protocol}}.";

  const customerPhone = pickFirst(
    normalizePhone(getByPath(payload, "from")),
    normalizePhone(getByPath(payload, "phone")),
    normalizePhone(getByPath(payload, "data.from")),
  );

  const protocol = pickFirst(
    getByPath(cabmeResponse, "protocol"),
    getByPath(cabmeResponse, "data.protocol"),
    getByPath(cabmeResponse, "ride.id"),
    getByPath(cabmeResponse, "data.ride.id"),
    "N/A",
  );

  return template
    .replaceAll("{{customer_phone}}", customerPhone || "N/A")
    .replaceAll("{{protocol}}", protocol || "N/A");
}

async function sendWhatsappToDriver(driverPhone, payload, tenant, cabmeResponse, env) {
  const sendUrl = pickFirst(tenant.whatsappSendUrl, env.ZPRO_SEND_URL);
  if (!sendUrl) {
    return { sent: false, reason: "missing_send_url" };
  }

  const token = pickFirst(tenant.whatsappToken, tenant.zproToken, env.ZPRO_API_TOKEN);
  const message = composeDriverMessage(payload, tenant, cabmeResponse);
  const body = {
    phone: driverPhone,
    number: driverPhone,
    chatId: driverPhone,
    message,
    text: message,
    zproApiId: pickFirst(tenant.zproApiId, env.ZPRO_API_ID),
    instanceId: pickFirst(tenant.zproInstanceId, env.ZPRO_INSTANCE_ID),
  };

  const headers = {
    "content-type": "application/json",
  };

  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  const response = await fetch(sendUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  return {
    sent: response.ok,
    status: response.status,
    body: await parseResponse(response),
  };
}

function keyVariants(phone) {
  const normalized = normalizePhone(phone);
  const variants = new Set();

  if (normalized) {
    variants.add(normalized);
    if (normalized.length > 11) {
      variants.add(normalized.slice(-11));
    }
    if (normalized.length > 10) {
      variants.add(normalized.slice(-10));
    }
    if (normalized.length > 9) {
      variants.add(normalized.slice(-9));
    }
  }

  return [...variants];
}

export async function loadClientConfig(kv, phone) {
  const variants = keyVariants(phone);
  for (const variant of variants) {
    const data = await kv.get(`${TENANT_PREFIX}${variant}`, { type: "json" });
    if (data && typeof data === "object") {
      return { keyPhone: variant, ...data };
    }
  }
  return null;
}

export async function saveClientConfig(kv, phone, config) {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    throw new Error("phone_required");
  }

  const payloadToSave = {
    ...config,
    keyPhone: normalized,
    updatedAt: new Date().toISOString(),
  };

  await kv.put(`${TENANT_PREFIX}${normalized}`, JSON.stringify(payloadToSave));
  return payloadToSave;
}

async function parseResponse(response) {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

async function zproPost(cfg, endpoint, body) {
  if (!cfg.ok) {
    return { ok: false, reason: cfg.reason };
  }

  const endpointSuffix = endpoint ? `/${String(endpoint).replace(/^\/+/, "")}` : "";
  const url = `${cfg.base}${endpointSuffix}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      authorization: cfg.token,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const parsed = await parseResponse(response);
  return {
    ok: response.ok,
    status: response.status,
    url,
    response: parsed,
  };
}

function extractContactId(showContactResponse) {
  return pickFirst(
    getByPath(showContactResponse, "contactId"),
    getByPath(showContactResponse, "id"),
    getByPath(showContactResponse, "contact.id"),
    getByPath(showContactResponse, "data.contactId"),
    getByPath(showContactResponse, "data.id"),
    getByPath(showContactResponse, "data.contact.id"),
    getByPath(showContactResponse, "response.contactId"),
  );
}

function buildKanbanIds(tenant) {
  return {
    triagem: Number(pickFirst(tenant.kanbanTriagemId, tenant.kanbanTriagem, "1")),
    osAberta: Number(pickFirst(tenant.kanbanOsAbertaId, tenant.kanbanOsAberta, "2")),
    prestador: Number(pickFirst(tenant.kanbanPrestadorConfirmadoId, tenant.kanbanPrestador, "3")),
    finalizada: Number(pickFirst(tenant.kanbanOsFinalizadaId, tenant.kanbanFinalizada, "4")),
  };
}

function pickKanbanId(trigger, ids) {
  if (trigger === "ride-book") {
    return ids.osAberta;
  }
  if (trigger === "confirm-requete") {
    return ids.prestador;
  }
  if (trigger === "complete-requete") {
    return ids.finalizada;
  }
  return ids.triagem;
}

async function moveKanbanByNumber(cfg, number, kanbanId) {
  const showContact = await zproPost(cfg, "showcontact", { number });
  if (!showContact.ok) {
    return { moved: false, step: "showcontact", detail: showContact };
  }

  const contactId = extractContactId(showContact.response);
  if (!contactId) {
    return { moved: false, step: "showcontact", reason: "contactId_not_found", detail: showContact };
  }

  const update = await zproPost(cfg, "updateContactKanban", {
    contactId: Number(contactId),
    kanban: Number(kanbanId),
  });

  if (!update.ok) {
    return { moved: false, step: "updateContactKanban", detail: update, contactId };
  }

  return {
    moved: true,
    contactId: Number(contactId),
    kanban: Number(kanbanId),
    showcontact: { status: showContact.status, ok: true },
    update: { status: update.status, ok: true },
  };
}

async function generateAiReply(messageText) {

  if (!messageText) {
    return "Dados recebidos. Iniciando busca...";
  }

  // A chave será passada como argumento

  // Função ajustada para receber a chave OpenAI dinamicamente
  return async function (messageText, openaiKey) {
    if (!messageText) {
      return "Dados recebidos. Iniciando busca...";
    }
    if (!openaiKey || openaiKey.length < 10) {
      return "Dados recebidos. Iniciando busca...";
    }
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          authorization: `Bearer ${openaiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: OPENAI_SYSTEM_PROMPT },
            { role: "user", content: messageText },
          ],
          max_tokens: 100,
          temperature: 0,
        }),
      });
      const parsed = await parseResponse(response);
      const text = pickFirst(getByPath(parsed, "choices.0.message.content"), "Dados recebidos. Iniciando busca...");
      return text.slice(0, 150);
    } catch {
      return "Dados recebidos. Iniciando busca...";
    }
  }
}

async function sendTextToCustomer(cfg, number, text) {
  return zproPost(cfg, "", {
    body: text,
    number,
    isClosed: false,
  });
  await kv.put(`${TENANT_PREFIX}${normalized}`, JSON.stringify(payload));
  return payload;
}

if (!env.CLIENTS_KV) {
  return json({ ok: false, error: "CLIENTS_KV_not_bound" }, 500);
}

let payload;
try {
  payload = await request.json();
} catch {
  return json({ ok: false, error: "invalid_json_payload" }, 400);
}

const callerPhone = extractPhone(payload);
if (!callerPhone) {
  return json({ ok: false, error: "caller_phone_not_found" }, 400);
}

const tenant = await loadClientConfig(env.CLIENTS_KV, callerPhone);
if (!tenant) {
  return json(
    {
      ok: false,
      error: "tenant_not_found",
      callerPhone,
      expectedKey: `client:${callerPhone}`,
    },
    404,
  );
}

const cabmeUrl = buildCabmeUrl(tenant, env);
const cabmeHeaders = {};
if (tenant.cabmeToken) {
  cabmeHeaders.authorization = `Bearer ${tenant.cabmeToken}`;
}
if (tenant.cabmeApiKey) {
  cabmeHeaders["x-api-key"] = tenant.cabmeApiKey;
}

const cabmeResponse = await fetch(cabmeUrl, {
  method: "POST",
  headers: cabmeHeaders,
  body: buildCabmeFormData(payload, tenant, callerPhone, env),
});

const cabmeBody = await parseResponse(cabmeResponse);

if (!cabmeResponse.ok) {
  return json(
    {
      ok: false,
      error: "cabme_request_failed",
      status: cabmeResponse.status,
      cabmeUrl,
      response: cabmeBody,
    },
    502,
  );
}

const driverPhone = extractDriverPhone(cabmeBody);
let whatsapp = { sent: false, reason: "driver_phone_not_found" };
if (driverPhone) {
  whatsapp = await sendWhatsappToDriver(driverPhone, payload, tenant, cabmeBody, env);
}

return json({
  ok: true,
  tenant: tenant.tenantId || tenant.companyName || tenant.keyPhone,
  callerPhone,
  cabme: {
    status: cabmeResponse.status,
    response: cabmeBody,
  },
  whatsapp,
});
