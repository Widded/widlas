import React from 'react';
import { Footprints, ArrowRight, BusFront } from 'lucide-react';
import RouteItinerary, { terminalOf, buildItinerary } from './RouteItinerary';
import { calculateFare, formatFare } from '../data/fares';

const fmtWalk = (km) => {
  const m = km * 1000;
  return m > 1000 ? (m / 1000).toFixed(1) + 'km' : Math.round(m) + 'm';
};

export default function RouteList({
  searchResults,
  selectedRouteIndex,
  setSelectedRouteIndex,
  expandedRouteId,
  setExpandedRouteId,
  activeSubRouteId,
  setActiveSubRouteId,
  hasSearched,
  setHasSearched,
  fromLocation,
  toLocation,
  focusOnMap,
  getWalk,
  fareType,
  setSheetState
}) {
  if (!hasSearched || !searchResults) return null;

  return (
    <div className="animate-in" style={{ animationDelay: '150ms', marginTop: '12px' }}>
      {/* Rota Özeti Çubuğu (Tıklayınca aramayı düzenler) */}
      <div 
        className="journey-summary-bar" 
        onClick={() => setHasSearched(false)} 
        title="Aramayı düzenlemek için dokun"
      >
        <div className="journey-path">
          <div className="journey-node">
            <span className="journey-dot start" />
            <span>{fromLocation.name || 'Konumunuz'}</span>
          </div>
          <ArrowRight size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
          <div className="journey-node">
            <span className="journey-dot end" />
            <span>{toLocation.name || 'Hedef'}</span>
          </div>
        </div>
        <button 
          className="journey-edit-btn" 
          onClick={(e) => { e.stopPropagation(); setHasSearched(false); }}
        >
          Değiştir
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: '800' }}>Önerilen Rotalar</h2>
        <button className="action-pill" onClick={() => setHasSearched(false)}>Yeni Arama</button>
      </div>

      {searchResults.routes && searchResults.routes.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {(() => {
            const groupedRoutes = [];
            const groupMap = new Map();
            searchResults.routes.forEach((route, idx) => {
              const key = route.isTransfer 
                ? `transfer_${route.line1}_${route.startStop?.name}_${route.transferStop?.name}_${route.endStop?.name}`
                : `direct_${route.startStop?.name || 'walk'}_${route.endStop?.name || 'walk'}`;
              if (!groupMap.has(key)) {
                groupMap.set(key, {
                  ...route,
                  groupId: key,
                  originalIdx: idx,
                  groupedLines: [route]
                });
              } else {
                groupMap.get(key).groupedLines.push(route);
              }
            });
            groupedRoutes.push(...groupMap.values());

            return groupedRoutes.map((routeGroup) => {
              const idx = routeGroup.originalIdx;
              const isSelected = selectedRouteIndex === idx;
              const isExpanded = expandedRouteId === routeGroup.groupId;
              
              const activeSubIndex = activeSubRouteId?.startsWith(routeGroup.groupId) ? parseInt(activeSubRouteId.split('_').pop()) : 0;
              const activeRouteObj = (isExpanded && routeGroup.groupedLines[activeSubIndex]) ? routeGroup.groupedLines[activeSubIndex] : routeGroup;
              
              // Her zaman itin'i hesapla ki süre atlaması (jump) olmasın
              const itin = buildItinerary(activeRouteObj, getWalk(activeRouteObj, isSelected), new Date());
              
              const getFareText = () => {
                if (routeGroup.isWalkOnly) return "Ücretsiz";
                const totalFare = calculateFare(fareType, routeGroup.isTransfer);
                return formatFare(totalFare);
              };

              return (
                <div 
                  key={routeGroup.groupId} 
                  className={`route-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => { setSelectedRouteIndex(idx); if (!isSelected) setExpandedRouteId(null); }}
                  style={{
                    borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                    backgroundColor: isSelected ? 'var(--surface-hover)' : 'var(--surface)',
                    borderWidth: isSelected ? '2px' : '1px',
                    padding: isSelected ? '15px' : '16px',
                    cursor: isSelected ? 'default' : 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', flex: 1 }}>
                      {routeGroup.isWalkOnly ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981' }}>
                          <Footprints size={16} /> <span>Sadece Yürüme ({fmtWalk(routeGroup.walkDistanceStart)})</span>
                        </div>
                      ) : (
                        <>
                          {routeGroup.walkDistanceStart > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)' }}>
                              <Footprints size={14} /> <span>({fmtWalk(routeGroup.walkDistanceStart)})</span>
                              <ArrowRight size={14} color="var(--text-muted)" style={{ marginLeft: '2px' }} />
                            </div>
                          )}

                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                            {routeGroup.isTransfer ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                <span className="bus-badge" style={{ background: routeGroup.color }}>{routeGroup.line1}</span>
                                {routeGroup.transferWalkDistance > 0 && (
                                  <>
                                    <ArrowRight size={14} color="var(--text-muted)" />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-muted)' }}>
                                      <Footprints size={13} /> <span>({fmtWalk(routeGroup.transferWalkDistance)})</span>
                                    </div>
                                  </>
                                )}
                                <ArrowRight size={14} color="var(--text-muted)" />
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                                  {routeGroup.groupedLines.map((r, i) => (
                                    <React.Fragment key={'t_' + i}>
                                      {i > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: '0 2px' }}>/</span>}
                                      <span className="bus-badge" style={{ background: r.color2 }}>{r.line2}</span>
                                    </React.Fragment>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                                {routeGroup.groupedLines.map((r, i) => (
                                  <React.Fragment key={'d_' + i}>
                                    {i > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: '0 2px' }}>/</span>}
                                    <span className="bus-badge" style={{ background: r.color || 'var(--primary)' }}>{r.name}</span>
                                  </React.Fragment>
                                ))}
                              </div>
                            )}
                          </div>

                          {routeGroup.walkDistanceEnd > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted)' }}>
                              <ArrowRight size={14} color="var(--text-muted)" />
                              <Footprints size={14} /> <span>({fmtWalk(routeGroup.walkDistanceEnd)})</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '12px' }}>
                      <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                        {itin ? itin.totalMin : routeGroup.totalTime} dk
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', whiteSpace: 'nowrap' }}>
                        Tahmini
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600', marginTop: '6px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {getFareText()}
                      </span>
                    </div>
                  </div>

                  {!isExpanded && (
                    <div className="route-compact" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                      {!routeGroup.isWalkOnly && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{routeGroup.startStop?.name}</span>
                          <ArrowRight size={12} opacity={0.6} />
                          {routeGroup.isTransfer && (
                             <>
                               {routeGroup.legs?.[0]?.toStop?.name !== routeGroup.transferStop?.name ? (
                                 <>
                                   <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{routeGroup.legs?.[0]?.toStop?.name}</span>
                                   <ArrowRight size={12} opacity={0.6} />
                                   <Footprints size={12} opacity={0.6} />
                                   <ArrowRight size={12} opacity={0.6} />
                                   <span style={{ fontWeight: 600, color: '#f59e0b' }}>{routeGroup.transferStop?.name}</span>
                                 </>
                               ) : (
                                 <span style={{ fontWeight: 600, color: '#f59e0b' }}>{routeGroup.transferStop?.name}</span>
                               )}
                               <ArrowRight size={12} opacity={0.6} />
                             </>
                          )}
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{routeGroup.endStop?.name}</span>
                        </div>
                      )}

                      {isSelected && (
                          <button 
                            className="btn-primary" 
                            style={{ padding: '8px 16px', fontSize: '0.85rem', alignSelf: 'flex-start', borderRadius: '8px', width: '100%', textAlign: 'center', marginTop: '4px' }}
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setExpandedRouteId(routeGroup.groupId); 
                              if (setSheetState) setSheetState('full');
                            }}
                          >
                            Detayları Göster
                          </button>
                      )}
                      {!isSelected && <span style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem', marginTop: '2px' }}>Seçmek için dokun</span>}
                    </div>
                  )}
                  
                  {isSelected && isExpanded && itin && (
                    <>
                      {routeGroup.groupedLines.length > 1 && (
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                          {routeGroup.groupedLines.map((r, subIdx) => {
                              const isActive = activeSubIndex === subIdx;
                              return (
                                <button 
                                  key={subIdx} 
                                  onClick={(e) => { e.stopPropagation(); setActiveSubRouteId(`${routeGroup.groupId}_${subIdx}`); }}
                                  style={{ 
                                    padding: '6px 10px', borderRadius: '6px', border: isActive ? `2px solid ${r.color || 'var(--primary)'}` : '1px solid var(--border-color)', 
                                    background: isActive ? 'var(--primary-light)' : 'transparent',
                                    color: 'var(--text-main)', fontWeight: isActive ? '700' : '500',
                                    fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap',
                                    display: 'flex', alignItems: 'center', gap: '4px'
                                  }}
                                >
                                  <BusFront size={14} color={r.color || 'var(--primary)'} />
                                  {r.isTransfer ? `${r.line1}➔${r.line2}` : r.name} Detayı
                                </button>
                              );
                          })}
                        </div>
                      )}
                      <RouteItinerary
                        itin={itin}
                        fromName={fromLocation.name}
                        toName={toLocation.name}
                        fromCoord={{ lat: fromLocation.lat, lon: fromLocation.lon }}
                        toCoord={{ lat: toLocation.lat, lon: toLocation.lon }}
                        onFocus={focusOnMap}
                      />
                      <button 
                          className="action-pill" 
                          style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
                          onClick={(e) => { e.stopPropagation(); setExpandedRouteId(null); }}
                        >
                          Detayları Gizle
                      </button>
                    </>
                  )}
                </div>
              );
            });
          })()}
        </div>
      ) : (
        <div className="premium-card" style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '12px' }}>Sonuç Bulunamadı</h3>
          <p style={{ color: 'var(--text-muted)' }}>Seçtiğiniz konumlar arasında doğrudan bir otobüs hattı bulunmamaktadır.</p>
        </div>
      )}
    </div>
  );
}
