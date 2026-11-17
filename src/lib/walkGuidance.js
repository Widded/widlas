const EARTH_RADIUS_M = 6371000;
const toRad = (deg) => (deg * Math.PI) / 180;
const toDeg = (rad) => (rad * 180) / Math.PI;
const normalize = (deg) => ((deg % 360) + 360) % 360;

export const distanceMeters = (a, b) => {
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

export const bearingDegrees = (a, b) => {
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLon = toRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return normalize(toDeg(Math.atan2(y, x)));
};

export const relativeArrowDegrees = (bearing, heading) => {
  const base = Number.isFinite(bearing) ? bearing : 0;
  if (!Number.isFinite(heading)) return normalize(base);
  return normalize(base - heading);
};

export const walkingMinutes = (meters) => {
  if (!Number.isFinite(meters)) return 1;
  return Math.max(1, Math.ceil(meters / 1.4 / 60 - 1e-9));
};

export const destinationOf = (headSign) => {
  const value = String(headSign || '').trim();
  if (!value) return '';
  const parts = value.split(' - ');
  return parts[parts.length - 1].trim();
};
