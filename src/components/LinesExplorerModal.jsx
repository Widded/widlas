import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  Bus,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { etusLines, allStopsDB } from '../data/db';
import { getLineColor } from '../lib/lineColors';

const CORRIDORS = [
  { id: 'all', title: 'Tüm Hatlar' },
  { id: 'kampus', title: 'Kampüs / Üniversite' },
  { id: 'otogar', title: 'Otogar' },
  { id: 'merkez', title: 'Çarşı / Merkez' }
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

  useEffect(() => {
    if (initialLineCode) {
      // Modal her açıldığında seçili hattı aç: dış prop'tan gelen senkronizasyon.
      // oxlint-disable-next-line react/set-state-in-effect
      setExpandedLineCode(initialLineCode);
      setActiveDirIdx(0);
    }
  }, [initialLineCode]);

  // Sorted list of all ETUS lines numerically
  const allLines = useMemo(() => {
    return Object.values(etusLines).sort((a, b) => {
      const getNum = (c) => parseInt(c) || 0;
      return getNum(a.code) - getNum(b.code) || a.code.localeCompare(b.code);
    });
  }, []);

  // Filter lines by corridor and search query
  const filteredLines = useMemo(() => {
    const normQ = normalizeTr(searchQuery);
    const cleanQ = normQ.replace(/^hat\s+/, '').trim();

    return allLines
      .map(line => {
        // Check corridor
        if (selectedCorridor === 'kampus') {
          const matches = line.directions.some(d => {
            const h = normalizeTr(d.headSign || '');
            if (CAMPUS_KEYWORDS.some(k => h.includes(k))) return true;
            return (d.stopIds || []).some(sid => {
              const s = normalizeTr(allStopsDB[sid]?.name || '');
              return CAMPUS_KEYWORDS.some(k => s.includes(k));
            });
          });
          if (!matches) return null;
        } else if (selectedCorridor === 'otogar') {
          const matches = line.directions.some(d => {
            const h = normalizeTr(d.headSign || '');
            if (OTOGAR_KEYWORDS.some(k => h.includes(k))) return true;
            return (d.stopIds || []).some(sid => {
              const s = normalizeTr(allStopsDB[sid]?.name || '');
              return OTOGAR_KEYWORDS.some(k => s.includes(k));
            });
          });
          if (!matches) return null;
        } else if (selectedCorridor === 'merkez') {
          const matches = line.directions.some(d => {
            const h = normalizeTr(d.headSign || '');
            if (MERKEZ_KEYWORDS.some(k => h.includes(k))) return true;
            return (d.stopIds || []).some(sid => {
              const s = normalizeTr(allStopsDB[sid]?.name || '');
              return MERKEZ_KEYWORDS.some(k => s.includes(k));
            });
          });
          if (!matches) return null;
        }

        // Query check
        if (!normQ) return { line, matchedStop: null };

        const normCode = normalizeTr(line.code);
        if (normCode === normQ || normCode === cleanQ || (cleanQ.length >= 1 && normCode.startsWith(cleanQ))) {
          return { line, matchedStop: null };
        }

        const headSigns = (line.directions || []).map(d => normalizeTr(d.headSign || '')).join(' ');
        if (headSigns.includes(normQ) || (cleanQ.length >= 2 && headSigns.includes(cleanQ))) {
          return { line, matchedStop: null };
        }

        // Check stops along this line
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

        if (foundStopName) {
          return { line, matchedStop: foundStopName };
        }

        return null;
      })
      .filter(Boolean);
  }, [allLines, selectedCorridor, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="lines-modal-backdrop" onClick={onClose}>
      <div className="lines-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Grabber */}
        <div className="search-modal-grabber-box">
          <div className="search-modal-grabber" />
        </div>

        {/* Header */}
        <div className="lines-modal-header">
          <div className="lines-modal-title">
            <Bus size={20} className="text-primary" />
            <span>ETUS Güzergah ve Hatları</span>
            <span className="lines-count-tag">{allLines.length} Hat</span>
          </div>
          <button className="search-modal-close-btn" onClick={onClose} title="Kapat">
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="lines-search-bar">
          <Search size={16} className="text-dim" />
          <input
            type="text"
            placeholder="Hat kodu, güzergah veya durak ara (1A, Balkan, Erasta, Otogar)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="lines-search-input"
          />
          {searchQuery && (
            <button className="search-clear-input-btn" onClick={() => setSearchQuery('')}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* Corridor Chips */}
        <div className="lines-corridors-scroll">
          {CORRIDORS.map(c => (
            <button
              key={c.id}
              className={`lines-corridor-chip ${selectedCorridor === c.id ? 'active' : ''}`}
              onClick={() => setSelectedCorridor(c.id)}
            >
              {c.title}
            </button>
          ))}
        </div>

        {/* Lines Accordion List */}
        <div className="lines-scroll-list">
          {filteredLines.length === 0 ? (
            <div className="search-empty-state">
              <Bus size={28} className="text-dim" />
              <p className="search-empty-title">Aramanıza uygun ETUS hattı bulunamadı</p>
              <p className="search-empty-sub">Farklı bir hat kodu (örn: 1A, 3, 7) veya durak ismi deneyin.</p>
            </div>
          ) : (
            filteredLines.map(({ line, matchedStop }) => {
              const isExpanded = expandedLineCode === line.code;
              const dir = line.directions?.[activeDirIdx] || line.directions?.[0];

              return (
                <div key={line.code} className="lines-item-card">
                  {/* Item Summary Header */}
                  <div
                    className="lines-item-header"
                    onClick={() => {
                      setExpandedLineCode(prev => (prev === line.code ? null : line.code));
                      setActiveDirIdx(0);
                    }}
                  >
                    <div
                      className="lines-item-badge"
                      style={{ backgroundColor: getLineColor(line.code, line.color) }}
                    >
                      <span>{line.code}</span>
                    </div>

                    <div className="lines-item-info">
                      <span className="lines-item-name">{line.name || `Hat ${line.code}`}</span>
                      <span className="lines-item-headsign">
                        {line.directions?.[0]?.headSign || 'ETUS Edirne Toplu Taşıma'}
                      </span>
                      <div className="lines-item-meta-row">
                        <span className="lines-item-meta-sub">
                          {line.directions?.length || 1} Yön · {line.directions?.[0]?.stopIds?.length || 0} Durak
                        </span>
                        {matchedStop && (
                          <span className="lines-item-match-pill">
                            📍 {matchedStop} durağı
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="lines-item-arrow">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Expanded Directions and Stops */}
                  {isExpanded && (
                    <div className="lines-item-expanded">
                      {/* Direction Switcher */}
                      {line.directions?.length > 1 && (
                        <div className="lines-dir-tabs">
                          {line.directions.map((d, dIdx) => (
                            <button
                              key={`dir_${dIdx}`}
                              className={`lines-dir-tab ${activeDirIdx === dIdx ? 'active' : ''}`}
                              onClick={() => setActiveDirIdx(dIdx)}
                            >
                              <span>{dIdx === 0 ? 'Gidiş:' : 'Dönüş:'} {d.headSign || `Yön ${dIdx + 1}`}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Action: Inspect on Map */}
                      <button
                        className="lines-show-map-btn"
                        onClick={() => {
                          onSelectLineOnMap(line, activeDirIdx);
                          onClose();
                        }}
                      >
                        <Eye size={15} />
                        <span>Haritada Güzergahı Göster</span>
                      </button>

                      {/* Stops Timeline */}
                      <div className="lines-stops-list">
                        <span className="lines-stops-header">
                          Güzergah Durakları ({dir?.stopIds?.length || 0} Durak)
                        </span>

                        <div className="lines-stops-timeline">
                          {(dir?.stopIds || []).map((sid, idx) => {
                            const stop = allStopsDB[sid];
                            return (
                              <div key={`stop_${sid}_${idx}`} className="lines-stop-row">
                                <div className="lines-stop-dot" style={{ borderColor: getLineColor(line.code, line.color) }}>
                                  <span className="lines-stop-idx">{idx + 1}</span>
                                </div>
                                <span className="lines-stop-name">{stop?.name || sid}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
