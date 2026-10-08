import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { allStopsDB } from '../data/db';

const createCustomIcon = (svgString, color) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        background-color: ${color}; 
        width: 32px; 
        height: 32px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        border-radius: 50%; 
        border: 3px solid white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
        color: white;
      ">
        ${svgString}
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 10px solid ${color};
        margin: -2px auto 0 auto;
        filter: drop-shadow(0px 3px 2px rgba(0,0,0,0.2));
      "></div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42]
  });
};

const userLocationSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
const destinationSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`;
const busStopSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><circle cx="15" cy="18" r="2"/></svg>`;
const transferSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 14 4-4-4-4"/><path d="M2 10h20"/><path d="m6 10-4 4 4 4"/><path d="M22 14H2"/></svg>`;

const customIcons = {
  start: createCustomIcon(userLocationSvg, '#10b981'),
  end: createCustomIcon(destinationSvg, '#ef4444'),
  busStart: createCustomIcon(busStopSvg, '#3b82f6'),
  transfer: createCustomIcon(transferSvg, '#f59e0b')
};

function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && Number.isFinite(center[0]) && Number.isFinite(center[1])) {
      map.flyTo(center, zoom || 14, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

function MapResizeHandler({ isVisible }) {
  const map = useMap();
  useEffect(() => {
    if (isVisible) {
      setTimeout(() => map.invalidateSize(), 150);
      setTimeout(() => map.invalidateSize(), 400);
    }
  }, [isVisible, map]);
  return null;
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

const MapArea = React.memo(function MapArea({
  mapCenter, mapZoom, hasSearched, mapSelectionMode, onMapClick,
  fromLocation, toLocation, activeRoute, walkingPathStart, walkingPathEnd,
  activeLineData, isSplitLayout
}) {
  const safeMapCenter = (Array.isArray(mapCenter) && mapCenter.length === 2 && Number.isFinite(mapCenter[0]) && Number.isFinite(mapCenter[1])) 
    ? mapCenter 
    : [41.6771, 26.5557];

  const isValidCoord = (coord) => Array.isArray(coord) && coord.length >= 2 && Number.isFinite(coord[0]) && Number.isFinite(coord[1]);

  const validGeom1 = useMemo(() => {
    const g = activeRoute?.routeGeometry1 || activeRoute?.routeGeometry || [];
    return g.filter(isValidCoord);
  }, [activeRoute?.id]);

  const validGeom2 = useMemo(() => {
    const g = activeRoute?.routeGeometry2 || [];
    return g.filter(isValidCoord);
  }, [activeRoute?.id]);

  const validMainGeom = useMemo(() => {
    const g = activeRoute?.routeGeometry || [];
    return g.filter(isValidCoord);
  }, [activeRoute?.id]);

  return (
    <div className="desktop-map-area">
      <div className={`map-container-wrapper animate-in ${!isSplitLayout ? 'mobile-hidden' : ''}`} style={{ animationDelay: '100ms' }}>
        <MapContainer
          center={safeMapCenter}
          zoom={mapZoom}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
          preferCanvas={true}
        >
          <TileLayer
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            attribution='&copy; Google Maps'
          />
          <MapUpdater center={safeMapCenter} zoom={mapZoom} />
          <MapResizeHandler isVisible={isSplitLayout} />
          <MapClickHandler onMapClick={onMapClick} />

          {isValidCoord([fromLocation.lat, fromLocation.lon]) && (
            <Marker position={[fromLocation.lat, fromLocation.lon]} icon={customIcons.start}>
              <Popup><b>Başlangıç:</b><br/>{fromLocation.name}</Popup>
            </Marker>
          )}

          {isValidCoord([toLocation.lat, toLocation.lon]) && (
            <Marker position={[toLocation.lat, toLocation.lon]} icon={customIcons.end}>
              <Popup><b>Hedef:</b><br/>{toLocation.name}</Popup>
            </Marker>
          )}

          {hasSearched && activeRoute && (
            <>
              {isValidCoord([activeRoute.startStop?.lat, activeRoute.startStop?.lon]) && (
                <Marker key={`sstop_${activeRoute.id}`} position={[activeRoute.startStop.lat, activeRoute.startStop.lon]} icon={customIcons.busStart}>
                  <Popup><b>Biniş Durağı:</b><br/>{activeRoute.startStop.name}</Popup>
                </Marker>
              )}
              {isValidCoord([activeRoute.endStop?.lat, activeRoute.endStop?.lon]) && (
                <Marker key={`estop_${activeRoute.id}`} position={[activeRoute.endStop.lat, activeRoute.endStop.lon]} icon={customIcons.busStart}>
                  <Popup><b>İniş Durağı:</b><br/>{activeRoute.endStop.name}</Popup>
                </Marker>
              )}

              {walkingPathStart.length > 0 && (
                <Polyline key={`walk_start_${activeRoute.id}`} positions={walkingPathStart} pathOptions={{ color: '#64748b', dashArray: '5, 8', weight: 4 }} />
              )}
              {walkingPathEnd.length > 0 && (
                <Polyline key={`walk_end_${activeRoute.id}`} positions={walkingPathEnd} pathOptions={{ color: '#64748b', dashArray: '5, 8', weight: 4 }} />
              )}
              
              {activeRoute.isTransfer ? (
                <>
                  {validGeom1.length > 0 && (
                    <Polyline key={`geom1_${activeRoute.id}`} positions={validGeom1} pathOptions={{ color: activeRoute.color || '#3b82f6', weight: 5, opacity: 0.9 }} />
                  )}
                  {isValidCoord([activeRoute.transferStop?.lat, activeRoute.transferStop?.lon]) && (
                    <Marker key={`tstop_${activeRoute.id}`} position={[activeRoute.transferStop.lat, activeRoute.transferStop.lon]} icon={customIcons.transfer}>
                      <Popup><b>Aktarma Durağı:</b><br/>{activeRoute.transferStop.name}</Popup>
                    </Marker>
                  )}
                  {validGeom2.length > 0 && (
                    <Polyline key={`geom2_${activeRoute.id}`} positions={validGeom2} pathOptions={{ color: activeRoute.color2 || '#ef4444', weight: 5, opacity: 0.9 }} />
                  )}
                </>
              ) : (
                <>
                  {validMainGeom.length > 0 && (
                    <Polyline key={`geom_${activeRoute.id}`} positions={validMainGeom} pathOptions={{ color: activeRoute.color || activeRoute.routes?.[0]?.color || '#3b82f6', weight: 5, opacity: 0.9 }} />
                  )}
                </>
              )}

              {activeRoute.passedStopCoords && activeRoute.passedStopCoords.length > 0 && activeRoute.passedStopCoords.map((coord, i) => {
                if (isValidCoord([coord[0], coord[1]])) {
                  return (
                    <CircleMarker key={`passed_${activeRoute.id}_${i}`} center={[coord[0], coord[1]]} radius={4} pathOptions={{ color: '#fff', fillColor: '#94a3b8', fillOpacity: 1, weight: 1 }}>
                      <Popup>{coord[2]}</Popup>
                    </CircleMarker>
                  );
                }
                return null;
              })}
            </>
          )}

          {activeLineData && activeLineData.directions?.[0] && (
             <>
               {/* Draw the main route line with a glowing effect */}
               <Polyline 
                 positions={activeLineData.directions[0].path} 
                 pathOptions={{ color: activeLineData.color, weight: 6, opacity: 0.8 }} 
               />
               <Polyline 
                 positions={activeLineData.directions[0].path} 
                 pathOptions={{ color: '#ffffff', weight: 2, opacity: 0.5 }} 
               />

               {/* Draw glowing stops */}
               {activeLineData.directions[0].stopIds.map((sid, i) => {
                 const stop = allStopsDB[sid];
                 if (!stop) return null;
                 return (
                   <CircleMarker 
                     key={`line_stop_${sid}_${i}`} 
                     center={[stop.lat, stop.lon]} 
                     radius={5} 
                     pathOptions={{ color: '#fff', fillColor: activeLineData.color, fillOpacity: 1, weight: 2 }}
                   >
                     <Popup><b>{stop.name}</b></Popup>
                   </CircleMarker>
                 )
               })}
             </>
          )}

        </MapContainer>
      </div>
    </div>
  );
});

export default MapArea;
