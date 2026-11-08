// 30 günlük canlı otobüs geçmişi.
//
// Vercel KV / Upstash Redis bağlıysa snapshot'ları orada tutar. Bağlı değilse
// 503 döner; istemci bu durumda yalnızca cihazdaki IndexedDB kaydını kullanır.
//
// Beklenen env değişkenleri:
//   KV_REST_API_URL + KV_REST_API_TOKEN            (Vercel KV)
//   veya UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
//
// Anahtar: hist:line:<hat>:<yön>  (Redis sorted set, score = timestamp ms)
// Saklama: 30 gün (her yazımda eski kayıtlar silinir, anahtara 31 gün TTL)

const RETENTION_DAYS = 30;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;
const MAX_BUSES = 100;
const MAX_GET = 5000;
const LINE_RE = /^[A-Za-z0-9]{1,12}$/;
const DIRECTION_RE = /^[0-9]$/;

const redisConfig = () => {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url, token } : null;
};

const pipeline = async (config, commands) => {
  const res = await fetch(`${config.url}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(commands)
  });
  if (!res.ok) throw new Error(`redis-http-${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('redis-bad-response');
  const error = data.find((item) => item && item.error);
  if (error) throw new Error(error.error);
  return data;
};

const keyFor = (line, direction) => `hist:line:${line}:${direction}`;

const sanitizeBuses = (buses) => {
  if (!Array.isArray(buses)) return [];
  return buses
    .slice(0, MAX_BUSES)
    .map((bus) => ({
      id: String(bus?.id || '').slice(0, 32),
      lat: Number(bus?.lat),
      lng: Number(bus?.lng),
      bearing: Number(bus?.bearing) || 0
    }))
    .filter((bus) =>
      bus.id &&
      Number.isFinite(bus.lat) &&
      Number.isFinite(bus.lng) &&
      bus.lat >= -90 && bus.lat <= 90 &&
      bus.lng >= -180 && bus.lng <= 180
    );
};

const readBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  const config = redisConfig();
  if (!config) {
    res.statusCode = req.method === 'POST' ? 200 : 503;
    res.end(JSON.stringify({ enabled: false, reason: 'storage-not-configured' }));
    return;
  }

  try {
    if (req.method === 'POST') {
      const body = readBody(req);
      const line = String(body.line || '').trim();
      const direction = String(body.direction ?? '').trim();

      if (!LINE_RE.test(line) || !DIRECTION_RE.test(direction)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'invalid-line-or-direction' }));
        return;
      }

      const buses = sanitizeBuses(body.snapshot?.buses);
      if (!buses.length) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'no-buses' }));
        return;
      }

      const now = Date.now();
      const cutoff = now - RETENTION_MS;
      const key = keyFor(line, direction);
      const member = JSON.stringify({ t: now, buses });
      if (member.length > 20000) {
        res.statusCode = 413;
        res.end(JSON.stringify({ error: 'snapshot-too-large' }));
        return;
      }

      await pipeline(config, [
        ['ZADD', key, now, member],
        ['ZREMRANGEBYSCORE', key, 0, cutoff],
        ['EXPIRE', key, Math.ceil(RETENTION_MS / 1000) + 86400]
      ]);

      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method === 'GET') {
      const url = new URL(req.url, 'https://local');
      const line = String(url.searchParams.get('line') || '').trim();
      const direction = String(url.searchParams.get('direction') || '').trim();
      const days = Math.min(RETENTION_DAYS, Math.max(1, Number(url.searchParams.get('days')) || RETENTION_DAYS));

      if (!LINE_RE.test(line) || !DIRECTION_RE.test(direction)) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'invalid-line-or-direction' }));
        return;
      }

      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      const key = keyFor(line, direction);
      const data = await pipeline(config, [
        ['ZRANGEBYSCORE', key, cutoff, '+inf', 'LIMIT', 0, MAX_GET]
      ]);

      const raw = Array.isArray(data[0]?.result) ? data[0].result : [];
      const snapshots = raw
        .map((item) => {
          try {
            return JSON.parse(item);
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      res.statusCode = 200;
      res.end(JSON.stringify({ enabled: true, line, direction, days, count: snapshots.length, snapshots }));
      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'method-not-allowed' }));
  } catch {
    res.statusCode = 502;
    res.end(JSON.stringify({ error: 'history-unavailable' }));
  }
}
