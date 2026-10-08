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
  getWalk
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
            // Rotaları aynı hatları gruplayarak göster
            const groupedRoutes = [];
            searchResults.routes.forEach((r, idx) => {
              const groupId = r.startStop?.name + r.endStop?.name + (r.transferStop?.name || '') + (r.isWalkOnly ? 'walk' : '');
              let existing = groupedRoutes.find(g => g.groupId === groupId);
              if (!existing) {
                existing = {
                  groupId,
                  idxList: [],
                  groupedLines: [],
                  startStop: r.startStop,
                  endStop: r.endStop,
                  transferStop: r.transferStop,
                  walkStartMins: r.walkStartMins,
                  walkEndMins: r.walkEndMins,
                  walkDistanceStart: r.walkDistanceStart,
                  walkDistanceEnd: r.walkDistanceEnd,
                  totalTime: r.totalTime,
                  isTransfer: r.isTransfer,
                  isWalkOnly: r.isWalkOnly,
                  legs: r.legs
                };
                groupedRoutes.push(existing);
              }
              existing.idxList.push(idx);
              if (r.isWalkOnly) {
                existing.groupedLines.push({ name: 'Sadece Yürüme', isWalkOnly: true });
              } else if (r.isTransfer) {
                existing.groupedLines.push({ 
                  line1: r.routes[0].name, color: r.color, 
                  line2: r.routes[1].name, color2: r.color2, 
                  isTransfer: true,
                  transferWalkDistance: r.transferWalkDistance
                });
              } else {
                existing.groupedLines.push({ name: r.routes[0].name, color: r.color });
              }
            });

            return groupedRoutes.map((routeGroup) => {
              const baseIdx = routeGroup.idxList[0];
              const isSelected = routeGroup.idxList.includes(selectedRouteIndex);
              const isExpanded = expandedRouteId === routeGroup.groupId;
              
              let activeSubIndex = 0;
              if (isSelected && activeSubRouteId && activeSubRouteId.startsWith(routeGroup.groupId)) {
                activeSubIndex = parseInt(activeSubRouteId.split('_')[1]);
              }
              const actualRouteIndex = routeGroup.idxList[activeSubIndex] || routeGroup.idxList[0];
              
              // Only call selected route indexing if it's currently selected
              const itin = isSelected && isExpanded ? searchResults.itineraries?.[actualRouteIndex] : null;

              return (
                <div 
                  key={routeGroup.groupId} 
                  className={`route-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => { setSelectedRouteIndex(baseIdx); if (!isSelected) setExpandedRouteId(null); }}
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
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-dim)' }}>
                              <Footprints size={14} /> <span>({fmtWalk(routeGroup.walkDistanceStart)})</span>
                              <ArrowRight size={14} color="var(--text-dim)" style={{ marginLeft: '2px' }} />
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
                                        <ArrowRight size={14} color="var(--text-dim)" />
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--text-dim)' }}>
                                          <Footprints size={13} /> <span>({fmtWalk(r.transferWalkDistance)})</span>
                                        </div>
                                      </>
                                    )}
                                    <ArrowRight size={14} color="var(--text-dim)" />
                                    <span className="bus-badge" style={{ background: r.color2 }}>{r.line2}</span>
                                  </div>
                                ) : (
                                  <span className="bus-badge" style={{ background: r.color || 'var(--primary)' }}>{r.name}</span>
                                )}
                              </React.Fragment>
                            ))}
                          </div>

                          {routeGroup.walkDistanceEnd > 0 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-dim)' }}>
                              <ArrowRight size={14} color="var(--text-dim)" />
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
