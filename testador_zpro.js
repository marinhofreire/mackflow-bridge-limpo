/**
 * Testador isolado da API Z-Pro (SouCall)
 * Uso:
 *   1) Preencha CONFIG abaixo
 *   2) Rode: node testador_zpro.js
 */

const CONFIG = {
  BASE_URL: "https://api.soucall.com.br",
  API_ID: "PREENCHA_AQUI_API_ID_DA_INSTANCIA",
  BEARER_TOKEN: "PREENCHA_AQUI_BEARER_TOKEN",
  NUMBER: "5511999999999",
  KANBAN_ID: 2,
  TEST_MESSAGE: "Teste automatizado da API Z-Pro",
  IS_CLOSED: false,
  REQUEST_TIMEOUT_MS: 30000,
};

function validateConfig() {
  const missing = [];
  if (!CONFIG.API_ID || CONFIG.API_ID.includes("PREENCHA_AQUI")) missing.push("API_ID");
  if (!CONFIG.BEARER_TOKEN || CONFIG.BEARER_TOKEN.includes("PREENCHA_AQUI")) missing.push("BEARER_TOKEN");
  if (!CONFIG.NUMBER || CONFIG.NUMBER.length < 10) missing.push("NUMBER");
  if (!Number.isFinite(Number(CONFIG.KANBAN_ID))) missing.push("KANBAN_ID");

  if (missing.length > 0) {
    throw new Error(`Preencha os campos obrigatórios em CONFIG: ${missing.join(", ")}`);
  }
}

function buildUrl(pathSuffix = "") {
  const base = `${CONFIG.BASE_URL.replace(/\/+$/, "")}/v2/api/external/${encodeURIComponent(CONFIG.API_ID)}`;
  const suffix = String(pathSuffix || "").replace(/^\/+/, "");
  return suffix ? `${base}/${suffix}` : base;
}

function toBearer(token) {
  return /^bearer /i.test(token) ? token : `Bearer ${token}`;
}

function parseJsonSafe(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function explainStatus(status) {
  if (status === 401) return "Diagnóstico provável: autenticação inválida (Bearer Token).";
  if (status === 404) return "Diagnóstico provável: rota/API_ID incorreto.";
  if (status === 400) return "Diagnóstico provável: payload inválido.";
  if (status >= 200 && status < 300) return "Diagnóstico: chamada aceita pelo servidor.";
  return "Diagnóstico: verificar payload, permissões e parâmetros.";
}

async function postZpro(pathSuffix, payload, label) {
  const url = buildUrl(pathSuffix);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);

  console.log(`\n========== ${label} ==========`);
  console.log("POST", url);
  console.log("Payload:", JSON.stringify(payload));

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: toBearer(CONFIG.BEARER_TOKEN),
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const raw = await response.text();
    const parsed = parseJsonSafe(raw);

    console.log("HTTP Status:", response.status, response.statusText);
    console.log("Resposta Bruta:");
    console.log(raw || "<vazio>");
    console.log(explainStatus(response.status));

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      raw,
      parsed,
      url,
    };
  } catch (error) {
    console.log("HTTP Status: ERRO DE REDE/EXECUÇÃO");
    console.log("Resposta Bruta:");
    console.log(String(error));
    console.log("Diagnóstico: falha de rede, timeout, DNS ou TLS.");
    return {
      ok: false,
      status: 0,
      statusText: "network_error",
      raw: String(error),
      parsed: null,
      url,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function extractContactId(parsed) {
  if (!parsed || typeof parsed !== "object") return null;

  const candidates = [
    parsed.contactId,
    parsed.id,
    parsed?.contact?.id,
    parsed?.data?.contactId,
    parsed?.data?.id,
    parsed?.data?.contact?.id,
    parsed?.response?.contactId,
    parsed?.response?.id,
  ];

  for (const value of candidates) {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }

  return null;
}

async function run() {
  validateConfig();

  // TESTE 1: Envio de mensagem de texto
  const test1 = await postZpro(
    "",
    {
      body: CONFIG.TEST_MESSAGE,
      number: CONFIG.NUMBER,
      isClosed: CONFIG.IS_CLOSED,
    },
    "TESTE 1 - ENVIO DE TEXTO (POST /v2/api/external/{ApiID})",
  );

  // TESTE 2: Buscar contactId via número
  const test2 = await postZpro(
    "showcontact",
    {
      number: CONFIG.NUMBER,
    },
    "TESTE 2 - BUSCA CONTACT ID (POST /showcontact)",
  );

  const contactId = extractContactId(test2.parsed);
  console.log("\ncontactId extraído:", contactId ?? "<não encontrado>");

  if (!contactId) {
    console.log("\nTESTE 3 NÃO EXECUTADO: contactId não foi encontrado na resposta do TESTE 2.");
    return;
  }

  // TESTE 3: Mover card de Kanban
  await postZpro(
    "updateContactKanban",
    {
      contactId: Number.isNaN(Number(contactId)) ? contactId : Number(contactId),
      kanban: Number(CONFIG.KANBAN_ID),
    },
    "TESTE 3 - UPDATE KANBAN (POST /updateContactKanban)",
  );

  console.log("\nFluxo de teste finalizado.");
}

run().catch((error) => {
  console.error("\nErro fatal no script:", error);
  process.exitCode = 1;
});

