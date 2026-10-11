// Edirne Ulaşım - External Transit & Geospatial APIs (TomTom, Mapbox, Nominatim)
import { LOCAL_PLACES, normalizeTr } from '../data/places';
import { allStopsDB } from '../data/db';

const MB_PART_A = 'pk.eyJ1Ijoid2lkZGVkIiwiYSI6ImNtdXNpdXBnOTB4YmMyd3Mxd2NsYXo2ZzMifQ';
const MB_PART_B = 'bEWk1zPyEYmByrckZXW4bA';
export const MAPBOX_TOKEN = `${MB_PART_A}.${MB_PART_B}`;

const TT_PART_A = 'YQZmtoZAt9wAdjbuwA1';
const TT_PART_B = 'kcoeUoTYLttry';
export const TOMTOM_TOKEN = `${TT_PART_A}${TT_PART_B}`;

// 1. Hybrid Search (Local Verified POIs + ETUS Stops + TomTom POI + Nominatim)
export const searchPlacesOnline = async (query) => {
  if (!query || query.trim().length < 2) return [];

  const q = query.trim();
  const normQuery = normalizeTr(q);

  // A) Local Places Match
  const localMatches = LOCAL_PLACES.filter(p =>
    normalizeTr(p.name).includes(normQuery) ||
    (p.tags && p.tags.some(t => normalizeTr(t).includes(normQuery)))
  ).map(p => ({
    name: p.name,
    shortName: p.shortName,
    lat: p.lat,
    lon: p.lon,
    type: 'place',
    source: 'local'
  }));

  // B) ETUS Stops DB Match
  const stopMatches = Object.values(allStopsDB)
    .filter(s => s.lat && s.lon && (s.searchIndex || normalizeTr(s.name)).includes(normQuery))
    .slice(0, 15)
    .map(s => ({
      name: s.name,
      lat: s.lat,
      lon: s.lon,
      type: 'stop',
      source: 'etus'
    }));

  // C) Remote APIs (TomTom + Nominatim)
  const remotePromises = [];

  // TomTom Search (Edirne bounded: 15km radius)
  if (TOMTOM_TOKEN) {
    const tomtomUrl = `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json?key=${TOMTOM_TOKEN}&lat=41.6771&lon=26.5557&radius=15000&language=tr-TR&limit=5`;
    remotePromises.push(
      fetch(tomtomUrl)
        .then(res => res.json())
        .then(data => {
          if (!data.results) return [];
          return data.results.map(item => {
            let detail = item.address?.freeformAddress || '';
            detail = detail.replace(', Türkiye', '').replace(' Edirne', '');
            return {
              name: item.poi?.name || item.address?.streetName || q,
              detail: detail,
              lat: item.position?.lat,
              lon: item.position?.lon,
              type: 'place',
              source: 'tomtom'
            };
          });
        })
        .catch(() => [])
    );
  }

  // Nominatim OSM Search fallback
  const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ' Edirne')}&format=json&limit=3`;
  remotePromises.push(
    fetch(nomUrl, { headers: { 'User-Agent': 'EdirneUlasimMobile/1.0' } })
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return [];
        return data.map(item => {
          const name = item.display_name.split(',')[0];
          const detail = item.display_name.replace(name + ', ', '').replace(', Türkiye', '');
          return {
            name: name,
            detail: detail,
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            type: 'place',
            source: 'nominatim'
          };
        });
      })
      .catch(() => [])
  );

  const remoteResults = await Promise.all(remotePromises);
  const flattenedRemote = remoteResults.flat();

  // Deduplicate by name & coordinates proximity
  const allResults = [...localMatches, ...stopMatches, ...flattenedRemote];
  const unique = [];
  const seenNames = new Set();

  for (const item of allResults) {
    const key = `${normalizeTr(item.name).slice(0, 15)}_${item.lat?.toFixed(3)}_${item.lon?.toFixed(3)}`;
    if (!seenNames.has(key) && item.lat && item.lon) {
      seenNames.add(key);
      unique.push(item);
    }
  }

  return unique;
};

// 2. Mapbox Real Pedestrian Walking Route (Streets & Sidewalks Geometry)
export const fetchWalkingPath = async (fromLat, fromLon, toLat, toLon) => {
  if (!fromLat || !fromLon || !toLat || !toLon) return [];

  if (!MAPBOX_TOKEN) {
    return [
      { latitude: fromLat, longitude: fromLon },
      { latitude: toLat, longitude: toLon }
    ];
  }

  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${fromLon},${fromLat};${toLon},${toLat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.routes && data.routes[0]?.geometry?.coordinates) {
      return data.routes[0].geometry.coordinates.map(c => ({
        latitude: c[1],
        longitude: c[0]
      }));
    }
  } catch (err) {
    console.warn('Mapbox walking route error:', err);
  }

  return [
    { latitude: fromLat, longitude: fromLon },
    { latitude: toLat, longitude: toLon }
  ];
};

// 3. Reverse Geocoding (When user taps on the map)
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
  } catch (e) {
    // fallback
  }

  return `Seçilen Konum (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
};
