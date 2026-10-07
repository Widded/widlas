import React, { useState } from 'react';
import { BusFront, Footprints, MapPin, Flag, ArrowRight, Repeat, ChevronDown, ChevronUp, Info, BellRing, Hourglass, Navigation } from 'lucide-react';

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
  if (!route?.legs?.length) return null;
  const startWalkMin = walkMinutes(walk.startM);
  const endWalkMin = walkMinutes(walk.endM);
  const waitMin = route.transferWaitMins || 0;

  let t = departAt;
  const atStop1 = addMin(t, startWalkMin);
  t = atStop1;
  const legs = route.legs.map((leg, i) => {
    const boardAt = t;
    const alightAt = addMin(boardAt, leg.minutes);
    t = alightAt;
    if (i < route.legs.length - 1) t = addMin(t, waitMin);
    return { ...leg, boardAt, alightAt };
  });
  const arriveAt = addMin(t, endWalkMin);

  const segments = [
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
    transfers: legs.length - 1,
    legs,
    segments,
    walk
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

export default function RouteItinerary({ itin, fromName, toName, fromCoord, toCoord, onFocus }) {
  if (!itin) return null;
  const focus = (p) => (e) => {
    e.stopPropagation();
    if (p && Number.isFinite(p.lat) && Number.isFinite(p.lon)) onFocus(p.lat, p.lon);
  };
  const totalSegMin = itin.segments.reduce((s, x) => s + x.min, 0) || 1;
  const lastLeg = itin.legs[itin.legs.length - 1];

  return (
    <div className="itin" onClick={(e) => e.stopPropagation()}>
      {/* Özet */}
      <div className="itin-summary">
        <div className="itin-times" style={{ display: 'flex', alignItems: 'center' }}>
          <div className="itin-total">
            <span>{itin.totalMin}</span> dk
          </div>
          <div className="itin-time-label" style={{ marginLeft: '12px', fontSize: '1.2rem', color: 'var(--text-main)' }}>Tahmini Yolculuk</div>
        </div>

        <div className="itin-bar" aria-label="Süre dağılımı">
          {itin.segments.filter(s => s.min > 0).map((s, i) => (
            <div
              key={i}
              className={`itin-bar-seg itin-bar-${s.kind}`}
              style={{ flexGrow: s.min / totalSegMin, background: s.kind === 'bus' ? s.color : undefined }}
              title={`${s.kind === 'walk' ? 'Yürüme' : s.kind === 'wait' ? 'Aktarma bekleme' : 'Otobüs'}: ${s.min} dk`}
            >
              {s.min / totalSegMin > 0.12 && <span>{s.min}′</span>}
            </div>
          ))}
        </div>

        <div className="itin-chips">
          <span className="itin-chip"><Footprints size={13} /> {fmtDist(itin.totalWalkM)} yürüme</span>
          <span className="itin-chip"><BusFront size={13} /> {itin.totalStops} durak</span>
          <span className="itin-chip"><Repeat size={13} /> {itin.transfers === 0 ? 'Aktarmasız' : `${itin.transfers} aktarma`}</span>
        </div>
      </div>

      {/* Adım adım tarif */}
      <ol className="itin-timeline">
        {/* Başlangıç */}
        <li className="itin-row itin-node itin-clickable" onClick={focus(fromCoord)}>
          <div className="itin-rail"><span className="itin-dot" style={{ background: '#10b981' }}><Navigation size={12} color="#fff" /></span></div>
          <div className="itin-content">
            <div className="itin-head"><b>{fromName || 'Başlangıç'}</b></div>
            <span className="itin-sub">Yola çıkış noktası</span>
          </div>
        </li>

        {/* Durağa yürüme */}
        <li className="itin-row itin-seg">
          <div className="itin-rail"><span className="itin-line itin-line-walk" /></div>
          <div className="itin-content itin-walk">
            <Footprints size={16} />
            <span>
              <b>{fmtDist(itin.walk.startM)}</b> yürü · ~{itin.startWalkMin} dk
              {!itin.walk.startExact && <em> (kuş uçuşu)</em>}
            </span>
          </div>
        </li>

        {itin.legs.map((leg, i) => (
          <React.Fragment key={leg.line + '_' + i}>
            {/* Biniş / aktarma durağı */}
            <li className="itin-row itin-node itin-clickable" onClick={focus(leg.fromStop)}>
              <div className="itin-rail">
                <span className="itin-dot itin-dot-ring" style={{ borderColor: i === 0 ? leg.color : '#f59e0b' }}>
                  {i === 0 ? <BusFront size={12} color={leg.color} /> : <Repeat size={12} color="#f59e0b" />}
                </span>
              </div>
              <div className="itin-content">
                <div className="itin-head">
                  <b>{leg.fromStop?.name} {i === 0 ? 'Durağı' : '(Aktarma)'}</b>
                </div>
                {i > 0 && (
                  <div className="itin-transfer">
                    <span><b>{itin.legs[i - 1].line}</b> hattından in, <b>aynı duraktan</b> diğer otobüse geç.</span>
                    <span className="itin-wait"><Hourglass size={13} /> Tahmini bekleme ~{itin.waitMin} dk</span>
                  </div>
                )}
                <div className="itin-board" style={{ '--leg-color': leg.color }}>
                  <span className="bus-badge" style={{ background: leg.color }}>{leg.line}</span>
                  <div className="itin-board-text">
                    <span><b>{terminalOf(leg.headSign)}</b> yönüne giden otobüse bin</span>
                    <span className="itin-sub">Ön tabelada “{terminalOf(leg.headSign)}” yazmalı · Güzergah: {leg.headSign}</span>
                  </div>
                </div>
              </div>
            </li>

            {/* Otobüs yolculuğu */}
            <li className="itin-row itin-seg">
              <div className="itin-rail"><span className="itin-line" style={{ background: leg.color }} /></div>
              <div className="itin-content">
                <div className="itin-ride">
                  <BusFront size={16} color={leg.color} />
                  <span><b>{leg.stopCount} durak</b> git · ~{leg.minutes} dk</span>
                </div>
                <LegStops leg={leg} />
              </div>
            </li>
          </React.Fragment>
        ))}

        {/* İniş */}
        <li className="itin-row itin-node itin-clickable" onClick={focus(lastLeg.toStop)}>
          <div className="itin-rail"><span className="itin-dot itin-dot-ring" style={{ borderColor: lastLeg.color }}><MapPin size={12} color={lastLeg.color} /></span></div>
          <div className="itin-content">
            <div className="itin-head"><b>{lastLeg.toStop?.name} Durağı</b></div>
            <span className="itin-sub">Otobüsten in</span>
          </div>
        </li>

        {/* Hedefe yürüme */}
        <li className="itin-row itin-seg">
          <div className="itin-rail"><span className="itin-line itin-line-walk" /></div>
          <div className="itin-content itin-walk">
            <Footprints size={16} />
            <span>
              <b>{fmtDist(itin.walk.endM)}</b> yürü · ~{itin.endWalkMin} dk
              {!itin.walk.endExact && <em> (kuş uçuşu)</em>}
            </span>
          </div>
        </li>

        {/* Varış */}
        <li className="itin-row itin-node itin-clickable" onClick={focus(toCoord)}>
          <div className="itin-rail"><span className="itin-dot" style={{ background: '#ef4444' }}><Flag size={12} color="#fff" /></span></div>
          <div className="itin-content">
            <div className="itin-head"><b>{toName || 'Varış'}</b></div>
            <span className="itin-sub">Varış noktası</span>
          </div>
        </li>
      </ol>

      <p className="itin-note">
        <Info size={14} />
        <span>
          Saatler tahminidir: otobüste durak başına ~1,5 dk, yürümede ~5 km/s, aktarmada {itin.waitMin || 12} dk bekleme varsayılır.
          İlk otobüsü bekleme süresi dahil değildir (sefer saati verisi yok). Haritada görmek için bir adıma dokun.
        </span>
      </p>
    </div>
  );
}
