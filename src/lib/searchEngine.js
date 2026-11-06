import { LOCAL_PLACES, normalizeTr } from '../data/places';
import { allStopsDB } from '../data/db';

export const EDIRNE_CENTER = { lat: 41.6771, lon: 26.5557 };
export const EDIRNE_BBOX = {
  minLat: 41.55,
  maxLat: 41.76,
  minLon: 26.42,
  maxLon: 26.72
};

export const normalizeCompact = normalizeTr;

export const isInsideEdirne = (lat, lon) =>
  Number.isFinite(lat) &&
  Number.isFinite(lon) &&
  lat >= EDIRNE_BBOX.minLat &&
  lat <= EDIRNE_BBOX.maxLat &&
  lon >= EDIRNE_BBOX.minLon &&
  lon <= EDIRNE_BBOX.maxLon;

export const normalizeText = (value) => (value || '')
  .toLocaleLowerCase('tr')
  .replace(/ı/g, 'i')
  .replace(/ğ/g, 'g')
  .replace(/ü/g, 'u')
  .replace(/ş/g, 's')
  .replace(/ö/g, 'o')
  .replace(/ç/g, 'c')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export const distanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Türkçe hâl eklerini sorgu tarafında kırp (otogara -> otogar, hastaneye -> hastane)
const SUFFIXES = [
  'larindan', 'lerinden', 'larin', 'lerin', 'lardan', 'lerden',
  'daki', 'deki', 'taki', 'teki', 'lara', 'lere',
  'dan', 'den', 'tan', 'ten', 'nin', 'nun',
  'lar', 'ler', 'da', 'de', 'ta', 'te', 'ya', 'ye',
  'in', 'un', 'a', 'e', 'i', 'u', 'tar'
];

const stripSuffix = (token) => {
  if (!token || token.length < 5) return null;
  for (const suffix of SUFFIXES) {
    if (token.length - suffix.length >= 4 && token.endsWith(suffix)) {
      return token.slice(0, -suffix.length);
    }
  }
  return null;
};

const QUERY_ALIASES = {
  heykel: ['merkez', 'sehir'],
  merkez: ['heykel'],
  terminal: ['otogar'],
  otogar: ['terminal'],
  otobus: ['otogar', 'terminal'],
  uni: ['universite'],
  universite: ['uni', 'kampus', 'yerleske'],
  kampus: ['yerleske', 'universite'],
  yerleske: ['kampus', 'universite'],
  hastane: ['hastanesi'],
  hastanesi: ['hastane'],
  avm: ['alisveris'],
  alisveris: ['avm'],
  cami: ['camii'],
  camii: ['cami'],
  yurt: ['kyk'],
  kyk: ['yurt'],
  gar: ['tren'],
  tren: ['gar'],
  kopru: ['koprusu'],
  koprusu: ['kopru']
};

const buildTokens = (values) => {
  const tokens = new Set();
  for (const value of values) {
    if (!value) continue;
    for (const token of normalizeText(value).split(' ')) {
      if (token.length >= 2) tokens.add(token);
    }
  }
  return [...tokens];
};

const routeDetail = (routes = []) => {
  if (!routes.length) return 'ETUS Durağı';
  const shown = routes.slice(0, 3).map((route) => `Hat ${route}`).join(' · ');
  return routes.length > 3 ? `${shown} +${routes.length - 3}` : shown;
};

const makeEntry = (item, values) => ({
  ...item,
  tokens: buildTokens(values),
  compact: normalizeTr(item.name)
});

const LOCAL_INDEX = LOCAL_PLACES.map((place) => makeEntry(
  {
    name: place.name,
    shortName: place.shortName,
    lat: place.lat,
    lon: place.lon,
    type: 'place',
    source: 'local'
  },
  [place.name, place.shortName, ...(place.tags || [])]
));

const STOP_INDEX = Object.values(allStopsDB).map((stop) => makeEntry(
  {
    name: stop.name,
    lat: stop.lat,
    lon: stop.lon,
    type: 'stop',
    source: 'etus',
    routes: stop.routes || [],
    detail: routeDetail(stop.routes)
  },
  [stop.name, stop.fullName]
));

const INDEX = [...LOCAL_INDEX, ...STOP_INDEX];

const levenshtein = (a, b, maxDistance = Infinity) => {
  if (Math.abs(a.length - b.length) > maxDistance) return maxDistance + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const value = Math.min(previous[j] + 1, row[j - 1] + 1, previous[j - 1] + cost);
      row[j] = value;
      if (value < rowMin) rowMin = value;
    }
    if (rowMin > maxDistance) return maxDistance + 1;
    previous = row;
  }

  return previous[b.length];
};

const tokenMatchScore = (variant, token) => {
  if (variant === token) return 1;
  if (token.startsWith(variant)) return 0.92;
  if (token.length >= 4 && variant.startsWith(token)) return 0.88;
  if (token.includes(variant) && variant.length >= 3) return 0.8;
  if (variant.includes(token) && token.length >= 4) return 0.74;

  const maxDistance = variant.length >= 7 ? 2 : variant.length >= 4 ? 1 : 0;
  if (maxDistance && Math.abs(variant.length - token.length) <= maxDistance) {
    const d = levenshtein(variant, token, maxDistance);
    if (d <= maxDistance) return 0.65 - d * 0.05;
  }

  return 0;
};

const STOP_WORDS = new Set([
  'edirne', 'merkez', 'mahalle', 'sokak', 'cadde', 'caddesi', 'bulvar', 'bulvari'
]);

const queryTokens = (query) => {
  const allTokens = normalizeText(query)
    .split(' ')
    .filter((token) => token.length >= 2);

  const meaningful = allTokens.filter((token) => !STOP_WORDS.has(token));
  return meaningful.length > 0 ? meaningful : allTokens;
};

