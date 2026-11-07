import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Bus,
  MapPin,
  RefreshCw,
  LocateFixed,
  ChevronRight,
  Radio
} from 'lucide-react';
import { etusLines, allStopsDB } from '../data/db';
import { getLineColor } from '../lib/lineColors';
import { getNearestBus } from '../services/kentkart';
import './bus-live.css';
import './stop-live.css';

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const fmtDistance = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);

const fmtTime = (ts) => {
  if (!ts) return '—';
  return new Date(ts).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

const normalize = (value) => String(value || '').toLocaleLowerCase('tr').trim();

const destOf = (headSign) => {
  const parts = String(headSign || '').split(' - ');
  return parts.length > 1 ? parts[parts.length - 1] : (headSign || '');
};

const distanceTo = (position, stop) => {
  if (!position || !stop) return null;
  return haversine(position.lat, position.lon, stop.lat, stop.lon);
};

// nearest/bus bazen routeList döndürmeyebilir; o durumda db'den kur.
const fallbackRoutes = (stop) => {
  const rows = [];
  (stop.routes || []).forEach((code) => {
    const line = etusLines[code];
    if (!line) return;
    (line.directions || []).forEach((dir, idx) => {
      const ids = dir.stopIds || [];
      const hasStop = ids.includes(stop.id) ||
        ids.some((sid) => normalize(allStopsDB[sid]?.name) === normalize(stop.name));
      if (hasStop) {
        rows.push({
          displayRouteCode: code,
          direction: String(idx),
          headSign: dir.headSign,
          routeColor: line.color
        });
      }
    });
  });
  return rows;
};

export default function StopLiveModal({ isOpen, onClose, userLocation }) {
  const [position, setPosition] = useState(
    userLocation?.lat && userLocation?.lon ? { lat: userLocation.lat, lon: userLocation.lon } : null
  );
  const [stopId, setStopId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | locating | loading | ready | error
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [stopQuery, setStopQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const stops = useMemo(
    () => Object.values(allStopsDB).filter((s) => Number.isFinite(s.lat) && Number.isFinite(s.lon)),
    []
  );

  useEffect(() => {
    if (userLocation?.lat && userLocation?.lon) {
      // oxlint-disable-next-line react/set-state-in-effect
      setPosition({ lat: userLocation.lat, lon: userLocation.lon });
    }
  }, [userLocation?.lat, userLocation?.lon]);

  const nearestStop = useCallback((pos) => {
    if (!pos) return null;
    let best = null;
    stops.forEach((stop) => {
      const distance = distanceTo(pos, stop);
      if (!best || distance < best.distance) best = { stop, distance };
    });
    return best;
  }, [stops]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setStatus('error');
      setError('Bu cihaz/tarayıcı konum desteklemiyor.');
      return;
    }
    setStatus('locating');
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => {
        setStatus('error');
        setError('Konum alınamadı. Tarayıcıdan konum izni verip tekrar dene.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }, []);

  const loadStop = useCallback(async (id, { silent } = {}) => {
    const stop = allStopsDB[id];
    if (!stop) return;

    if (!silent) {
      setStatus('loading');
      setData(null);
    }
    setError('');

    try {
      const json = await getNearestBus({
        stopId: stop.id,
        lat: stop.lat,
        lng: stop.lon
      });

      const buses = json.busList || [];
      const busMap = new Map();
      buses.forEach((bus) => {
        const key = `${bus.displayRouteCode}_${bus.direction}`;
        const eta = bus.timeDiff !== '' && Number.isFinite(Number(bus.timeDiff))
          ? Number(bus.timeDiff)
          : Number.POSITIVE_INFINITY;
        const previous = busMap.get(key);
        const previousEta = previous && previous.timeDiff !== '' && Number.isFinite(Number(previous.timeDiff))
          ? Number(previous.timeDiff)
          : Number.POSITIVE_INFINITY;
        if (!previous || eta < previousEta) busMap.set(key, bus);
      });

      const routeList = json.routeList && json.routeList.length
        ? json.routeList
        : fallbackRoutes(stop);

      const rows = routeList.map((route) => {
        const code = route.displayRouteCode;
        const direction = String(route.direction);
        const bus = busMap.get(`${code}_${direction}`) || null;
        const eta = bus && bus.timeDiff !== '' && Number.isFinite(Number(bus.timeDiff))
          ? Number(bus.timeDiff)
          : null;

        // Durak, bu yönün ilk/son durağı mı? (terminal davranışını netleştirir)
        const dir = etusLines[code]?.directions?.[Number(direction)];
        const ids = dir?.stopIds || [];
        let role = null;
        if (dir && ids.length) {
          const idx = ids.findIndex((sid) =>
            sid === stop.id || normalize(allStopsDB[sid]?.name) === normalize(stop.name)
          );
          if (idx === 0) role = 'origin';
          else if (idx === ids.length - 1) role = 'terminus';
        }

        return {
          key: `${code}_${direction}`,
          code,
          direction,
          headSign: route.headSign || dir?.headSign || '',
          bus,
          eta,
          role,
          color: getLineColor(code, etusLines[code]?.color)
        };
      });

      rows.sort((a, b) => {
        if (a.eta != null && b.eta != null) return a.eta - b.eta;
        if (a.eta != null) return -1;
        if (b.eta != null) return 1;
        return a.code.localeCompare(b.code, 'tr');
      });

      setData({ stop, rows });
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
  }, []);

  // Modal açıldığında / kapandığında durumu sıfırla
  useEffect(() => {
    if (!isOpen) {
      // oxlint-disable-next-line react/set-state-in-effect
      setStopId(null);
      setData(null);
      setUpdatedAt(null);
      setStatus('idle');
      setError('');
      setPickerOpen(false);
      setStopQuery('');
      setShowAll(false);
    }
  }, [isOpen]);

  // Konum yoksa iste; varsa en yakın durağı seç
  useEffect(() => {
    if (!isOpen) return;
    if (!position) {
      // oxlint-disable-next-line react/set-state-in-effect
      requestLocation();
      return;
    }
    if (!stopId) {
      const nearest = nearestStop(position);
      if (nearest) {
        // oxlint-disable-next-line react/set-state-in-effect
        setStopId(nearest.stop.id);
      }
    }
  }, [isOpen, position, stopId, nearestStop, requestLocation]);

  // Durak seçilince / konum değişince canlı veriyi yükle
  useEffect(() => {
    if (!isOpen || !stopId) return;
    // oxlint-disable-next-line react/set-state-in-effect
    loadStop(stopId);
  }, [isOpen, stopId, loadStop]);

  // 20 saniyede bir yenile
  useEffect(() => {
    if (!isOpen || !stopId) return undefined;
    const timer = setInterval(() => {
      loadStop(stopId, { silent: true });
    }, 20000);
    return () => clearInterval(timer);
  }, [isOpen, stopId, loadStop]);

  const pickNearest = () => {
    const nearest = nearestStop(position);
    if (!nearest) {
      requestLocation();
      return;
    }
    setStopId(nearest.stop.id);
    setPickerOpen(false);
    setStopQuery('');
    setShowAll(false);
  };

  const handlePickStop = (id) => {
    setStopId(id);
    setPickerOpen(false);
    setStopQuery('');
    setShowAll(false);
  };

  if (!isOpen) return null;

  const currentStop = stopId ? allStopsDB[stopId] : null;
  const currentDistance = distanceTo(position, currentStop);
  const nearest = position ? nearestStop(position) : null;

  const liveRows = data?.rows?.filter((row) => row.eta != null) || [];
  const otherRows = data?.rows?.filter((row) => row.eta == null) || [];
  const visibleOthers = showAll ? otherRows : otherRows.slice(0, 5);

  const filteredStops = (() => {
    const q = normalize(stopQuery);
    const seen = new Set();
    return stops
      .filter((stop) => !q || normalize(stop.name).includes(q) || normalize(stop.fullName).includes(q))
      .map((stop) => ({ stop, distance: distanceTo(position, stop) }))
      .sort((a, b) => {
        if (a.distance != null && b.distance != null) return a.distance - b.distance;
        if (a.distance != null) return -1;
        if (b.distance != null) return 1;
        return a.stop.name.localeCompare(b.stop.name, 'tr');
      })
      .filter(({ stop }) => {
        const key = normalize(stop.name);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  })();

  const renderRow = (row) => (
    <div
      key={row.key}
      className={`stop-live-row ${row.eta != null ? 'is-live' : ''}`}
      style={{ '--line-color': row.color }}
    >
      <span className="stop-live-code">{row.code}</span>
      <span className="stop-live-main">
        <span className="stop-live-dest">
          → {destOf(row.headSign)}
          {row.role === 'origin' && <span className="stop-live-tag">kalkış</span>}
          {row.role === 'terminus' && <span className="stop-live-tag">son durak</span>}
        </span>
        <span className="stop-live-sub">
          {row.bus
            ? [
                row.bus.stopDiff !== '' ? `${row.bus.stopDiff} durak` : null,
                row.bus.plate || 'ETUS'
              ].filter(Boolean).join(' · ')
            : 'yaklaşan yok'}
        </span>
      </span>
      <span className={`stop-live-eta ${row.eta != null ? '' : 'none'}`}>
        {row.eta != null ? (
          <>
            {row.eta}
            <small>dk</small>
          </>
        ) : '—'}
      </span>
    </div>
  );

  return (
    <div className="bus-live-backdrop" onClick={onClose}>
      <div className="bus-live-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-grabber-box">
          <div className="search-modal-grabber" />
        </div>

        <div className="bus-live-header">
          <div className="bus-live-heading">
            <span className="bus-live-eyebrow">Kentkart · canlı</span>
            <h2 className="bus-live-title">Durakta Ne Var?</h2>
          </div>
          <button className="search-modal-close-btn" onClick={onClose} aria-label="Kapat" title="Kapat">
            <X size={17} />
          </button>
        </div>

        <button
          type="button"
          className="bus-live-stop"
          style={{ '--line-color': '#94A3B8' }}
          onClick={() => {
            setPickerOpen(true);
            setStopQuery('');
          }}
          title="Durak seç"
        >
          <span className="bus-live-stop-icon"><MapPin size={14} /></span>
          <span className="bus-live-stop-text">
            <b>{currentStop?.name || 'Durak seç'}</b>
            <small>
              {currentDistance != null
                ? `Size ${fmtDistance(currentDistance)} uzaklıkta · durak değiştir`
                : 'Durak değiştir'}
            </small>
          </span>
          <ChevronRight size={16} className="bus-live-stop-chev" />
        </button>

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

        {(status === 'loading' || status === 'ready') && data && (
          <div className="stop-live-body">
            <div className="stop-live-section">
              <span className="stop-live-section-title">
                Yaklaşan otobüsler
                {liveRows.length > 0 && <span className="stop-live-count">{liveRows.length}</span>}
              </span>

              {liveRows.length === 0 ? (
                <div className="bus-live-empty">
                  <Bus size={22} />
                  <p>Şu an bu durağa yaklaşan canlı araç yok.</p>
                  <small>Birkaç dakika sonra tekrar dene.</small>
                </div>
              ) : (
                <div className="stop-live-list">
                  {liveRows.map(renderRow)}
                </div>
              )}
            </div>

            {otherRows.length > 0 && (
              <div className="stop-live-section">
                <span className="stop-live-section-title">
                  Duraktan geçen hatlar
                  <span className="stop-live-count muted">{otherRows.length}</span>
                </span>
                <div className="stop-live-list">
                  {visibleOthers.map(renderRow)}
                </div>
                {otherRows.length > 5 && (
                  <button
                    type="button"
                    className="stop-live-more"
                    onClick={() => setShowAll((v) => !v)}
                  >
                    {showAll ? 'Daha az göster' : `Tümünü göster (${otherRows.length})`}
                  </button>
                )}
              </div>
            )}

            <p className="stop-live-note">
              <Radio size={12} /> Süreler Kentkart canlı verisinden alınır. Yaklaşan araç yoksa “—” gösterilir.
            </p>
          </div>
        )}

        {status === 'loading' && !data && (
          <div className="bus-live-state">
            <RefreshCw size={20} className="bus-live-spin" />
            <p>Durak bilgisi alınıyor…</p>
          </div>
        )}

        <div className="bus-live-footer">
          <span>Son güncelleme: {fmtTime(updatedAt)}</span>
          <button
            type="button"
            className="bus-live-refresh"
            onClick={() => stopId && loadStop(stopId)}
            disabled={status === 'loading'}
          >
            <RefreshCw size={14} className={status === 'loading' ? 'bus-live-spin' : ''} />
            Yenile
          </button>
        </div>

        {pickerOpen && (
          <div className="bus-live-picker">
            <div className="bus-live-picker-head">
              <span>Durak seç</span>
              <button
                type="button"
                className="bus-live-picker-close"
                onClick={() => setPickerOpen(false)}
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
                className="bus-live-picker-row"
                onClick={pickNearest}
              >
                <LocateFixed size={15} className="bus-live-picker-locate" />
                <span className="bus-live-picker-name">Konumuma en yakın durak</span>
                {nearest && <small>{fmtDistance(nearest.distance)}</small>}
              </button>

              {filteredStops.map(({ stop, distance }) => (
                <button
                  key={stop.id}
                  type="button"
                  className={`bus-live-picker-row ${stopId === stop.id ? 'active' : ''}`}
                  onClick={() => handlePickStop(stop.id)}
                >
                  <span className="bus-live-picker-name">{stop.name}</span>
                  {distance != null && <small>{fmtDistance(distance)}</small>}
                </button>
              ))}

              {filteredStops.length === 0 && (
                <p className="bus-live-picker-empty">Durak bulunamadı.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
