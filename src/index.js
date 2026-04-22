import { handleWebhook } from "./webhook.js";
import { renderPainel } from "./painel.js";

function json(data, status = 200) {
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

function html(content, status = 200) {
  return new Response(content, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "access-control-allow-origin": "*",
    },
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
          "access-control-allow-methods": "GET,POST,OPTIONS",
          "access-control-allow-headers": "content-type,authorization",
        },
      });
    }

    if (method === "POST" && (path === "/" || path === "/webhook")) {
      return handleWebhook(request, env);
    }

    if (method === "GET" && path === "/health") {
      return json({ ok: true, service: "mackflow-bridge" });
    }

    if (method === "GET" && (path === "/painel" || path === "/")) {
      const expectedSecret = String(env.ADMIN_SECRET_PASSWORD || "").trim();
      const providedSecret = String(url.searchParams.get("secret") || "").trim();

      if (expectedSecret && providedSecret !== expectedSecret) {
        return html("<h1>Acesso negado</h1>", 401);
      }

      return html(
        renderPainel({
          webhookUrl: "https://bridge.mackflow.com.br/webhook",
        }),
      );
    }

    return json({ ok: false, error: "not_found" }, 404);
  },
};
