# mackflow-bridge

Projeto mínimo Cloudflare Worker (TypeScript).

## Como rodar

1. Instale dependências:
	npm install

2. Build:
	npm run build

3. Deploy:
	npx wrangler deploy

## Endpoint padrão

GET /

Retorna JSON:
{
  "ok": true,
  "message": "mackflow bridge online",
  "timestamp": "..."
}
