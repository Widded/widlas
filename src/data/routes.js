// Edirne Koordinatlı Durak Veritabanı
import { allStopsDB, etusLines } from './db.js';

// Haversine Formula (Mesafe hesaplama)
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Mesafe km cinsinden
};

// Yakındaki tüm durakları bulur (maxRadiusKm çapında)
export const findNearbyStops = (lat, lon, maxRadiusKm = 0.8) => {
  const nearby = [];
  Object.values(allStopsDB).forEach(stop => {
    if (stop.lat && stop.lon) {
      const distance = getDistance(lat, lon, stop.lat, stop.lon);
      if (distance <= maxRadiusKm) {
        nearby.push({ ...stop, distanceKm: distance });
      }
    }
  });
  return nearby.sort((a, b) => a.distanceKm - b.distanceKm);
};

// İki koordinat arası alternatifleri ile birlikte akıllı rota hesaplayan motor
export const calculateSmartRoute = async (fromLat, fromLon, toLat, toLon) => {
  if (!fromLat || !fromLon || !toLat || !toLon) return null;

  const slicePath = (path, startStop, endStop) => {
    if (!path || path.length === 0) return [];
    if (!startStop || !endStop || !startStop.lat || !endStop.lat) return path;
    const dist = (c, stop) => Math.pow(c[0] - stop.lat, 2) + Math.pow(c[1] - stop.lon, 2);
    const findIdx = (stop) => {
      let minIdx = 0; let minD = Infinity;
      path.forEach((c, i) => {
        let d = dist(c, stop);
        if (d < minD) { minD = d; minIdx = i; }
      });
      return minIdx;
    };
    const i1 = findIdx(startStop);
    const i2 = findIdx(endStop);
    return path.slice(Math.min(i1, i2), Math.max(i1, i2) + 1);
  };


  // 800 metre (yaklaşık 10 dk yürüme) çapındaki tüm durakları al
  const startStops = findNearbyStops(fromLat, fromLon, 0.8);
  const endStops = findNearbyStops(toLat, toLon, 0.8);

  if (startStops.length === 0 || endStops.length === 0) return null;

  const possibleRoutes = [];

  for (const sStop of startStops) {
    for (const eStop of endStops) {
      if (sStop.id === eStop.id) continue;

      const sLines = sStop.routes || [];
      const eLines = eStop.routes || [];
      const commonRoutes = sLines.filter(r => eLines.includes(r));

      for (const code of commonRoutes) {
        const lineData = etusLines[code];
        if (!lineData) continue;

        // Hangi yönde A durağı B durağından önce geliyor?
        for (const dir of lineData.directions) {
          const idxA = dir.stopIds.indexOf(sStop.id);
          const idxB = dir.stopIds.indexOf(eStop.id);
          
          if (idxA !== -1 && idxB !== -1 && idxA < idxB) {
            const stopCount = idxB - idxA;
            const estimatedBusTime = stopCount * 1.5; // Ortalama her durak 1.5 dk
            const walkStart = Math.ceil(sStop.distanceKm * 12); // km başı ~12 dk yürüme
            const walkEnd = Math.ceil(eStop.distanceKm * 12);
            const totalTime = walkStart + estimatedBusTime + walkEnd;

            // Ara durakları topla
            const passedStopIds = dir.stopIds.slice(idxA + 1, idxB);
            const passedStops = [];
            const passedStopCoords = [];
            passedStopIds.forEach(id => {
              const s = allStopsDB[id];
              if (s) {
                passedStops.push(s.name);
                if (s.lat && s.lon) passedStopCoords.push([s.lat, s.lon, s.name]);
              }
            });

            possibleRoutes.push({
              id: `${code}_${sStop.id}_${eStop.id}`,
              name: code,
              description: `${dir.headSign} yönü, ${stopCount} durak`,
              color: lineData.color || '#4f46e5',
              busTimeMins: Math.ceil(estimatedBusTime),
              totalTime: Math.ceil(totalTime),
              startStop: sStop,
              endStop: eStop,
              routeGeometry: slicePath(dir.path, sStop, eStop),
              walkDistanceStart: sStop.distanceKm,
              walkDistanceEnd: eStop.distanceKm,
              passedStops: passedStops,
              passedStopCoords: passedStopCoords
            });
          }
        }
      }
    }
  }

  // 1-TRANSFER ROTALARI (Aktarma)
  // Eğer doğrudan rota yoksa veya çeşitlilik olsun istiyorsak, 1 aktarmalı rotaları bulalım
  const transferRoutes = [];
  
  const linesToEnd = {}; 
  for (const eStop of endStops) {
    for (const lineCode of (eStop.routes || [])) {
      const lineData = etusLines[lineCode];
      if (!lineData) continue;
      lineData.directions.forEach((dir, dirIdx) => {
        const idxB = dir.stopIds.indexOf(eStop.id);
        if (idxB !== -1) {
          if (!linesToEnd[lineCode]) linesToEnd[lineCode] = [];
          linesToEnd[lineCode].push({ eStop, dirIdx, idxB, walkEnd: eStop.distanceKm });
        }
      });
    }
  }

  // Başlangıç duraklarından yola çık ve aktarma duraklarını kontrol et
  for (const sStop of startStops) {
    for (const line1Code of (sStop.routes || [])) {
      const line1Data = etusLines[line1Code];
      if (!line1Data) continue;

      line1Data.directions.forEach((dir1, dir1Idx) => {
        const idxA = dir1.stopIds.indexOf(sStop.id);
        if (idxA === -1) return;

        // Bu hattın güzergahındaki sonraki durakları aktarma noktası olarak tara
        for (let tIdx = idxA + 1; tIdx < dir1.stopIds.length; tIdx++) {
          const tStopId = dir1.stopIds[tIdx];
          const tStop = allStopsDB[tStopId];
          if (!tStop) continue;

          for (const line2Code of (tStop.routes || [])) {
            if (line1Code === line2Code) continue;

            const endMatches = linesToEnd[line2Code];
            if (!endMatches) continue;

            for (const match of endMatches) {
               const dir2 = etusLines[line2Code].directions[match.dirIdx];
               const idxT = dir2.stopIds.indexOf(tStopId);
               
               if (idxT !== -1 && idxT < match.idxB) {
                  const leg1Stops = tIdx - idxA;
                  const leg2Stops = match.idxB - idxT;
                  const leg1Time = leg1Stops * 1.5;
                  const leg2Time = leg2Stops * 1.5;
                  const transferWaitTime = 12; // Aktarma bekleme süresi cezası
                  const walkStart = Math.ceil(sStop.distanceKm * 12);
                  const walkEnd = Math.ceil(match.walkEnd * 12);
                  const totalTime = walkStart + leg1Time + transferWaitTime + leg2Time + walkEnd;

                  const passedStops = [];
                  const passedStopCoords = [];
                  // 1. bacak
                  dir1.stopIds.slice(idxA + 1, tIdx).forEach(id => {
                    const s = allStopsDB[id];
                    if (s) { passedStops.push(s.name); if (s.lat && s.lon) passedStopCoords.push([s.lat, s.lon, s.name]); }
                  });
                  
                  // Aktarma İşareti
                  passedStops.push('>>>TRANSFER<<<');
                  
                  // 2. bacak (aktarma noktası hariç, zaten eklenebilir ama atlıyoruz)
                  dir2.stopIds.slice(idxT + 1, match.idxB).forEach(id => {
                    const s = allStopsDB[id];
                    if (s) { passedStops.push(s.name); if (s.lat && s.lon) passedStopCoords.push([s.lat, s.lon, s.name]); }
                  });

                  transferRoutes.push({
                    id: `T_${line1Code}_${line2Code}_${sStop.id}_${match.eStop.id}`,
                    isTransfer: true,
                    name: `${line1Code} ➔ ${line2Code}`,
                    line1: line1Code,
                    line2: line2Code,
                    color: line1Data.color || '#4f46e5',
                    color2: etusLines[line2Code]?.color || '#f59e0b',
                    busTimeMins: Math.ceil(leg1Time + leg2Time + transferWaitTime),
                    totalTime: Math.ceil(totalTime),
                    startStop: sStop,
                    transferStop: tStop,
                    endStop: match.eStop,
                    routeGeometry: [], // fallback
                    routeGeometry1: slicePath(dir1.path, sStop, tStop),
                    routeGeometry2: slicePath(dir2.path, tStop, match.eStop),
                    walkDistanceStart: sStop.distanceKm,
                    walkDistanceEnd: match.walkEnd,
                    passedStops: passedStops,
                    passedStopCoords: passedStopCoords
                  });
               }
            }
          }
        }
      });
    }
  }

  // Bütün rotaları birleştir
  const allRoutes = [...possibleRoutes, ...transferRoutes];

  if (allRoutes.length === 0) return null;

  // Toplam süreye (yürüme + otobüs + bekleme) göre en hızlıdan yavaşa sırala
  allRoutes.sort((a, b) => a.totalTime - b.totalTime);

  // Aynı hat kombinasyonlarını eleyerek sadece en iyi varyasyonları tut
  const uniqueLines = [];
  const lineCodesSeen = new Set();
  
  for (const pr of allRoutes) {
    if (!lineCodesSeen.has(pr.name)) {
      uniqueLines.push(pr);
      lineCodesSeen.add(pr.name);
    }
  }

  // Sadece en mantıklı ilk 5 rotayı al
  const topRoutes = uniqueLines.slice(0, 5);

  const bestRoute = uniqueLines[0];

  return {
    startStop: topRoutes[0].startStop,
    endStop: topRoutes[0].endStop,
    routes: topRoutes,
    walkDistanceStart: bestRoute.walkDistanceStart,
    walkDistanceEnd: bestRoute.walkDistanceEnd,
    busTimeMins: bestRoute.busTimeMins,
    totalTime: bestRoute.totalTime,
    routeGeometry: bestRoute.routeGeometry
  };
};
