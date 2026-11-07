// Vercel serverless proxy: Kentkart canlı API'sine sunucu tarafından istek atar.
// İmza (X-KK-*) tarayıcıda üretilir; burada yalnızca Origin/Referer düzeltilip iletilir.

const ALLOWED_PATH = /^web\/[a-zA-Z0-9/_-]+$/;

const buildHeaders = (req) => ({
  'Content-Type': 'application/json',
  'Origin': 'https://m.kentkart.com',
  'Referer': 'https://m.kentkart.com/',
  'X-KK-Credential': req.headers['x-kk-credential'] || '',
  'X-KK-Date': req.headers['x-kk-date'] || '',
  'X-KK-Signature': req.headers['x-kk-signature'] || ''
});

const forward = async (path, searchParams, req) => {
  const params = new URLSearchParams(searchParams);
  params.delete('path');
  const target = `https://service.kentkart.com/rl1//${path}?${params.toString()}`;
  const upstream = await fetch(target, { headers: buildHeaders(req) });
  const text = await upstream.text();
  return { status: upstream.status, text };
};

export default async function handler(req, res) {
  const url = new URL(req.url, 'https://local');
  const path = url.searchParams.get('path') || '';

  if (!ALLOWED_PATH.test(path)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'invalid path' }));
    return;
  }

  try {
    const { status, text } = await forward(path, url.searchParams, req);
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(text);
  } catch {
    res.statusCode = 502;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'upstream unavailable' }));
  }
}
