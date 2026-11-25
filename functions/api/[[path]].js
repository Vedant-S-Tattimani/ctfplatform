// Cloudflare Pages Function: proxies /api/* to the Render backend so cookies, CSRF, and SSE stay same-origin.
// Set BACKEND_URL in Cloudflare Pages > Settings > Environment variables (e.g. https://your-app.onrender.com).
export async function onRequest(context) {
  const backend = (context.env.BACKEND_URL || '').replace(/\/+$/, '');
  if (!backend) {
    return new Response(JSON.stringify({ error: 'BACKEND_URL is not configured in Cloudflare Pages.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(context.request.url);
  const target = `${backend}${url.pathname}${url.search}`;

  const headers = new Headers(context.request.headers);
  headers.set('X-Forwarded-Host', url.host);
  headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));
  headers.delete('host');

  const method = context.request.method;
  const init = {
    method,
    headers,
    redirect: 'manual',
    ...(method !== 'GET' && method !== 'HEAD' ? { body: context.request.body } : {}),
  };

  const res = await fetch(target, init);
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });
}
