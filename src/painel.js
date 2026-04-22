// painel.js - Painel Multi-Tenant Mackflow Bridge

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function inputField({ name, label, value = "", required = false, placeholder = "" }) {
  return `
    <label class="block">
      <span class="mb-2 block text-sm font-medium text-slate-700">${escapeHtml(label)}</span>
      <input name="${escapeHtml(name)}" value="${escapeHtml(value)}" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" ${required ? "required" : ""} placeholder="${escapeHtml(placeholder)}" />
    </label>
  `;
}

function textAreaField({ name, label, value = "", placeholder = "" }) {
  return `
    <label class="block col-span-2">
      <span class="mb-2 block text-sm font-medium text-slate-700">${escapeHtml(label)}</span>
      <textarea name="${escapeHtml(name)}" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="${escapeHtml(placeholder)}">${escapeHtml(value)}</textarea>
    </label>
  `;
}

function renderPainel({ secret = "", client = {}, selectedPhone = "", saved = false, error = "" }) {
  return `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MackFlow Painel</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="min-h-screen bg-slate-100 text-slate-900">
    <main class="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h1 class="text-2xl font-bold">MackFlow Painel</h1>
        <p class="mt-2 text-sm text-slate-600">Central de conexões para Configuração SouCall e Configuração SouFind.</p>
      </section>

      <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 class="text-lg font-semibold">Criar Ponte</h2>
        <form id="bridge-form" class="mt-4 grid gap-4 sm:grid-cols-2">
          ${inputField({ name: "nome", label: "Nome da Empresa", required: true })}
          ${inputField({ name: "whatsapp", label: "WhatsApp de Atendimento", placeholder: "5511999999999", required: true })}
          ${inputField({ name: "zproApiUrl", label: "URL do Servidor (SouCall)", placeholder: "https://api.soucall.com.br", required: true })}
          ${inputField({ name: "zproInstance", label: "Instancia", required: true })}
          ${inputField({ name: "zproToken", label: "Token ZPRO", required: true })}
          ${inputField({ name: "cabmeEmail", label: "E-mail Cabme", required: true })}
          ${inputField({ name: "cabmeSenha", label: "Senha Cabme", required: true })}
          ${inputField({ name: "openaiKey", label: "Chave OpenAI" })}
          <button class="h-12 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-500 col-span-2" type="submit">Criar Ponte</button>
        </form>
      </section>

      <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 class="text-lg font-semibold">Buscar cliente</h2>
        <form class="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]" method="GET" action="/painel">
          <input type="hidden" name="secret" value="${escapeHtml(secret)}" />
          ${inputField({
    name: "phone",
    label: "Telefone da empresa (chave KV)",
    value: selectedPhone,
    required: true,
    placeholder: "5511999999999",
  })}
          <button class="mt-7 h-12 rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white hover:bg-slate-800" type="submit">Carregar</button>
        </form>
      </section>

      <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h2 class="text-lg font-semibold">Configurar cliente</h2>
        <form class="mt-4 space-y-4" method="POST" action="/painel/salvar?secret=${encodeURIComponent(secret)}">
          <div class="grid gap-4 sm:grid-cols-2">
            ${inputField({ name: "keyPhone", label: "Telefone da empresa (chave KV)", value: client.keyPhone || selectedPhone, required: true, placeholder: "5511999999999" })}
            ${inputField({ name: "tenantId", label: "Tenant ID", value: client.tenantId, placeholder: "souassist-sp" })}
            ${inputField({ name: "companyName", label: "Nome da empresa", value: client.companyName })}
            ${inputField({ name: "userId", label: "User ID", value: client.userId })}
            ${inputField({ name: "cabmeBaseUrl", label: "Cabme Base URL", value: client.cabmeBaseUrl })}
            ${inputField({ name: "cabmeRideBookPath", label: "Cabme RideBook Path", value: client.cabmeRideBookPath })}
            ${inputField({ name: "cabmeToken", label: "Cabme Token", value: client.cabmeToken })}
            ${inputField({ name: "cabmeApiKey", label: "Cabme API Key", value: client.cabmeApiKey })}
            ${inputField({ name: "whatsappSendUrl", label: "WhatsApp Send URL", value: client.whatsappSendUrl })}
            ${inputField({ name: "whatsappToken", label: "WhatsApp Token", value: client.whatsappToken })}
            ${inputField({ name: "zproToken", label: "ZPRO Token", value: client.zproToken })}
            ${inputField({ name: "zproApiId", label: "ZPRO API ID", value: client.zproApiId })}
            ${inputField({ name: "zproInstanceId", label: "ZPRO Instance ID", value: client.zproInstanceId })}
            ${inputField({ name: "defaultPickupLat", label: "Latitude origem padrão", value: client.defaultPickupLat || "-23.4773051" })}
            ${inputField({ name: "defaultPickupLng", label: "Longitude origem padrão", value: client.defaultPickupLng || "-46.539147" })}
            ${inputField({ name: "defaultDropLat", label: "Latitude destino padrão", value: client.defaultDropLat || "-23.4773051" })}
            ${inputField({ name: "defaultDropLng", label: "Longitude destino padrão", value: client.defaultDropLng || "-46.539147" })}
            ${inputField({ name: "defaultDropName", label: "Nome destino padrão", value: client.defaultDropName || "Destino" })}
            ${inputField({ name: "vehicleTypeId", label: "Vehicle Type ID", value: client.vehicleTypeId || "1" })}
            ${inputField({ name: "totalPeople", label: "Total pessoas", value: client.totalPeople || "1" })}
            ${inputField({ name: "totalChildren", label: "Total crianças", value: client.totalChildren || "0" })}
          </div>
          ${textAreaField({
    name: "driverMessageTemplate",
    label: "Template WhatsApp para motorista",
    value: client.driverMessageTemplate || "Nova ocorrencia enviada para voce. Cliente: {{customer_phone}}. Protocolo: {{protocol}}.",
    placeholder: "Use {{customer_phone}} e {{protocol}} no texto.",
  })}
          <button class="h-12 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-500" type="submit">Salvar no CLIENTS_KV</button>
        </form>
      </section>

      <section class="rounded-2xl bg-yellow-100 border-2 border-yellow-400 p-6 shadow-sm ring-1 ring-yellow-300 flex items-center gap-4">
        <span class="text-2xl">⚠️</span>
        <div>
          <div class="text-lg font-bold text-yellow-900">URL para cadastrar no Webhook do SouCall:</div>
          <div class="text-blue-900 font-mono text-base select-all">https://bridge.mackflow.com.br/webhook</div>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

// Export para uso no Worker
if (typeof module !== "undefined") {
  module.exports = { renderPainel };
}
