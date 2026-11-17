import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Bus, Footprints, ChevronDown, Maximize2, RefreshCw } from 'lucide-react';
import RouteOptionCard from './RouteOptionCard';
import { fmtDuration, fmtDist } from '../lib/routeDisplay';
import './RouteResultSheet.css';

export default function RouteResultSheet({
  routes: incomingRoutes = [],
  selectedIdx = 0,
  onSelectIdx,
  toLocation,
  onMinimizedChange,
  onClose,
  onStartWalk,
  forceMinimized = false
}) {
  const routes = useMemo(() => {
    if (Array.isArray(incomingRoutes)) return incomingRoutes;
    if (incomingRoutes && Array.isArray(incomingRoutes.routes)) return incomingRoutes.routes;
    return [];
  }, [incomingRoutes]);

  const [isMinimized, setIsMinimized] = useState(false);

  const setMinimized = useCallback((value) => {
    setIsMinimized(value);
    if (onMinimizedChange) onMinimizedChange(value);
  }, [onMinimizedChange]);

  useEffect(() => {
    if (!forceMinimized) return;
    // oxlint-disable-next-line react/set-state-in-effect
    setIsMinimized(true);
    if (onMinimizedChange) onMinimizedChange(true);
  }, [forceMinimized, onMinimizedChange]);

  useEffect(() => {
    if (forceMinimized) return;
    // Yeni rota sonuçları geldiğinde tam listeyi göster.
    // oxlint-disable-next-line react/set-state-in-effect
    setMinimized(false);
  }, [routes, forceMinimized, setMinimized]);

  const indexedRoutes = useMemo(() => {
    if (!routes || !Array.isArray(routes)) return [];
    return routes.map((r, idx) => ({ ...r, _originalIdx: idx }));
  }, [routes]);

  const sortedRoutes = useMemo(
    () => [...indexedRoutes]
      .sort((a, b) => (a.totalTime || 0) - (b.totalTime || 0))
      .slice(0, 6),
    [indexedRoutes]
  );

  const currentRoute = routes[selectedIdx] || routes[0];

  if (!routes || routes.length === 0) {
    return (
      <div className="route-sheet-container is-empty">
        <div className="route-sheet-grabber-box">
          <div className="route-sheet-grabber-bar" />
        </div>
        <div className="route-empty-box">
          <div className="route-empty-icon-circle">
            <Bus size={24} className="text-muted" />
          </div>
          <h3 className="route-empty-title">Doğrudan Hat Bulunamadı</h3>
          <p className="route-empty-subtitle">
            {toLocation?.name
              ? `"${toLocation.name}" için uygun sefer tespit edilemedi.`
              : 'Seçilen noktalar arasında toplu taşıma rotası bulunamadı.'}
          </p>
          <button className="route-empty-retry-btn" onClick={onClose}>
            <RefreshCw size={15} />
            <span>Yeni Arama Yap</span>
          </button>
        </div>
      </div>
    );
  }

  if (isMinimized) {
    return (
      <div className="route-minimized-wrapper">
        <div className="route-minimized-card" onClick={() => setMinimized(false)}>
          <div className="route-minimized-row">
            <div
              className="route-mini-badge"
              style={{ backgroundColor: currentRoute?.color || '#3B82F6' }}
            >
              {currentRoute?.isWalkOnly ? <Footprints size={14} /> : <Bus size={14} />}
              <span>
                {currentRoute?.isWalkOnly
                  ? 'Yürüyüş'
                  : currentRoute?.isTransfer
                    ? `${currentRoute.line1 || currentRoute.legs?.[0]?.line || '1'}+${currentRoute.line2 || currentRoute.legs?.[1]?.line || '2'}`
                    : currentRoute?.name || currentRoute?.lineCode || currentRoute?.legs?.[0]?.line || 'Hat'}
              </span>
            </div>

            <div className="route-minimized-info">
              <span className="route-minimized-dest">{toLocation?.name || 'Seçilen Hedef'}</span>
              <span className="route-minimized-sub">
                {fmtDuration(currentRoute?.totalTime)} • {fmtDist(currentRoute)}
              </span>
            </div>

            <button className="route-mini-expand-btn" title="Detayları Göster">
              <Maximize2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="route-sheet-container">
      <div className="route-sheet-grabber-box" onClick={() => setMinimized(true)}>
        <div className="route-sheet-grabber-bar" />
      </div>

      <div className="rs-header">
        <div className="rs-title-wrap">
          <span className="rs-title">Rotalar</span>
          <span className="rs-count">{sortedRoutes.length} seçenek</span>
        </div>
        <button
          className="rs-minimize"
          onClick={() => setMinimized(true)}
          title="Haritayı Gör"
          aria-label="Haritayı Gör"
        >
          <ChevronDown size={18} />
        </button>
      </div>

      <div className="rs-list">
        {sortedRoutes.map((route, idx) => (
          <RouteOptionCard
            key={`rcard_${route.id}`}
            route={route}
            isSelected={route._originalIdx === selectedIdx}
            isFirst={idx === 0}
            toLocation={toLocation}
            onSelect={() => onSelectIdx?.(route._originalIdx)}
            onStartWalk={onStartWalk}
          />
        ))}
      </div>
    </div>
  );
}
