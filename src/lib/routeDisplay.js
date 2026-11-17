export const fmtDuration = (totalMinutes) => {
  if (!totalMinutes) return '0 dk';
  const m = Math.round(totalMinutes);
  if (m >= 60) {
    const hours = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${hours} sa ${rem} dk` : `${hours} sa`;
  }
  return `${m} dk`;
};

export const fmtDist = (route) => {
  if (!route) return '';
  const km = route.totalDistanceKm ||
    (route.isWalkOnly ? (route.walkDistanceStart || 1.2) : (route.busTimeMins || 10) * 0.38) ||
    3.5;
  return `${Number(km).toFixed(1).replace('.', ',')} km`;
};

export const walkDistanceKm = (route, side) => {
  const value = Number(side === 'start' ? route?.walkDistanceStart : route?.walkDistanceEnd);
  return Number.isFinite(value) && value > 0 ? value : 0;
};

export const walkMinutes = (route, side) => {
  const value = Number(side === 'start' ? route?.walkStartMins : route?.walkEndMins);
  if (Number.isFinite(value) && value > 0) return Math.round(value);
  const legacy = Number(side === 'start' ? route?.walkTimeStart : route?.walkTimeEnd);
  return Number.isFinite(legacy) && legacy > 0 ? Math.round(legacy) : 0;
};

export const fmtWalkKm = (km) => {
  const meters = Number(km) * 1000;
  if (!Number.isFinite(meters) || meters <= 0) return '';
  return meters >= 1000
    ? `${(meters / 1000).toFixed(1).replace('.', ',')} km`
    : `${Math.round(meters)} m`;
};

export const destOf = (headSign) => {
  const value = String(headSign || '').trim();
  if (!value) return '';
  const parts = value.split(' - ');
  return parts[parts.length - 1].trim();
};
