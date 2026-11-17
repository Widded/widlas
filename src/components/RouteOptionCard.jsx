import React, { useState } from 'react';
import {
  Bus,
  Footprints,
  ChevronDown,
  ChevronUp,
  Navigation,
  Repeat,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import {
  fmtDuration,
  fmtDist,
  fmtWalkKm,
  walkDistanceKm,
  walkMinutes,
  destOf
} from '../lib/routeDisplay';
import './RouteOptionCard.css';

export default function RouteOptionCard({
  route,
  isSelected,
  isFirst,
  toLocation,
  onSelect,
  onStartWalk
}) {
  const [stepsOpen, setStepsOpen] = useState(false);

  if (!route) return null;

  const startWalkKm = walkDistanceKm(route, 'start');
  const endWalkKm = walkDistanceKm(route, 'end');
  const startWalkMin = walkMinutes(route, 'start');
  const endWalkMin = walkMinutes(route, 'end');
  const headSign = route.legs?.[0]?.headSign || route.description || '';
  const dest = destOf(headSign);
  const line1 = route.isTransfer
    ? (route.line1 || route.legs?.[0]?.line || 'Hat')
    : (route.name || route.lineCode || route.legs?.[0]?.line || 'Hat');
  const line2 = route.isTransfer ? (route.line2 || route.legs?.[1]?.line || 'Hat') : null;
  const color1 = route.color || '#3B82F6';
  const color2 = route.color2 || '#F59E0B';

  const startWalkLabel = startWalkKm > 0 ? fmtWalkKm(startWalkKm) : 'Durakta';
  const endWalkLabel = endWalkKm > 0 ? fmtWalkKm(endWalkKm) : 'Hedefe yakın';

  return (
    <div
      className={`rs-card ${isSelected ? 'is-selected' : ''}`}
      onClick={() => onSelect?.()}
    >
      <div className="rs-card-main">
        <div className="rs-badges">
          {route.isWalkOnly ? (
            <span className="rs-badge is-walk" title="Yürüyüş">
              <Footprints size={18} />
            </span>
          ) : route.isTransfer ? (
            <>
              <span className="rs-badge" style={{ backgroundColor: color1 }}>{line1}</span>
              <span className="rs-transfer-arrow">↓</span>
              <span className="rs-badge" style={{ backgroundColor: color2 }}>{line2}</span>
            </>
          ) : (
            <span className="rs-badge" style={{ backgroundColor: color1 }}>{line1}</span>
          )}
        </div>

        <div className="rs-info">
          <div className="rs-title-row">
            <span className="rs-duration">{fmtDuration(route.totalTime)}</span>
            {isFirst && <span className="rs-fastest">En hızlı</span>}
          </div>
          <div className="rs-dest">
            {route.isWalkOnly
              ? (toLocation?.name || 'Yürüyüş rotası')
              : (dest ? `${dest} yönü` : (toLocation?.name || 'Hat yönü'))}
          </div>
          <div className="rs-meta">
            {route.isWalkOnly
              ? `${fmtDist(route)} yürüyüş`
              : route.isTransfer
                ? `Aktarma: ${route.transferStop?.name || '—'}`
                : `${route.startStop?.name || 'Biniş durağı'} · Aktarmasız`}
          </div>
        </div>

        <div className="rs-side">
          {!route.isWalkOnly && (
            <span className="rs-walk-chip">
              <Footprints size={12} />
              {startWalkLabel}
            </span>
          )}
          <ChevronDown
            size={17}
            className={`rs-chevron ${isSelected ? 'is-open' : ''}`}
          />
        </div>
      </div>

      {isSelected && (
        <div className="rs-detail" onClick={(e) => e.stopPropagation()}>
          {route.isWalkOnly ? (
            <div className="rs-walk-only-detail">
              <span className="rs-walk-only-icon"><Footprints size={20} /></span>
              <div>
                <b>Yürüyerek git</b>
                <span>{fmtDist(route)} · {fmtDuration(route.totalTime)}</span>
              </div>
            </div>
          ) : (
            <>
              <div className="rs-timeline">
                <div className="rs-stop-row">
                  <span className="rs-dot start" />
                  <div className="rs-stop-info">
                    <span className="rs-stop-label">Biniş</span>
                    <span className="rs-stop-name">{route.startStop?.name || 'Biniş durağı'}</span>
                  </div>
                  <span className="rs-stop-walk">
                    <Footprints size={12} />
                    {startWalkKm > 0 ? `${startWalkLabel} · ${startWalkMin} dk` : 'Durakta'}
                  </span>
                </div>

                <div className="rs-route-track" style={{ '--line-color': color1 }}>
                  <Bus size={14} />
                  <span className="rs-route-label">
                    {line1}{line2 ? ` → ${line2}` : ''}
                  </span>
                </div>

                {route.isTransfer && (
                  <div className="rs-stop-row transfer">
                    <span className="rs-dot transfer" />
                    <div className="rs-stop-info">
                      <span className="rs-stop-label">Aktarma</span>
                      <span className="rs-stop-name">{route.transferStop?.name || 'Aktarma durağı'}</span>
                    </div>
                    <span className="rs-stop-walk">
                      {Number(route.transferWalkDistance) > 0
                        ? fmtWalkKm(route.transferWalkDistance)
                        : 'Aynı durak'}
                    </span>
                  </div>
                )}

                <div className="rs-stop-row">
                  <span className="rs-dot end" />
                  <div className="rs-stop-info">
                    <span className="rs-stop-label">İniş</span>
                    <span className="rs-stop-name">{route.endStop?.name || 'İniş durağı'}</span>
                  </div>
                  <span className="rs-stop-walk">
                    <Footprints size={12} />
                    {endWalkKm > 0 ? `${endWalkLabel} · ${endWalkMin} dk` : 'Hedefe yakın'}
                  </span>
                </div>
              </div>

              <div className="rs-actions">
                <button
                  type="button"
                  className="rs-go-btn"
                  onClick={() => onStartWalk?.(route)}
                >
                  <Navigation size={15} />
                  Durağa Git
                </button>
                <button
                  type="button"
                  className="rs-steps-btn"
                  onClick={() => setStepsOpen((v) => !v)}
                >
                  {stepsOpen ? 'Adımları gizle' : 'Adımları göster'}
                  {stepsOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
              </div>

              {stepsOpen && (
                <div className="rs-itinerary">
                  <div className="itinerary-timeline">
                    {(startWalkKm > 0 || startWalkMin > 0) && (
                      <div className="itinerary-step">
                        <div className="itinerary-node walk-node"><Footprints size={13} /></div>
                        <div className="itinerary-content">
                          <span className="itinerary-step-title">
                            {route.startStop?.name || 'Biniş Durağı'} durağına yürü
                          </span>
                          <span className="itinerary-step-meta">
                            {startWalkMin > 0 ? `~${startWalkMin} dk` : 'Yürüme'}
                            {startWalkKm > 0 ? ` (${fmtWalkKm(startWalkKm)})` : ''}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="itinerary-step">
                      <div className="itinerary-node bus-node" style={{ backgroundColor: color1 }}>
                        <Bus size={13} />
                      </div>
                      <div className="itinerary-content">
                        <span className="itinerary-step-title">
                          <b>{route.isTransfer ? line1 : (route.name || route.lineCode)}</b> hattına bin
                        </span>
                        <span className="itinerary-step-meta">
                          {route.startStop?.name} durağından biniş
                          {route.legs?.[0]?.stops?.length
                            ? ` · ${route.legs[0].stops.length} durak`
                            : ''}
                        </span>
                      </div>
                    </div>

                    {route.isTransfer && (
                      <>
                        <div className="itinerary-step">
                          <div className="itinerary-node transfer-node"><Repeat size={13} /></div>
                          <div className="itinerary-content">
                            <span className="itinerary-step-title">
                              <b>{route.transferStop?.name}</b> durağında aktarma yap
                            </span>
                            <span className="itinerary-step-meta">
                              <b>{line2}</b> hattına geçiş yapın
                              {Number(route.transferWalkDistance) > 0
                                ? ` · ${fmtWalkKm(route.transferWalkDistance)} yürüme`
                                : ''}
                            </span>
                          </div>
                        </div>

                        <div className="itinerary-step">
                          <div className="itinerary-node bus-node" style={{ backgroundColor: color2 }}>
                            <Bus size={13} />
                          </div>
                          <div className="itinerary-content">
                            <span className="itinerary-step-title">
                              <b>{line2}</b> hattı ile seyahat et
                            </span>
                            <span className="itinerary-step-meta">
                              {route.endStop?.name} durağında inin
                              {route.legs?.[1]?.stops?.length ? ` · ${route.legs[1].stops.length} durak` : ''}
                            </span>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="itinerary-step">
                      <div className="itinerary-node alight-node"><CheckCircle2 size={13} /></div>
                      <div className="itinerary-content">
                        <span className="itinerary-step-title">
                          {route.endStop?.name} durağında in
                        </span>
                        <span className="itinerary-step-meta">
                          {endWalkKm > 0
                            ? `Hedefe yürüme: ${fmtWalkKm(endWalkKm)}${endWalkMin > 0 ? ` (~${endWalkMin} dk)` : ''}`
                            : 'İndiğiniz durak hedefe yakın'}
                        </span>
                      </div>
                    </div>

                    <div className="itinerary-step">
                      <div className="itinerary-node dest-node"><MapPin size={13} /></div>
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
            </>
          )}
        </div>
      )}
    </div>
  );
}
