import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  MapPin,
  ArrowUpDown,
  Clock,
  Bus,
  Star,
  GraduationCap,
  ShoppingBag,
  Landmark,
  Building,
  Navigation,
  Check,
  ChevronRight,
  Utensils,
  Coffee,
  Pill,
  Bed,
  CreditCard,
  Activity,
  Layers,
  Eye
} from 'lucide-react';
import { LOCAL_PLACES } from '../data/places';
import { searchPlacesOnline, getCategoryMeta } from '../services/api';
import { etusLines } from '../data/db';

const DEFAULT_RECENT_SEARCHES = [
  {
    id: 'rec_1',
    type: 'place',
    title: 'Selimiye Camii',
    subtitle: 'Edirne Merkez · Tarihi Alan',
    place: { name: 'Selimiye Camii', lat: 41.6781, lon: 26.5594 }
  },
  {
    id: 'rec_2',
    type: 'place',
    title: 'Trakya Üniversitesi Balkan Kampüsü',
    subtitle: 'ETUS 1A, 2A, 3, 3A, 7A Güzergahı',
    place: { name: 'Trakya Üniversitesi Balkan Kampüsü', lat: 41.6389, lon: 26.6150 }
  },
  {
    id: 'rec_3',
    type: 'place',
    title: 'Erasta AVM',
    subtitle: 'Talat Paşa Asfaltı · Alışveriş & Yaşam',
    place: { name: 'Erasta AVM', lat: 41.6663, lon: 26.5710 }
  },
  {
    id: 'rec_4',
    type: 'place',
    title: 'Edirne Otogar',
    subtitle: 'Şehirlerarası Otobüs Terminali',
    place: { name: 'Edirne Otogar', lat: 41.6320, lon: 26.6184 }
  }
];

const POPULAR_CHIPS = [
  { id: 'p1', label: 'Trakya Üni', icon: GraduationCap, place: { name: 'Trakya Üniversitesi Balkan Kampüsü', lat: 41.6389, lon: 26.6150 } },
  { id: 'p2', label: 'Erasta AVM', icon: ShoppingBag, place: { name: 'Erasta AVM', lat: 41.6663, lon: 26.5710 } },
  { id: 'p3', label: 'Selimiye', icon: Landmark, place: { name: 'Selimiye Camii', lat: 41.6781, lon: 26.5594 } },
  { id: 'p4', label: 'Otogar', icon: Bus, place: { name: 'Edirne Otogar', lat: 41.6320, lon: 26.6184 } },
  { id: 'p5', label: 'Saraçlar Cad.', icon: Building, place: { name: 'Saraçlar Caddesi', lat: 41.6735, lon: 26.5537 } }
];

const POPULAR_LINES = ['1A', '2A', '3', '3A', '7A', '1F', '4'];

