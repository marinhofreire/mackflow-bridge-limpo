// worker.ts - Entry point do Cloudflare Worker puro
import { zproHandler } from './routes/zpro';
import { cabmePingHandler } from './routes/cabme';

export default {
    async fetch(request: Request, env: any): Promise<Response> {
        const url = new URL(request.url);
        if (url.pathname.startsWith('/zpro')) {
            return zproHandler(request, env);
        }
        if (url.pathname.startsWith('/cabme')) {
            return cabmePingHandler(request, env);
        }
        return new Response('OK', { status: 200 });
    }
};
