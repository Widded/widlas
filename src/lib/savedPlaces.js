const STORAGE_KEY = 'edirne_saved_places_v1';

const normalize = (place) =>
  `${(place.name || '').trim().toLowerCase()}_${Number(place.lat).toFixed(5)}_${Number(place.lon).toFixed(5)}`;

export const loadSavedPlaces = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter(p => p && Number.isFinite(p.lat) && Number.isFinite(p.lon)) : [];
  } catch {
    return [];
  }
};

export const savePlace = (place) => {
  if (!place || !Number.isFinite(place.lat) || !Number.isFinite(place.lon)) {
    return loadSavedPlaces();
  }

  const current = loadSavedPlaces();
  if (current.some(p => normalize(p) === normalize(place))) {
    return current;
  }

  const entry = {
    id: `saved_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: place.name || 'Kaydedilen Konum',
    lat: place.lat,
    lon: place.lon
  };
  const next = [entry, ...current].slice(0, 30);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Depolama kapalıysa sessizce devam et.
  }

  return next;
};

export const removeSavedPlace = (id) => {
  const next = loadSavedPlaces().filter(p => p.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Depolama kapalıysa sessizce devam et.
  }
  return next;
};
