// Esqueleto do Bot Orquestrador: Roteamento automático de mensagens motorista <-> cliente WhatsApp
// Integração: Firestore (mensagens motorista), ZPRO (WhatsApp), Cabme/Soufind (dados OS/cliente), GPT (IA)

import { initializeApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fetch from 'node-fetch';

// Inicialização Firebase Admin
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) : {};
if (!global['firebaseApp']) {
    initializeApp({ credential: cert(serviceAccount) });
    global['firebaseApp'] = true;
}
const db = getFirestore();

// Configs ZPRO/WhatsApp
const ZPRO_API_URL = process.env.ZPRO_API_URL || 'https://zpro.suaempresa.com/api/send';
const ZPRO_TOKEN = process.env.ZPRO_TOKEN || '';

// Configs Cabme/Soufind
const CABME_API_URL = process.env.CABME_API_URL || 'https://api.soufind.com.br/api/v1';
const CABME_TOKEN = process.env.CABME_TOKEN || '';

// Função: Buscar dados do cliente/OS pelo ID da OS
async function getClientByOrderId(orderId: string) {
    const r = await fetch(`${CABME_API_URL}/get-booking-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'accesstoken': CABME_TOKEN },
        body: JSON.stringify({ order_id: orderId })
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data?.customer || null;
}

// Função: Enviar mensagem para WhatsApp via ZPRO
async function sendWhatsAppMessage(phone: string, message: string) {
    await fetch(ZPRO_API_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ZPRO_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: phone, body: message })
    });
}

// Função: Chamar IA para sugerir resposta
async function suggestReply(context: string) {
    // Exemplo: chamada para endpoint local /ia/sugerir
    const r = await fetch('http://localhost:8787/ia/sugerir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pergunta: context })
    });
    if (!r.ok) return null;
    const data = await r.json();
    return data.resposta;
}

// Listener Firestore: novas mensagens do motorista
function listenDriverMessages() {
    db.collection('conversations').onSnapshot(snapshot => {
        snapshot.docChanges().forEach(async change => {
            if (change.type === 'added') {
                const msg = change.doc.data();
                if (msg.from === 'driver' && msg.orderId && msg.message) {
                    // Buscar cliente vinculado à OS
                    const cliente = await getClientByOrderId(msg.orderId);
                    if (cliente && cliente.phone) {
                        // IA sugere resposta (opcional)
                        const iaReply = await suggestReply(msg.message);
                        // Enviar mensagem para cliente no WhatsApp
                        await sendWhatsAppMessage(cliente.phone, iaReply || msg.message);
                    }
                }
            }
        });
    });
}

// Listener ZPRO: mensagens recebidas do cliente (WhatsApp)
// Exemplo: endpoint webhook (Express ou Hono)
export async function zproWebhookHandler(req, res) {
    const { number, body, externalKey } = req.body;
    // Buscar OS vinculada ao cliente (pode usar externalKey ou buscar por telefone)
    // Exemplo: buscar OS aberta para esse telefone
    // ...
    // Enviar mensagem para o app do motorista (pode ser via Firestore ou push notification)
    // ...
    res.json({ ok: true });
}

// Inicializar listeners
listenDriverMessages();

// Exporte para uso em serverless/Express/Hono
export default { listenDriverMessages, zproWebhookHandler };
