import {
  EDIRNE_CENTER,
  isInsideEdirne,
  mergeAndRankCandidates,
  normalizeCompact,
  scoreRemoteItem,
  searchLocalCandidates
} from '../lib/searchEngine';

// API anahtarları yalnızca ortam değişkenlerinden okunur (.env).
// .env dosyası git'e dahil edilmez; örnek değerler için .env.example dosyasına bakın.
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';
export const TOMTOM_TOKEN = import.meta.env.VITE_TOMTOM_TOKEN || '';

const REMOTE_CACHE_TTL = 5 * 60 * 1000;
const REMOTE_CACHE_MAX = 80;
const remoteCache = new Map();
let lastNominatimAt = 0;

const cleanAddress = (value = '') => value
  .replace(', Türkiye', '')
  .replace(' Edirne (Merkez)', '')
  .replace(' (Merkez)', '')
  .replace(/,\s*$/, '')
  .trim();

const fetchJson = async (url, { signal, timeoutMs = 2500 } = {}) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onAbort = () => controller.abort();

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
};

const getCachedRemote = (key) => {
  const entry = remoteCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > REMOTE_CACHE_TTL) {
    remoteCache.delete(key);
    return null;
  }
  return entry.items;
};

const setCachedRemote = (key, items) => {
  if (remoteCache.size >= REMOTE_CACHE_MAX) {
    const oldest = remoteCache.keys().next().value;
    remoteCache.delete(oldest);
  }
  remoteCache.set(key, { at: Date.now(), items });
};

const toTomTomItem = (item, fallbackName) => ({
  name: item.poi?.name || item.address?.streetName || fallbackName,
  detail: cleanAddress(item.address?.freeformAddress || item.address?.streetName || '') || 'Edirne',
  lat: item.position?.lat,
  lon: item.position?.lon,
  type: 'place',
  source: 'tomtom',
  category: item.poi?.categories?.[0] || (item.poi ? 'İşletme' : 'Adres')
});

const toMapboxItem = (item) => {
  const name = item.text || item.place_name?.split(',')[0] || 'Edirne';
  const detail = cleanAddress((item.place_name || '').replace(`${name}, `, ''));
  return {
    name,
    detail: detail || 'Edirne',
    lat: item.geometry?.coordinates?.[1],
    lon: item.geometry?.coordinates?.[0],
    type: 'place',
    source: 'mapbox',
    category: item.place_type?.[0] || 'Adres'
  };
};

const toNominatimItem = (item) => {
  const name = (item.display_name || '').split(',')[0] || 'Edirne';
  const detail = cleanAddress((item.display_name || '').replace(`${name}, `, ''));
  return {
    name,
    detail: detail || 'Edirne',
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
    type: 'place',
    source: 'nominatim',
    category: item.type || 'Mekan'
  };
};

const fetchTomTom = async (query, center, signal) => {
  if (!TOMTOM_TOKEN) return [];
  const url = `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${TOMTOM_TOKEN}&lat=${center.lat}&lon=${center.lon}&radius=12000&countrySet=TR&typeahead=true&language=tr-TR&limit=8`;
  try {
    const data = await fetchJson(url, { signal });
    return (data.results || []).map((item) => toTomTomItem(item, query));
  } catch {
    return [];
  }
};

