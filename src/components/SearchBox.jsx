import React, { useRef, useEffect, useState } from 'react';
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
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      if (activeInput === 'from' && fromInputRef.current) fromInputRef.current.focus();
      if (activeInput === 'to' && toInputRef.current) toInputRef.current.focus();
    }
  }, [activeInput, isDesktop]);

  const renderSuggestions = (closeOnSelect = false) => {
    const suggestions = activeInput === 'from' ? fromSuggestions : toSuggestions;
    const isPopular = suggestions.length === 0;
    
    return (
      <>
        <h4 style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
          {isPopular ? 'Popüler Noktalar' : 'Arama Sonuçları'}
        </h4>
        
        {isPopular ? (
          localPlaces.map((place, idx) => (
            <div key={'pop_' + idx} className="search-result-item" onClick={() => { selectSuggestion(activeInput, place); if(closeOnSelect) setActiveInput(null); }}>
              <div className="icon-wrapper"><MapPin size={20} color="var(--text-dim)" /></div>
              <span style={{ fontWeight: '600', fontSize: '1.05rem' }}>{place.name}</span>
            </div>
          ))
        ) : (
          suggestions.map((place, idx) => (
            <div key={idx} className="search-result-item" onClick={() => { selectSuggestion(activeInput, place); if(closeOnSelect) setActiveInput(null); }}>
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
      </>
    );
  };

  return (
    <>
      {(!hasSearched || isDesktop || (!isDesktop && activeInput)) && (
        <div className="premium-card animate-in" style={{ animationDelay: '50ms', padding: (!isDesktop && activeInput) ? '0' : '16px' }}>
          
          {/* Mobile Sticky Header */}
          {!isDesktop && activeInput ? (
            <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface)', padding: '16px', borderBottom: '1px solid var(--border-color)', borderTopLeftRadius: 'var(--radius-lg)', borderTopRightRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                 <button className="action-pill" style={{ padding: '8px', border: 'none', background: 'transparent' }} onClick={() => setActiveInput(null)}>
                   <ArrowLeft size={20} color="var(--text-main)" />
                 </button>
                 <h2 className="search-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                   {activeInput === 'from' ? 'Başlangıç Noktası Ara' : 'Varış Noktası Ara'}
                 </h2>
              </div>
              
              <div className="search-widget" style={{ borderColor: 'var(--primary)', boxShadow: '0 0 0 2px rgba(59,130,246,0.3)' }}>
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
            </div>
          ) : (
            <>
              {(!isDesktop || !activeInput) && (
                <>
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
            </>
          )}

          {/* Mobile Suggestions List (Not Sticky) */}
          {!isDesktop && activeInput && (
            <div className="suggestions-list animate-in fade-in slide-in-from-top-2" style={{ padding: '24px 16px' }}>
              <div className="quick-actions" style={{ marginBottom: '24px' }}>
                 <button className="action-pill" onClick={() => { getUserLocation(); setActiveInput(null); }}>
                   <LocateFixed size={16} color="var(--primary)" /> Konumum
                 </button>
                 <button className="action-pill" onClick={() => { setMapSelectionMode(activeInput); setActiveInput(null); }}>
                   <MapIcon size={16} color="var(--primary)" /> Haritadan Seç
                 </button>
              </div>
              
              {renderSuggestions(true)}
            </div>
          )}
        </div>
      )}

      {/* Desktop Modal Overlay */}
      {isDesktop && activeInput && (
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
              {renderSuggestions(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
