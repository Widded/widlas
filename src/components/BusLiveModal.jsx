import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Bus,
  MapPin,
  RefreshCw,
  LocateFixed,
  ChevronLeft,
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

  const loadLive = useCallback(async (code, pos, { dirIdx = null, autoDir = false, silent } = {}) => {
    if (!pos) return;
    const line = etusLines[code];
    if (!line) return;

    if (!silent) setStatus('loading');
    setError('');

    const computeDirection = async (idx) => {
      const nearest = nearestForDir(line, idx, pos);
      if (!nearest) return null;

      const dirData = line.directions?.[idx];
      const path = dirData?.path || [];
      const metrics = buildPathMetrics(path);
      const stopProj = metrics
        ? projectPoint(path, metrics.cum, nearest.stop.lat, nearest.stop.lon)
        : null;

      const busList = await getLineBuses({ code, direction: idx });
      const stopCount = Math.max(1, (dirData?.stopIds?.length || 2) - 1);
      const avgStopSpacing = metrics ? metrics.total / stopCount : 350;

      const buses = busList
        .map((b) => {
          const lat = Number(b.lat);
          const lon = Number(b.lng);
          let eta = null;
          let stopsLeft = null;

          if (metrics && stopProj && Number.isFinite(lat) && Number.isFinite(lon)) {
            const busProj = projectPoint(path, metrics.cum, lat, lon);
            const remaining = stopProj.along - busProj.along;
            // otobüs durağa yaklaşıyorsa (çok yakınsa 1 dk)
            if (remaining > -120) {
              eta = Math.max(1, Math.ceil(Math.max(60, remaining) / 280));
              stopsLeft = Math.max(1, Math.round(Math.max(0, remaining) / Math.max(120, avgStopSpacing)));
            }
          }

          return { ...b, lat, lon, eta, stopsLeft };
        })
        .filter((b) => b.eta !== null)
        .sort((a, b) => a.eta - b.eta);

      return { dirIdx: idx, nearest, buses };
    };

    try {
      let result = null;

      if (autoDir) {
        const candidates = (await Promise.all(
          (line.directions || []).map((_, idx) => computeDirection(idx))
        )).filter(Boolean);

        const withBuses = candidates.filter((c) => c.buses.length > 0);
        const pool = withBuses.length ? withBuses : candidates;
        pool.sort((a, b) => {
          if (a.buses.length && b.buses.length) return a.buses[0].eta - b.buses[0].eta;
          if (a.buses.length) return -1;
          if (b.buses.length) return 1;
          return a.nearest.distance - b.nearest.distance;
        });
        result = pool[0] || null;
      } else {
        result = await computeDirection(dirIdx ?? 0);
      }

      if (!result) throw new Error('no-stop');

      setActiveDir(result.dirIdx);
      setLive({ stop: result.nearest.stop, distance: result.nearest.distance, buses: result.buses });
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
  }, [nearestForDir]);

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
          loadLive(selectedCode, p, { autoDir: true });
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
  }, [selectedCode, loadLive]);

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
    loadLive(selectedCode, position, { autoDir: true });
  }, [isOpen, selectedCode, position, loadLive]);

  // 20 saniyede bir otomatik yenile
  useEffect(() => {
    if (!isOpen || !selectedCode || !position) return undefined;
    const timer = setInterval(() => {
      loadLive(selectedCode, position, { dirIdx: activeDir, silent: true });
    }, 20000);
    return () => clearInterval(timer);
  }, [isOpen, selectedCode, activeDir, position, loadLive]);

  const handleChangeLine = () => {
    setSelectedCode(null);
    setLive(null);
    setStatus(position ? 'idle' : 'locating');
  };

  const handleDir = (idx) => {
    if (idx === activeDir) return;
    setActiveDir(idx);
    if (position) loadLive(selectedCode, position, { dirIdx: idx });
  };

  if (!isOpen) return null;

  const line = selectedCode ? etusLines[selectedCode] : null;
  const color = line ? getLineColor(line.code, line.color) : '#94A3B8';
  const dirs = line?.directions || [];
  const activeDirData = dirs[activeDir];

  const filteredLines = lines.filter((l) => {
    const q = query.trim().toLocaleLowerCase('tr');
    if (!q) return true;
    return String(l.code).toLocaleLowerCase('tr').includes(q) ||
      (l.directions || []).some((d) => (d.headSign || '').toLocaleLowerCase('tr').includes(q));
  });

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

            {dirs.length > 1 && (
              <div className="bus-live-dirs" role="tablist" aria-label="Yön">
                {dirs.map((d, idx) => (
                  <button
                    key={`d_${idx}`}
                    type="button"
                    role="tab"
                    aria-selected={activeDir === idx}
                    className={`bus-live-dir ${activeDir === idx ? 'active' : ''}`}
                    onClick={() => handleDir(idx)}
                    title={d.headSign}
                  >
                    {d.headSign}
                  </button>
                ))}
              </div>
            )}

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
                <div className="bus-live-stop" style={{ '--line-color': color }}>
                  <span className="bus-live-stop-icon"><MapPin size={14} /></span>
                  <span className="bus-live-stop-text">
                    <b>{live.stop.name}</b>
                    <small>Size {fmtDistance(live.distance)} uzaklıkta · en yakın durak</small>
                  </span>
                </div>

                {live.buses.length === 0 ? (
                  <div className="bus-live-empty">
                    <Bus size={22} />
                    <p>Şu an bu hatta yaklaşan otobüs görünmüyor.</p>
                    <small>Birkaç dakika sonra tekrar dene.</small>
                  </div>
                ) : (
                  <div className="bus-live-result" style={{ '--line-color': color }}>
                    <div className="bus-live-eta-main">
                      <span className="bus-live-eta">{live.buses[0].eta}</span>
                      <span className="bus-live-eta-unit">dk</span>
                      <span className="bus-live-eta-sub">
                        {live.buses[0].stopsLeft ? `${live.buses[0].stopsLeft} durak kaldı` : 'yaklaşıyor'}
                      </span>
                    </div>

                    <div className="bus-live-bus-meta">
                      <span>{live.buses[0].plateNumber || live.buses[0].plate || 'ETUS'}</span>
                      <span className="bus-live-dot-sep" />
                      <span>{live.buses[0].headSign || activeDirData?.headSign}</span>
                    </div>

                    {live.buses.length > 1 && (
                      <div className="bus-live-next">
                        <span className="bus-live-next-title">Sonraki otobüsler</span>
                        {live.buses.slice(1, 4).map((b, i) => (
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
                onClick={() => position && loadLive(selectedCode, position, { dirIdx: activeDir })}
                disabled={status === 'loading'}
              >
                <RefreshCw size={14} className={status === 'loading' ? 'bus-live-spin' : ''} />
                Yenile
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
