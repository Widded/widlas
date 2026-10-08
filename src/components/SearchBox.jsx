import React, { useRef, useEffect } from 'react';
import { Search, Map as MapIcon, ArrowUpDown, LocateFixed, ArrowLeft, MapPin, BusFront, X } from 'lucide-react';

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
  const fromInputRef = useRef(null);
  const toInputRef = useRef(null);

  useEffect(() => {
    if (activeInput === 'from' && fromInputRef.current) fromInputRef.current.focus();
    if (activeInput === 'to' && toInputRef.current) toInputRef.current.focus();
  }, [activeInput]);

  return (
    <div className="premium-card animate-in" style={{ animationDelay: '50ms' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
         {activeInput && (
           <button className="action-pill" style={{ padding: '8px', border: 'none', background: 'transparent' }} onClick={() => setActiveInput(null)}>
             <ArrowLeft size={20} color="var(--text-main)" />
           </button>
         )}
         <h2 className="search-title" style={{ margin: 0, fontSize: '1.15rem' }}>
           {activeInput === 'from' ? 'Başlangıç Noktası Ara' : activeInput === 'to' ? 'Varış Noktası Ara' : (!isSplitLayout ? 'Nereye gidiyoruz?' : 'Rota Bul')}
         </h2>
      </div>

      <div className="search-widget" style={{ borderColor: activeInput ? 'var(--primary)' : 'var(--border-color)', boxShadow: activeInput ? '0 0 0 2px rgba(59,130,246,0.3)' : 'var(--shadow-sm)' }}>
        <div className="search-timeline">
          <div className="dot-start"></div>
          <div className="timeline-line"></div>
          <div className="dot-end"></div>
        </div>

        <div className="search-inputs">
          <div className="input-row" onClick={() => setActiveInput('from')}>
            <input 
              ref={fromInputRef}
              className="modern-input" 
              placeholder="Başlangıç noktası..." 
              value={fromLocation.name} 
              onChange={(e) => handleInputChange(e, 'from')}
              readOnly={activeInput !== 'from'}
              style={{ flex: 1 }}
            />
            {activeInput === 'from' && fromLocation.name && (
               <X size={16} color="var(--text-dim)" onClick={(e) => { e.stopPropagation(); handleInputChange({target: {value: ''}}, 'from'); }} style={{cursor:'pointer', marginRight:'12px'}}/>
            )}
          </div>
          <div className="input-divider"></div>
          <div className="input-row" onClick={() => setActiveInput('to')}>
            <input 
              ref={toInputRef}
              className="modern-input" 
              placeholder="Nereye gitmek istiyorsunuz?" 
              value={toLocation.name} 
              onChange={(e) => handleInputChange(e, 'to')}
              readOnly={activeInput !== 'to'}
              style={{ flex: 1 }}
            />
            {activeInput === 'to' && toLocation.name && (
               <X size={16} color="var(--text-dim)" onClick={(e) => { e.stopPropagation(); handleInputChange({target: {value: ''}}, 'to'); }} style={{cursor:'pointer', marginRight:'12px'}}/>
            )}
          </div>
        </div>

        <button className="swap-btn" onClick={swapLocations}>
          <ArrowUpDown size={18} />
        </button>
      </div>

      {activeInput ? (
        <div className="suggestions-list animate-in fade-in slide-in-from-top-2" style={{ marginTop: '24px' }}>
          <div className="quick-actions" style={{ marginBottom: '24px' }}>
             <button className="action-pill" onClick={() => { getUserLocation(); setActiveInput(null); }}>
               <LocateFixed size={16} color="var(--primary)" /> Konumum
             </button>
             <button className="action-pill" onClick={() => { setMapSelectionMode(activeInput); setActiveInput(null); }}>
               <MapIcon size={16} color="var(--primary)" /> Haritadan Seç
             </button>
          </div>
          
          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
            {(activeInput === 'from' ? fromSuggestions : toSuggestions).length === 0 ? 'Popüler Noktalar' : 'Arama Sonuçları'}
          </h4>
          
          {(activeInput === 'from' ? fromSuggestions : toSuggestions).length === 0 ? (
            localPlaces.map((place, idx) => (
              <div key={'pop_' + idx} className="search-result-item" onClick={() => { selectSuggestion(activeInput, place); setActiveInput(null); }}>
                <div className="icon-wrapper"><MapPin size={20} color="var(--text-dim)" /></div>
                <span style={{ fontWeight: '600', fontSize: '1.05rem' }}>{place.name}</span>
              </div>
            ))
          ) : (
            (activeInput === 'from' ? fromSuggestions : toSuggestions).map((place, idx) => (
              <div key={idx} className="search-result-item" onClick={() => { selectSuggestion(activeInput, place); setActiveInput(null); }}>
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
      ) : (
        <>
          <div className="quick-actions" style={{ marginTop: '20px' }}>
            <button className="action-pill" onClick={getUserLocation}>
              <LocateFixed size={16} color="var(--primary)" /> Konumum
            </button>
            <button className="action-pill" onClick={() => setMapSelectionMode(fromLocation.lat ? 'to' : 'from')}>
              <MapIcon size={16} color="var(--primary)" /> Haritadan Seç
            </button>
          </div>

          <button className="btn-primary" style={{ marginTop: '20px' }} onClick={() => { handleSearch(); setActiveInput(null); }}>
            Rotayı Güncelle
          </button>
        </>
      )}
    </div>
  );
}
