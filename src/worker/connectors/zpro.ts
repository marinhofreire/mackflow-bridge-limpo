// Cloudflare Worker puro: funções utilitárias ZPRO

async function fetchWithTimeout(input: RequestInfo, init: RequestInit, timeoutMs: number) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(input, { ...init, signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timeout);
    }
}

export async function listTickets(env: any) {
    const url = new URL(`/v2/api/external/${env.ZPRO_API_ID}/listTickets`, env.ZPRO_BASE_URL);
    url.searchParams.set("pageNumber", "1");
    url.searchParams.set("status", "open");

    return fetchWithTimeout(
        url.toString(),
        {
            headers: {
                Authorization: `Bearer ${env.ZPRO_TOKEN}`
            }
        },
        5000 // timeout fixo
    );
}


async function fetchWithTimeout(input: RequestInfo, init: RequestInit, timeoutMs: number) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(input, { ...init, signal: controller.signal });
        return response;
    } finally {
        clearTimeout(timeout);
    }
}

// Exemplo: ajuste para env puro
const url = new URL(`/v2/api/external/${env.ZPRO_API_ID}/listTickets`, env.ZPRO_BASE_URL);
url.searchParams.set("pageNumber", "1");
url.searchParams.set("status", "open");

return fetchWithTimeout(
    url.toString(),
    {
        headers: {
            Authorization: `Bearer ${env.ZPRO_TOKEN}`
        }
    },
    5000 // timeout fixo
);
}
