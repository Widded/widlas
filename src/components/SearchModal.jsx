import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  MapPin,
  ArrowUpDown,
  Bus,
  ChevronRight,
  Crosshair
} from 'lucide-react';
import { searchPlacesOnline } from '../services/api';

const POPULAR_PLACES = [
  { id: 'p1', name: 'Selimiye Camii', subtitle: 'Edirne Merkez', lat: 41.6781, lon: 26.5594 },
  { id: 'p2', name: 'Trakya Üniversitesi', subtitle: 'Balkan Kampüsü', lat: 41.6389, lon: 26.6150 },
  { id: 'p3', name: 'Erasta AVM', subtitle: 'Talat Paşa Asfaltı', lat: 41.6663, lon: 26.5710 },
  { id: 'p4', name: 'Edirne Otogar', subtitle: 'Şehirlerarası Terminal', lat: 41.6320, lon: 26.6184 }
];

const PLACEHOLDER_QUERIES = ['Konumunuz', 'Mevcut Konumunuz', 'Mevcut Konum', 'Mevcut Konumum', 'Konumum'];
const isPlaceholderQuery = (query) =>
  !query || query.trim().length < 2 || PLACEHOLDER_QUERIES.includes(query);

export default function SearchModal({
  isOpen,
  onClose,
  targetType = 'to',
  fromLocation,
  toLocation,
  onSelectLocation,
  onUseMyLocation,
  onSelectFromMap,
  userLocation
}) {
  const [activeTab, setActiveTab] = useState(targetType);
  const [fromQuery, setFromQuery] = useState(fromLocation?.name || '');
  const [toQuery, setToQuery] = useState(toLocation?.name || '');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const toInputRef = useRef(null);
  const fromInputRef = useRef(null);
  const debounceTimer = useRef(null);
  const abortRef = useRef(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;

    // oxlint-disable-next-line react/set-state-in-effect
    setActiveTab(targetType);
    setFromQuery(fromLocation?.name || '');
    setToQuery(toLocation?.name || '');
    setSearchResults([]);
    setIsSearching(false);

    const focusTimer = setTimeout(() => {
      if (targetType === 'from') {
        fromInputRef.current?.focus();
      } else {
        toInputRef.current?.focus();
      }
    }, 180);

    return () => clearTimeout(focusTimer);
    // Prop değerleri yalnızca modal açılırken senkronize edilmeli; açıkken
    // "Konumum" seçimi formu sıfırlamasın.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, targetType]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const activeQuery = activeTab === 'from' ? fromQuery : toQuery;
  const hasQuery = !isPlaceholderQuery(activeQuery);

  useEffect(() => {
    if (!isOpen) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    abortRef.current?.abort();
    const requestId = ++requestIdRef.current;

    if (isPlaceholderQuery(activeQuery)) {
      // oxlint-disable-next-line react/set-state-in-effect
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsSearching(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await searchPlacesOnline(activeQuery, {
          signal: controller.signal,
          userLocation
        });
        if (controller.signal.aborted || requestId !== requestIdRef.current) return;
        setSearchResults(results);
      } catch (err) {
        if (err?.name === 'AbortError') return;
        console.error('Search error:', err);
        if (requestId === requestIdRef.current) setSearchResults([]);
      } finally {
        if (requestId === requestIdRef.current) setIsSearching(false);
      }
    }, 280);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      controller.abort();
    };
    // Koordinat değişimine göre yeniden ara; userLocation objesi her GPS
    // güncellemesinde yeni referans olduğu için objeyi bağımlılık yapmıyoruz.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuery, activeTab, isOpen, userLocation?.lat, userLocation?.lon]);

  if (!isOpen) return null;

  const handleSwap = () => {
    const tempF = fromQuery;
    setFromQuery(toQuery);
    setToQuery(tempF);
    setActiveTab((prev) => (prev === 'from' ? 'to' : 'from'));
  };

  const handleSelectPlace = (place) => {
    onSelectLocation(place, activeTab);
    onClose();
  };

  const handleUseMyLocation = async () => {
    if (isLocating || !onUseMyLocation) return;
    setIsLocating(true);
    const place = await onUseMyLocation(activeTab);
    setIsLocating(false);

    if (!place) return;

    if (activeTab === 'from') {
      onClose();
    } else {
      setFromQuery(place.name || 'Mevcut Konumum');
    }
  };

  const handleSelectFromMap = () => {
    if (!onSelectFromMap) return;
    onSelectFromMap(activeTab);
    onClose();
  };

  // Konum seçimi olduğu için hat sonuçlarını listede gösterme.
  const locationResults = searchResults.filter((item) => item.type !== 'line');

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter') {
      const first = locationResults[0];
      if (first) {
        event.preventDefault();
        handleSelectPlace(first);
      }
    }
  };

  const renderResult = (item, idx) => (
    <button
      type="button"
      key={`res_${idx}_${item.name}`}
      className="search-result-item"
      style={{ animationDelay: `${Math.min(idx, 8) * 24}ms` }}
      onClick={() => handleSelectPlace(item)}
    >
      <span
        className="search-item-badge-icon"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-muted)' }}
      >
        {item.type === 'stop' ? <Bus size={17} /> : <MapPin size={17} />}
      </span>

      <span className="search-item-info">
        <span className="search-item-name">{item.name}</span>
        <span className="search-item-sub">
          {item.detail || (item.type === 'stop' ? 'ETUS Durağı' : 'Edirne')}
        </span>
      </span>

      <ChevronRight size={16} className="search-item-arrow" />
    </button>
  );

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <div
        className="search-modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Konum ara"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="search-modal-grabber-box">
          <div className="search-modal-grabber" />
        </div>

        <div className="search-modal-header">
          <div className="search-modal-heading">
            <span className="search-modal-eyebrow">
              {activeTab === 'from' ? 'Kalkış' : 'Varış'}
            </span>
            <h2 className="search-modal-title">
              {activeTab === 'from' ? 'Nereden?' : 'Nereye?'}
            </h2>
          </div>
          <button className="search-modal-close-btn" onClick={onClose} title="Kapat" aria-label="Kapat">
            <X size={19} />
          </button>
        </div>

        <div className="search-inputs-stack">
          <div className={`search-input-pill ${activeTab === 'from' ? 'is-active' : ''}`}>
            <span className="search-input-dot origin-dot" />
            <div className="search-input-body">
              <label className="search-input-label" htmlFor="search-from-input">Nereden</label>
              <input
                id="search-from-input"
                ref={fromInputRef}
                type="text"
                placeholder="Başlangıç noktası"
                value={fromQuery}
                onChange={(e) => {
                  setFromQuery(e.target.value);
                  setActiveTab('from');
                }}
                onFocus={() => setActiveTab('from')}
                onKeyDown={handleInputKeyDown}
                className="search-text-input"
                autoComplete="off"
              />
            </div>
            {fromQuery && (
              <button
                className="search-clear-input-btn"
                onClick={() => setFromQuery('')}
                aria-label="Kalkış noktasını temizle"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <button
            className="search-swap-fab"
            onClick={handleSwap}
            title="Yer değiştir"
            aria-label="Kalkış ve varışı yer değiştir"
          >
            <ArrowUpDown size={14} />
          </button>

          <div className={`search-input-pill ${activeTab === 'to' ? 'is-active' : ''}`}>
            <span className="search-input-dot dest-dot" />
            <div className="search-input-body">
              <label className="search-input-label" htmlFor="search-to-input">Nereye</label>
              <input
                id="search-to-input"
                ref={toInputRef}
                type="text"
                placeholder="Durak, yer veya hat ara"
                value={toQuery}
                onChange={(e) => {
                  setToQuery(e.target.value);
                  setActiveTab('to');
                }}
                onFocus={() => setActiveTab('to')}
                onKeyDown={handleInputKeyDown}
                className="search-text-input"
                autoComplete="off"
              />
            </div>
            {toQuery && (
              <button
                className="search-clear-input-btn"
                onClick={() => setToQuery('')}
                aria-label="Varış noktasını temizle"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="search-results-container">
          {isSearching && (
            <div className="search-skeleton-list" aria-hidden="true">
              {[0, 1].map((i) => (
                <div className="search-skeleton-row" key={i}>
                  <span className="search-skeleton-icon" />
                  <div className="search-skeleton-lines">
                    <span className="search-skeleton-line w1" />
                    <span className="search-skeleton-line w2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isSearching && hasQuery && locationResults.length > 0 && (
            <div className="search-results-list">
              {locationResults.map(renderResult)}
            </div>
          )}

          {!isSearching && hasQuery && locationResults.length === 0 && (
            <div className="search-empty-state">
              <div className="search-empty-icon">
                <Search size={24} />
              </div>
              <p className="search-empty-title">Sonuç bulunamadı</p>
              <p className="search-empty-sub">
                Farklı bir isim deneyin veya haritadan bir noktaya dokunun.
              </p>
            </div>
          )}

          {!isSearching && !hasQuery && (
            <div className="search-default-state">
              <div className="search-default-label">Popüler noktalar</div>
              <div className="search-quick-picks">
                <button
                  type="button"
                  className="search-quick-pick"
                  onClick={handleUseMyLocation}
                  disabled={isLocating}
                >
                  <span className="search-quick-pick-icon">
                    {isLocating ? <span className="search-spinner" /> : <Crosshair size={18} />}
                  </span>
                  <span className="search-quick-pick-text">
                    <b>{isLocating ? 'Konum alınıyor…' : 'Konumum'}</b>
                    <small>
                      {activeTab === 'from' ? 'Mevcut konumumu kullan' : 'Kalkış noktası yap'}
                    </small>
                  </span>
                </button>
                <button
                  type="button"
                  className="search-quick-pick"
                  onClick={handleSelectFromMap}
                >
                  <span className="search-quick-pick-icon">
                    <MapPin size={18} />
                  </span>
                  <span className="search-quick-pick-text">
                    <b>Haritadan Seç</b>
                    <small>
                      {activeTab === 'from' ? 'Haritada kalkış seç' : 'Haritada varış seç'}
                    </small>
                  </span>
                </button>
              </div>

              <div className="search-results-list">
                {POPULAR_PLACES.map((place, idx) => (
                  <button
                    type="button"
                    key={place.id}
                    className="search-result-item"
                    style={{ animationDelay: `${idx * 24}ms` }}
                    onClick={() => handleSelectPlace(place)}
                  >
                    <span className="search-item-badge-icon recent-icon">
                      <MapPin size={17} />
                    </span>
                    <span className="search-item-info">
                      <span className="search-item-name">{place.name}</span>
                      <span className="search-item-sub">{place.subtitle}</span>
                    </span>
                    <ChevronRight size={16} className="search-item-arrow" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
