
// Handler mínimo para Worker puro (ping Cabme)
export async function cabmePingHandler(request: Request, env: any): Promise<Response> {
    const baseUsed = env.CABME_ORIGIN_BASE_URL || env.CABME_BASE_URL;
    let requestId = '';
    try {
        requestId = request.headers.get('x-request-id') || '';
    } catch { }

    // Exemplo de chamada externa (ajuste para seu endpoint real)
    const url = baseUsed + '/vehicle-categories';
    let response: Response | null = null;
    try {
        response = await fetch(url, {
            method: 'GET',
            headers: {
                'accesstoken': env.CABME_ACCESSTOKEN || '',
                'apikey': env.CABME_APIKEY || ''
            }
        });
    } catch {
        return new Response(JSON.stringify({ ok: false, error: 'cabme_unreachable', requestId }), {
            headers: { 'Content-Type': 'application/json' },
            status: 502
        });
    }

    const bodyText = await response.text().catch(() => '');
    const debugSnippet = bodyText.slice(0, 200);

    if ([301, 302, 307, 308].includes(response.status)) {
        return new Response(JSON.stringify({
            ok: false,
            error: 'CABME_REDIRECT',
            status: response.status,
            location: response.headers.get('location') ?? null,
            message: 'CabMe respondeu redirect. Ajuste base/host para não redirecionar.',
            baseUsed,
            debugSnippet,
            requestId
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: response.status
        });
    }

    if (response.status === 403) {
        if (bodyText.includes('error code: 1003')) {
            return new Response(JSON.stringify({
                ok: false,
                error: 'CF_1003',
                message: '403 (Cloudflare 1003): o Cloudflare está bloqueando a chamada do Worker ao CabMe. Verifique se CABME_BASE_URL está usando domínio (https://console.mackflow.com.br/api/) e não IP, e se não há regra/WAF bloqueando Workers.',
                next: 'Confirme CABME_BASE_URL e libere o Worker nas regras do Cloudflare (WAF/Bot/Firewall), depois rode /cabme/ping de novo.',
                baseUsed,
                status: response.status,
                debugSnippet,
                requestId
            }), {
                headers: { 'Content-Type': 'application/json' },
                status: 403
            });
        }
        return new Response(JSON.stringify({
            ok: false,
            error: 'CABME_AUTH',
            message: '403: CabMe recusou autenticação. Isso normalmente indica CABME_ACCESSTOKEN inválido/inativo na tabela (access_tokens/users_access).',
            next: 'Atualize o secret CABME_ACCESSTOKEN com um token ativo do CabMe e teste /cabme/ping.',
            baseUsed,
            status: response.status,
            debugSnippet,
            requestId
        }), {
            headers: { 'Content-Type': 'application/json' },
            status: 403
        });
    }

    let payload: any = null;
    try {
        payload = bodyText ? JSON.parse(bodyText) : null;
    } catch { }

    return new Response(JSON.stringify({
        ok: response.ok,
        baseUsed,
        cabmeStatus: response.status,
        sample: payload ? JSON.stringify(payload).slice(0, 200) : null,
        debugSnippet: response.ok ? undefined : debugSnippet,
        requestId
    }), {
        headers: { 'Content-Type': 'application/json' },
        status: response.ok ? 200 : 502
    });
}
