import React from 'react';
import { Search, Map as MapIcon, ArrowUpDown, LocateFixed, ArrowLeft, MapPin, BusFront } from 'lucide-react';

export default function SearchBox({
  fromLocation,
  toLocation,
  activeInput,
  setActiveInput,
  mapSelectionMode,
  setMapSelectionMode,
  fromSuggestions,
  toSuggestions,
  handleInputChange,
  selectSuggestion,
  getUserLocation,
  handleSearch,
  hasSearched,
  localPlaces,
  isSplitLayout,
  swapLocations
}) {
  return (
    <>
      {(!hasSearched || window.innerWidth >= 1024) && (
        <div className="premium-card animate-in" style={{ animationDelay: '50ms' }}>
          {!isSplitLayout && <h2 className="search-title">Nereye gidiyoruz?</h2>}

          <div className="search-widget">
            <div className="search-timeline">
              <div className="dot-start"></div>
              <div className="timeline-line"></div>
              <div className="dot-end"></div>
            </div>

            <div className="search-inputs">
              <div className="input-row" onClick={() => setActiveInput('from')}>
                <input className="modern-input" readOnly placeholder="Başlangıç noktası..." value={fromLocation.name} />
              </div>
              <div className="input-divider"></div>
              <div className="input-row" onClick={() => setActiveInput('to')}>
                <input className="modern-input" readOnly placeholder="Nereye gitmek istiyorsunuz?" value={toLocation.name} />
              </div>
            </div>

            <button className="swap-btn" onClick={swapLocations}>
              <ArrowUpDown size={18} />
            </button>
          </div>

          <div className="quick-actions">
            <button className="action-pill" onClick={getUserLocation}>
              <LocateFixed size={16} color="var(--primary)" /> Konumum
            </button>
            <button className="action-pill" onClick={() => setMapSelectionMode(fromLocation.lat ? 'to' : 'from')}>
              <MapIcon size={16} color="var(--primary)" /> Haritadan Seç
            </button>
          </div>

          <button className="btn-primary" style={{ marginTop: '20px' }} onClick={handleSearch}>
            Rotayı Güncelle
          </button>
        </div>
      )}

      {/* Modal Overlay */}
      {activeInput && (
        <div className="modal-overlay">
          <div className="modal-header">
            <button className="action-pill" style={{ padding: '8px', border: 'none', background: 'transparent' }} onClick={() => setActiveInput(null)}>
              <ArrowLeft size={24} color="var(--text-main)" />
            </button>
            <input
              autoFocus
              className="search-input-modal"
              placeholder={activeInput === 'from' ? 'Başlangıç noktası ara...' : 'Varış noktası ara...'}
              value={activeInput === 'from' ? fromLocation.name : toLocation.name}
              onChange={(e) => handleInputChange(e, activeInput)}
            />
          </div>

          <div className="modal-body">
            <div className="quick-actions" style={{ marginBottom: '24px', marginTop: 0 }}>
              <button className="action-pill" onClick={() => getUserLocation()}>
                <LocateFixed size={16} color="var(--primary)" /> Konumum
              </button>
              <button className="action-pill" onClick={() => { setMapSelectionMode(activeInput); setActiveInput(null); }}>
                <MapIcon size={16} color="var(--primary)" /> Harita
              </button>
            </div>

            <div>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                {(activeInput === 'from' ? fromSuggestions : toSuggestions).length === 0 ? 'Popüler Noktalar' : 'Arama Sonuçları'}
              </h4>

              {(activeInput === 'from' ? fromSuggestions : toSuggestions).length === 0 ? (
                localPlaces.map((place, idx) => (
                  <div key={'pop_' + idx} className="search-result-item" onClick={() => selectSuggestion(activeInput, place)}>
                    <div className="icon-wrapper"><MapPin size={20} color="var(--text-dim)" /></div>
                    <span style={{ fontWeight: '600', fontSize: '1.05rem' }}>{place.name}</span>
                  </div>
                ))
              ) : (
                (activeInput === 'from' ? fromSuggestions : toSuggestions).map((place, idx) => (
                  <div key={idx} className="search-result-item" onClick={() => selectSuggestion(activeInput, place)}>
                    <div className="icon-wrapper">
                      {place.type === 'stop' ? <BusFront size={20} color="var(--primary)" /> : <MapPin size={20} color="var(--text-dim)" />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: '600', fontSize: '1.05rem', color: 'var(--text-main)' }}>{place.name}</span>
                      {place.detail && <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '-2px' }}>{place.detail}</span>}
                      {place.type === 'stop' && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>Otobüs Durağı</span>}
                      {place.type === 'tomtom' && <span style={{ fontSize: '0.75rem', color: '#DF1B12', fontWeight: '700', textTransform: 'uppercase' }}>İşletme (TomTom)</span>}
                      {place.type === 'map' && <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase' }}>Haritadan Sonuç</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
