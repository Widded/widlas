// Canlı otobüs verisinden 30 günlük geçmiş kaydı.
//
// - Her cihazda IndexedDB'ye yazar (30 gün sonra temizlenir).
// - Vercel KV / Upstash Redis yapılandırılmışsa aynı snapshot sunucuya da
//   gönderilir; böylece tüm kullanıcılar için ortak geçmiş oluşur.
//
// Kayıt sıklığı hat+yön başına 5 dakikada bir ile sınırlıdır; 20 saniyelik
// canlı yenileme veritabanını şişirmez.

const DB_NAME = 'etus-history';
const DB_VERSION = 1;
const STORE = 'snapshots';
const RETENTION_DAYS = 30;
const THROTTLE_MS = 5 * 60 * 1000;
const CLEANUP_KEY = 'kkHistCleanAt';

let dbPromise = null;

const openDb = () => {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('indexeddb-unavailable'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
        store.createIndex('byTime', 't');
        store.createIndex('byLine', ['code', 'direction', 't']);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('indexeddb-error'));
  });

  return dbPromise;
};

const storeLocal = async ({ line, direction, snapshot }) => {
  const db = await openDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).add({
      code: line,
      direction: String(direction),
      t: snapshot.t,
      buses: snapshot.buses
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
};

const cleanupLocal = async () => {
  let last = 0;
  try {
    last = Number(localStorage.getItem(CLEANUP_KEY) || 0);
  } catch {
    last = 0;
  }

  if (Date.now() - last < 24 * 60 * 60 * 1000) return;

  try {
    localStorage.setItem(CLEANUP_KEY, String(Date.now()));
  } catch {
    // yoksay
  }

  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const db = await openDb();

  await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const index = tx.objectStore(STORE).index('byTime');
    const range = IDBKeyRange.upperBound(cutoff);
    const request = index.openCursor(range);
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
        return;
      }
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
};

const postServer = async (payload) => {
  try {
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const recordLineSnapshot = ({ code, direction, buses }) => {
  if (!code || direction == null || !Array.isArray(buses) || buses.length === 0) return;

  const now = Date.now();
  const throttleKey = `kkHistTs:${code}:${direction}`;
  try {
    const last = Number(localStorage.getItem(throttleKey) || 0);
    if (now - last < THROTTLE_MS) return;
    localStorage.setItem(throttleKey, String(now));
  } catch {
    // localStorage yoksa devam et; IndexedDB yine çalışabilir.
  }

  const cleanedBuses = buses
    .map((bus) => ({
      id: String(bus.busId || ''),
      lat: Number(bus.lat),
      lng: Number(bus.lng),
      bearing: Number(bus.bearing) || 0
    }))
    .filter((bus) => bus.id && Number.isFinite(bus.lat) && Number.isFinite(bus.lng));

  if (!cleanedBuses.length) return;

  const payload = {
    line: String(code),
    direction: String(direction),
    snapshot: { t: now, buses: cleanedBuses }
  };

  storeLocal(payload).catch(() => {});
  postServer(payload).catch(() => {});

  cleanupLocal().catch(() => {});
};

// Gelecekteki tahmin/analizler için cihazdaki geçmişi okur.
export const readLocalHistory = async ({ code, direction, days = RETENTION_DAYS } = {}) => {
  const db = await openDb();
  const cutoff = Date.now() - Math.min(days, RETENTION_DAYS) * 24 * 60 * 60 * 1000;

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const store = tx.objectStore(STORE);
    const index = store.index('byTime');
    const range = IDBKeyRange.lowerBound(cutoff);
    const request = index.openCursor(range);
    const rows = [];

    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        resolve(rows);
        return;
      }
      const value = cursor.value;
      if (!code || (value.code === String(code) && (!direction || value.direction === String(direction)))) {
        rows.push(value);
      }
      cursor.continue();
    };
    request.onerror = () => reject(request.error);
  });
};
