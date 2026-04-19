export default {
    async fetch(request: Request): Promise<Response> {
        return new Response(JSON.stringify({
            ok: true,
            message: "mackflow bridge online",
            timestamp: new Date().toISOString()
        }), {
            headers: { "Content-Type": "application/json" }
        });
    }
};
