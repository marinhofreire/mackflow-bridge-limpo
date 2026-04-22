// index.js - Entrypoint Cloudflare Worker
import { handleWebhook } from "./webhook.js";
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

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request, event));
});

async function handleRequest(request, event) {
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

  if (method === "POST" && path === "/webhook") {
    return handleWebhook(request, event?.env || {});
  }

  // Painel na raiz
  if (method === "GET" && (path === "/" || path === "/painel")) {
    const urlObj = new URL(request.url);
    const secret = urlObj.searchParams.get("secret") || "";
    const phone = urlObj.searchParams.get("phone") || "";
    const saved = urlObj.searchParams.get("saved") === "1";
    const error = urlObj.searchParams.get("error") || "";
    // Não carrega dados do KV, apenas renderiza o painel estático
    return new Response(renderPainel({ secret, selectedPhone: phone, saved, error }), {
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  return json({ ok: false, error: "not_found" }, 404);
}

