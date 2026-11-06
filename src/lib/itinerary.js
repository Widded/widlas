const WALK_M_PER_MIN = 80; // ~4.8 km/s yürüme hızı

const addMin = (d, m) => new Date(d.getTime() + m * 60000);
const walkMinutes = (m) => Math.max(1, Math.ceil(m / WALK_M_PER_MIN));

// "Gazimihal - Otogar" -> "Otogar" (otobüsün ön tabelasında yazan son durak)
export const terminalOf = (headSign) => (headSign || '').split(' - ').pop().trim();

/**
 * Seçilen rotayı zaman damgalı adımlara çevirir.
 * walk: { startM, endM, startExact, endExact } -> yürüme mesafeleri (metre)
 */
export function buildItinerary(route, walk, departAt) {
  if (!route) return null;
  const isWalkOnly = route.isWalkOnly;
  if (!isWalkOnly && !route.legs?.length) return null;

  const startWalkMin = walkMinutes(walk.startM);
  const endWalkMin = isWalkOnly ? 0 : walkMinutes(walk.endM);
  const waitMin = route.transferWaitMins || 0;

  let t = departAt;
  const atStop1 = addMin(t, startWalkMin);
  t = atStop1;

  const legs = (route.legs || []).map((leg, i) => {
    const boardAt = t;
    const alightAt = addMin(boardAt, leg.minutes);
    t = alightAt;
    if (i < route.legs.length - 1) t = addMin(t, waitMin);
    return { ...leg, boardAt, alightAt };
  });

  const arriveAt = isWalkOnly ? atStop1 : addMin(t, endWalkMin);

  const segments = isWalkOnly
    ? [{ kind: 'walk', min: startWalkMin }]
    : [
      { kind: 'walk', min: startWalkMin },
      ...legs.flatMap((l, i) => (i > 0 ? [{ kind: 'wait', min: waitMin }, { kind: 'bus', min: l.minutes, color: l.color }] : [{ kind: 'bus', min: l.minutes, color: l.color }])),
      { kind: 'walk', min: endWalkMin }
    ];

  return {
    departAt,
    arriveAt,
    totalMin: Math.round((arriveAt - departAt) / 60000),
    startWalkMin,
    endWalkMin,
    waitMin,
    totalWalkM: walk.startM + walk.endM,
    totalStops: legs.reduce((s, l) => s + l.stopCount, 0),
    transfers: isWalkOnly ? 0 : Math.max(0, legs.length - 1),
    isWalkOnly,
    legs,
    segments,
    walk,
    route
  };
}