export default function SearchModal({
  isOpen,
  onClose,
  targetType = 'to', // 'from' | 'to'
  fromLocation,
  toLocation,
  onSelectLocation,
  onSelectFromMap,
  onOpenLines,
  onSelectLineOnMap
}) {
  const [activeTab, setActiveTab] = useState(targetType);
  const [fromQuery, setFromQuery] = useState(fromLocation?.name || 'Konumunuz');
  const [toQuery, setToQuery] = useState(toLocation?.name || '');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'lines' | 'places' | 'stops'

  const toInputRef = useRef(null);
  const fromInputRef = useRef(null);
  const debounceTimer = useRef(null);

  // Sync inputs with current values when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(targetType);
      setFromQuery(fromLocation?.name || 'Konumunuz');
      setToQuery(toLocation?.name || '');
      setSearchResults([]);
      setFilterType('all');

      // Auto-focus input
      setTimeout(() => {
        if (targetType === 'from') {
          fromInputRef.current?.focus();
        } else {
          toInputRef.current?.focus();
        }
      }, 150);
    }
  }, [isOpen, targetType, fromLocation?.name, toLocation?.name]);

  const activeQuery = activeTab === 'from' ? fromQuery : toQuery;

  // Debounced search trigger
  useEffect(() => {
    if (!isOpen) return;

    if (!activeQuery || activeQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (activeQuery === 'Konumunuz' || activeQuery === 'Mevcut Konumunuz') {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await searchPlacesOnline(activeQuery);
        setSearchResults(results);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [activeQuery, activeTab, isOpen]);

  if (!isOpen) return null;

  const handleSwap = () => {
    const tempF = fromQuery;
    const tempT = toQuery;
    setFromQuery(tempT);
    setToQuery(tempF);
    setActiveTab(prev => (prev === 'from' ? 'to' : 'from'));
  };

  const handleSelectPlace = (place) => {
    onSelectLocation(place, activeTab);
    onClose();
  };

  const handleSelectMyLocation = () => {
    onSelectLocation({ name: 'Konumunuz', lat: null, lon: null }, activeTab);
    onClose();
  };

  // Filtered search list
  const filteredResults = searchResults.filter(item => {
    if (filterType === 'lines') return item.type === 'line';
    if (filterType === 'places') return item.type === 'place';
    if (filterType === 'stops') return item.type === 'stop';
    return true;
  });

  const lineResultsCount = searchResults.filter(item => item.type === 'line').length;

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <div className="search-modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Grabber for mobile sheet ergonomics */}
        <div className="search-modal-grabber-box">
          <div className="search-modal-grabber" />
        </div>

        {/* Modal Header */}
        <div className="search-modal-header">
          <div className="search-modal-title">
            <Search size={18} className="text-primary" />
            <span>{activeTab === 'from' ? 'Kalkış Noktası Seç' : 'Varış Noktası Belirle'}</span>
          </div>
          <button className="search-modal-close-btn" onClick={onClose} title="Kapat">
            <X size={20} />
          </button>
        </div>

        {/* Dual Input Section */}
        <div className="search-inputs-card">
          {/* Origin Row */}
          <div className={`search-input-row ${activeTab === 'from' ? 'focused' : ''}`}>
            <div className="search-input-icon-dot origin-dot" />
            <input
              ref={fromInputRef}
              type="text"
              placeholder="Başlangıç noktası..."
              value={fromQuery}
              onChange={(e) => {
                setFromQuery(e.target.value);
                setActiveTab('from');
              }}
              onFocus={() => setActiveTab('from')}
              className="search-text-input"
            />
            {fromQuery && fromQuery !== 'Konumunuz' && (
              <button className="search-clear-input-btn" onClick={() => setFromQuery('')}>
                <X size={15} />
              </button>
            )}
          </div>

          {/* Swap Divider Button */}
          <div className="search-swap-divider">
            <div className="search-swap-line" />
            <button className="search-swap-btn" onClick={handleSwap} title="Konumları Değiştir">
              <ArrowUpDown size={14} />
            </button>
            <div className="search-swap-line" />
          </div>

          {/* Destination Row */}
          <div className={`search-input-row ${activeTab === 'to' ? 'focused' : ''}`}>
            <div className="search-input-icon-dot dest-dot" />
            <input
              ref={toInputRef}
              type="text"
              placeholder="Varış noktası veya hat ara (1A, Erasta, Otogar)..."
              value={toQuery}
              onChange={(e) => {
                setToQuery(e.target.value);
                setActiveTab('to');
              }}
              onFocus={() => setActiveTab('to')}
              className="search-text-input"
            />
            {toQuery && (
              <button className="search-clear-input-btn" onClick={() => setToQuery('')}>
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Action Buttons Row */}
        <div className="search-quick-actions-bar">
          <button className="search-action-pill" onClick={handleSelectMyLocation}>
            <Navigation size={14} className="text-emerald" />
            <span>Mevcut Konum</span>
          </button>

          <button
            className="search-action-pill"
            onClick={() => {
              onClose();
              onSelectFromMap(activeTab);
            }}
          >
            <MapPin size={14} className="text-sky" />
            <span>Haritadan Seç</span>
          </button>

          {onOpenLines && (
            <button
              className="search-action-pill"
              onClick={() => {
                onClose();
                onOpenLines();
              }}
            >
              <Bus size={14} className="text-amber" />
              <span>Tüm Hatlar</span>
            </button>
          )}
        </div>

        {/* Popular Destination Chips */}
        <div className="search-popular-chips-scroll">
          {POPULAR_CHIPS.map(chip => {
            const IconComp = chip.icon;
            return (
              <button
                key={chip.id}
                className="search-chip-item"
                onClick={() => handleSelectPlace(chip.place)}
              >
                <IconComp size={14} />
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* Filter Pills (Tümü / Hatlar / Yerler / Duraklar) */}
        {searchResults.length > 0 && (
          <div className="search-filter-pills-row">
            <button
              className={`search-filter-pill ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              Tümü ({searchResults.length})
            </button>
            {lineResultsCount > 0 && (
              <button
                className={`search-filter-pill ${filterType === 'lines' ? 'active' : ''}`}
                onClick={() => setFilterType('lines')}
              >
                Hatlar ({lineResultsCount})
              </button>
            )}
            <button
              className={`search-filter-pill ${filterType === 'places' ? 'active' : ''}`}
              onClick={() => setFilterType('places')}
            >
              Önemli Yerler
            </button>
            <button
              className={`search-filter-pill ${filterType === 'stops' ? 'active' : ''}`}
              onClick={() => setFilterType('stops')}
            >
              ETUS Durakları
            </button>
          </div>
        )}

        {/* Results / Recents Scrollable List */}
        <div className="search-results-container">
          {isSearching && (
            <div className="search-loading-row">
              <div className="search-spinner" />
              <span>Edirne noktaları ve ETUS hatları taranıyor...</span>
            </div>
          )}

          {/* Live Search Suggestions */}
          {!isSearching && filteredResults.length > 0 && (
            <div className="search-results-list">
              {filteredResults.map((item, idx) => {
                const meta = getCategoryMeta(item);
                const isLine = item.type === 'line';

                return (
                  <div
                    key={`res_${idx}_${item.name}`}
                    className="search-result-item"
                    onClick={() => {
                      if (isLine) {
                        const lineData = etusLines[item.lineCode];
                        if (lineData && onSelectLineOnMap) {
                          onSelectLineOnMap(lineData, 0);
                          onClose();
                          return;
                        } else if (onOpenLines) {
                          onOpenLines(item.lineCode);
                          onClose();
                          return;
                        }
                      }
                      handleSelectPlace(item);
                    }}
                  >
                    <div
                      className="search-item-badge-icon"
                      style={{
                        backgroundColor: isLine ? (item.lineColor || '#3B82F6') : meta.bg,
                        color: isLine ? '#FFFFFF' : meta.color
                      }}
                    >
                      {isLine ? <Bus size={16} /> : item.type === 'stop' ? <Bus size={16} /> : <MapPin size={16} />}
                    </div>

                    <div className="search-item-info">
                      <div className="search-item-top-row">
                        <span className="search-item-name">{item.name}</span>
                        <span
                          className="search-item-cat-tag"
                          style={{
                            color: isLine ? '#FFFFFF' : meta.color,
                            backgroundColor: isLine ? (item.lineColor || '#3B82F6') : meta.bg
                          }}
                        >
                          {isLine ? 'ETUS Hattı' : meta.label}
                        </span>
                      </div>
                      <span className="search-item-sub">
                        {item.detail || (item.type === 'stop' ? 'ETUS Otobüs Durağı' : 'Edirne')}
                      </span>
                    </div>

                    {isLine ? (
                      <div className="search-item-line-action" title="Güzergahı Gör">
                        <Eye size={16} className="text-primary" />
                      </div>
                    ) : (
                      <ChevronRight size={16} className="search-item-arrow" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* No results notice */}
          {!isSearching && activeQuery.length >= 2 && filteredResults.length === 0 && (
            <div className="search-empty-state">
              <MapPin size={28} className="text-dim" />
              <p className="search-empty-title">"{activeQuery}" için sonuç bulunamadı</p>
              <p className="search-empty-sub">Farklı bir isim (örn: 1A, Selimiye, Otogar) deneyebilir veya haritadan doğrudan dokunarak seçebilirsiniz.</p>
            </div>
          )}

          {/* Default Recent Searches & Popular Lines when input is blank */}
          {!isSearching && (!activeQuery || activeQuery.length < 2) && (
            <div className="search-recents-section">
              {/* Popular ETUS Lines Fast Bar */}
              <div className="search-popular-lines-card">
                <div className="search-popular-lines-header">
                  <Bus size={14} className="text-primary" />
                  <span>Sık Kullanılan ETUS Hatları</span>
                </div>
                <div className="search-popular-lines-pills">
                  {POPULAR_LINES.map(code => {
                    const line = etusLines[code];
                    if (!line) return null;
                    return (
                      <button
                        key={code}
                        className="search-popular-line-btn"
                        onClick={() => {
                          if (onSelectLineOnMap) {
                            onSelectLineOnMap(line, 0);
                            onClose();
                          } else if (onOpenLines) {
                            onOpenLines(code);
                            onClose();
                          }
                        }}
                      >
                        <span
                          className="search-popular-line-dot"
                          style={{ backgroundColor: line.color || '#3B82F6' }}
                        />
                        <span className="search-popular-line-name">Hat {code}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="search-recents-header" style={{ marginTop: '16px' }}>
                <Clock size={14} className="text-dim" />
                <span>Popüler Noktalar</span>
              </div>

              <div className="search-results-list">
                {DEFAULT_RECENT_SEARCHES.map(item => (
                  <div
                    key={item.id}
                    className="search-result-item"
                    onClick={() => handleSelectPlace(item.place)}
                  >
                    <div className="search-item-badge-icon recent-icon">
                      <Clock size={16} />
                    </div>
                    <div className="search-item-info">
                      <span className="search-item-name">{item.title}</span>
                      <span className="search-item-sub">{item.subtitle}</span>
                    </div>
                    <ChevronRight size={16} className="search-item-arrow" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
