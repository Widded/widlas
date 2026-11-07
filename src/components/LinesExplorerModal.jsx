import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Bus,
  ChevronDown,
  ChevronUp,
  Eye,
  MapPin,
  ArrowRight,
  ArrowLeftRight
} from 'lucide-react';
import { etusLines, allStopsDB } from '../data/db';
import { getLineColor } from '../lib/lineColors';
import './lines.css';

const CORRIDORS = [
  { id: 'all', title: 'Tümü' },
  { id: 'kampus', title: 'Kampüs' },
  { id: 'otogar', title: 'Otogar' },
  { id: 'merkez', title: 'Merkez' }
];

const normalizeTr = (str = '') => {
  return str
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
};

const CAMPUS_KEYWORDS = ['fakulte', 'universite', 'balkan', 'yerleske', 'kyk', 'tip', 'kampus', 'eczacilik', 'aysekadin'];
const OTOGAR_KEYWORDS = ['otogar', 'terminal'];
const MERKEZ_KEYWORDS = ['carsi', 'merkez', 'gazimihal', 'selimiye', 'saraclar', 'bankalar', 'orduevi', 'hukumet', 'belediye'];

const lineMatchesCorridor = (line, corridor) => {
  if (corridor === 'all') return true;
  const keywords = corridor === 'kampus' ? CAMPUS_KEYWORDS
    : corridor === 'otogar' ? OTOGAR_KEYWORDS
      : MERKEZ_KEYWORDS;
  return (line.directions || []).some(d => {
    const h = normalizeTr(d.headSign || '');
    if (keywords.some(k => h.includes(k))) return true;
    return (d.stopIds || []).some(sid => {
      const s = normalizeTr(allStopsDB[sid]?.name || '');
      return keywords.some(k => s.includes(k));
    });
  });
};

