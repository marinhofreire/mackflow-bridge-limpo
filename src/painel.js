export function renderPainel({ webhookUrl = "https://bridge.mackflow.com.br/webhook" } = {}) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MackFlow Bridge - Status</title>
  <style>
    :root {
      --bg: #0b1020;
      --card: #111831;
      --card-2: #0f1730;
      --line: #1f2a4d;
      --text: #e8ecff;
      --muted: #95a1c8;
      --ok: #22c55e;
      --accent: #5eead4;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      font-family: "Segoe UI", "Helvetica Neue", sans-serif;
      background: radial-gradient(1200px 600px at 20% -10%, #1b2752 0%, var(--bg) 45%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }

    .wrap {
      width: min(980px, 100%);
      background: linear-gradient(180deg, var(--card), var(--card-2));
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
    }

    h1 {
      margin: 0 0 8px 0;
      font-size: clamp(28px, 4vw, 42px);
      font-weight: 800;
      letter-spacing: 0.3px;
      text-align: center;
    }

    .sub {
      text-align: center;
      color: var(--muted);
      margin: 0 0 24px 0;
    }

    .url-box {
      border: 1px solid #2f3d73;
      background: #0a132c;
      border-radius: 16px;
      padding: 22px;
      text-align: center;
      margin-bottom: 28px;
    }

    .url-label {
      color: var(--muted);
      font-size: 14px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .url-value {
      color: var(--accent);
      font-weight: 800;
      font-size: clamp(16px, 3vw, 30px);
      word-break: break-all;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      overflow: hidden;
      border-radius: 14px;
      border: 1px solid var(--line);
    }

    thead th {
      text-align: left;
      background: #0d1734;
      color: #c8d4ff;
      font-size: 13px;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      padding: 14px 16px;
    }

    tbody td {
      padding: 16px;
      border-top: 1px solid var(--line);
      font-size: 15px;
    }

    .status-ok {
      color: var(--ok);
      font-weight: 700;
    }
  </style>
</head>
<body>
  <main class="wrap">
    <h1>MackFlow Bridge - Status</h1>
    <p class="sub">Painel operacional</p>

    <section class="url-box">
      <div class="url-label">URL do Webhook</div>
      <div class="url-value">${webhookUrl}</div>
    </section>

    <section>
      <table>
        <thead>
          <tr>
            <th>Servico</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Z-PRO</td>
            <td class="status-ok">Online</td>
          </tr>
          <tr>
            <td>OpenAI</td>
            <td class="status-ok">Online</td>
          </tr>
          <tr>
            <td>Cabme</td>
            <td class="status-ok">Online</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>
</body>
</html>`;
}
