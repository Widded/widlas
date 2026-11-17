const plateKey = (bus) => String(bus?.plateNumber || bus?.plate || '').trim();

export const mergeOfficialEta = (lineBuses = [], nearestBuses = [], code, direction) => {
  const official = new Map();

  (nearestBuses || []).forEach((bus) => {
    if (String(bus?.displayRouteCode) !== String(code)) return;
    if (String(bus?.direction) !== String(direction)) return;
    const key = plateKey(bus);
    if (!key) return;
    official.set(key, bus);
  });

  return (lineBuses || []).map((bus) => {
    const nearest = official.get(plateKey(bus));
    const eta = Number(nearest?.timeDiff);
    const stops = Number(nearest?.stopDiff);
    return {
      ...bus,
      officialEta: Number.isFinite(eta) && eta > 0 ? eta : null,
      officialStopsLeft: Number.isFinite(stops) && stops > 0 ? stops : null
    };
  });
};