const fetchMapbox = async (query, center, signal) => {
  if (!MAPBOX_TOKEN) return [];
  const bbox = '26.42,41.55,26.72,41.76';
  const proximity = `${center.lon},${center.lat}`;
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&bbox=${bbox}&proximity=${proximity}&country=tr&language=tr&limit=5`;
  try {
    const data = await fetchJson(url, { signal });
    return (data.features || []).map(toMapboxItem);
  } catch {
    return [];
  }
};

const fetchNominatim = async (query, signal) => {
  if (Date.now() - lastNominatimAt < 1100) return [];
  lastNominatimAt = Date.now();

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${query} Edirne`)}&format=json&limit=5&countrycodes=tr&viewbox=26.42,41.76,26.72,41.55&bounded=1&accept-language=tr`;
  try {
    const data = await fetchJson(url, { signal, timeoutMs: 3000 });
    return Array.isArray(data) ? data.map(toNominatimItem) : [];
  } catch {
    return [];
  }
};

// Hybrid search: local places/stops are ranked locally, remote providers fill the rest.
export const searchPlacesOnline = async (query, { signal, userLocation } = {}) => {
  if (!query || query.trim().length < 2) return [];

  const q = query.trim();
  const center = userLocation && Number.isFinite(userLocation.lat) && Number.isFinite(userLocation.lon)
    ? { lat: userLocation.lat, lon: userLocation.lon }
    : EDIRNE_CENTER;

  if (signal?.aborted) return [];

  const localCandidates = searchLocalCandidates(q, { userLocation: center });
  const cacheKey = `${normalizeCompact(q)}|${center.lat.toFixed(2)},${center.lon.toFixed(2)}`;

  let remoteItems = getCachedRemote(cacheKey);
  if (!remoteItems) {
    const [tomtom, mapbox] = await Promise.all([
      fetchTomTom(q, center, signal),
      fetchMapbox(q, center, signal)
    ]);

    remoteItems = [...tomtom, ...mapbox];

    if (localCandidates.length === 0 && remoteItems.length < 3) {
      const nominatim = await fetchNominatim(q, signal);
      remoteItems = [...remoteItems, ...nominatim];
    }

    if (signal?.aborted) return [];
    setCachedRemote(cacheKey, remoteItems);
  }

  const remoteCandidates = remoteItems
    .filter((item) => isInsideEdirne(item.lat, item.lon))
    .map((item) => ({ ...item, ...scoreRemoteItem(item, q, center) }))
    .filter((item) => item.matchScore >= 0.3);

  if (signal?.aborted) return [];

  return mergeAndRankCandidates(
    [...localCandidates, ...remoteCandidates],
    { userLocation: center, limit: 8 }
  );
};

// 2. Mapbox Real Pedestrian Walking Route (Streets & Sidewalks Geometry)
export const fetchWalkingPath = async (fromLat, fromLon, toLat, toLon) => {
  if (!fromLat || !fromLon || !toLat || !toLon) return [];

  if (!MAPBOX_TOKEN) {
    return [
      [fromLat, fromLon],
      [toLat, toLon]
    ];
  }

  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${fromLon},${fromLat};${toLon},${toLat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.routes && data.routes[0]?.geometry?.coordinates) {
      return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]); // [lat, lon]
    }
  } catch (err) {
    console.warn('Mapbox walking route error:', err);
  }

  return [
    [fromLat, fromLon],
    [toLat, toLon]
  ];
};

// 3. Mapbox Road-snapped Transit / Bus Route (Driving profile along real streets & roads)
export const fetchRoadSnappedBusPath = async (stops) => {
  if (!stops || stops.length < 2) return null;
  if (!MAPBOX_TOKEN) return null;

  try {
    const uniqueStops = [];
    stops.forEach((s) => {
      const lat = Number(s?.lat !== undefined ? s.lat : s?.[0]);
      const lon = Number(s?.lon !== undefined ? s.lon : s?.[1]);
      if (isNaN(lat) || isNaN(lon) || !lat || !lon) return;

      if (uniqueStops.length === 0) {
        uniqueStops.push({ lat, lon });
      } else {
        const prev = uniqueStops[uniqueStops.length - 1];
        if (Math.abs(prev.lat - lat) > 0.0001 || Math.abs(prev.lon - lon) > 0.0001) {
          uniqueStops.push({ lat, lon });
        }
      }
    });

    if (uniqueStops.length < 2) return null;

    let waypoints = uniqueStops;
    if (waypoints.length > 25) {
      const step = (waypoints.length - 1) / 24;
      waypoints = [];
      for (let i = 0; i < 24; i++) {
        waypoints.push(uniqueStops[Math.round(i * step)]);
      }
      waypoints.push(uniqueStops[uniqueStops.length - 1]);
    }

    const coordsStr = waypoints
      .map(s => `${s.lon.toFixed(6)},${s.lat.toFixed(6)}`)
      .join(';');

    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsStr}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.routes && data.routes[0]?.geometry?.coordinates) {
      return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]); // [latitude, longitude]
    }
  } catch (err) {
    console.warn('Mapbox road-snapping error:', err);
  }

  return null;
};

// 4. Reverse Geocoding (When user clicks on map)
export const reverseGeocodeCoord = async (lat, lon) => {
  try {
    if (TOMTOM_TOKEN) {
      const url = `https://api.tomtom.com/search/2/reverseGeocode/${lat},${lon}.json?key=${TOMTOM_TOKEN}&language=tr-TR`;
      const res = await fetch(url);
      const data = await res.json();
      const addr = data.addresses?.[0]?.address;
      if (addr?.freeformAddress) {
        return addr.freeformAddress.replace(', Türkiye', '').replace(' Edirne', '');
      }
    }
  } catch {
    // fallback
  }

  return `Seçilen Konum (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
};
