import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Bus,
  MapPin,
  RefreshCw,
  LocateFixed,
  ChevronLeft,
  ChevronRight,
  Radio
} from 'lucide-react';
import { etusLines, allStopsDB } from '../data/db';
import { getLineColor } from '../lib/lineColors';
import { getLineBuses } from '../services/kentkart';
import './bus-live.css';

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const fmtDistance = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);

const SPEED_M_PER_MIN = 280;
const LAYOVER_MIN = 6;
const TURNAROUND_MIN = 5;

const buildPathMetrics = (path) => {
  if (!Array.isArray(path) || path.length < 2) return null;
  const cum = [0];
  for (let i = 1; i < path.length; i += 1) {
    cum[i] = cum[i - 1] + haversine(path[i - 1][0], path[i - 1][1], path[i][0], path[i][1]);
  }
  return { cum, total: cum[cum.length - 1] };
};

const projectPoint = (path, cum, lat, lon) => {
  let best = Infinity;
  let bestIdx = 0;
  for (let i = 0; i < path.length; i += 1) {
    const d = haversine(lat, lon, path[i][0], path[i][1]);
    if (d < best) {
      best = d;
      bestIdx = i;
    }
  }
  return { index: bestIdx, along: cum[bestIdx], offset: best };
};

const fmtTime = (ts) => {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const lineSort = (a, b) => {
  const na = parseInt(a.code) || Number.POSITIVE_INFINITY;
  const nb = parseInt(b.code) || Number.POSITIVE_INFINITY;
  return na - nb || a.code.localeCompare(b.code, 'tr');
};

export default function BusLiveModal({ isOpen, onClose, userLocation, initialLineCode = null }) {
  const [selectedCode, setSelectedCode] = useState(null);
  const [activeDir, setActiveDir] = useState(0);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('idle'); // idle | locating | loading | ready | error
  const [error, setError] = useState('');
  const [position, setPosition] = useState(
    userLocation?.lat && userLocation?.lon ? { lat: userLocation.lat, lon: userLocation.lon } : null
  );
  const [live, setLive] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [chosenStopId, setChosenStopId] = useState(null);
  const [stopPickerOpen, setStopPickerOpen] = useState(false);
  const [stopQuery, setStopQuery] = useState('');

  const lines = useMemo(
    () => Object.values(etusLines).sort(lineSort),
    []
  );

  useEffect(() => {
    if (userLocation?.lat && userLocation?.lon) {
      // oxlint-disable-next-line react/set-state-in-effect
      setPosition({ lat: userLocation.lat, lon: userLocation.lon });
    }
  }, [userLocation?.lat, userLocation?.lon]);

  useEffect(() => {
    if (!isOpen) {
      // oxlint-disable-next-line react/set-state-in-effect
      setSelectedCode(null);
      setActiveDir(0);
      setStatus('idle');
      setError('');
      setLive(null);
      setUpdatedAt(null);
      setQuery('');
      setChosenStopId(null);
      setStopPickerOpen(false);
      setStopQuery('');
    } else if (initialLineCode) {
      setSelectedCode(initialLineCode);
    }
  }, [isOpen, initialLineCode]);

  const nearestForDir = useCallback((line, dirIdx, pos) => {
    const dir = line?.directions?.[dirIdx];
    if (!dir || !pos) return null;
    let best = null;
    (dir.stopIds || []).forEach((sid) => {
      const stop = allStopsDB[sid];
      if (!stop || !Number.isFinite(stop.lat) || !Number.isFinite(stop.lon)) return;
      const distance = haversine(pos.lat, pos.lon, stop.lat, stop.lon);
      if (!best || distance < best.distance) best = { stop, distance };
    });
    return best;
  }, []);

  const normalizeName = (value) => String(value || '').toLocaleLowerCase('tr').trim();

  // Seçili durak varsa onu, yoksa konuma en yakın durağı döndürür.
  // Karşı yönün durak kimliği farklı olabileceği için isim eşleşmesi de denenir.
  const stopForDirection = useCallback((line, dirIdx, pos, stopId) => {
    const dir = line?.directions?.[dirIdx];
    if (!dir) return null;

    if (stopId) {
      const base = allStopsDB[stopId];
      if (!base) return null;
      const ids = dir.stopIds || [];
      let sid = ids.includes(stopId) ? stopId : null;
      if (!sid) {
        const target = normalizeName(base.name);
        sid = ids.find((x) => normalizeName(allStopsDB[x]?.name) === target) || null;
      }
      if (!sid) return null;
      const stop = allStopsDB[sid];
      const distance = pos ? haversine(pos.lat, pos.lon, stop.lat, stop.lon) : null;
      return { stop, distance, picked: true };
    }

    return nearestForDir(line, dirIdx, pos);
  }, [nearestForDir]);

  const loadLive = useCallback(async (code, pos, { silent, stopId = null, pickBest = false } = {}) => {
    if (!pos) return;
    const line = etusLines[code];
    if (!line) return;

    if (!silent) setStatus('loading');
    setError('');

    const computeDirection = async (idx) => {
      const target = stopForDirection(line, idx, pos, stopId);
      if (!target) return null;

      const dirData = line.directions?.[idx];
      const path = dirData?.path || [];
      const metrics = buildPathMetrics(path);
      const stopProj = metrics
        ? projectPoint(path, metrics.cum, target.stop.lat, target.stop.lon)
        : null;

      const busList = await getLineBuses({ code, direction: idx });
      const stopCount = Math.max(1, (dirData?.stopIds?.length || 2) - 1);
      const avgStopSpacing = metrics ? metrics.total / stopCount : 350;

      const dirStopIds = dirData?.stopIds || [];
      const stopIdx = dirStopIds.findIndex((sid) =>
        sid === target.stop.id ||
        normalizeName(allStopsDB[sid]?.name) === normalizeName(target.stop.name)
      );
      const isOrigin = stopIdx === 0;
      const isTerminus = stopIdx >= 0 && stopIdx === dirStopIds.length - 1;

      const buses = [];
      const projected = [];
      busList.forEach((b) => {
        const lat = Number(b.lat);
        const lon = Number(b.lng);
        if (!metrics || !stopProj || !Number.isFinite(lat) || !Number.isFinite(lon)) return;

        const busProj = projectPoint(path, metrics.cum, lat, lon);
        const remaining = stopProj.along - busProj.along;
        projected.push({ remaining });

        // otobüs durağa yaklaşıyorsa (çok yakınsa 1 dk)
        if (remaining > -120) {
          buses.push({
            ...b,
            lat,
            lon,
            eta: Math.max(1, Math.ceil(Math.max(60, remaining) / SPEED_M_PER_MIN)),
            stopsLeft: Math.max(1, Math.round(Math.max(0, remaining) / Math.max(120, avgStopSpacing)))
          });
        }
      });
      buses.sort((a, b) => a.eta - b.eta);

      // Durağı geçmiş otobüsler: bir sonraki seferin tahmininde kullanılır.
      const passedMinutes = projected
        .filter((p) => p.remaining <= -120)
        .map((p) => -p.remaining / SPEED_M_PER_MIN);
      const lastPassedMinAgo = passedMinutes.length ? Math.min(...passedMinutes) : null;

      return {
        dirIdx: idx,
        stop: target.stop,
        distance: target.distance,
        buses,
        busesOnRoute: busList.length,
        pathMinutes: metrics ? metrics.total / SPEED_M_PER_MIN : null,
        lastPassedMinAgo,
        isOrigin,
        isTerminus
      };
    };

    try {
      // Her iki yönü de hesapla; böylece tek yön gizlenmez.
      const rawDirections = (await Promise.all(
        (line.directions || []).map((_, idx) => computeDirection(idx))
      )).filter(Boolean);

      if (!rawDirections.length) throw new Error('no-stop');

      // Canlı araç yoksa sefer aralığından tahmini süre üret.
      // Ortalama sefer aralığı ≈ (gidiş-dönüş süresi + son durak beklemesi) / hattaki araç sayısı
      const fleetCount = rawDirections.reduce((n, d) => n + d.busesOnRoute, 0);
      const maxPathMinutes = Math.max(0, ...rawDirections.map((d) => d.pathMinutes || 0));
      const fleetHeadway = fleetCount > 0 && maxPathMinutes > 0
        ? (2 * maxPathMinutes + LAYOVER_MIN) / fleetCount
        : null;

      const directions = rawDirections.map((d) => {
        if (d.buses.length) {
          return { ...d, estimate: null, headway: null, estimateReason: null };
        }

        const opposite = rawDirections.find((x) => x.dirIdx !== d.dirIdx);

        // Terminaldeyiz: karşı yönden terminale yaklaşan otobüs, bu yönde
        // kısa bir beklemeden sonra geri dönecek.
        if (d.isOrigin && opposite?.buses?.length) {
          const arriving = Math.min(...opposite.buses.map((b) => b.eta));
          return {
            ...d,
            estimate: Math.max(1, Math.round(arriving + TURNAROUND_MIN)),
            headway: null,
            estimateReason: 'terminal'
          };
        }

        if (!fleetHeadway) {
          return { ...d, estimate: null, headway: null, estimateReason: null };
        }

        // Çok seyrek/tek araçlı durumlarda "~60 dk" gibi güvenilmez
        // tahminler göstermemek için üst sınırı aşanları gizle.
        const headway = Math.min(60, Math.max(8, fleetHeadway));
        if (headway > 45) {
          return { ...d, estimate: null, headway: Math.round(headway), estimateReason: null };
        }

        // Son geçişten bu yana geçen süreyi sefer aralığına göre fazlandır.
        let estimate = Math.round(headway);
        if (d.lastPassedMinAgo != null) {
          const phase = d.lastPassedMinAgo % headway;
          estimate = Math.max(1, Math.round(headway - phase));
        }

        return {
          ...d,
          headway: Math.round(headway),
          estimate,
          estimateReason: 'headway'
        };
      });

      const best = directions.slice().sort((a, b) => {
        if (a.buses.length && !b.buses.length) return -1;
        if (!a.buses.length && b.buses.length) return 1;
        if (a.buses.length && b.buses.length) return a.buses[0].eta - b.buses[0].eta;
        const ea = a.estimate ?? Number.POSITIVE_INFINITY;
        const eb = b.estimate ?? Number.POSITIVE_INFINITY;
        return ea - eb || a.distance - b.distance;
      })[0];

      setLive({ directions, bestDirIdx: best.dirIdx });

      // Yön seçimi: yeni durak/hat için en iyi yönü seç, otomatik yenilemede seçimi koru.
      setActiveDir((prev) => {
        if (pickBest) return best.dirIdx;
        return directions.some((d) => d.dirIdx === prev) ? prev : best.dirIdx;
      });

      setUpdatedAt(Date.now());
      setStatus('ready');
    } catch (e) {
      setStatus('error');
      setError(
        e?.message === 'signer-unavailable'
          ? 'Canlı veri motoru yüklenemedi. Sayfayı yenileyip tekrar dene.'
          : 'Canlı veri alınamadı. Lütfen tekrar dene.'
      );
    }
  }, [stopForDirection]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Bu cihaz/ tarayıcı konum desteklemiyor.');
      return;
    }
    setStatus('locating');
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setPosition(p);
        if (selectedCode) {
          loadLive(selectedCode, p, { stopId: chosenStopId, pickBest: true });
        } else {
          setStatus('idle');
        }
      },
      () => {
        setStatus('error');
        setError('Konum alınamadı. Tarayıcıdan konum izni verip tekrar dene.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }, [selectedCode, loadLive, chosenStopId]);

  // Modal açıldığında konum yoksa iste
  useEffect(() => {
    if (isOpen && !position) {
      // oxlint-disable-next-line react/set-state-in-effect
      requestLocation();
    }
  }, [isOpen, position, requestLocation]);

  // Seçim yapıldığında konum varsa yükle (uygun yön otomatik seçilir)
  useEffect(() => {
    if (!isOpen || !selectedCode || !position) return;
    const line = etusLines[selectedCode];
    if (!line) return;
    // oxlint-disable-next-line react/set-state-in-effect
    loadLive(selectedCode, position, { stopId: chosenStopId, pickBest: true });
  }, [isOpen, selectedCode, position, chosenStopId, loadLive]);

  // 20 saniyede bir otomatik yenile (seçili yönü korur)
  useEffect(() => {
    if (!isOpen || !selectedCode || !position) return undefined;
    const timer = setInterval(() => {
      loadLive(selectedCode, position, { silent: true, stopId: chosenStopId });
    }, 20000);
    return () => clearInterval(timer);
  }, [isOpen, selectedCode, position, chosenStopId, loadLive]);

  const handleChangeLine = () => {
    setSelectedCode(null);
    setLive(null);
    setChosenStopId(null);
    setStopPickerOpen(false);
    setStopQuery('');
    setStatus(position ? 'idle' : 'locating');
  };

  const handleDir = (idx) => {
    setActiveDir(idx);
  };

  const handlePickStop = (id) => {
    setChosenStopId(id);
    setStopPickerOpen(false);
    setStopQuery('');
    if (position) loadLive(selectedCode, position, { stopId: id, pickBest: true });
  };

  if (!isOpen) return null;

  const line = selectedCode ? etusLines[selectedCode] : null;
  const color = line ? getLineColor(line.code, line.color) : '#94A3B8';
  const dirs = line?.directions || [];
  const activeDirData = dirs[activeDir];
  const liveDirections = live?.directions || [];
  const activeResult = liveDirections.find((d) => d.dirIdx === activeDir) || liveDirections[0] || null;
  const activeBuses = activeResult?.buses || [];

  const destOf = (headSign) => {
    const parts = String(headSign || '').split(' - ');
    return parts.length > 1 ? parts[parts.length - 1] : (headSign || '');
  };

  const filteredLines = lines.filter((l) => {
    const q = query.trim().toLocaleLowerCase('tr');
    if (!q) return true;
    return String(l.code).toLocaleLowerCase('tr').includes(q) ||
      (l.directions || []).some((d) => (d.headSign || '').toLocaleLowerCase('tr').includes(q));
  });

  const stopOptions = (() => {
    const ids = activeDirData?.stopIds || [];
    const q = normalizeName(stopQuery);
    return ids
      .map((sid) => {
        const stop = allStopsDB[sid];
        if (!stop) return null;
        const distance = position
          ? haversine(position.lat, position.lon, stop.lat, stop.lon)
          : null;
        return { id: sid, name: stop.name, distance };
      })
      .filter(Boolean)
      .filter((s) => !q || normalizeName(s.name).includes(q));
  })();

  return (
    <div className="bus-live-backdrop" onClick={onClose}>
      <div className="bus-live-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-grabber-box">
          <div className="search-modal-grabber" />
        </div>

        <div className="bus-live-header">
          <div className="bus-live-heading">
            <span className="bus-live-eyebrow">Kentkart · canlı</span>
            <h2 className="bus-live-title">Otobüs Nerede?</h2>
          </div>
          <button className="search-modal-close-btn" onClick={onClose} aria-label="Kapat" title="Kapat">
            <X size={17} />
          </button>
        </div>

        {!selectedCode ? (
          <>
            <div className="bus-live-search">
              <input
                type="text"
                placeholder="Hat ara (1A, 3, 7E…)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Hat ara"
              />
            </div>

            <div className="bus-live-line-grid">
              {filteredLines.map((l) => {
                const c = getLineColor(l.code, l.color);
                return (
                  <button
                    key={l.code}
                    type="button"
                    className="bus-live-line-chip"
                    style={{ '--line-color': c }}
                    onClick={() => setSelectedCode(l.code)}
                  >
                    <span className="bus-live-line-code">{l.code}</span>
                    <span className="bus-live-line-name">{l.directions?.[0]?.headSign || ''}</span>
                  </button>
                );
              })}
            </div>

            <p className="bus-live-footnote">
              <Radio size={12} /> Canlı veri resmi Kentkart sisteminden alınır.
            </p>
          </>
        ) : (
          <>
            <div className="bus-live-selected" style={{ '--line-color': color }}>
              <button type="button" className="bus-live-back" onClick={handleChangeLine} aria-label="Hat değiştir">
                <ChevronLeft size={18} />
              </button>
              <span className="bus-live-selected-code">{line.code}</span>
              <span className="bus-live-selected-name">{activeDirData?.headSign || ''}</span>
              <span className="bus-live-live-dot" />
            </div>

            {status === 'locating' && (
              <div className="bus-live-state">
                <LocateFixed size={22} className="bus-live-spin" />
                <p>Konum alınıyor…</p>
              </div>
            )}

            {status === 'error' && (
              <div className="bus-live-state">
                <p>{error}</p>
                <button type="button" className="bus-live-retry" onClick={requestLocation}>
                  Konumu al
                </button>
              </div>
            )}

            {(status === 'loading' || status === 'ready') && live && (
              <>
                <button
                  type="button"
                  className="bus-live-stop"
                  style={{ '--line-color': color }}
                  onClick={() => {
                    setStopPickerOpen(true);
                    setStopQuery('');
                  }}
                  title="Durak seç"
                >
                  <span className="bus-live-stop-icon"><MapPin size={14} /></span>
                  <span className="bus-live-stop-text">
                    <b>{activeResult?.stop?.name}</b>
                    <small>
                      Size {fmtDistance(activeResult?.distance)} uzaklıkta ·{' '}
                      {chosenStopId ? 'seçili durak' : 'en yakın durak'}
                    </small>
                  </span>
                  <ChevronRight size={16} className="bus-live-stop-chev" />
                </button>

                {liveDirections.length > 1 && (
                  <div className="bus-live-dirs" role="tablist" aria-label="Yön seçimi">
                    <span className="bus-live-dirs-label">Yön</span>
                    {liveDirections.map((d) => {
                      const dirData = dirs[d.dirIdx];
                      const isActive = activeResult?.dirIdx === d.dirIdx;
                      const first = d.buses[0];
                      const estimate = first ? null : d.estimate;
                      return (
                        <button
                          key={`dir_${d.dirIdx}`}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          className={`bus-live-dir ${isActive ? 'active' : ''}`}
                          onClick={() => handleDir(d.dirIdx)}
                          title={dirData?.headSign}
                        >
                          <span className="bus-live-dir-dest">
                            <span className="bus-live-dir-arrow">→</span>
                            {destOf(dirData?.headSign)}
                          </span>
                          <span className={`bus-live-dir-eta ${first ? '' : estimate ? 'estimate' : 'none'}`}>
                            {first ? `${first.eta} dk` : estimate ? `~${estimate} dk` : 'yaklaşan yok'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {activeBuses.length === 0 && activeResult?.estimate ? (
                  <div className="bus-live-result bus-live-result--estimate" style={{ '--line-color': color }}>
                    <div className="bus-live-eta-main">
                      <span className="bus-live-eta">~{activeResult.estimate}</span>
                      <span className="bus-live-eta-unit">dk</span>
                      <span className="bus-live-eta-sub">tahmini</span>
                    </div>

                    <div className="bus-live-bus-meta">
                      <span>Canlı araç görünmüyor</span>
                      <span className="bus-live-dot-sep" />
                      <span>
                        {activeResult?.estimateReason === 'terminal'
                          ? 'Terminal dönüşü tahmini'
                          : 'Sefer aralığına göre tahmin'}
                      </span>
                    </div>

                    <p className="bus-live-estimate-note">
                      {activeResult?.estimateReason === 'terminal'
                        ? 'Karşı yönden gelen otobüsün terminale varıp geri dönmesi bekleniyor.'
                        : 'Tahmini süre; hattaki canlı araç sayısı ve güzergah uzunluğundan hesaplanır.'}
                    </p>
                  </div>
                ) : activeBuses.length === 0 ? (
                  <div className="bus-live-empty">
                    <Bus size={22} />
                    <p>Bu yönde durağa yaklaşan canlı araç yok.</p>
                    <small>Diğer yönü seçebilir veya başka bir durak deneyebilirsin.</small>
                    <button
                      type="button"
                      className="bus-live-empty-btn"
                      onClick={() => {
                        setStopPickerOpen(true);
                        setStopQuery('');
                      }}
                    >
                      Durak seç
                    </button>
                  </div>
                ) : (
                  <div className="bus-live-result" style={{ '--line-color': color }}>
                    <div className="bus-live-eta-main">
                      <span className="bus-live-eta">{activeBuses[0].eta}</span>
                      <span className="bus-live-eta-unit">dk</span>
                      <span className="bus-live-eta-sub">
                        {activeBuses[0].stopsLeft ? `${activeBuses[0].stopsLeft} durak kaldı` : 'yaklaşıyor'}
                      </span>
                    </div>

                    <div className="bus-live-bus-meta">
                      <span>{activeBuses[0].plateNumber || activeBuses[0].plate || 'ETUS'}</span>
                      <span className="bus-live-dot-sep" />
                      <span>{activeBuses[0].headSign || activeDirData?.headSign}</span>
                    </div>

                    {activeBuses.length > 1 && (
                      <div className="bus-live-next">
                        <span className="bus-live-next-title">Sonraki otobüsler</span>
                        {activeBuses.slice(1, 4).map((b, i) => (
                          <div className="bus-live-next-row" key={`${b.busId}_${i}`}>
                            <span>{b.plateNumber || b.plate || 'ETUS'}</span>
                            <span>{b.eta} dk</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {status === 'loading' && !live && (
              <div className="bus-live-state">
                <RefreshCw size={20} className="bus-live-spin" />
                <p>Otobüs konumları alınıyor…</p>
              </div>
            )}

            <div className="bus-live-footer">
              <span>Son güncelleme: {fmtTime(updatedAt)}</span>
              <button
                type="button"
                className="bus-live-refresh"
                onClick={() => position && loadLive(selectedCode, position, { stopId: chosenStopId })}
                disabled={status === 'loading'}
              >
                <RefreshCw size={14} className={status === 'loading' ? 'bus-live-spin' : ''} />
                Yenile
              </button>
            </div>
          </>
        )}

        {selectedCode && stopPickerOpen && (
          <div className="bus-live-picker">
            <div className="bus-live-picker-head">
              <span>Durak seç</span>
              <button
                type="button"
                className="bus-live-picker-close"
                onClick={() => setStopPickerOpen(false)}
                aria-label="Kapat"
              >
                <X size={16} />
              </button>
            </div>

            <div className="bus-live-picker-search">
              <input
                type="text"
                placeholder="Durak ara…"
                value={stopQuery}
                onChange={(e) => setStopQuery(e.target.value)}
                aria-label="Durak ara"
              />
            </div>

            <div className="bus-live-picker-list">
              <button
                type="button"
                className={`bus-live-picker-row ${!chosenStopId ? 'active' : ''}`}
                onClick={() => handlePickStop(null)}
              >
                <LocateFixed size={15} className="bus-live-picker-locate" />
                <span className="bus-live-picker-name">Konumuma en yakın durak</span>
              </button>

              {stopOptions.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className={`bus-live-picker-row ${chosenStopId === s.id ? 'active' : ''}`}
                  onClick={() => handlePickStop(s.id)}
                >
                  <span className="bus-live-picker-order">{i + 1}</span>
                  <span className="bus-live-picker-name">{s.name}</span>
                  {s.distance != null && <small>{fmtDistance(s.distance)}</small>}
                </button>
              ))}

              {stopOptions.length === 0 && (
                <p className="bus-live-picker-empty">Durak bulunamadı.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
