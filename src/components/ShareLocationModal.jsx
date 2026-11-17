import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Bus, ChevronRight, Crosshair, Share2 } from 'lucide-react';
import { searchPlacesOnline } from '../services/api';
import { loadSavedPlaces } from '../lib/savedPlaces';
import { POPULAR_PLACES } from '../data/popularPlaces';

// Hedef seçip link üreten paylaşım ekranı. Normal rota aramasından farkı:
// tek alan (kalkış yok), "Konumum" hedefi kendi konumun olur, seçim anında paylaşır.
export default function ShareLocationModal({ isOpen, onClose, onShare, onLocate, onPickOnMap, userLocation }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState([]);
  const debounceTimer = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    // oxlint-disable-next-line react/set-state-in-effect
    setQuery('');
    setResults([]);
    setError('');
    setIsSearching(false);
    setSaved(loadSavedPlaces());
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    abortRef.current?.abort();

    const q = query.trim();
    if (q.length < 2) {
      // oxlint-disable-next-line react/set-state-in-effect
      setResults([]);
      // oxlint-disable-next-line react/set-state-in-effect
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsSearching(true);

    debounceTimer.current = setTimeout(async () => {
      try {
        const found = await searchPlacesOnline(q, { signal: controller.signal, userLocation });
        if (controller.signal.aborted) return;
        setResults(found.filter((item) => item.type !== 'line'));
      } catch (err) {
        if (err?.name !== 'AbortError') setResults([]);
      } finally {
        if (!controller.signal.aborted) setIsSearching(false);
      }
    }, 280);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      controller.abort();
    };
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [query, isOpen, userLocation?.lat, userLocation?.lon]);

  if (!isOpen) return null;

  const share = (place) => {
    if (!place?.lat || !place?.lon) return;
    onShare(place);
    onClose();
  };

  const handleLocate = async () => {
    if (isLocating || !onLocate) return;
    setIsLocating(true);
    setError('');
    try {
      const place = await onLocate();
      if (place) share(place);
      else setError('Konum alınamadı. İzinleri kontrol edip tekrar dene.');
    } finally {
      setIsLocating(false);
    }
  };

  const renderItem = (item, idx) => (
    <button
      type="button"
      key={`${item.type || 'place'}_${idx}_${item.name}`}
      className="search-result-item"
      style={{ animationDelay: `${Math.min(idx, 8) * 24}ms` }}
      onClick={() => share(item)}
    >
      <span className="search-item-badge-icon" style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-muted)' }}>
        {item.type === 'stop' ? <Bus size={17} /> : <MapPin size={17} />}
      </span>
      <span className="search-item-info">
        <span className="search-item-name">{item.name}</span>
        <span className="search-item-sub">{item.detail || (item.type === 'stop' ? 'ETUS Durağı' : 'Edirne')}</span>
      </span>
      <ChevronRight size={16} className="search-item-arrow" />
    </button>
  );

  const hasQuery = query.trim().length >= 2;

  return (
    <div className="search-modal-backdrop" onClick={onClose}>
      <div
        className="search-modal-sheet share-modal-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Konum paylaş"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="search-modal-grabber-box">
          <div className="search-modal-grabber" />
        </div>

        <div className="search-modal-header">
          <div className="share-modal-heading">
            <span className="share-modal-badge">
              <Share2 size={18} />
            </span>
            <div>
              <h2 className="search-modal-title">Konum paylaş</h2>
              <p className="share-modal-hint">Karşı taraf kendi konumundan buraya rota alır.</p>
            </div>
          </div>
          <button className="search-modal-close-btn" onClick={onClose} title="Kapat" aria-label="Kapat">
            <X size={19} />
          </button>
        </div>

        <div className="search-inputs-stack">
          <div className="search-input-pill is-active">
            <span className="search-input-dot dest-dot" />
            <div className="search-input-body">
              <label className="search-input-label" htmlFor="share-dest-input">Hedef</label>
              <input
                id="share-dest-input"
                type="text"
                autoFocus
                placeholder="Nereye gelsinler?"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-text-input"
                autoComplete="off"
              />
            </div>
            {query && (
              <button className="search-clear-input-btn" onClick={() => setQuery('')} aria-label="Hedefi temizle">
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

          {!isSearching && hasQuery && results.length > 0 && (
            <div className="search-results-list">{results.map(renderItem)}</div>
          )}

          {!isSearching && hasQuery && results.length === 0 && (
            <div className="search-empty-state">
              <div className="search-empty-icon">
                <Search size={24} />
              </div>
              <p className="search-empty-title">Sonuç bulunamadı</p>
              <p className="search-empty-sub">Farklı bir isim dene veya haritadan seç.</p>
            </div>
          )}

          {!hasQuery && (
            <div className="search-default-state">
              <div className="search-quick-picks">
                <button type="button" className="search-quick-pick" onClick={handleLocate} disabled={isLocating}>
                  <span className="search-quick-pick-icon">
                    {isLocating ? <span className="search-spinner" /> : <Crosshair size={18} />}
                  </span>
                  <span className="search-quick-pick-text">
                    <b>{isLocating ? 'Konum alınıyor…' : 'Konumum'}</b>
                    <small>Kendi konumunu hedef yap</small>
                  </span>
                </button>
                <button type="button" className="search-quick-pick" onClick={onPickOnMap}>
                  <span className="search-quick-pick-icon">
                    <MapPin size={18} />
                  </span>
                  <span className="search-quick-pick-text">
                    <b>Haritadan Seç</b>
                    <small>Haritada hedefi işaretle</small>
                  </span>
                </button>
              </div>

              {error && <p className="share-modal-error">{error}</p>}

              {saved.length > 0 && (
                <>
                  <div className="search-default-label">Kaydedilenler</div>
                  <div className="search-results-list">
                    {saved.slice(0, 4).map((place) => renderItem(place))}
                  </div>
                </>
              )}

              <div className="search-default-label">Popüler noktalar</div>
              <div className="search-results-list">
                {POPULAR_PLACES.map((place, idx) => (
                  <button
                    type="button"
                    key={place.id}
                    className="search-result-item"
                    style={{ animationDelay: `${idx * 24}ms` }}
                    onClick={() => share(place)}
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
