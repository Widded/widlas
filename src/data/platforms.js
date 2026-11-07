// Gidiş/dönüş platformlarını ayırır.
//
// Kentkart'ın Edirne verisinde bazı duraklar iki yönde de aynı ID ve aynı
// koordinatla geliyor. Aynı isimli karşı platform (ör. "TOKİ Yaşam Merkezi 1"
// ve "2") ayrı bir durak olarak veritabanında duruyorsa, her yönü kendi
// platformuna bağlarız. Böylece rota ters çevrildiğinde karşı yönün durağı
// kullanılır ve haritada aynı noktaya iki yön çizilmez.

const EARTH_R = 6371000;

const distanceM = (a, b) => {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return EARTH_R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const normalizeBaseName = (name) => String(name || '')
  .toLocaleLowerCase('tr')
  .replace(/\s+\d+\s*$/, '')
  .replace(/\s+/g, ' ')
  .trim();

// Yol, durak sırasıyla aynı yönde mi? (bazı hatlarda path ters geliyor)
const pathForward = (dir, stops) => {
  const ids = dir.stopIds || [];
  const path = dir.path || [];
  if (!ids.length || path.length < 2) return true;

  const first = stops[ids[0]];
  const last = stops[ids[ids.length - 1]];
  if (!first || !last || !Number.isFinite(first.lat) || !Number.isFinite(last.lat)) return true;

  const head = { lat: path[0][0], lon: path[0][1] };
  return distanceM(head, first) <= distanceM(head, last);
};

// Durağın yola göre sağ/sol tarafı ve yola uzaklığı.
// Sağ taraf (Türkiye'de durak tarafı) pozitif döner.
const pathSide = (dir, stop, stops) => {
  const path = dir.path || [];
  if (!stop || !Number.isFinite(stop.lat) || !Number.isFinite(stop.lon) || path.length < 3) {
    return { score: 0, offset: Number.POSITIVE_INFINITY };
  }

  let bestIdx = 0;
  let bestDist = Number.POSITIVE_INFINITY;
  path.forEach((point, idx) => {
    const d = distanceM({ lat: point[0], lon: point[1] }, stop);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = idx;
    }
  });

  const i0 = Math.max(0, bestIdx - 1);
  const i1 = Math.min(path.length - 1, bestIdx + 1);
  const lat0 = path[bestIdx][0];
  const lon0 = path[bestIdx][1];
  const metersPerDegLat = 110540;
  const metersPerDegLon = 111320 * Math.cos((lat0 * Math.PI) / 180);

  const dx = (path[i1][1] - path[i0][1]) * metersPerDegLon;
  const dy = (path[i1][0] - path[i0][0]) * metersPerDegLat;
  const rx = (stop.lon - lon0) * metersPerDegLon;
  const ry = (stop.lat - lat0) * metersPerDegLat;

  const sign = pathForward(dir, stops) ? -1 : 1;
  return { score: (dx * ry - dy * rx) * sign, offset: bestDist };
};

const replaceStopInDirection = (dir, fromId, toId, code, stops) => {
  if (fromId === toId) return;
  dir.stopIds = (dir.stopIds || []).map((id) => (id === fromId ? toId : id));
  const stop = stops[toId];
  if (stop) {
    if (!Array.isArray(stop.routes)) stop.routes = [];
    if (!stop.routes.includes(code)) stop.routes.push(code);
  }
};

/**
 * Orijinal hat/durak verisinden platformları ayrılmış bir kopya üretir.
 * Orijinal objeler değiştirilmez.
 */
export function buildPlatformData(baseLines, baseStops) {
  const stops = {};
  Object.values(baseStops || {}).forEach((stop) => {
    stops[stop.id] = { ...stop, routes: [...(stop.routes || [])] };
  });

  const lines = {};
  Object.values(baseLines || {}).forEach((line) => {
    lines[line.code] = {
      ...line,
      directions: (line.directions || []).map((dir) => ({
        ...dir,
        stopIds: [...(dir.stopIds || [])]
      }))
    };
  });

  Object.values(lines).forEach((line) => {
    const dirs = line.directions || [];
    if (dirs.length < 2) return;

    const set0 = new Set(dirs[0].stopIds || []);
    const set1 = new Set(dirs[1].stopIds || []);
    const shared = [...set0].filter((id) => set1.has(id));

    for (const sharedId of shared) {
      const sharedStop = stops[sharedId];
      if (!sharedStop || !Number.isFinite(sharedStop.lat) || !Number.isFinite(sharedStop.lon)) continue;

      const baseName = normalizeBaseName(sharedStop.name);

      // Aynı isimli, yakın (120 m) ve farklı ID'li karşı platformu bul.
      let sibling = null;
      Object.values(stops).forEach((candidate) => {
        if (candidate.id === sharedId) return;
        if (!Number.isFinite(candidate.lat) || !Number.isFinite(candidate.lon)) return;
        if (normalizeBaseName(candidate.name) !== baseName) return;
        const distance = distanceM(sharedStop, candidate);
        if (distance > 120) return;
        if (!sibling || distance < sibling.distance) sibling = { stop: candidate, distance };
      });

      if (!sibling) continue;

      const sibId = sibling.stop.id;
      const side0 = pathSide(dirs[0], sharedStop, stops);
      const side0Sib = pathSide(dirs[0], sibling.stop, stops);
      const side1 = pathSide(dirs[1], sharedStop, stops);
      const side1Sib = pathSide(dirs[1], sibling.stop, stops);

      let dir0Id = null;
      let dir1Id = null;

      if (side0.score > 0 && side0Sib.score <= 0) {
        dir0Id = sharedId;
        dir1Id = sibId;
      } else if (side0Sib.score > 0 && side0.score <= 0) {
        dir0Id = sibId;
        dir1Id = sharedId;
      } else if (side1.score > 0 && side1Sib.score <= 0) {
        dir1Id = sharedId;
        dir0Id = sibId;
      } else if (side1Sib.score > 0 && side1.score <= 0) {
        dir1Id = sibId;
        dir0Id = sharedId;
      } else if (side0.offset <= side0Sib.offset) {
        // İki platform da aynı tarafta görünüyorsa yola daha yakın olanı seç.
        dir0Id = sharedId;
        dir1Id = sibId;
      } else {
        dir0Id = sibId;
        dir1Id = sharedId;
      }

      replaceStopInDirection(dirs[0], sharedId, dir0Id, line.code, stops);
      replaceStopInDirection(dirs[1], sharedId, dir1Id, line.code, stops);
    }
  });

  return { lines, stops };
}
