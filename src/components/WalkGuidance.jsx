import React from 'react';
import { ArrowUp, X } from 'lucide-react';
import {
  distanceMeters,
  bearingDegrees,
  relativeArrowDegrees,
  walkingMinutes,
  destinationOf
} from '../lib/walkGuidance';
import './WalkGuidance.css';

const fmtDistance = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);

export default function WalkGuidance({
  stop,
  lineCode,
  lineColor,
  headSign,
  liveLocation,
  isWatching,
  onExit
}) {
  if (!stop) return null;

  const hasLocation =
    liveLocation &&
    Number.isFinite(liveLocation.lat) &&
    Number.isFinite(liveLocation.lon);
  const distance = hasLocation ? distanceMeters(liveLocation, stop) : null;
  const bearing = hasLocation ? bearingDegrees(liveLocation, stop) : 0;
  const arrow = hasLocation ? relativeArrowDegrees(bearing, liveLocation.heading) : 0;
  const minutes = distance != null ? walkingMinutes(distance) : null;
  const arrived = distance != null && distance <= 25;
  const dest = destinationOf(headSign);

  return (
    <div className="walk-guidance-wrapper">
      <div className={`walk-guidance ${arrived ? 'is-arrived' : ''}`}>
        <div
          className="walk-guidance-arrow"
          style={{ transform: `rotate(${arrow}deg)` }}
          aria-hidden="true"
        >
          <ArrowUp size={18} />
        </div>

        <div className="walk-guidance-info">
          <div className="walk-guidance-line">
            <span
              className="walk-guidance-badge"
              style={{ backgroundColor: lineColor || '#3B82F6' }}
            >
              {lineCode}
            </span>
            {dest && <span className="walk-guidance-dest">{dest} yönü</span>}
          </div>
          <div className="walk-guidance-stop">{stop.fullName || stop.name}</div>
          <div className="walk-guidance-meta">
            {arrived
              ? 'Duraktasın'
              : distance != null
                ? `${fmtDistance(distance)} · ${minutes} dk`
                : isWatching
                  ? 'Konum alınıyor…'
                  : 'Konum alınamadı. İzinleri kontrol et.'}
          </div>
        </div>

        <button
          type="button"
          className="walk-guidance-exit"
          onClick={onExit}
          aria-label="Vazgeç"
          title="Vazgeç"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