export default function LinesExplorerModal({
  isOpen,
  onClose,
  initialLineCode = null,
  onSelectLineOnMap
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCorridor, setSelectedCorridor] = useState('all');
  const [expandedLineCode, setExpandedLineCode] = useState(initialLineCode);
  const [activeDirIdx, setActiveDirIdx] = useState(0);
  const cardRefs = useRef({});

  useEffect(() => {
    if (initialLineCode) {
      // oxlint-disable-next-line react/set-state-in-effect
      setExpandedLineCode(initialLineCode);
      setActiveDirIdx(0);
      // açılışta ilgili karta kaydır
      setTimeout(() => {
        cardRefs.current[initialLineCode]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 220);
    }
  }, [initialLineCode]);

  const allLines = useMemo(() => {
    const numOf = (c) => {
      const m = String(c).match(/^(\d+)/);
      return m ? parseInt(m[1], 10) : Number.POSITIVE_INFINITY;
    };
    return Object.values(etusLines).sort((a, b) => {
      return numOf(a.code) - numOf(b.code) || a.code.localeCompare(b.code, 'tr');
    });
  }, []);

  const corridorCounts = useMemo(() => {
    const counts = {};
    for (const c of CORRIDORS) {
      counts[c.id] = c.id === 'all'
        ? allLines.length
        : allLines.filter(l => lineMatchesCorridor(l, c.id)).length;
    }
    return counts;
  }, [allLines]);

  const filteredLines = useMemo(() => {
    const normQ = normalizeTr(searchQuery);
    const cleanQ = normQ.replace(/^hat\s+/, '').trim();

    return allLines
      .filter(line => lineMatchesCorridor(line, selectedCorridor))
      .map(line => {
        if (!normQ) return { line, matchedStop: null };

        const normCode = normalizeTr(line.code);
        if (normCode === normQ || normCode === cleanQ || (cleanQ.length >= 1 && normCode.startsWith(cleanQ))) {
          return { line, matchedStop: null };
        }

        const headSigns = (line.directions || []).map(d => normalizeTr(d.headSign || '')).join(' ');
        if (headSigns.includes(normQ) || (cleanQ.length >= 2 && headSigns.includes(cleanQ))) {
          return { line, matchedStop: null };
        }

        let foundStopName = null;
        for (const d of line.directions || []) {
          for (const sid of d.stopIds || []) {
            const stop = allStopsDB[sid];
            if (stop?.name) {
              const normStop = normalizeTr(stop.name);
              if (normStop.includes(normQ) || (cleanQ.length >= 2 && normStop.includes(cleanQ))) {
                foundStopName = stop.name;
                break;
              }
            }
          }
          if (foundStopName) break;
        }

        return foundStopName ? { line, matchedStop: foundStopName } : null;
      })
      .filter(Boolean);
  }, [allLines, selectedCorridor, searchQuery]);

  if (!isOpen) return null;

  const totalStops = new Set(
    allLines.flatMap(l => (l.directions || []).flatMap(d => d.stopIds || []))
  ).size;

  return (
    <div className="lines-modal-backdrop" onClick={onClose}>
      <div className="lines-modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal-grabber-box">
          <div className="search-modal-grabber" />
        </div>

        {/* Header */}
        <div className="lines-header">
          <div className="lines-header-text">
            <span className="lines-eyebrow">ETUS · Edirne</span>
            <h2 className="lines-title">Hatlar</h2>
            <span className="lines-subtitle">
              {allLines.length} hat · {totalStops} durak
            </span>
          </div>
          <button className="search-modal-close-btn" onClick={onClose} title="Kapat" aria-label="Kapat">
            <X size={17} />
          </button>
        </div>

        {/* Search */}
        <div className="lines-toolbar">
          <div className="lines-search-bar">
            <Search size={16} className="lines-search-icon" />
            <input
              type="text"
              placeholder="Hat kodu veya durak ara…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="lines-search-input"
              aria-label="Hat veya durak ara"
            />
            {searchQuery && (
              <button className="search-clear-input-btn" onClick={() => setSearchQuery('')} aria-label="Temizle">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="lines-filters" role="tablist" aria-label="Hat filtreleri">
            {CORRIDORS.map(c => (
              <button
                key={c.id}
                role="tab"
                aria-selected={selectedCorridor === c.id}
                className={`lines-filter-chip ${selectedCorridor === c.id ? 'active' : ''}`}
                onClick={() => setSelectedCorridor(c.id)}
              >
                <span>{c.title}</span>
                <span className="lines-filter-count">{corridorCounts[c.id]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="lines-scroll-list">
          {filteredLines.length === 0 ? (
            <div className="search-empty-state">
              <Bus size={26} className="text-dim" />
              <p className="search-empty-title">Uygun hat bulunamadı</p>
              <p className="search-empty-sub">Farklı bir hat kodu (1A, 3, 7) veya durak adı deneyin.</p>
            </div>
          ) : (
            filteredLines.map(({ line, matchedStop }) => {
              const color = getLineColor(line.code, line.color);
              const dir = line.directions?.[activeDirIdx] || line.directions?.[0];
              const expanded = expandedLineCode === line.code;
              const stopCount = line.directions?.[0]?.stopIds?.length || 0;
              const dirCount = line.directions?.length || 1;
              const firstStop = allStopsDB[dir?.stopIds?.[0]]?.name;
              const lastStop = allStopsDB[dir?.stopIds?.[dir.stopIds.length - 1]]?.name;

              return (
                <article
                  key={line.code}
                  ref={(el) => { cardRefs.current[line.code] = el; }}
                  className={`lines-card ${expanded ? 'is-open' : ''}`}
                  style={{ '--line-color': color }}
                >
                  <button
                    className="lines-card-header"
                    onClick={() => {
                      setExpandedLineCode(prev => (prev === line.code ? null : line.code));
                      setActiveDirIdx(0);
                    }}
                    aria-expanded={expanded}
                  >
                    <span className="lines-code-badge">{line.code}</span>
                    <span className="lines-card-main">
                      <span className="lines-card-title">{line.directions?.[0]?.headSign || line.name || `Hat ${line.code}`}</span>
                      <span className="lines-card-meta">
                        <span>{stopCount} durak</span>
                        <span className="lines-meta-dot" />
                        <span>{dirCount} yön</span>
                        {matchedStop && (
                          <>
                            <span className="lines-meta-dot" />
                            <span className="lines-match">
                              <MapPin size={11} /> {matchedStop}
                            </span>
                          </>
                        )}
                      </span>
                    </span>
                    <span className="lines-card-chevron">
                      {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>

                  {expanded && (
                    <div className="lines-card-body">
                      {dirCount > 1 && (
                        <div className="lines-dir-switch" role="tablist" aria-label="Yön seçimi">
                          {line.directions.map((d, dIdx) => (
                            <button
                              key={`dir_${dIdx}`}
                              role="tab"
                              aria-selected={activeDirIdx === dIdx}
                              className={`lines-dir-btn ${activeDirIdx === dIdx ? 'active' : ''}`}
                              onClick={() => setActiveDirIdx(dIdx)}
                              title={d.headSign}
                            >
                              <span className="lines-dir-icon">
                                {dIdx === 0 ? <ArrowRight size={14} /> : <ArrowLeftRight size={14} />}
                              </span>
                              <span className="lines-dir-text">{d.headSign}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="lines-route-strip">
                        <span className="lines-route-end">{firstStop || '—'}</span>
                        <span className="lines-route-track">
                          <span className="lines-route-dot" />
                          <span className="lines-route-line" />
                          <span className="lines-route-dot" />
                        </span>
                        <span className="lines-route-end right">{lastStop || '—'}</span>
                      </div>

                      <button
                        className="lines-map-btn"
                        onClick={() => {
                          onSelectLineOnMap(line, activeDirIdx);
                          onClose();
                        }}
                      >
                        <Eye size={16} />
                        <span>Haritada Güzergahı Göster</span>
                      </button>

                      <div className="lines-stops">
                        <div className="lines-stops-head">
                          <span className="lines-stops-title">Güzergah Durakları</span>
                          <span className="lines-stops-count">{dir?.stopIds?.length || 0}</span>
                        </div>

                        <div className="lines-timeline">
                          {(dir?.stopIds || []).map((sid, idx) => {
                            const stop = allStopsDB[sid];
                            const isFirst = idx === 0;
                            const isLast = idx === (dir.stopIds.length - 1);
                            return (
                              <div
                                key={`stop_${sid}_${idx}`}
                                className={`lines-stop ${isFirst ? 'is-first' : ''} ${isLast ? 'is-last' : ''}`}
                              >
                                <span className="lines-stop-marker">
                                  <span className="lines-stop-num">{idx + 1}</span>
                                </span>
                                <span className="lines-stop-name">{stop?.name || sid}</span>
                                {isFirst && <span className="lines-stop-tag start">Biniş</span>}
                                {isLast && <span className="lines-stop-tag end">İniş</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
