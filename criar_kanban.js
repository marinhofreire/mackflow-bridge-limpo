/**
 * Script para criar Kanban no Z-Pro (SouCall)
 * Execute: node criar_kanban.js
 */

const CONFIG = {
  BASE_URL: "https://api.soucall.com.br",
  API_ID: "ed417d20-2c5f-4f7a-888d-b8ab6f34ac44",
  BEARER_TOKEN: "[COLE O TOKEN LARANJA GIGANTE AQUI]",
  KANBAN_NAME: "Triagem IA",
  TIMEOUT_MS: 30000,
};

function toBearer(token) {
  return /^bearer /i.test(token) ? token : `Bearer ${token}`;
}

function validateConfig() {
  const missing = [];
  if (!CONFIG.API_ID) missing.push("API_ID");
  if (!CONFIG.BEARER_TOKEN || CONFIG.BEARER_TOKEN.includes("COLE O TOKEN")) missing.push("BEARER_TOKEN");
  if (!CONFIG.KANBAN_NAME) missing.push("KANBAN_NAME");

  if (missing.length) {
    throw new Error(`Preencha os campos: ${missing.join(", ")}`);
  }
}

function parseJsonSafe(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function extractKanbanId(parsed) {
  if (!parsed || typeof parsed !== "object") return null;

  const candidates = [
    parsed.kanbanId,
    parsed.id,
    parsed.data?.kanbanId,
    parsed.data?.id,
    parsed.response?.kanbanId,
    parsed.response?.id,
    parsed.kanban?.id,
    parsed.data?.kanban?.id,
  ];

  for (const candidate of candidates) {
    if (candidate !== undefined && candidate !== null && String(candidate).trim() !== "") {
      return candidate;
    }
  }

  return null;
}

async function run() {
  validateConfig();

  const endpoint = `${CONFIG.BASE_URL.replace(/\/+$/, "")}/v2/api/external/${encodeURIComponent(CONFIG.API_ID)}/createKanban`;
  const payload = { name: CONFIG.KANBAN_NAME };

  console.log("Criando Kanban no Z-Pro...");
  console.log("POST", endpoint);
  console.log("Payload:", JSON.stringify(payload));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
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
    const kanbanId = extractKanbanId(parsed);

    console.log("\n===== RESULTADO DA API =====");
    console.log("HTTP Status:", response.status, response.statusText);
    console.log("Resposta Bruta:");
    console.log(raw || "<vazio>");

    if (kanbanId !== null) {
      console.log("\n==============================");
      console.log(`O SEU ID DO KANBAN É: ${kanbanId}`);
      console.log("==============================");
    } else {
      console.log("\n==============================");
      console.log("O SEU ID DO KANBAN É: [NAO ENCONTRADO NA RESPOSTA]");
      console.log("==============================");
      console.log("Dica: confira a resposta bruta acima para identificar o campo retornado.");
    }
  } catch (error) {
    console.log("\n===== ERRO =====");
    console.log("Falha ao chamar a API:", String(error));
  } finally {
    clearTimeout(timeout);
  }
}

run().catch((error) => {
  console.error("Erro fatal:", error);
  process.exitCode = 1;
});

