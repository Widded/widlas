import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { allStopsDB } from '../data/db';
import { getLineColor } from '../lib/lineColors';

// Helper: Calculate travel bearing between two coordinates (degrees)
function getBearing(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
  const dLat1 = (lat1 * Math.PI) / 180;
  const dLat2 = (lat2 * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(dLat2);
  const x = Math.cos(dLat1) * Math.sin(dLat2) -
    Math.sin(dLat1) * Math.cos(dLat2) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return Math.round((brng + 360) % 360);
}

function getDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Pusula açısını Türkçe yön kısaltmasına çevirir (K, KD, D...)
const CARDINAL_DIRECTIONS = ['K', 'KD', 'D', 'GD', 'G', 'GB', 'B', 'KB'];
function headingToCardinal(deg) {
  return CARDINAL_DIRECTIONS[Math.round(((deg % 360) + 360) % 360 / 45) % 8];
}

// Rota çizgisi boyunca yön okları üretir.
function buildDirectionArrows(points, { maxArrows = 12, minSpacingM = 220 } = {}) {
  if (!Array.isArray(points) || points.length < 2) return [];

  const cumulative = [0];
  for (let i = 1; i < points.length; i += 1) {
    const [lat1, lon1] = points[i - 1];
    const [lat2, lon2] = points[i];
    if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return [];
    cumulative.push(cumulative[i - 1] + getDistanceMeters(lat1, lon1, lat2, lon2));
  }

  const total = cumulative[cumulative.length - 1];
  if (total < 40) return [];

  const count = Math.min(maxArrows, Math.max(1, Math.floor(total / minSpacingM)));
  const spacing = total / (count + 1);
  const arrows = [];

  for (let i = 1; i <= count; i += 1) {
    const target = spacing * i;
    let segment = 1;
    while (segment < cumulative.length && cumulative[segment] < target) segment += 1;
    if (segment >= points.length) break;

    const segmentLength = Math.max(1, cumulative[segment] - cumulative[segment - 1]);
    const t = (target - cumulative[segment - 1]) / segmentLength;
    const [lat1, lon1] = points[segment - 1];
    const [lat2, lon2] = points[segment];
    const lat = lat1 + (lat2 - lat1) * t;
    const lon = lon1 + (lon2 - lon1) * t;
    const bearing = getBearing(lat1, lon1, lat2, lon2);

    arrows.push({ lat, lon, bearing });
  }

  return arrows;
}

// Rota üzerinde belirli bir orana denk gelen noktayı bulur (hat etiketi için).
function pointAlongPath(points, fraction) {
  if (!Array.isArray(points) || points.length < 2) return null;

  const cumulative = [0];
  for (let i = 1; i < points.length; i += 1) {
    const [lat1, lon1] = points[i - 1];
    const [lat2, lon2] = points[i];
    if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;
    cumulative.push(cumulative[i - 1] + getDistanceMeters(lat1, lon1, lat2, lon2));
  }

  const total = cumulative[cumulative.length - 1];
  if (total < 1) return null;

  const target = total * fraction;
  let segment = 1;
  while (segment < cumulative.length && cumulative[segment] < target) segment += 1;
  if (segment >= points.length) segment = points.length - 1;

  const segmentLength = Math.max(1, cumulative[segment] - cumulative[segment - 1]);
  const t = (target - cumulative[segment - 1]) / segmentLength;
  const [lat1, lon1] = points[segment - 1];
  const [lat2, lon2] = points[segment];

  return {
    lat: lat1 + (lat2 - lat1) * t,
    lon: lon1 + (lon2 - lon1) * t
  };
}

// Marker Icons Generators
const createStartStopIcon = (color = '#0D9488') => {
  return L.divIcon({
    className: '',
    html: `
      <div class="start-stop-badge" style="border-color: ${color}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 6v6"></path><path d="M15 6v6"></path><path d="M2 12h19.6"></path>
          <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"></path>
          <circle cx="7" cy="18" r="2"></circle><circle cx="15" cy="18" r="2"></circle>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16]
  });
};

const createEndStopIcon = (color = '#0D9488') => {
  return L.divIcon({
    className: '',
    html: `
      <div class="end-stop-badge" style="border-color: ${color}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16]
  });
};

const createTransferStopIcon = (color1 = '#0D9488', color2 = '#F59E0B') => {
  return L.divIcon({
    className: '',
    html: `
      <div class="transfer-stop-badge" style="background: linear-gradient(135deg, ${color1} 0 50%, ${color2} 50% 100%)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16]
  });
};

const createIntermediateStopIcon = (bearing, color = '#3B82F6') => {
  return L.divIcon({
    className: '',
    html: `
      <div class="stop-badge" style="border-color: ${color}">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(${bearing}deg)">
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -12]
  });
};

