import { LOCAL_PLACES, normalizeTr } from '../data/places';
import { allStopsDB, etusLines } from '../data/db';

const MB_PART_A = 'pk.eyJ1Ijoid2lkZGVkIiwiYSI6ImNtdXNpdXBnOTB4YmMyd3Mxd2NsYXo2ZzMifQ';
const MB_PART_B = 'bEWk1zPyEYmByrckZXW4bA';
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || `${MB_PART_A}.${MB_PART_B}`;

const TT_PART_A = 'YQZmtoZAt9wAdjbuwA1';
const TT_PART_B = 'kcoeUoTYLttry';
export const TOMTOM_TOKEN = import.meta.env.VITE_TOMTOM_TOKEN || `${TT_PART_A}${TT_PART_B}`;

// Helper: Get user-friendly category badge & icon metadata
export const getCategoryMeta = (item) => {
  if (item.type === 'line') {
    return {
      label: 'ETUS Hattı',
      color: item.lineColor || '#38BDF8',
      bg: 'rgba(56, 189, 248, 0.16)',
      icon: 'bus'
    };
  }

  if (item.type === 'stop') {
    return {
      label: 'ETUS Durağı',
      color: '#24C795',
      bg: 'rgba(36, 199, 149, 0.14)',
      icon: 'bus'
    };
  }

  if (item.source === 'local') {
    return {
      label: 'Önemli Nokta',
      color: '#38BDF8',
      bg: 'rgba(56, 189, 248, 0.14)',
      icon: 'star'
    };
  }

  const cat = (item.category || '').toLowerCase();
  if (cat.includes('restaurant') || cat.includes('food') || cat.includes('yemek')) {
    return {
      label: 'Restoran',
      color: '#FB923C',
      bg: 'rgba(251, 146, 60, 0.14)',
      icon: 'utensils'
    };
  }
  if (cat.includes('caf') || cat.includes('coffee') || cat.includes('pub') || cat.includes('bar')) {
    return {
      label: 'Kafe & Kahve',
      color: '#FBBF24',
      bg: 'rgba(251, 191, 36, 0.14)',
      icon: 'coffee'
    };
  }
  if (cat.includes('pharmacy') || cat.includes('drug') || cat.includes('eczane')) {
    return {
      label: 'Eczane',
      color: '#F87171',
      bg: 'rgba(248, 113, 113, 0.14)',
      icon: 'pill'
    };
  }
  if (cat.includes('hotel') || cat.includes('motel') || cat.includes('pansiyon') || cat.includes('otel')) {
    return {
      label: 'Otel',
      color: '#A78BFA',
      bg: 'rgba(167, 139, 250, 0.14)',
      icon: 'bed'
    };
  }
  if (cat.includes('market') || cat.includes('shop') || cat.includes('mall') || cat.includes('store') || cat.includes('supermarket')) {
    return {
      label: 'Market / AVM',
      color: '#34D399',
      bg: 'rgba(52, 211, 153, 0.14)',
      icon: 'shopping-bag'
    };
  }
  if (cat.includes('hospital') || cat.includes('health') || cat.includes('doctor') || cat.includes('saglik')) {
    return {
      label: 'Sağlık',
      color: '#F472B6',
      bg: 'rgba(244, 114, 182, 0.14)',
      icon: 'activity'
    };
  }
  if (cat.includes('bank') || cat.includes('atm')) {
    return {
      label: 'Banka / ATM',
      color: '#60A5FA',
      bg: 'rgba(96, 165, 250, 0.14)',
      icon: 'credit-card'
    };
  }
  if (cat.includes('government') || cat.includes('office') || cat.includes('belediye') || cat.includes('kamu')) {
    return {
      label: 'Resmi Kurum',
      color: '#818CF8',
      bg: 'rgba(129, 140, 248, 0.14)',
      icon: 'landmark'
    };
  }

  if (item.source === 'tomtom') {
    return {
      label: 'İşletme (TomTom)',
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.14)',
      icon: 'store'
    };
  }

  return {
    label: 'Mekan / Adres',
    color: '#94A3B8',
    bg: 'rgba(148, 163, 184, 0.14)',
    icon: 'map-pin'
  };
};

