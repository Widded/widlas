import React, { useState, useMemo } from 'react';
import {
  Search,
  X,
  Bus,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Eye,
  Navigation
} from 'lucide-react';
import { etusLines, allStopsDB } from '../data/db';

const CORRIDORS = [
  { id: 'all', title: 'Tüm Hatlar' },
  { id: 'kampus', title: 'Kampüs / Üniversite' },
  { id: 'otogar', title: 'Otogar' },
  { id: 'merkez', title: 'Çarşı / Merkez' }
];

export default function LinesExplorerModal({
  isOpen,
  onClose,
  onSelectLineOnMap
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCorridor, setSelectedCorridor] = useState('all');
  const [expandedLineCode, setExpandedLineCode] = useState(null);
  const [activeDirIdx, setActiveDirIdx] = useState(0);

  // Sorted list of all ETUS lines numerically
  const allLines = useMemo(() => {
    return Object.values(etusLines).sort((a, b) => {
      const getNum = (c) => parseInt(c) || 0;
      return getNum(a.code) - getNum(b.code) || a.code.localeCompare(b.code);
    });
  }, []);

  // Filter lines by corridor and search query
  const filteredLines = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allLines.filter(line => {
      // Corridor filter
      if (selectedCorridor === 'kampus') {
        const hasCampus = line.directions.some(d =>
          (d.headSign || '').toLowerCase().includes('fakülte') ||
          (d.headSign || '').toLowerCase().includes('üniversite') ||
          (d.headSign || '').toLowerCase().includes('balkan')
        );
        if (!hasCampus) return false;
      } else if (selectedCorridor === 'otogar') {
        const hasOtogar = line.directions.some(d =>
          (d.headSign || '').toLowerCase().includes('otogar')
        );
        if (!hasOtogar) return false;
      } else if (selectedCorridor === 'merkez') {
        const hasMerkez = line.directions.some(d =>
          (d.headSign || '').toLowerCase().includes('çarşı') ||
          (d.headSign || '').toLowerCase().includes('merkez') ||
          (d.headSign || '').toLowerCase().includes('gazimihal') ||
          (d.headSign || '').toLowerCase().includes('selimiye')
        );
        if (!hasMerkez) return false;
      }

      // Query filter
      if (!q) return true;
      if (line.code.toLowerCase().includes(q)) return true;
      if (line.name && line.name.toLowerCase().includes(q)) return true;
      return line.directions.some(d => (d.headSign || '').toLowerCase().includes(q));
    });
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
            placeholder="Hat kodu veya güzergah ara (Örn: 1A, Gazimihal, Otogar)..."
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
            </div>
          ) : (
            filteredLines.map(line => {
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
                      style={{ backgroundColor: line.color || '#3B82F6' }}
                    >
                      <span>{line.code}</span>
                    </div>

                    <div className="lines-item-info">
                      <span className="lines-item-name">{line.name || `Hat ${line.code}`}</span>
                      <span className="lines-item-headsign">
                        {line.directions?.[0]?.headSign || 'ETUS Edirne Toplu Taşıma'}
                      </span>
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
                          Durak Listesi ({dir?.stopIds?.length || 0} Durak)
                        </span>

                        <div className="lines-stops-timeline">
                          {(dir?.stopIds || []).map((sid, idx) => {
                            const stop = allStopsDB[sid];
                            return (
                              <div key={`stop_${sid}_${idx}`} className="lines-stop-row">
                                <div className="lines-stop-dot" style={{ borderColor: line.color || '#3B82F6' }}>
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