const compactQueryFor = (query) => queryTokens(query).join('');

const queryTokenGroups = (query) => {
  const tokens = queryTokens(query);

  return tokens.map((token) => {
    const variants = new Set([token]);
    const stem = stripSuffix(token);
    if (stem) variants.add(stem);
    for (const alias of QUERY_ALIASES[token] || []) variants.add(alias);
    if (stem) {
      for (const alias of QUERY_ALIASES[stem] || []) variants.add(alias);
    }
    return [...variants];
  });
};

const nameMatchScore = (entry, query, groups) => {
  const compactQuery = compactQueryFor(query);
  const compactName = entry.compact || '';

  let compactScore = 0;
  if (compactQuery && compactName) {
    if (compactName === compactQuery) compactScore = 1;
    else if (compactName.startsWith(compactQuery)) compactScore = 0.95;
    else if (compactQuery.startsWith(compactName) && compactName.length >= 4) compactScore = 0.88;
    else if (compactName.includes(compactQuery)) compactScore = 0.82;
    else if (compactQuery.includes(compactName) && compactName.length >= 4) compactScore = 0.72;
  }

  let scoreSum = 0;
  let matchedGroups = 0;

  for (const variants of groups) {
    let best = 0;
    for (const variant of variants) {
      for (const token of entry.tokens) {
        const score = tokenMatchScore(variant, token);
        if (score > best) best = score;
        if (best === 1) break;
      }
      if (best === 1) break;
    }
    scoreSum += best;
    if (best >= 0.6) matchedGroups += 1;
  }

  const groupCount = groups.length || 1;
  const average = scoreSum / groupCount;
  const coverage = matchedGroups / groupCount;
  const tokenScore = average * (0.7 + 0.3 * coverage);

  return Math.max(compactScore, tokenScore);
};

export const scoreRemoteItem = (item, query, userLocation) => {
  const entry = {
    tokens: buildTokens([item.name, item.category]),
    compact: normalizeTr(item.name)
  };
  const matchScore = nameMatchScore(entry, query, queryTokenGroups(query));
  const distance = userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lon)
    ? distanceKm(userLocation.lat, userLocation.lon, item.lat, item.lon)
    : null;

  return { matchScore, distanceKm: distance };
};

export const searchLocalCandidates = (query, { userLocation } = {}) => {
  const q = query.trim();
  if (!q) return [];

  const groups = queryTokenGroups(q);
  const results = [];

  for (const entry of INDEX) {
    const matchScore = nameMatchScore(entry, q, groups);
    if (matchScore < 0.3) continue;

    const distance = userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lon)
      ? distanceKm(userLocation.lat, userLocation.lon, entry.lat, entry.lon)
      : null;

    results.push({ ...entry, matchScore, distanceKm: distance });
  }

  return results;
};

const SOURCE_BONUS = {
  local: 0.22,
  etus: 0.2,
  tomtom: 0.07,
  mapbox: 0.05,
  nominatim: 0.02
};

const SOURCE_PRIORITY = {
  local: 5,
  etus: 4,
  tomtom: 3,
  mapbox: 2,
  nominatim: 1
};

const finalScore = (item) => {
  const match = item.matchScore || 0;
  const source = SOURCE_BONUS[item.source] || 0;
  const proximity = item.distanceKm != null
    ? Math.max(0, 1 - item.distanceKm / 12) * 0.12
    : 0;
  return match * 0.78 + source + proximity;
};

const nameSimilarity = (a, b) => {
  const x = normalizeTr(a);
  const y = normalizeTr(b);
  if (!x || !y) return 0;
  if (x === y) return 1;
  if (x.includes(y) || y.includes(x)) return 0.85;

  const maxLength = Math.max(x.length, y.length);
  if (!maxLength) return 0;
  const distance = levenshtein(x, y, 6);
  return 1 - distance / maxLength;
};

export const mergeAndRankCandidates = (candidates, { limit = 8 } = {}) => {
  const sorted = [...candidates].sort((a, b) => finalScore(b) - finalScore(a));
  const merged = [];

  for (const candidate of sorted) {
    const existing = merged.find((item) => {
      if (!Number.isFinite(item.lat) || !Number.isFinite(candidate.lat)) return false;

      const distance = distanceKm(item.lat, item.lon, candidate.lat, candidate.lon);
      if (distance > 0.35) return false;

      const similarity = nameSimilarity(item.name, candidate.name);
      if (similarity < 0.72) return false;

      const exactName = normalizeTr(item.name) === normalizeTr(candidate.name);
      return exactName ? distance <= 0.35 : distance <= 0.13;
    });

    if (!existing) {
      merged.push({ ...candidate });
      continue;
    }

    const candidatePriority = SOURCE_PRIORITY[candidate.source] || 0;
    const existingPriority = SOURCE_PRIORITY[existing.source] || 0;

    if (candidatePriority > existingPriority) {
      merged[merged.indexOf(existing)] = {
        ...candidate,
        routes: candidate.routes?.length ? candidate.routes : existing.routes,
        detail: candidate.detail || existing.detail,
        matchScore: Math.max(candidate.matchScore || 0, existing.matchScore || 0)
      };
    } else {
      existing.routes = existing.routes?.length ? existing.routes : candidate.routes;
      existing.detail = existing.detail || candidate.detail;
      existing.matchScore = Math.max(existing.matchScore || 0, candidate.matchScore || 0);
    }
  }

  return merged
    .map((item) => ({ ...item, _score: finalScore(item) }))
    .sort((a, b) => (
      b._score - a._score ||
      (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)
    ))
    .slice(0, limit)
    .map((item) => {
      const clean = { ...item };
      delete clean.tokens;
      delete clean.compact;
      delete clean._score;
      return clean;
    });
};
