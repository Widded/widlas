import React from 'react';
import { Footprints, ArrowRight, BusFront } from 'lucide-react';
import RouteItinerary, { terminalOf, buildItinerary } from './RouteItinerary';

const fmtWalk = (m) => m > 1000 ? (m / 1000).toFixed(1) + 'km' : Math.round(m) + 'm';

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
  fareType
}) {
  if (!hasSearched || !searchResults) return null;

  return (
    <div className="animate-in" style={{ animationDelay: '150ms', marginTop: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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
                ? `transfer_${route.startStop.name}_${route.transferStop.name}_${route.endStop.name}`
                : `direct_${route.startStop.name}_${route.endStop.name}`;
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
              
              const itin = isSelected && isExpanded ? buildItinerary(activeRouteObj, getWalk(activeRouteObj, isSelected), new Date()) : null;

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
                            {routeGroup.groupedLines.map((r, i) => (
                              <React.Fragment key={i}>
                                {i > 0 && <span style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: '0 4px', fontWeight: 400 }}>/</span>}
                                {r.isTransfer ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <span className="bus-badge" style={{ background: r.color }}>{r.line1}</span>
                                    {r.transferWalkDistance > 0 && (
                                      <>
                                        <ArrowRight size={14} color="var(--text-muted)" />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-muted)' }}>
                                          <Footprints size={13} /> <span>({fmtWalk(r.transferWalkDistance)})</span>
                                        </div>
                                      </>
                                    )}
                                    <ArrowRight size={14} color="var(--text-muted)" />
                                    <span className="bus-badge" style={{ background: r.color2 }}>{r.line2}</span>
                                  </div>
                                ) : (
                                  <span className="bus-badge" style={{ background: r.color || 'var(--primary)' }}>{r.name}</span>
                                )}
                              </React.Fragment>
                            ))}
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
                        {routeGroup.isWalkOnly ? "Ücretsiz" : (fareType === 'ogrenci' ? '16.50 ₺' : '23.00 ₺')}
                      </span>
                    </div>
                  </div>

                  {!isExpanded && (
                    <div className="route-compact">
                      <span><Footprints size={13} style={{ verticalAlign: '-2px' }} /> <b>{routeGroup.walkStartMins} dk</b> yürü (Biniş: <b>{routeGroup.startStop?.name}</b>)</span>
                      {routeGroup.isTransfer && <span>Aktarma: <b>{routeGroup.transferStop?.name}</b></span>}
                      <span>İniş: <b>{routeGroup.endStop?.name}</b> (<Footprints size={13} style={{ verticalAlign: '-2px' }} /> <b>{routeGroup.walkEndMins} dk</b> yürü)</span>
                      {routeGroup.legs?.[0] && <span>Yön: <b>{terminalOf(routeGroup.legs[0].headSign)}</b></span>}
                      {isSelected && (
                          <button 
                            className="btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '0.85rem', marginTop: '8px', alignSelf: 'flex-start', borderRadius: '6px' }}
                            onClick={(e) => { e.stopPropagation(); setExpandedRouteId(routeGroup.groupId); }}
                          >
                            Detayları Göster
                          </button>
                      )}
                      {!isSelected && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Seçmek için dokun</span>}
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
