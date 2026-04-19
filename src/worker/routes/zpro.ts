
// Esqueleto inicial para ZPRO: Kanban/CRM, Etiquetas, Clientes, Cards, Integração IA

import type { Context } from "hono";

// Modelos básicos (pode migrar para DB ou KV depois)
type CardStatus = "novo" | "em_atendimento" | "aguardando" | "finalizado";
type Etiqueta = { id: string; nome: string; cor: string };
type Cliente = { id: string; nome: string; contato: string };
type Card = {
    id: string;
    titulo: string;
    descricao: string;
    status: CardStatus;
    cliente: Cliente;
    responsavel?: string;
    prioridade?: string;
    etiquetas: Etiqueta[];
    historico: string[];
    criadoEm: string;
    atualizadoEm: string;
};

// Mock storage (substituir por DB/KV)
const cards: Card[] = [];
const etiquetas: Etiqueta[] = [];
const clientes: Cliente[] = [];

// Rotas RESTful completas
import { nanoid } from "nanoid";

export async function zproHandler(c: Context) {
    const { req } = c;
    // Listar todos os cards
    if (req.method === "GET" && req.path === "/cards") {
        return c.json(cards);
    }
    // Criar novo card
    if (req.method === "POST" && req.path === "/cards") {
        const body = await req.json();
        if (!body.titulo || !body.descricao || !body.status || !body.cliente) {
            return c.json({ error: "Campos obrigatórios: titulo, descricao, status, cliente" }, 400);
        }
        const clienteObj = clientes.find(c => c.id === body.cliente) || { id: body.cliente, nome: body.cliente, contato: "" };
        const novoCard: Card = {
            id: nanoid(),
            titulo: body.titulo,
            descricao: body.descricao,
            status: body.status,
            cliente: clienteObj,
            responsavel: body.responsavel || "",
            prioridade: body.prioridade || "",
            etiquetas: (body.etiquetas || []).map((e: string) => etiquetas.find(et => et.id === e) || { id: e, nome: e, cor: "#888" }),
            historico: [
                `Criado em ${new Date().toISOString()} por ${body.responsavel || "sistema"}`
            ],
            criadoEm: new Date().toISOString(),
            atualizadoEm: new Date().toISOString()
        };
        cards.push(novoCard);
        return c.json(novoCard);
    }
    // Atualizar card (status, responsavel, etc)
    if (req.method === "PATCH" && req.path.startsWith("/cards/")) {
        const id = req.path.split("/")[2];
        const idx = cards.findIndex(c => c.id === id);
        if (idx === -1) return c.json({ error: "Card não encontrado" }, 404);
        const body = await req.json();
        if (body.status) cards[idx].status = body.status;
        if (body.responsavel) cards[idx].responsavel = body.responsavel;
        if (body.prioridade) cards[idx].prioridade = body.prioridade;
        if (body.etiquetas) cards[idx].etiquetas = body.etiquetas.map((e: string) => etiquetas.find(et => et.id === e) || { id: e, nome: e, cor: "#888" });
        cards[idx].historico.push(`Atualizado em ${new Date().toISOString()} (${JSON.stringify(body)})`);
        cards[idx].atualizadoEm = new Date().toISOString();
        return c.json(cards[idx]);
    }
    // Remover card
    if (req.method === "DELETE" && req.path.startsWith("/cards/")) {
        const id = req.path.split("/")[2];
        const idx = cards.findIndex(c => c.id === id);
        if (idx === -1) return c.json({ error: "Card não encontrado" }, 404);
        cards.splice(idx, 1);
        return c.json({ ok: true });
    }
    // Listar etiquetas
    if (req.method === "GET" && req.path === "/etiquetas") {
        return c.json(etiquetas);
    }
    // Criar etiqueta
    if (req.method === "POST" && req.path === "/etiquetas") {
        const body = await req.json();
        if (!body.nome || !body.cor) return c.json({ error: "Campos obrigatórios: nome, cor" }, 400);
        const nova: Etiqueta = { id: nanoid(), nome: body.nome, cor: body.cor };
        etiquetas.push(nova);
        return c.json(nova);
    }
    // Listar clientes
    if (req.method === "GET" && req.path === "/clientes") {
        return c.json(clientes);
    }
    // Criar cliente
    if (req.method === "POST" && req.path === "/clientes") {
        const body = await req.json();
        if (!body.nome || !body.contato) return c.json({ error: "Campos obrigatórios: nome, contato" }, 400);
        const novo: Cliente = { id: nanoid(), nome: body.nome, contato: body.contato };
        clientes.push(novo);
        return c.json(novo);
    }
    // Integração IA (mock GPT)
    if (req.method === "POST" && req.path === "/ia/sugerir") {
        const body = await req.json();
        // Aqui você pode integrar com GPT real (OpenAI API, etc)
        // Exemplo mock:
        const resposta = `Sugestão IA para: ${body.pergunta || "(sem pergunta)"}`;
        return c.json({ resposta });
    }
    return c.json({ error: "not_found" }, 404);
}
