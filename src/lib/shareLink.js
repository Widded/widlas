// Paylaşılan varış linki: <sayfa>?to=lat,lon&tn=Ad
// Link yalnızca hedefi taşır; kalkış her zaman linki açan kişinin konumudur.
export const buildShareUrl = (place, base) => {
  const url = new URL(base);
  url.search = '';
  url.searchParams.set('to', `${place.lat.toFixed(6)},${place.lon.toFixed(6)}`);
  if (place.name) url.searchParams.set('tn', place.name);
  return url.toString();
};

export const parseShareTarget = (search) => {
  const params = new URLSearchParams(search);
  const raw = params.get('to');
  if (!raw) return null;

  const [lat, lon] = raw.split(',').map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return null;

  return { name: params.get('tn') || 'Paylaşılan konum', lat, lon };
};