const createDirectionArrowIcon = (color, bearing) => {
  return L.divIcon({
    className: '',
    html: `
      <div class="route-direction-arrow" style="transform: rotate(${bearing}deg)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="${color}" stroke="#FFFFFF" stroke-width="2.2" stroke-linejoin="round">
          <path d="M12 3l7 10h-4v8h-6v-8H5z"></path>
        </svg>
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};

const createLineLabelIcon = (code, color) => {
  const width = Math.max(32, String(code || '').length * 8 + 16);
  return L.divIcon({
    className: '',
    html: `<div class="route-line-label" style="border-color: ${color}">${code}</div>`,
    iconSize: [width, 22],
    iconAnchor: [width / 2, 11]
  });
};


const createPinIcon = (color, isDestination = false) => {
  return L.divIcon({
    className: '',
    html: `
      <div class="custom-pin">
        <div class="pin-bubble" style="background: ${color}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            ${isDestination 
              ? '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" x2="4" y1="22" y2="15"></line>'
              : '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle>'
            }
          </svg>
        </div>
        <div class="pin-arrow" style="border-top-color: ${color}"></div>
      </div>
    `,
    iconSize: [30, 34],
    iconAnchor: [15, 34],
    popupAnchor: [0, -36]
  });
};

// Subcomponent: Live map controller for recenter & auto-fit
function MapAutoFitter({ 
  activeRoute, 
  activeLineData, 
  activeLineDirIdx, 
  fromLocation, 
  toLocation, 
  walkingPathStart, 
  walkingPathEnd,
  roadSnappedBusPath,
  roadSnappedBusPath1,
  roadSnappedBusPath2,
  routeSheetMinimized,
  recenterTarget
}) {
  const map = useMap();
  const fitTimerRef = useRef(null);

  useEffect(() => {
    // Yürüme yolu ve road-snap geometrileri art arda geldiği için her birinde
    // fitBounds çağırmak haritayı sürekli zıplatıyordu. Kısa debounce ile
    // tüm geometri oturduktan sonra tek seferde sığdırıyoruz.
    if (fitTimerRef.current) clearTimeout(fitTimerRef.current);

    fitTimerRef.current = setTimeout(() => {
      // 1. Recenter target if provided
      if (recenterTarget && Number.isFinite(recenterTarget.lat) && Number.isFinite(recenterTarget.lon)) {
        map.flyTo([recenterTarget.lat, recenterTarget.lon], recenterTarget.zoom || 15, { duration: 1.0 });
        return;
      }

      // 2. Active Line Explorer Mode
      if (activeLineData?.directions?.[activeLineDirIdx]?.path?.length > 1) {
        const path = activeLineData.directions[activeLineDirIdx].path;
        const bounds = L.latLngBounds(path);
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            paddingTopLeft: [70, 30],
            paddingBottomRight: [30, window.innerWidth < 768 ? 200 : 70],
            maxZoom: 15,
            animate: true
          });
        }
        return;
      }

      // 3. Active Route Mode
      if (activeRoute) {
        const coords = [];
        if (fromLocation?.lat && fromLocation?.lon) coords.push([fromLocation.lat, fromLocation.lon]);
        if (toLocation?.lat && toLocation?.lon) coords.push([toLocation.lat, toLocation.lon]);

        if (roadSnappedBusPath?.length) coords.push(...roadSnappedBusPath);
        else if (activeRoute.routeGeometry?.length) coords.push(...activeRoute.routeGeometry);

        if (roadSnappedBusPath1?.length) coords.push(...roadSnappedBusPath1);
        else if (activeRoute.routeGeometry1?.length) coords.push(...activeRoute.routeGeometry1);

        if (roadSnappedBusPath2?.length) coords.push(...roadSnappedBusPath2);
        else if (activeRoute.routeGeometry2?.length) coords.push(...activeRoute.routeGeometry2);

        if (walkingPathStart?.length) coords.push(...walkingPathStart);
        if (walkingPathEnd?.length) coords.push(...walkingPathEnd);

        const validCoords = coords.filter(c => Array.isArray(c) && c.length >= 2 && Number.isFinite(c[0]) && Number.isFinite(c[1]));
        if (validCoords.length >= 2) {
          const bounds = L.latLngBounds(validCoords);
          if (bounds.isValid()) {
            const isMobile = window.innerWidth < 768;
            // Rota paneli açıkken haritanın görünen üst kısmına sığdır.
            // Panel yüksekliği CSS'te 64dvh (max 720px) olduğu için aynı değeri kullan.
            const bottomPad = activeRoute && !routeSheetMinimized
              ? Math.min(Math.round(window.innerHeight * 0.64), 720)
              : (isMobile ? 110 : 80);
            map.fitBounds(bounds, {
              paddingTopLeft: [80, 24],
              paddingBottomRight: [24, bottomPad],
              maxZoom: 16,
              animate: true
            });
          }
        }
        return;
      }

      // 4. Henüz rota yok: seçilen kalkış/varış noktalarına odaklan
      const points = [];
      if (Number.isFinite(fromLocation?.lat) && Number.isFinite(fromLocation?.lon)) {
        points.push([fromLocation.lat, fromLocation.lon]);
      }
      if (Number.isFinite(toLocation?.lat) && Number.isFinite(toLocation?.lon)) {
        points.push([toLocation.lat, toLocation.lon]);
      }

      if (points.length === 1) {
        map.flyTo(points[0], 16, { duration: 0.9 });
      } else if (points.length >= 2) {
        const bounds = L.latLngBounds(points);
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            paddingTopLeft: [60, 130],
            paddingBottomRight: [60, 110],
            maxZoom: 16,
            animate: true
          });
        }
      }
    }, 320);

    return () => {
      if (fitTimerRef.current) clearTimeout(fitTimerRef.current);
    };
  }, [
    activeRoute,
    activeLineData,
    activeLineDirIdx,
    fromLocation?.lat,
    fromLocation?.lon,
    toLocation?.lat,
    toLocation?.lon,
    walkingPathStart,
    walkingPathEnd,
    routeSheetMinimized,
    recenterTarget,
    roadSnappedBusPath,
    roadSnappedBusPath1,
    roadSnappedBusPath2,
    map
  ]);

  return null;
}

// Subcomponent: Live Location follower
function LiveLocationFollower({ liveLocation, isFollowing }) {
  const map = useMap();
  useEffect(() => {
    if (isFollowing && liveLocation && Number.isFinite(liveLocation.lat) && Number.isFinite(liveLocation.lon)) {
      map.panTo([liveLocation.lat, liveLocation.lon], { animate: true, duration: 0.8 });
    }
  }, [liveLocation, isFollowing, map]);
  return null;
}

// Subcomponent: Map click & drag handler
function MapInteractionHandler({ onMapClick, setIsFollowing }) {
  useMapEvents({
    click(e) {
      if (setIsFollowing) setIsFollowing(false);
      if (onMapClick) onMapClick(e.latlng.lat, e.latlng.lng);
    },
    dragstart() {
      if (setIsFollowing) setIsFollowing(false);
    }
  });
  return null;
}

const MapArea = React.memo(function MapArea({
  mapCenter = [41.6771, 26.5557],
  mapZoom = 14,
  mapType = 'Standart', // 'Standart' | 'Uydu'
  fromLocation,
  toLocation,
  activeRoute,
  walkingPathStart = [],
  walkingPathEnd = [],
  roadSnappedBusPath = null,
  roadSnappedBusPath1 = null,
  roadSnappedBusPath2 = null,
  activeLineData = null,
  activeLineDirIdx = 0,
  liveLocation = null,
  isFollowing = false,
  setIsFollowing,
  recenterTarget = null,
  routeSheetMinimized = false,
  onMapClick
}) {
  const mapRef = useRef(null);

  const isValidCoord = (coord) => Array.isArray(coord) && coord.length >= 2 && Number.isFinite(coord[0]) && Number.isFinite(coord[1]);

  // Google Maps tile URL based on mapType
  const tileUrl = mapType === 'Uydu'
    ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
    : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}';

  // User live location icon
  const userLiveIcon = useMemo(() => {
    if (!liveLocation) return null;
    const hasHeading = typeof liveLocation.heading === 'number' && !isNaN(liveLocation.heading);
    const rotateStyle = hasHeading ? `transform: rotate(${liveLocation.heading}deg);` : '';
    const headingParts = hasHeading
      ? '<div class="user-puck-cone"></div><div class="user-puck-arrow"></div>'
      : '';
    return L.divIcon({
      className: '',
      html: `
        <div class="user-puck-container">
          <div class="user-puck-pulse"></div>
          <div class="user-puck-dot" style="${rotateStyle}">
            ${headingParts}
          </div>
        </div>
      `,
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });
  }, [liveLocation]);

  // Direct route transit geometry & stops
  const directGeometry = useMemo(() => {
    if (!activeRoute || activeRoute.isTransfer) return [];
    const geom = roadSnappedBusPath || activeRoute.routeGeometry || [];
    return geom.filter(isValidCoord);
  }, [activeRoute, roadSnappedBusPath]);

  // Transfer route geometry & stops
  const transferGeometry1 = useMemo(() => {
    if (!activeRoute || !activeRoute.isTransfer) return [];
    const geom = roadSnappedBusPath1 || activeRoute.routeGeometry1 || [];
    return geom.filter(isValidCoord);
  }, [activeRoute, roadSnappedBusPath1]);

  const transferGeometry2 = useMemo(() => {
    if (!activeRoute || !activeRoute.isTransfer) return [];
    const geom = roadSnappedBusPath2 || activeRoute.routeGeometry2 || [];
    return geom.filter(isValidCoord);
  }, [activeRoute, roadSnappedBusPath2]);

  // Yön okları: rota geometrisi boyunca eşit aralıklarla
  const directArrows = useMemo(() => buildDirectionArrows(directGeometry), [directGeometry]);
  const transferArrows1 = useMemo(() => buildDirectionArrows(transferGeometry1), [transferGeometry1]);
  const transferArrows2 = useMemo(() => buildDirectionArrows(transferGeometry2), [transferGeometry2]);

  // Hat etiketi: rota çizgisinin yaklaşık ortasında
  const directLabel = useMemo(() => pointAlongPath(directGeometry, 0.45), [directGeometry]);
  const transferLabel1 = useMemo(() => pointAlongPath(transferGeometry1, 0.45), [transferGeometry1]);
  const transferLabel2 = useMemo(() => pointAlongPath(transferGeometry2, 0.45), [transferGeometry2]);

  // Direct route stops list
  const directStops = useMemo(() => {
    if (!activeRoute || activeRoute.isTransfer) return [];
    if (activeRoute.directStops?.length) {
      return activeRoute.directStops.filter(s => s && isValidCoord([s.lat, s.lon]));
    }
    const stops = [
      activeRoute.startStop,
      ...(activeRoute.legs?.[0]?.stops || []),
      activeRoute.endStop
    ].filter(s => s && isValidCoord([s.lat, s.lon]));
    return stops;
  }, [activeRoute]);

  // Transfer route stops lists
  const transferLeg1Stops = useMemo(() => {
    if (!activeRoute || !activeRoute.isTransfer) return [];
    if (activeRoute.stops1?.length) {
      return activeRoute.stops1.filter(s => s && isValidCoord([s.lat, s.lon]));
    }
    const stops = [
      activeRoute.startStop,
      ...(activeRoute.legs?.[0]?.stops || []),
      activeRoute.transferStop
    ].filter(s => s && isValidCoord([s.lat, s.lon]));
    return stops;
  }, [activeRoute]);

  const transferLeg2Stops = useMemo(() => {
    if (!activeRoute || !activeRoute.isTransfer) return [];
    if (activeRoute.stops2?.length) {
      return activeRoute.stops2.filter(s => s && isValidCoord([s.lat, s.lon]));
    }
    const stops = [
      activeRoute.transferStop,
      ...(activeRoute.legs?.[1]?.stops || []),
      activeRoute.endStop
    ].filter(s => s && isValidCoord([s.lat, s.lon]));
    return stops;
  }, [activeRoute]);

  // Origin & Destination pins
  const showOriginPin = fromLocation?.lat && fromLocation?.lon && fromLocation.name !== 'Konumunuz' && fromLocation.name !== 'Mevcut Konumunuz';
  const showDestinationPin = toLocation?.lat && toLocation?.lon;

  return (
    <div className="map-viewport-fixed">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
        preferCanvas={true}
        ref={mapRef}
      >
        <TileLayer
          key={mapType}
          url={tileUrl}
          maxZoom={20}
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
        />

        <LiveLocationFollower liveLocation={liveLocation} isFollowing={isFollowing} />
        <MapInteractionHandler onMapClick={onMapClick} setIsFollowing={setIsFollowing} />
        <MapAutoFitter
          activeRoute={activeRoute}
          activeLineData={activeLineData}
          activeLineDirIdx={activeLineDirIdx}
          fromLocation={fromLocation}
          toLocation={toLocation}
          walkingPathStart={walkingPathStart}
          walkingPathEnd={walkingPathEnd}
          roadSnappedBusPath={roadSnappedBusPath}
          roadSnappedBusPath1={roadSnappedBusPath1}
          roadSnappedBusPath2={roadSnappedBusPath2}
          routeSheetMinimized={routeSheetMinimized}
          recenterTarget={recenterTarget}
        />

        {/* 1. User Live GPS Location */}
        {liveLocation && isValidCoord([liveLocation.lat, liveLocation.lon]) && (
          <Marker position={[liveLocation.lat, liveLocation.lon]} icon={userLiveIcon} zIndexOffset={999}>
            <Popup>
              <b>Mevcut Konumunuz</b>
              <br />
              Doğruluk: ±{Math.round(liveLocation.accuracy || 10)}m
              <br />
              Yön:
              {typeof liveLocation.heading === 'number' && !isNaN(liveLocation.heading)
                ? ` ${headingToCardinal(liveLocation.heading)} (${Math.round(liveLocation.heading)}°)`
                : ' algılanamadı'}
            </Popup>
          </Marker>
        )}

        {/* 2. Custom Origin Location Pin */}
        {showOriginPin && (
          <Marker position={[fromLocation.lat, fromLocation.lon]} icon={createPinIcon('#1E2530', false)}>
            <Popup><b>Başlangıç:</b><br />{fromLocation.name}</Popup>
          </Marker>
        )}

        {/* 3. Destination Pin */}
        {showDestinationPin && (
          <Marker position={[toLocation.lat, toLocation.lon]} icon={createPinIcon('#1E2530', true)}>
            <Popup><b>Varış Noktası:</b><br />{toLocation.name}</Popup>
          </Marker>
        )}

        {/* 4. Pedestrian Walking Polylines */}
        {walkingPathStart.length > 1 && (
          <>
            <Polyline positions={walkingPathStart} pathOptions={{ color: 'rgba(15, 23, 42, 0.55)', weight: 6, dashArray: '5, 7', lineCap: 'round' }} />
            <Polyline positions={walkingPathStart} pathOptions={{ color: '#FFFFFF', weight: 3, dashArray: '5, 7', lineCap: 'round', opacity: 0.95 }} />
          </>
        )}
        {walkingPathEnd.length > 1 && (
          <>
            <Polyline positions={walkingPathEnd} pathOptions={{ color: 'rgba(15, 23, 42, 0.55)', weight: 6, dashArray: '5, 7', lineCap: 'round' }} />
            <Polyline positions={walkingPathEnd} pathOptions={{ color: '#FFFFFF', weight: 3, dashArray: '5, 7', lineCap: 'round', opacity: 0.95 }} />
          </>
        )}

        {/* 5. Direct Transit Route Display (Casing + Core + Direction Arrows) */}
        {activeRoute && !activeRoute.isTransfer && directGeometry.length > 1 && (
          <>
            <Polyline
              positions={directGeometry}
              pathOptions={{ color: 'rgba(15, 23, 42, 0.8)', weight: 8, lineCap: 'round', lineJoin: 'round' }}
            />
            <Polyline
              positions={directGeometry}
              pathOptions={{ color: activeRoute.color || '#3B82F6', weight: 5, lineCap: 'round', lineJoin: 'round', opacity: 0.98 }}
            />
            {directArrows.map((arrow, idx) => (
              <Marker
                key={`darrow_${idx}`}
                position={[arrow.lat, arrow.lon]}
                icon={createDirectionArrowIcon(activeRoute.color || '#3B82F6', arrow.bearing)}
                interactive={false}
                zIndexOffset={-300}
              />
            ))}
            {directLabel && (
              <Marker
                position={[directLabel.lat, directLabel.lon]}
                icon={createLineLabelIcon(
                  activeRoute.legs?.[0]?.line || activeRoute.name || 'Hat',
                  activeRoute.color || '#3B82F6'
                )}
                interactive={false}
                zIndexOffset={-250}
              />
            )}
          </>
        )}

        {/* Direct Route Prominent Stops with Direction Arrows */}
        {activeRoute && !activeRoute.isTransfer && directStops.map((stop, idx) => {
          if (idx === 0) {
            return (
              <Marker
                key={`sstop_${idx}_${stop.id || stop.lat}`}
                position={[stop.lat, stop.lon]}
                icon={createStartStopIcon(activeRoute.color || '#3B82F6')}
                riseOnHover
                zIndexOffset={1000}
              >
                <Popup><b>Biniş Durağı:</b><br />{stop.name}</Popup>
              </Marker>
            );
          }
          if (idx === directStops.length - 1) {
            return (
              <Marker
                key={`estop_${idx}_${stop.id || stop.lat}`}
                position={[stop.lat, stop.lon]}
                icon={createEndStopIcon(activeRoute.color || '#3B82F6')}
                riseOnHover
                zIndexOffset={1000}
              >
                <Popup><b>İniş Durağı:</b><br />{stop.name}</Popup>
              </Marker>
            );
          }

          const nextStop = directStops[idx + 1];
          const prevStop = directStops[idx - 1];
          const bearing = nextStop ? getBearing(stop.lat, stop.lon, nextStop.lat, nextStop.lon) : (prevStop ? getBearing(prevStop.lat, prevStop.lon, stop.lat, stop.lon) : 0);

          return (
            <Marker
              key={`mstop_${idx}_${stop.id || stop.lat}`}
              position={[stop.lat, stop.lon]}
              icon={createIntermediateStopIcon(bearing, activeRoute.color || '#3B82F6')}
              riseOnHover
            >
              <Tooltip className="route-tooltip" direction="top" offset={[0, -10]} opacity={0.95}>{stop.name}</Tooltip>
              <Popup><b>{stop.name}</b><br /><span style={{ color: '#94a3b8' }}>Durak #{idx + 1}</span></Popup>
            </Marker>
          );
        })}

        {/* 6. Transfer Transit Route Display */}
        {activeRoute && activeRoute.isTransfer && (
          <>
            {/* Leg 1: Outer Casing + Core + Arrows */}
            {transferGeometry1.length > 1 && (
              <>
                <Polyline positions={transferGeometry1} pathOptions={{ color: 'rgba(15, 23, 42, 0.8)', weight: 8, lineCap: 'round', lineJoin: 'round' }} />
                <Polyline positions={transferGeometry1} pathOptions={{ color: activeRoute.color || '#3B82F6', weight: 5, lineCap: 'round', lineJoin: 'round', opacity: 0.98 }} />
                {transferArrows1.map((arrow, idx) => (
                  <Marker
                    key={`t1arrow_${idx}`}
                    position={[arrow.lat, arrow.lon]}
                    icon={createDirectionArrowIcon(activeRoute.color || '#3B82F6', arrow.bearing)}
                    interactive={false}
                    zIndexOffset={-300}
                  />
                ))}
                {transferLabel1 && (
                  <Marker
                    position={[transferLabel1.lat, transferLabel1.lon]}
                    icon={createLineLabelIcon(
                      activeRoute.line1 || activeRoute.legs?.[0]?.line || 'Hat',
                      activeRoute.color || '#3B82F6'
                    )}
                    interactive={false}
                    zIndexOffset={-250}
                  />
                )}
              </>
            )}

            {/* Leg 2: Outer Casing + Core + Arrows */}
            {transferGeometry2.length > 1 && (
              <>
                <Polyline positions={transferGeometry2} pathOptions={{ color: 'rgba(15, 23, 42, 0.8)', weight: 8, lineCap: 'round', lineJoin: 'round' }} />
                <Polyline positions={transferGeometry2} pathOptions={{ color: activeRoute.color2 || '#F59E0B', weight: 5, lineCap: 'round', lineJoin: 'round', opacity: 0.98 }} />
                {transferArrows2.map((arrow, idx) => (
                  <Marker
                    key={`t2arrow_${idx}`}
                    position={[arrow.lat, arrow.lon]}
                    icon={createDirectionArrowIcon(activeRoute.color2 || '#F59E0B', arrow.bearing)}
                    interactive={false}
                    zIndexOffset={-300}
                  />
                ))}
                {transferLabel2 && (
                  <Marker
                    position={[transferLabel2.lat, transferLabel2.lon]}
                    icon={createLineLabelIcon(
                      activeRoute.line2 || activeRoute.legs?.[1]?.line || 'Hat',
                      activeRoute.color2 || '#F59E0B'
                    )}
                    interactive={false}
                    zIndexOffset={-250}
                  />
                )}
              </>
            )}

            {/* Leg 1 Stops */}
            {transferLeg1Stops.map((stop, idx) => {
              if (idx === 0) {
                return (
                  <Marker
                    key={`t1_start_${idx}`}
                    position={[stop.lat, stop.lon]}
                    icon={createStartStopIcon(activeRoute.color || '#3B82F6')}
                    riseOnHover
                    zIndexOffset={1000}
                  >
                    <Popup><b>1. Biniş:</b><br />{stop.name}</Popup>
                  </Marker>
                );
              }
              if (idx === transferLeg1Stops.length - 1) {
                return (
                  <Marker
                    key={`t1_trans_${idx}`}
                    position={[stop.lat, stop.lon]}
                    icon={createTransferStopIcon(activeRoute.color || '#3B82F6', activeRoute.color2 || '#F59E0B')}
                    riseOnHover
                    zIndexOffset={900}
                  >
                    <Popup><b>Aktarma Durağı:</b><br />{stop.name}</Popup>
                  </Marker>
                );
              }
              const nextStop = transferLeg1Stops[idx + 1];
              const prevStop = transferLeg1Stops[idx - 1];
              const bearing = nextStop ? getBearing(stop.lat, stop.lon, nextStop.lat, nextStop.lon) : (prevStop ? getBearing(prevStop.lat, prevStop.lon, stop.lat, stop.lon) : 0);
              return (
                <Marker
                  key={`t1_mid_${idx}`}
                  position={[stop.lat, stop.lon]}
                  icon={createIntermediateStopIcon(bearing, activeRoute.color || '#3B82F6')}
                  riseOnHover
                >
                  <Tooltip className="route-tooltip" direction="top" offset={[0, -10]} opacity={0.95}>{stop.name}</Tooltip>
                  <Popup><b>{stop.name}</b></Popup>
                </Marker>
              );
            })}

            {/* Leg 2 Stops */}
            {transferLeg2Stops.map((stop, idx) => {
              if (idx === 0) return null; // Already rendered as transfer stop in Leg 1
              if (idx === transferLeg2Stops.length - 1) {
                return (
                  <Marker
                    key={`t2_end_${idx}`}
                    position={[stop.lat, stop.lon]}
                    icon={createEndStopIcon(activeRoute.color2 || '#F59E0B')}
                    riseOnHover
                    zIndexOffset={1000}
                  >
                    <Popup><b>İniş:</b><br />{stop.name}</Popup>
                  </Marker>
                );
              }
              const nextStop = transferLeg2Stops[idx + 1];
              const prevStop = transferLeg2Stops[idx - 1];
              const bearing = nextStop ? getBearing(stop.lat, stop.lon, nextStop.lat, nextStop.lon) : (prevStop ? getBearing(prevStop.lat, prevStop.lon, stop.lat, stop.lon) : 0);
              return (
                <Marker
                  key={`t2_mid_${idx}`}
                  position={[stop.lat, stop.lon]}
                  icon={createIntermediateStopIcon(bearing, activeRoute.color2 || '#F59E0B')}
                  riseOnHover
                >
                  <Tooltip className="route-tooltip" direction="top" offset={[0, -10]} opacity={0.95}>{stop.name}</Tooltip>
                  <Popup><b>{stop.name}</b></Popup>
                </Marker>
              );
            })}
          </>
        )}

        {/* 7. Line Preview Mode (Browsing a line in LinesExplorer) */}
        {activeLineData && activeLineData.directions?.[activeLineDirIdx] && (() => {
          const dirData = activeLineData.directions[activeLineDirIdx];
          const path = dirData.path || [];
          const stopIds = dirData.stopIds || [];
          const lineColor = getLineColor(activeLineData.code, activeLineData.color);
          const arrows = buildDirectionArrows(path, { maxArrows: 18 });
          const labelPoint = pointAlongPath(path, 0.5);

          return (
            <>
              {path.length > 1 && (
                <>
                  <Polyline positions={path} pathOptions={{ color: 'rgba(15, 23, 42, 0.8)', weight: 8, lineCap: 'round', lineJoin: 'round' }} />
                  <Polyline positions={path} pathOptions={{ color: lineColor, weight: 5, lineCap: 'round', lineJoin: 'round', opacity: 0.98 }} />
                  {arrows.map((arrow, idx) => (
                    <Marker
                      key={`line_arrow_${idx}`}
                      position={[arrow.lat, arrow.lon]}
                      icon={createDirectionArrowIcon(lineColor, arrow.bearing)}
                      interactive={false}
                      zIndexOffset={-300}
                    />
                  ))}
                  {labelPoint && (
                    <Marker
                      position={[labelPoint.lat, labelPoint.lon]}
                      icon={createLineLabelIcon(activeLineData.code, lineColor)}
                      interactive={false}
                      zIndexOffset={-250}
                    />
                  )}
                </>
              )}
              {stopIds.map((sid, i) => {
                const stop = allStopsDB[sid];
                if (!stop || !isValidCoord([stop.lat, stop.lon])) return null;

                if (i === 0) {
                  return (
                    <Marker
                      key={`line_s_${sid}_${i}`}
                      position={[stop.lat, stop.lon]}
                      icon={createStartStopIcon(lineColor)}
                      riseOnHover
                      zIndexOffset={1000}
                    >
                      <Popup><b>İlk Durak:</b><br />{stop.name}</Popup>
                    </Marker>
                  );
                }
                if (i === stopIds.length - 1) {
                  return (
                    <Marker
                      key={`line_e_${sid}_${i}`}
                      position={[stop.lat, stop.lon]}
                      icon={createEndStopIcon(lineColor)}
                      riseOnHover
                      zIndexOffset={1000}
                    >
                      <Popup><b>Son Durak:</b><br />{stop.name}</Popup>
                    </Marker>
                  );
                }

                const nextStop = allStopsDB[stopIds[i + 1]];
                const prevStop = allStopsDB[stopIds[i - 1]];
                const bearing = nextStop ? getBearing(stop.lat, stop.lon, nextStop.lat, nextStop.lon) : (prevStop ? getBearing(prevStop.lat, prevStop.lon, stop.lat, stop.lon) : 0);

                return (
                  <Marker
                    key={`line_m_${sid}_${i}`}
                    position={[stop.lat, stop.lon]}
                    icon={createIntermediateStopIcon(bearing, lineColor)}
                    riseOnHover
                  >
                    <Tooltip className="route-tooltip" direction="top" offset={[0, -10]} opacity={0.95}>{stop.name}</Tooltip>
                    <Popup><b>{stop.name}</b><br /><span style={{ color: '#94a3b8' }}>Durak #{i + 1}</span></Popup>
                  </Marker>
                );
              })}
            </>
          );
        })()}

      </MapContainer>
    </div>
  );
});

export default MapArea;
