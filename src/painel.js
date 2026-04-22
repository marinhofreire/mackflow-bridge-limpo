function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
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
          <p class="mt-2 text-sm text-slate-600">Central de conexoes para Configuracao SouCall e Configuracao SouFind.</p>
        </section>

        <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h2 class="text-lg font-semibold">Criar Ponte</h2>
          <form id="bridge-form" class="mt-4 grid gap-4 sm:grid-cols-2">
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Nome da Empresa</span>
              <input id="nome" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" required />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">WhatsApp de Atendimento</span>
              <input id="whatsapp" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="5511999999999" required />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">URL do Servidor (SouCall)</span>
              <input id="zproApiUrl" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="https://api.soucall.com.br" required />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Instancia</span>
              <input id="zproInstance" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" required />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Token de Acesso</span>
              <input id="zproToken" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" required />
            </label>

            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">E-mail de Login (SouFind)</span>
              <input id="cabmeEmail" type="email" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" required />
            </label>
            <label class="block">
              <span class="mb-2 block text-sm font-medium text-slate-700">Senha de Login (SouFind)</span>
              <input id="cabmeSenha" type="password" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" required />
            </label>

            <label class="block sm:col-span-2">
              <span class="mb-2 block text-sm font-medium text-slate-700">Chave OpenAI</span>
              <input id="openaiKey" type="password" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="sk-..." required />
            </label>

            <div class="sm:col-span-2">
              <button id="submit-btn" type="submit" class="h-12 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-500">
                Criar Ponte
              </button>
            </div>
          </form>
        </section>
              <label class="block">
                <span class="mb-2 block text-sm font-medium text-slate-700">Nome da Empresa</span>
                <input id="nome" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" required />
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-medium text-slate-700">WhatsApp de Atendimento</span>
                <input id="whatsapp" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="5511999999999" required />
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-medium text-slate-700">URL do Servidor (SouCall)</span>
                <input id="zproApiUrl" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="https://api.soucall.com.br" required />
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-medium text-slate-700">Instancia</span>
                <input id="zproInstance" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" required />
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-medium text-slate-700">Token de Acesso</span>
                <input id="zproToken" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" required />
              </label>

              <label class="block">
                <span class="mb-2 block text-sm font-medium text-slate-700">E-mail de Login (SouFind)</span>
                <input id="cabmeEmail" type="email" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" required />
              </label>
              <label class="block">
                <span class="mb-2 block text-sm font-medium text-slate-700">Senha de Login (SouFind)</span>
                <input id="cabmeSenha" type="password" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" required />
              </label>

              <label class="block sm:col-span-2">
                <span class="mb-2 block text-sm font-medium text-slate-700">Chave OpenAI</span>
                <input id="openaiKey" type="password" class="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200" placeholder="sk-..." required />
              </label>

              <div class="sm:col-span-2">
                <button id="submit-btn" type="submit" class="h-12 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-500">
                  Criar Ponte
                </button>
              </div>
            </form>
          </section>
          <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div class="flex items-center justify-between gap-3">
              <h2 class="text-lg font-semibold">Pontes Ativas</h2>
              <button id="refresh-btn" class="h-10 rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
                Atualizar
              </button>
            </div>
            <p id="status" class="mt-3 text-sm text-slate-600">Carregando...</p>

            <div class="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <table class="min-w-full divide-y divide-slate-200">
                <thead class="bg-slate-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Nome da Empresa</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">WhatsApp</th>
                    <th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Excluir</th>
                  </tr>
                </thead>
                <tbody id="clients-body" class="divide-y divide-slate-100 bg-white"></tbody>
              </table>
            </div>
          </section>
        </main>

        <script>
          const secret = "${secretEscaped}";
          const statusEl = document.getElementById("status");
          const clientsBody = document.getElementById("clients-body");
          const form = document.getElementById("bridge-form");
          const submitBtn = document.getElementById("submit-btn");
          const refreshBtn = document.getElementById("refresh-btn");

          function normalizePhone(value) {
        return String(value || "").replace(/\\D/g, "");
      }

          function setStatus(message, type) {
            statusEl.textContent = message;
          statusEl.className = "mt-3 text-sm";
          if (type === "error") {
            statusEl.classList.add("text-rose-600");
          return;
        }
          if (type === "success") {
            statusEl.classList.add("text-emerald-600");
          return;
        }
          statusEl.classList.add("text-slate-600");
      }

          function getApiUrl(path, params = { }) {
        const url = new URL(path, window.location.origin);
          url.searchParams.set("secret", secret);
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && String(value) !== "") {
            url.searchParams.set(key, String(value));
          }
        });
          return url.toString();
      }

          function renderRows(items) {
        if (!Array.isArray(items) || items.length === 0) {
            clientsBody.innerHTML = \`
          <tr>
            <td class="px-4 py-5 text-sm text-slate-500" colspan="3">Nenhuma ponte cadastrada.</td>
          </tr>
          \`;
          return;
        }

          clientsBody.innerHTML = items
          .map((item) => {
            const nome = String(item.nome || "Sem nome");
          const whatsapp = String(item.whatsapp || "");
          return \`
          <tr>
            <td class="px-4 py-4 text-sm text-slate-800">\${nome}</td>
            <td class="px-4 py-4 text-sm text-slate-700">\${whatsapp}</td>
            <td class="px-4 py-4 text-right">
              <button
                class="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600 text-white hover:bg-rose-500"
                data-whatsapp="\${whatsapp}"
                type="button"
                title="Excluir"
                aria-label="Excluir"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 6h18" />
                  <path d="M8 6V4h8v2" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6" />
                  <path d="M14 11v6" />
                </svg>
              </button>
            </td>
          </tr>
          \`;
          })
          .join("");

        document.querySelectorAll("button[data-whatsapp]").forEach((button) => {
            button.addEventListener("click", async () => {
              const whatsapp = normalizePhone(button.getAttribute("data-whatsapp"));
              if (!whatsapp) {
                return;
              }
              const confirmed = window.confirm("Confirma excluir esta ponte?");
              if (!confirmed) {
                return;
              }
              await deleteClient(whatsapp);
            });
        });
      }

          async function loadClients() {
            setStatus("Carregando pontes...", "info");
          try {
          const response = await fetch(getApiUrl("/api/clientes"));
          const data = await response.json();
          if (!response.ok || !data.ok) {
            throw new Error(data.error || "erro_ao_listar");
          }
          renderRows(data.clientes || []);
          setStatus(\`Total de pontes: \${data.total || 0}\`, "info");
        } catch (error) {
            renderRows([]);
          setStatus("Falha ao carregar a lista de pontes.", "error");
        }
      }

          async function createClient(payload) {
            submitBtn.disabled = true;
          try {
          const response = await fetch(getApiUrl("/api/clientes"), {
            method: "POST",
          headers: {"content-type": "application/json" },
          body: JSON.stringify(payload),
          });
          const data = await response.json();
          if (!response.ok || !data.ok) {
            throw new Error(data.error || "erro_ao_criar");
          }
          setStatus("Ponte criada com sucesso.", "success");
          form.reset();
          await loadClients();
        } catch (error) {
            setStatus("Nao foi possivel criar a ponte.", "error");
        } finally {
            submitBtn.disabled = false;
        }
      }

          async function deleteClient(whatsapp) {
        try {
          const response = await fetch(getApiUrl("/api/clientes", {whatsapp}), {
            method: "DELETE",
          });
          const data = await response.json();
          if (!response.ok || !data.ok) {
            throw new Error(data.error || "erro_ao_excluir");
          }
          setStatus("Ponte excluida.", "success");
          await loadClients();
        } catch (error) {
            setStatus("Nao foi possivel excluir a ponte.", "error");
        }
      }

      form.addEventListener("submit", async (event) => {
            event.preventDefault();
          const payload = {
            nome: document.getElementById("nome").value.trim(),
          whatsapp: normalizePhone(document.getElementById("whatsapp").value),
          zproApiUrl: document.getElementById("zproApiUrl").value.trim(),
          zproInstance: document.getElementById("zproInstance").value.trim(),
          zproToken: document.getElementById("zproToken").value.trim(),
          cabmeEmail: document.getElementById("cabmeEmail").value.trim(),
          cabmeSenha: document.getElementById("cabmeSenha").value.trim(),
          openaiKey: document.getElementById("openaiKey").value.trim(),
          };
          await createClient(payload);
      });

      refreshBtn.addEventListener("click", async () => {
            await loadClients();
      });

          loadClients();
        </script>
      </body>
    </html>`;

      ${ statusHtml }

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
            ${inputField({
              name: "keyPhone",
              label: "Telefone da empresa (chave KV)",
              value: client.keyPhone || selectedPhone,
              required: true,
              placeholder: "5511999999999",
            })}
            ${inputField({
              name: "tenantId",
              label: "Tenant ID",
              value: client.tenantId,
              placeholder: "souassist-sp",
            })}
            ${inputField({
              name: "companyName",
              label: "Nome da empresa",
              value: client.companyName,
              placeholder: "SouAssist 24h",
            })}
            ${inputField({
              name: "userId",
              label: "CabMe user_id",
              value: client.userId || "1",
              placeholder: "1",
            })}
            ${inputField({
              name: "cabmeBaseUrl",
              label: "CabMe Base URL",
              value: client.cabmeBaseUrl || "https://console.mackflow.com.br/api/",
              placeholder: "https://console.mackflow.com.br/api/",
            })}
            ${inputField({
              name: "cabmeRideBookPath",
              label: "CabMe ride-book path",
              value: client.cabmeRideBookPath || "v1/ride-book/",
              placeholder: "v1/ride-book/",
            })}
            ${inputField({
              name: "cabmeToken",
              label: "CabMe token (Bearer)",
              value: client.cabmeToken,
              placeholder: "token_cabme",
            })}
            ${inputField({
              name: "cabmeApiKey",
              label: "CabMe API Key (opcional)",
              value: client.cabmeApiKey,
              placeholder: "x-api-key",
            })}
            ${inputField({
              name: "whatsappSendUrl",
              label: "Z-Pro endpoint envio",
              value: client.whatsappSendUrl || "https://api.soucall.com.br/send-message",
              placeholder: "https://api.soucall.com.br/send-message",
            })}
            ${inputField({
              name: "whatsappToken",
              label: "Z-Pro token (Bearer)",
              value: client.whatsappToken || client.zproToken,
              placeholder: "token_zpro",
            })}
            ${inputField({
              name: "zproApiId",
              label: "Z-Pro API ID",
              value: client.zproApiId,
              placeholder: "uuid",
            })}
            ${inputField({
              name: "zproInstanceId",
              label: "Z-Pro Instance ID",
              value: client.zproInstanceId,
              placeholder: "instance_id",
            })}
            ${inputField({
              name: "defaultPickupLat",
              label: "Latitude origem padrao",
              value: client.defaultPickupLat || "-23.4773051",
            })}
            ${inputField({
              name: "defaultPickupLng",
              label: "Longitude origem padrao",
              value: client.defaultPickupLng || "-46.539147",
            })}
            ${inputField({
              name: "defaultDropLat",
              label: "Latitude destino padrao",
              value: client.defaultDropLat || "-23.4773051",
            })}
            ${inputField({
              name: "defaultDropLng",
              label: "Longitude destino padrao",
              value: client.defaultDropLng || "-46.539147",
            })}
            ${inputField({
              name: "defaultDropName",
              label: "Nome destino padrao",
              value: client.defaultDropName || "Destino",
            })}
            ${inputField({
              name: "vehicleTypeId",
              label: "Vehicle Type ID",
              value: client.vehicleTypeId || "1",
            })}
            ${inputField({
              name: "totalPeople",
              label: "Total pessoas",
              value: client.totalPeople || "1",
            })}
            ${inputField({
              name: "totalChildren",
              label: "Total criancas",
              value: client.totalChildren || "0",
            })}
          </div>

          ${textAreaField({
            name: "driverMessageTemplate",
            label: "Template WhatsApp para motorista",
            value:
              client.driverMessageTemplate ||
              "Nova ocorrencia enviada para voce. Cliente: {{customer_phone}}. Protocolo: {{protocol}}.",
            placeholder:
              "Use {{customer_phone}} e {{protocol}} no texto.",
          })}

          <button class="h-12 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white hover:bg-blue-500" type="submit">
            Salvar no CLIENTS_KV
          </button>
        </form>
      </section>
    </main >
  </body >
</html > `;
}
