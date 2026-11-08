// Kentkart resmi canlı veri servisi (Edirne).
// Resmi siteyle aynı imza (WASM) kullanılır; CORS açık olduğu için tarayıcıdan çağrılır.

import { recordLineSnapshot } from './history';

const REGION = '013';
const LANG = 'tr';
const AUTH_TYPE = '4';
const VERSION = 'Web_1.12.0_1.0_CHROME_kentkart.web.mkentkart';
const HEADER_TAG = 'JFpWyL1Bug';
const HEADER_STAMP = '2gCw9Sp8CPUFUEW5GVwSNRXUmH7QUwWWtWFvMz3gQ5VaiEgCxF';

let signerPromise = null;

export const isSignerReady = () =>
  typeof window !== 'undefined' && typeof window.createWasmSignature === 'function';

const waitForSigner = () => {
  if (isSignerReady()) return Promise.resolve(true);
  if (signerPromise) return signerPromise;

  signerPromise = new Promise((resolve) => {
    let tries = 0;
    const timer = setInterval(() => {
      if (isSignerReady()) {
        clearInterval(timer);
        resolve(true);
      } else if (++tries > 80) {
        clearInterval(timer);
        resolve(false);
      }
    }, 100);
  });
  return signerPromise;
};

const headersFor = (path) => {
  // İmza, document.domain'i de kapsıyor (official: m.kentkart.com).
  // Kendi domainimizde geçerli imza üretmek için yalnızca imza anında taklit ediyoruz.
  try {
    Object.defineProperty(document, 'domain', {
      get: () => 'm.kentkart.com',
      configurable: true
    });
  } catch {
    // yoksay
  }
  const sig = window.createWasmSignature(
    JSON.stringify([HEADER_TAG, HEADER_STAMP, VERSION, path])
  );
  return {
    'Content-Type': 'application/json',
    'X-KK-Credential': HEADER_TAG,
    'X-KK-Date': sig.substring(0, 10),
    'X-KK-Signature': sig.substring(10)
  };
};

const kkGet = async (path, params = {}) => {
  const ok = await waitForSigner();
  if (!ok || !isSignerReady()) throw new Error('signer-unavailable');

  const query = new URLSearchParams({
    region: REGION,
    lang: LANG,
    authType: AUTH_TYPE,
    version: VERSION,
    ...params
  }).toString();

  // Aynı origin'deki proxy'ye gider (Vercel: api/kk.js, yerel: Vite middleware).
  // Böylece tarayıcı CORS/preflight dalgalanmalarından etkilenmeyiz.
  const res = await fetch(`/api/kk?path=${encodeURIComponent(path)}&${query}`, {
    headers: headersFor(path)
  });
  if (!res.ok) throw new Error(`http-${res.status}`);
  const json = await res.json();

  if (json?.result && json.result.code !== 0) {
    const err = new Error(json.result.message || 'kentkart-error');
    err.code = json.result.code;
    throw err;
  }
  return json;
};

// Bir durağa yaklaşan canlı otobüsler (stopDiff: durak, timeDiff: dakika)
export const getNearestBus = async ({ stopId, lat, lng }) => {
  const json = await kkGet('web/nearest/bus', {
    accuracy: '0',
    lat: String(lat),
    lng: String(lng),
    busStopId: stopId ? String(stopId) : ''
  });
  const busList = json.busList || [];
  const routeList = json.routeList || [];

  // Durak ekranından da hat/yön bazlı geçmiş topla.
  const byLine = new Map();
  busList.forEach((bus) => {
    const code = bus.displayRouteCode;
    if (!code || bus.direction == null) return;
    const key = `${code}_${bus.direction}`;
    if (!byLine.has(key)) byLine.set(key, []);
    byLine.get(key).push(bus);
  });
  byLine.forEach((buses, key) => {
    const splitAt = key.lastIndexOf('_');
    recordLineSnapshot({
      code: key.slice(0, splitAt),
      direction: key.slice(splitAt + 1),
      buses
    });
  });

  return {
    stopInfo: json.stopInfo || null,
    busList,
    routeList
  };
};

// Bir hattın belirli yöndeki canlı otobüsleri
export const getLineBuses = async ({ code, direction }) => {
  const json = await kkGet('web/pathInfo', {
    direction: String(direction),
    displayRouteCode: code,
    resultType: '010000'
  });
  const path = (json.pathList || [])[0] || {};
  const buses = path.busList || [];
  recordLineSnapshot({ code, direction, buses });
  return buses;
};