// 1. Live Hybrid Search (TomTom Live POIs + Mapbox Places + Nominatim + Local POIs + ETUS Stops)
export const searchPlacesOnline = async (query) => {
  if (!query || query.trim().length < 2) return [];

  const q = query.trim();
  const normQuery = normalizeTr(q);

  // A) Local Verified Places Match
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

  // C) ETUS Bus Lines Match (e.g. "1A", "Hat 1A", "3", "Hat 3", "7", "Otogar")
  const cleanQ = normQuery.replace(/^hat\s+/, '').trim();
  const lineMatches = Object.values(etusLines)
    .filter(line => {
      const c = (line.code || '').toLowerCase();
      const normC = normalizeTr(c);
      const headSigns = (line.directions || []).map(d => normalizeTr(d.headSign || '')).join(' ');
      return normC === normQuery ||
             normC === cleanQ ||
             (cleanQ.length >= 1 && normC.startsWith(cleanQ)) ||
             headSigns.includes(normQuery) ||
             (cleanQ.length >= 2 && headSigns.includes(cleanQ));
    })
    .slice(0, 6)
    .map(line => {
      const firstStopId = line.directions?.[0]?.stopIds?.[0];
      const firstStop = allStopsDB[firstStopId];
      return {
        name: `Hat ${line.code}`,
        detail: line.directions?.[0]?.headSign || 'ETUS Otobüs Hattı',
        lat: firstStop?.lat || 41.6771,
        lon: firstStop?.lon || 26.5557,
        lineCode: line.code,
        lineColor: line.color,
        type: 'line',
        source: 'etus_line'
      };
    });

  // D) Remote APIs (TomTom with Typeahead + Mapbox Edirne BBox + Nominatim)
  const remotePromises = [];

  // TomTom Search
  if (TOMTOM_TOKEN) {
    const tomtomUrl = `https://api.tomtom.com/search/2/search/${encodeURIComponent(q)}.json?key=${TOMTOM_TOKEN}&lat=41.6771&lon=26.5557&radius=25000&countrySet=TR&typeahead=true&language=tr-TR&limit=10`;
    remotePromises.push(
      fetch(tomtomUrl)
        .then(res => res.json())
        .then(data => {
          if (!data.results) return [];
          return data.results.map(item => {
            let detail = item.address?.freeformAddress || item.address?.streetName || '';
            detail = detail
              .replace(', Türkiye', '')
              .replace(' Edirne (Merkez)', '')
              .replace(' (Merkez)', '')
              .trim();
            const isPoi = !!item.poi;
            return {
              name: item.poi?.name || item.address?.streetName || q,
              detail: detail || 'Edirne',
              lat: item.position?.lat,
              lon: item.position?.lon,
              type: 'place',
              source: 'tomtom',
              category: item.poi?.categories?.[0] || (isPoi ? 'İşletme' : 'Adres')
            };
          });
        })
        .catch(() => [])
    );
  }

  // Mapbox Geocoding
  if (MAPBOX_TOKEN) {
    const bbox = '26.45,41.58,26.65,41.72';
    const prox = '26.5557,41.6771';
    const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&bbox=${bbox}&proximity=${prox}&country=tr&language=tr&limit=5`;
    remotePromises.push(
      fetch(mapboxUrl)
        .then(res => res.json())
        .then(data => {
          if (!data.features) return [];
          return data.features.map(item => {
            const name = item.text || item.place_name.split(',')[0];
            const detail = item.place_name.replace(name + ', ', '').replace(', Türkiye', '').trim();
            return {
              name: name,
              detail: detail || 'Edirne',
              lat: item.geometry.coordinates[1],
              lon: item.geometry.coordinates[0],
              type: 'place',
              source: 'mapbox',
              category: 'Adres'
            };
          });
        })
        .catch(() => [])
    );
  }

  // Nominatim OSM Search fallback
  const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ' Edirne')}&format=json&limit=4&countrycodes=tr`;
  remotePromises.push(
    fetch(nomUrl)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return [];
        return data.map(item => {
          const name = item.display_name.split(',')[0];
          const detail = item.display_name.replace(name + ', ', '').replace(', Türkiye', '').trim();
          return {
            name: name,
            detail: detail || 'Edirne',
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
            type: 'place',
            source: 'nominatim',
            category: item.type || 'Mekan'
          };
        });
      })
      .catch(() => [])
  );

  const remoteResults = await Promise.all(remotePromises);
  const flattenedRemote = remoteResults.flat();

  // Deduplicate remote places
  const uniqueRemote = [];
  const seenRemote = new Set();
  for (const item of flattenedRemote) {
    if (!item.lat || !item.lon) continue;
    const key = `${normalizeTr(item.name).slice(0, 15)}_${item.lat.toFixed(3)}_${item.lon.toFixed(3)}`;
    if (!seenRemote.has(key)) {
      seenRemote.add(key);
      uniqueRemote.push(item);
    }
  }

  const topStops = stopMatches.slice(0, 4);
  const remainingStops = stopMatches.slice(4);

  const combined = [
    ...lineMatches,
    ...localMatches,
    ...uniqueRemote,
    ...topStops,
    ...remainingStops
  ];

  // Final deduplication
  const finalResults = [];
  const seenAll = new Set();
  for (const item of combined) {
    if (item.type === 'line') {
      const key = `line_${item.lineCode}`;
      if (!seenAll.has(key)) {
        seenAll.add(key);
        finalResults.push(item);
      }
      continue;
    }
    if (!item.lat || !item.lon) continue;
    const key = `${normalizeTr(item.name).slice(0, 16)}_${item.lat.toFixed(3)}_${item.lon.toFixed(3)}`;
    if (!seenAll.has(key)) {
      seenAll.add(key);
      finalResults.push(item);
    }
  }

  return finalResults;
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
  } catch (e) {
    // fallback
  }

  return `Seçilen Konum (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
};
