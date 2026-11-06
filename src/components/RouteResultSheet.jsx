import React, { useState, useMemo } from 'react';
import {
  Repeat,
  Footprints,
  Bus,
  ChevronDown,
  ChevronUp,
  Maximize2,
  RefreshCw,
  ArrowRight,
  MapPin,
  CheckCircle2
} from 'lucide-react';

const fmtDuration = (totalMinutes) => {
  if (!totalMinutes) return '0 dk';
  const m = Math.round(totalMinutes);
  if (m >= 60) {
    const hours = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${hours} sa ${rem} dk` : `${hours} sa`;
  }
  return `${m} dk`;
};

const fmtDist = (route) => {
  if (!route) return '';
  const km = route.totalDistanceKm || (route.isWalkOnly ? (route.walkDistanceStart || 1.2) : (route.busTimeMins || 10) * 0.38) || 3.5;
  return `${Number(km).toFixed(1).replace('.', ',')} km`;
};

export default function RouteResultSheet({
  routes: incomingRoutes = [],
  selectedIdx = 0,
  onSelectIdx,
  toLocation,
  onMinimizedChange,
  onClose
}) {
  const routes = useMemo(() => {
    if (Array.isArray(incomingRoutes)) return incomingRoutes;
    if (incomingRoutes && Array.isArray(incomingRoutes.routes)) return incomingRoutes.routes;
    return [];
  }, [incomingRoutes]);

  const [isMinimized, setIsMinimized] = useState(false);
  const [expandedRouteId, setExpandedRouteId] = useState(null);

  const setMinimized = (value) => {
    setIsMinimized(value);
    if (onMinimizedChange) onMinimizedChange(value);
  };

  // Preserve original indices for selection
  const indexedRoutes = useMemo(() => {
    if (!routes || !Array.isArray(routes)) return [];
    return routes.map((r, idx) => ({ ...r, _originalIdx: idx }));
  }, [routes]);

  // En hızlıdan yavaşa sırala, ilk 6 alternatifi göster
  const sortedRoutes = useMemo(
    () => [...indexedRoutes]
      .sort((a, b) => (a.totalTime || 0) - (b.totalTime || 0))
      .slice(0, 6),
    [indexedRoutes]
  );

  const currentRoute = routes[selectedIdx] || routes[0];

  // 1. EMPTY STATE
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

  // 2. MINIMIZED FLOATING CAPSULE VIEW (For inspecting the map freely)
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

  // 3. FULL "TÜM ROTALAR" LIST SHEET
  return (
    <div className="route-sheet-container">
      {/* Top Grabber Handle */}
      <div className="route-sheet-grabber-box" onClick={() => setMinimized(true)}>
        <div className="route-sheet-grabber-bar" />
      </div>

      {/* Header */}
      <div className="route-sheet-header">
        <div className="route-sheet-title-col">
          <div className="route-sheet-title-row">
            <span className="route-sheet-main-title">Rotalar</span>
            <span className="route-sheet-count-tag">{sortedRoutes.length} seçenek</span>
          </div>
        </div>

        <button
          className="route-sheet-minimize-btn"
          onClick={() => setMinimized(true)}
          title="Haritayı Gör"
          aria-label="Haritayı Gör"
        >
          <ChevronDown size={18} />
        </button>
      </div>

      {/* Route Cards Scrollable List */}
      <div className="route-cards-scroll-list">
        {sortedRoutes.map((route) => {
          const isSelected = route._originalIdx === selectedIdx;
          const isExpanded = expandedRouteId === route.id;

          return (
            <div
              key={`rcard_${route.id}`}
              className={`route-card-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectIdx(route._originalIdx)}
            >
              {/* Card Header Row */}
              <div className="route-card-header">
                {/* Transit Breadcrumbs */}
                <div className="route-card-breadcrumbs">
                  {route.isWalkOnly ? (
                    <div className="route-crumb-badge walk-crumb">
                      <Footprints size={14} />
                      <span>{fmtDuration(route.totalTime)} Yürüyüş</span>
                    </div>
                  ) : route.isTransfer ? (
                    <>
                      <div
                        className="route-crumb-badge bus-crumb"
                        style={{ backgroundColor: route.color || '#3B82F6' }}
                      >
                        <Bus size={13} />
                        <span>{route.line1 || route.legs?.[0]?.line || 'Hat'}</span>
                      </div>
                      <ArrowRight size={13} className="text-dim" />
                      <div
                        className="route-crumb-badge bus-crumb"
                        style={{ backgroundColor: route.color2 || '#F59E0B' }}
                      >
                        <Bus size={13} />
                        <span>{route.line2 || route.legs?.[1]?.line || 'Hat'}</span>
                      </div>
                      {route.walkTimeEnd > 0 && (
                        <>
                          <ArrowRight size={13} className="text-dim" />
                          <div className="route-crumb-badge walk-crumb">
                            <Footprints size={12} />
                            <span>{Math.round(route.walkTimeEnd)} dk</span>
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <div
                        className="route-crumb-badge bus-crumb"
                        style={{ backgroundColor: route.color || '#3B82F6' }}
                      >
                        <Bus size={13} />
                        <span>{route.name || route.lineCode || route.legs?.[0]?.line || 'Hat'}</span>
                      </div>
                      {route.walkTimeEnd > 0 && (
                        <>
                          <ArrowRight size={13} className="text-dim" />
                          <div className="route-crumb-badge walk-crumb">
                            <Footprints size={12} />
                            <span>{Math.round(route.walkTimeEnd)} dk</span>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Duration & Fare Badges */}
                <div className="route-card-stats">
                  <span className="route-stat-time">{fmtDuration(route.totalTime)}</span>
                </div>
              </div>

              {/* Subtitle Info Row */}
              <div className="route-card-sub-row">
                <span className="route-card-sub-info">
                  {route.isWalkOnly
                    ? `${fmtDist(route)} yürüme mesafesi`
                    : route.isTransfer
                      ? `1 Aktarma · ${route.startStop?.name || 'Durak'} üzerinden`
                      : `Aktarmasız Doğrudan · ${route.startStop?.name || 'Durak'} biniş`}
                </span>

                <button
                  className="route-card-expand-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedRouteId(prev => (prev === route.id ? null : route.id));
                  }}
                >
                  <span>{isExpanded ? 'Gizle' : 'Adımlar'}</span>
                  {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              </div>

              {/* Detailed Step-by-Step Itinerary (Accordion) */}
              {isExpanded && (
                <div className="route-itinerary-box" onClick={(e) => e.stopPropagation()}>
                  <div className="itinerary-timeline">
                    {/* Step 1: Walk to Start Stop */}
                    {route.walkTimeStart > 0 && (
                      <div className="itinerary-step">
                        <div className="itinerary-node walk-node">
                          <Footprints size={13} />
                        </div>
                        <div className="itinerary-content">
                          <span className="itinerary-step-title">
                            {route.startStop?.name || 'Biniş Durağı'} durağına yürü
                          </span>
                          <span className="itinerary-step-meta">
                            ~{Math.round(route.walkTimeStart)} dk ({Math.round((route.walkDistanceStart || 0.2) * 1000)}m)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Board First Bus */}
                    {!route.isWalkOnly && (
                      <div className="itinerary-step">
                        <div className="itinerary-node bus-node" style={{ backgroundColor: route.color || '#3B82F6' }}>
                          <Bus size={13} />
                        </div>
                        <div className="itinerary-content">
                          <span className="itinerary-step-title">
                            <b>{route.isTransfer ? route.line1 : (route.name || route.lineCode)}</b> hattına bin
                          </span>
                          <span className="itinerary-step-meta">
                            {route.startStop?.name} durağından biniş
                            {(route.directStops?.length || route.legs?.[0]?.stops?.length || route.passedStops?.length)
                              ? ` · ${(route.directStops?.length || route.legs?.[0]?.stops?.length || route.passedStops?.length)} durak`
                              : ''}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Step 3: Transfer (If applicable) */}
                    {route.isTransfer && (
                      <>
                        <div className="itinerary-step">
                          <div className="itinerary-node transfer-node">
                            <Repeat size={13} />
                          </div>
                          <div className="itinerary-content">
                            <span className="itinerary-step-title">
                              <b>{route.transferStop?.name}</b> durağında aktarma yap
                            </span>
                            <span className="itinerary-step-meta">
                              <b>{route.line2}</b> hattına geçiş yapın
                            </span>
                          </div>
                        </div>

                        <div className="itinerary-step">
                          <div className="itinerary-node bus-node" style={{ backgroundColor: route.color2 || '#F59E0B' }}>
                            <Bus size={13} />
                          </div>
                          <div className="itinerary-content">
                            <span className="itinerary-step-title">
                              <b>{route.line2}</b> hattı ile seyahat et
                            </span>
                            <span className="itinerary-step-meta">
                              {route.endStop?.name} durağında inin
                              {route.legs?.[1]?.stops?.length ? ` · ${route.legs[1].stops.length} durak` : ''}
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Step 4: Alight & Final Walk */}
                    {!route.isWalkOnly && (
                      <div className="itinerary-step">
                        <div className="itinerary-node alight-node">
                          <CheckCircle2 size={13} />
                        </div>
                        <div className="itinerary-content">
                          <span className="itinerary-step-title">
                            {route.endStop?.name} durağında in
                          </span>
                          <span className="itinerary-step-meta">
                            Hedefe kalan yürüme: ~{Math.round(route.walkTimeEnd || 3)} dk
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Step 5: Arrive */}
                    <div className="itinerary-step">
                      <div className="itinerary-node dest-node">
                        <MapPin size={13} />
                      </div>
                      <div className="itinerary-content">
                        <span className="itinerary-step-title">
                          Varış: {toLocation?.name || 'Hedef'}
                        </span>
                        <span className="itinerary-step-meta">
                          Toplam Süre: {fmtDuration(route.totalTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
