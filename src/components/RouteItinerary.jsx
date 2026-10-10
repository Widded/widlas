import React, { useState } from 'react';
import { BusFront, Footprints, MapPin, Flag, ArrowRight, Repeat, ChevronDown, ChevronUp, Info, BellRing, Hourglass, Navigation } from 'lucide-react';
import { FARES, calculateFare, formatFare } from '../data/fares';

const WALK_M_PER_MIN = 80; // ~4.8 km/s yürüme hızı

const fmtTime = (d) => d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
const addMin = (d, m) => new Date(d.getTime() + m * 60000);
const walkMinutes = (m) => Math.max(1, Math.ceil(m / WALK_M_PER_MIN));
const fmtDist = (m) => (m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m / 10) * 10} m`);

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

function LegStops({ leg }) {
  const [open, setOpen] = useState(false);
  const prevStop = leg.stops.length ? leg.stops[leg.stops.length - 1] : leg.fromStop;
  return (
    <>
      {leg.stops.length > 0 && (
        <button
          className="itin-toggle"
          onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        >
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          {open ? 'Ara durakları gizle' : `Ara durakları göster (${leg.stops.length})`}
        </button>
      )}
      {open && (
        <ol className="itin-stoplist" style={{ '--leg-color': leg.color }}>
          {leg.stops.map((s, i) => (
            <li key={s.id + '_' + i}>
              <span className="itin-stopnum">{i + 1}</span>
              <span>{s.name}</span>
            </li>
          ))}
        </ol>
      )}
      <div className="itin-alert">
        <BellRing size={15} />
        <span>
          <b>{prevStop?.name}</b> durağını geçince inme düğmesine bas.
          Sonraki durak <b>{leg.toStop?.name}</b>, orada ineceksin.
        </span>
      </div>
    </>
  );
}

import './RouteItinerary.css';

export default function RouteItinerary({ itin, fromName, toName, fromCoord, toCoord, onFocus }) {
  if (!itin) return null;
  const focus = (p) => (e) => {
    e.stopPropagation();
    if (p === 'navigation') onFocus('navigation');
    else if (p && Number.isFinite(p.lat) && Number.isFinite(p.lon)) onFocus(p.lat, p.lon);
  };
  const lastLeg = itin.legs[itin.legs.length - 1];

  return (
    <div className="route-detail-container" onClick={(e) => e.stopPropagation()}>
      
      {/* 1. Header / Summary Card */}
      <div className="detail-header-card">
        <div className="detail-time-block">
          <div className="detail-time-big">{itin.totalMin} <span className="detail-time-unit">dk</span></div>
          <div className="detail-time-label">Tahmini Toplam Süre</div>
        </div>
        
        <div className="detail-badges">
          <div className="detail-badge"><Footprints size={14} /> <span>{fmtDist(itin.totalWalkM)} yürüme</span></div>
          {!itin.isWalkOnly && (
            <>
              <div className="detail-badge"><BusFront size={14} /> <span>{itin.totalStops} durak</span></div>
              <div className="detail-badge"><Repeat size={14} /> <span>{itin.transfers === 0 ? 'Aktarmasız' : `${itin.transfers} aktarma`}</span></div>
            </>
          )}
        </div>
      </div>

      {/* 2. Timeline */}
      <div className="detail-timeline">
        {/* Start Point */}
        <div className="timeline-node clickable" onClick={focus(fromCoord)}>
          <div className="node-icon bg-emerald"><Navigation size={14} color="#fff" /></div>
          <div className="node-content">
            <div className="node-title">{fromName || 'Başlangıç Noktası'}</div>
            <div className="node-subtitle">Yolculuğun başlıyor</div>
          </div>
        </div>

        {/* Walk to First Stop (if not walk only) */}
        {!itin.isWalkOnly && itin.startWalkMin > 0 && (
          <div className="timeline-segment walk-segment clickable" onClick={focus('navigation')}>
             <div className="segment-line dashed"></div>
             <div className="segment-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
               <span className="segment-text"><Footprints size={14}/> {fmtDist(itin.walk.startM)} ({itin.startWalkMin} dk) yürü</span>
               <span style={{ fontSize: '0.7rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>🧭 Durağa Git</span>
             </div>
          </div>
        )}
        
        {/* Walk Only Route */}
        {itin.isWalkOnly && (
          <div className="timeline-segment walk-segment">
             <div className="segment-line dashed"></div>
             <div className="segment-content">
               <span className="segment-text"><Footprints size={14}/> {fmtDist(itin.totalWalkM)} ({itin.totalMin} dk) yürü</span>
             </div>
          </div>
        )}

        {/* Bus Legs */}
        {!itin.isWalkOnly && itin.legs.map((leg, i) => (
          <React.Fragment key={'leg_' + i}>
            {/* Stop Node */}
            <div className="timeline-node clickable" onClick={focus(leg.fromStop)}>
              <div className="node-icon" style={{ backgroundColor: leg.color }}>
                {i === 0 ? <BusFront size={14} color="#fff" /> : <Repeat size={14} color="#fff" />}
              </div>
              <div className="node-content">
                <div className="node-title">{leg.fromStop?.name}</div>
                <div className="node-subtitle">{i === 0 ? 'Otobüse Biniş Durağı' : 'Aktarma Durağı'}</div>
              </div>
            </div>

            {/* Wait / Transfer Instruction */}
            {i > 0 && (
              <div className="timeline-segment wait-segment">
                 <div className="segment-line dotted" style={{ borderColor: leg.color }}></div>
                 <div className="segment-content transfer-instruction">
                   {itin.route?.transferWalkDistance > 0 ? (
                      <div className="transfer-box">
                        <Footprints size={14} />
                        <span><b>{itin.legs[i - 1].line}</b> hattından in, yürüyerek geç <b>({fmtDist(itin.route.transferWalkDistance)})</b></span>
                      </div>
                    ) : (
                      <div className="transfer-box">
                        <Hourglass size={14} />
                        <span><b>{itin.legs[i - 1].line}</b> hattından in, <b>aynı durakta</b> bekle</span>
                      </div>
                    )}
                 </div>
              </div>
            )}

            {/* Boarding Info Box */}
            <div className="timeline-segment info-segment">
               <div className="segment-line solid" style={{ borderColor: leg.color }}></div>
               <div className="segment-content">
                  <div className="bus-instruction-card" style={{ borderLeft: `4px solid ${leg.color}` }}>
                     <div className="bus-badge-big" style={{ backgroundColor: leg.color }}>{leg.line}</div>
                     <div className="bus-details">
                        <div className="bus-dest"><b>{terminalOf(leg.headSign)}</b> Yönü</div>
                        <div className="bus-subtext">Ön tabelada “{terminalOf(leg.headSign)}” yazar</div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Ride Segment */}
            <div className="timeline-segment ride-segment">
               <div className="segment-line solid thick" style={{ borderColor: leg.color }}></div>
               <div className="segment-content">
                 <LegStops leg={leg} />
               </div>
            </div>
          </React.Fragment>
        ))}

        {/* End Stop Node */}
        {!itin.isWalkOnly && lastLeg && (
          <div className="timeline-node clickable" onClick={focus(lastLeg.toStop)}>
             <div className="node-icon bg-slate"><MapPin size={14} color="#fff" /></div>
             <div className="node-content">
               <div className="node-title">{lastLeg.toStop?.name}</div>
               <div className="node-subtitle">Otobüsten İniş</div>
             </div>
          </div>
        )}

        {/* Walk to Destination */}
        {!itin.isWalkOnly && itin.endWalkMin > 0 && (
          <div className="timeline-segment walk-segment">
             <div className="segment-line dashed"></div>
             <div className="segment-content">
               <span className="segment-text"><Footprints size={14}/> {fmtDist(itin.walk.endM)} ({itin.endWalkMin} dk) yürü</span>
             </div>
          </div>
        )}

        {/* Destination Node */}
        <div className="timeline-node clickable" onClick={focus(toCoord)}>
          <div className="node-icon bg-red"><Flag size={14} color="#fff" /></div>
          <div className="node-content">
            <div className="node-title">{toName || 'Varış Noktası'}</div>
            <div className="node-subtitle">Yolculuğun sonu</div>
          </div>
        </div>
      </div>

      {/* Fares */}
      {!itin.isWalkOnly && (
        <div className="fares-premium-card">
          <div className="fares-header">Tahmini Bilet Ücreti (2026)</div>
          <div className="fares-grid">
             <div className="fare-item">
               <div className="fare-type">{FARES.ogrenci.label}</div>
               <div className="fare-price">{formatFare(calculateFare('ogrenci', itin.transfers > 0))}</div>
             </div>
             <div className="fare-item">
               <div className="fare-type">{FARES.tam.label}</div>
               <div className="fare-price">{formatFare(calculateFare('tam', itin.transfers > 0))}</div>
             </div>
             <div className="fare-item">
               <div className="fare-type">{FARES.temassiz.label}</div>
               <div className="fare-price">{formatFare(calculateFare('temassiz', itin.transfers > 0))}</div>
             </div>
          </div>
          {itin.transfers > 0 && <div className="fares-note">* 45 dakika içi aktarma indirimi dahil edilmiştir.</div>}
        </div>
      )}

      {/* Note */}
      <div className="detail-note">
        <Info size={20} />
        <span>Süreler tahminidir (durak başı ~1 dk, yürüyüş ~5 km/s). İlk otobüsü bekleme süresi dahil değildir. Haritada görmek için bir adıma dokun.</span>
      </div>

    </div>
  );
}
