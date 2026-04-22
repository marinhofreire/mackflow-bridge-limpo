function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderPainel({ secret = "Soufind@1234", webhookUrl = "https://bridge.mackflow.com.br/webhook" } = {}) {
  const safeSecret = encodeURIComponent(secret);

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>MackFlow Bridge</title>
  <style>
    :root {
      --bg: #090d1a;
      --card: #111933;
      --line: #25325f;
      --text: #eef2ff;
      --muted: #9aa9d6;
      --accent: #4fd1c5;
      --ok: #22c55e;
      --danger: #ef4444;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
      background: radial-gradient(900px 500px at 15% 0%, #1a2754 0%, var(--bg) 50%);
      color: var(--text);
      padding: 22px;
    }
    .wrap { max-width: 1080px; margin: 0 auto; display: grid; gap: 18px; }
    .card {
      background: linear-gradient(180deg, #121a35, #0f1730);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 18px;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.35);
    }
    h1 { margin: 0; font-size: clamp(26px, 3.4vw, 40px); }
    .muted { color: var(--muted); }
    .webhook {
      margin-top: 10px;
      border: 1px solid #30417c;
      border-radius: 12px;
      background: #0b142d;
      padding: 14px;
      font-size: clamp(15px, 2.2vw, 28px);
      font-weight: 700;
      color: var(--accent);
      word-break: break-all;
      text-align: center;
    }
    .grid { display: grid; gap: 12px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } }
    label { display: block; font-size: 13px; color: var(--muted); margin-bottom: 6px; }
    input {
      width: 100%;
      border: 1px solid #2f3c72;
      border-radius: 10px;
      background: #0d1631;
      color: var(--text);
      padding: 11px;
      outline: none;
    }
    input:focus { border-color: #4fd1c5; }
    button {
      border: 0;
      border-radius: 10px;
      padding: 11px 16px;
      font-weight: 700;
      cursor: pointer;
    }
    .btn-primary { background: #22c55e; color: #06120a; }
    .btn-danger { background: var(--danger); color: #fff; }
    .msg { margin-top: 10px; font-size: 14px; color: var(--muted); min-height: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 10px; border-bottom: 1px solid #1f2b53; text-align: left; }
    th { color: #c9d6ff; font-size: 13px; text-transform: uppercase; }
    .ok { color: var(--ok); font-weight: 700; }
  </style>
</head>
<body>
  <main class="wrap">
    <section class="card">
      <h1>MackFlow Bridge</h1>
      <div class="muted">Webhook ativo para SouCall</div>
      <div class="webhook">${escapeHtml(webhookUrl)}</div>
    </section>

    <section class="card">
      <h2 style="margin:0 0 12px 0;">Cadastro de Cliente</h2>
      <form id="form-cliente" class="grid">
        <div>
          <label>Nome da Empresa</label>
          <input name="nome" required />
        </div>
        <div>
          <label>WhatsApp (chave KV)</label>
          <input name="whatsapp" required placeholder="5511999999999" />
        </div>
        <div>
          <label>URL API SouCall</label>
          <input name="zproApiUrl" required placeholder="https://api.soucall.com.br/v2/api/external/SEU_API_ID" />
        </div>
        <div>
          <label>ApiID SouCall (opcional se vier na URL)</label>
          <input name="zproApiId" placeholder="ed417d20-2c5f-4f7a-888d-b8ab6f34ac44" />
        </div>
        <div>
          <label>Token SouCall</label>
          <input name="zproToken" required />
        </div>
        <div>
          <label>OpenAI Key (opcional)</label>
          <input name="openaiKey" />
        </div>
        <div>
          <label>Email SouFind</label>
          <input name="cabmeEmail" />
        </div>
        <div>
          <label>Senha SouFind</label>
          <input name="cabmeSenha" />
        </div>
        <div style="grid-column:1/-1;">
          <button class="btn-primary" type="submit">Salvar Cliente</button>
          <span id="form-msg" class="msg"></span>
        </div>
      </form>
    </section>

    <section class="card">
      <h2 style="margin:0;">Clientes Cadastrados</h2>
      <div class="muted">Origem: CLIENTS_KV</div>
      <table>
        <thead>
          <tr>
            <th>Empresa</th>
            <th>WhatsApp</th>
            <th>ApiID</th>
            <th>Status</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody id="clientes-body">
          <tr><td colspan="5" class="muted">Carregando...</td></tr>
        </tbody>
      </table>
    </section>
  </main>

  <script>
    const SECRET = "${safeSecret}";

    function esc(value) {
      return String(value || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    async function api(path, options) {
      const opts = options || {};
      const sep = path.indexOf("?") >= 0 ? "&" : "?";
      const url = path + sep + "secret=" + SECRET;
      const response = await fetch(url, opts);
      const raw = await response.text();
      let data;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        data = { raw: raw };
      }
      if (!response.ok) {
        const msg = data && data.error ? data.error : "HTTP " + response.status;
        throw new Error(msg);
      }
      return data;
    }

    async function carregarClientes() {
      const body = document.getElementById("clientes-body");
      body.innerHTML = '<tr><td colspan="5" class="muted">Carregando...</td></tr>';
      try {
        const data = await api("/api/clientes");
        const clientes = Array.isArray(data.clientes) ? data.clientes : [];

        if (!clientes.length) {
          body.innerHTML = '<tr><td colspan="5" class="muted">Nenhum cliente cadastrado.</td></tr>';
          return;
        }

        let html = "";
        for (const cliente of clientes) {
          const nome = esc(cliente.nome || "");
          const whatsapp = esc(cliente.whatsapp || "");
          const apiId = esc(cliente.zproApiId || "");
          html += '<tr>' +
            '<td>' + nome + '</td>' +
            '<td>' + whatsapp + '</td>' +
            '<td>' + apiId + '</td>' +
            '<td class="ok">Online</td>' +
            '<td><button class="btn-danger" data-whatsapp="' + whatsapp + '">Excluir</button></td>' +
          '</tr>';
        }
        body.innerHTML = html;

        const buttons = body.querySelectorAll("button[data-whatsapp]");
        buttons.forEach(function (btn) {
          btn.addEventListener("click", async function () {
            const whatsapp = btn.getAttribute("data-whatsapp") || "";
            if (!whatsapp) return;
            if (!confirm("Excluir cliente " + whatsapp + "?")) return;
            try {
              await api("/api/clientes?whatsapp=" + encodeURIComponent(whatsapp), { method: "DELETE" });
              await carregarClientes();
            } catch (error) {
              alert(error.message || "Falha ao excluir");
            }
          });
        });
      } catch (error) {
        body.innerHTML = '<tr><td colspan="5" style="color:#fca5a5;">Erro: ' + esc(error.message || "falha") + '</td></tr>';
      }
    }

    document.getElementById("form-cliente").addEventListener("submit", async function (event) {
      event.preventDefault();
      const form = event.currentTarget;
      const msg = document.getElementById("form-msg");
      msg.textContent = "Salvando...";

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      try {
        await api("/api/clientes", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        msg.textContent = "Cliente salvo com sucesso.";
        form.reset();
        await carregarClientes();
      } catch (error) {
        msg.textContent = "Erro: " + (error.message || "falha ao salvar");
      }
    });

    carregarClientes();
  </script>
</body>
</html>`;
}
