import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { theme } from '../theme';
import { allStopsDB } from '../data/db';
import { ArrowUp, MapPin, Bus, Check, ArrowRight } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Calculate heading / bearing angle in degrees between two coordinates
function getBearing(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
  const dLat1 = (lat1 * Math.PI) / 180;
  const dLat2 = (lat2 * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(dLat2);
  const x = Math.cos(dLat1) * Math.sin(dLat2) - Math.sin(dLat1) * Math.cos(dLat2) * Math.cos(dLon);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export default function NativeMap({
  fromLocation,
  toLocation,
  activeRoute,
  roadSnappedBusPath,
  roadSnappedBusPath1,
  roadSnappedBusPath2,
  activeLineData,
  activeLineDirIdx,
  userLocation,
  walkingPathStart,
  walkingPathEnd,
  onMapPress,
  onMapLongPress,
  style,
  mapType = 'Standart',
  recenterTrigger = 0
}) {
  const mapRef = useRef(null);

  // Recenter trigger effect
  useEffect(() => {
    if (!mapRef.current || !recenterTrigger) return;
    const target = userLocation?.lat ? userLocation : fromLocation;
    if (target?.lat && target?.lon) {
      mapRef.current.animateToRegion({
        latitude: target.lat,
        longitude: target.lon,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02
      }, 600);
    }
  }, [recenterTrigger]);

  useEffect(() => {
    if (!mapRef.current) return;

    // 1. Line preview mode
    if (activeLineData) {
      const dir = activeLineData.directions?.[activeLineDirIdx || 0];
      const coords = dir?.path?.map(c => ({ latitude: c[0], longitude: c[1] })) || [];
      if (coords.length > 1) {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 110, right: 50, bottom: 200, left: 50 },
          animated: true
        });
      }
      return;
    }

    // 2. Active route mode
    if (activeRoute) {
      const coords = [];
      if (fromLocation?.lat && fromLocation?.lon) {
        coords.push({ latitude: fromLocation.lat, longitude: fromLocation.lon });
      }
      if (toLocation?.lat && toLocation?.lon) {
        coords.push({ latitude: toLocation.lat, longitude: toLocation.lon });
      }
      if (activeRoute.startStop?.lat && activeRoute.startStop?.lon) {
        coords.push({ latitude: activeRoute.startStop.lat, longitude: activeRoute.startStop.lon });
      }
      if (activeRoute.endStop?.lat && activeRoute.endStop?.lon) {
        coords.push({ latitude: activeRoute.endStop.lat, longitude: activeRoute.endStop.lon });
      }
      if (activeRoute.transferStop?.lat && activeRoute.transferStop?.lon) {
        coords.push({ latitude: activeRoute.transferStop.lat, longitude: activeRoute.transferStop.lon });
      }

      // Add road-snapped bus points or fallback routeGeometry
      const activePath = roadSnappedBusPath || activeRoute.routeGeometry;
      if (Array.isArray(activePath)) {
        activePath.forEach(c => coords.push({ latitude: c[0], longitude: c[1] }));
      }
      const activePath1 = roadSnappedBusPath1 || activeRoute.routeGeometry1;
      if (Array.isArray(activePath1)) {
        activePath1.forEach(c => coords.push({ latitude: c[0], longitude: c[1] }));
      }
      const activePath2 = roadSnappedBusPath2 || activeRoute.routeGeometry2;
      if (Array.isArray(activePath2)) {
        activePath2.forEach(c => coords.push({ latitude: c[0], longitude: c[1] }));
      }

      if (Array.isArray(walkingPathStart)) {
        walkingPathStart.forEach(c => coords.push(c));
      }
      if (Array.isArray(walkingPathEnd)) {
        walkingPathEnd.forEach(c => coords.push(c));
      }

      if (coords.length > 1) {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 110, right: 50, bottom: 260, left: 50 },
          animated: true
        });
      }
      return;
    }

    // 3. Single location
    if (fromLocation?.lat && fromLocation?.lon) {
      mapRef.current.animateToRegion({
        latitude: fromLocation.lat,
        longitude: fromLocation.lon,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03
      }, 700);
    }
  }, [
    activeRoute,
    roadSnappedBusPath,
    roadSnappedBusPath1,
    roadSnappedBusPath2,
    activeLineData,
    activeLineDirIdx,
    fromLocation?.lat,
    fromLocation?.lon,
    walkingPathStart?.length,
    walkingPathEnd?.length
  ]);

  const toCoords = (geom) => {
    if (!geom || !Array.isArray(geom)) return [];
    return geom.map(c => ({ latitude: c[0], longitude: c[1] }));
  };

  const activeLineDir = activeLineData?.directions?.[activeLineDirIdx || 0];

  // Helper lists for direct and transfer stops
  const directIntermediateStops = activeRoute && !activeRoute.isTransfer
    ? (activeRoute.legs?.[0]?.stops || (activeRoute.passedStopCoords || []).map(c => ({ lat: c[0], lon: c[1], name: c[2] })))
    : [];

  const fullDirectStops = activeRoute && !activeRoute.isTransfer
    ? [activeRoute.startStop, ...directIntermediateStops, activeRoute.endStop].filter(s => s?.lat && s?.lon)
    : [];

  const transferLeg1Stops = activeRoute && activeRoute.isTransfer
    ? (activeRoute.legs?.[0]?.stops || [])
    : [];

  const fullTransferLeg1 = activeRoute && activeRoute.isTransfer
    ? [activeRoute.startStop, ...transferLeg1Stops, activeRoute.transferStop].filter(s => s?.lat && s?.lon)
    : [];

  const transferLeg2Stops = activeRoute && activeRoute.isTransfer
    ? (activeRoute.legs?.[1]?.stops || [])
    : [];

  const fullTransferLeg2 = activeRoute && activeRoute.isTransfer
    ? [activeRoute.transferStop, ...transferLeg2Stops, activeRoute.endStop].filter(s => s?.lat && s?.lon)
    : [];

  // Web Browser fallback
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.container, style]}>
        <iframe
          src="https://www.openstreetmap.org/export/embed.html?bbox=26.50%2C41.64%2C26.62%2C41.71&layer=mapnik"
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            filter: 'invert(90%) hue-rotate(180deg) brightness(85%) contrast(110%)',
          }}
          title="Edirne Harita"
        />
      </View>
    );
  }

  // Native Mobile (iOS & Android) - Pure Google Maps Web Tiles with Zero Apple Artifacts
  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.mapView}
        initialRegion={{
          latitude: 41.6771,
          longitude: 26.5557,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        // REMOVE ALL APPLE MAPS REMNANTS:
        showsUserLocation={false}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsTraffic={false}
        showsIndoors={false}
        showsScale={false}
        showsCompass={false}
        legalLabelInsets={{ bottom: -200, left: -200 }}
        mapType={mapType === 'Uydu' && Platform.OS === 'android' ? 'satellite' : 'none'}
        userInterfaceStyle="light"
        onLongPress={(e) => {
          if (onMapLongPress && e.nativeEvent?.coordinate) {
            onMapLongPress(e.nativeEvent.coordinate);
          }
        }}
        onPress={(e) => {
          if (onMapPress && e.nativeEvent?.coordinate) {
            onMapPress(e.nativeEvent.coordinate);
          }
        }}
      >
        {/* Web Google Maps Tile Layer (replaces Apple Maps with Google Maps Street & Satellite) */}
        <UrlTile
          urlTemplate={
            mapType === 'Uydu'
              ? 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
              : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
          }
          maximumZ={20}
          minimumZ={1}
          flipY={false}
          tileSize={256}
          shouldReplaceMapContent={true}
          zIndex={-1}
        />

        {/* Custom Glowing User Location Puck (replaces Apple native blue orb) */}
        {userLocation?.lat && userLocation?.lon && (
          <Marker
            coordinate={{ latitude: userLocation.lat, longitude: userLocation.lon }}
            anchor={{ x: 0.5, y: 0.5 }}
            zIndex={999}
            flat={true}
            tracksViewChanges={false}
          >
            <View style={styles.userLocationContainer}>
              <View style={styles.userLocationPulse} />
              <View style={styles.userLocationDot} />
            </View>
          </Marker>
        )}

        {/* Custom Origin Pin (Replaces Apple native balloon pin) */}
        {fromLocation?.lat && fromLocation?.lon && fromLocation.name !== 'Konumunuz' && fromLocation.name !== 'Mevcut Konumunuz' && (
          <Marker
            coordinate={{ latitude: fromLocation.lat, longitude: fromLocation.lon }}
            anchor={{ x: 0.5, y: 1.0 }}
            title="Başlangıç"
            description={fromLocation.name}
            tracksViewChanges={false}
          >
            <View style={styles.pinContainer}>
              <View style={[styles.pinBubble, { backgroundColor: '#0284C7' }]}>
                <MapPin size={14} color="#FFFFFF" />
              </View>
              <View style={[styles.pinArrow, { borderTopColor: '#0284C7' }]} />
            </View>
          </Marker>
        )}

        {/* Custom Destination Pin (Replaces Apple native balloon pin) */}
        {toLocation?.lat && toLocation?.lon && (
          <Marker
            coordinate={{ latitude: toLocation.lat, longitude: toLocation.lon }}
            anchor={{ x: 0.5, y: 1.0 }}
            title="Varış Noktası"
            description={toLocation.name}
            tracksViewChanges={false}
          >
            <View style={styles.pinContainer}>
              <View style={[styles.pinBubble, { backgroundColor: '#EF4444' }]}>
                <MapPin size={14} color="#FFFFFF" />
              </View>
              <View style={[styles.pinArrow, { borderTopColor: '#EF4444' }]} />
            </View>
          </Marker>
        )}

        {/* Real Pedestrian Walking Polyline (Mapbox Directions API) */}
        {walkingPathStart && walkingPathStart.length > 1 && (
          <>
            <Polyline
              coordinates={walkingPathStart}
              strokeColor="rgba(0, 0, 0, 0.4)"
              strokeWidth={5}
              lineDashPattern={[6, 6]}
            />
            <Polyline
              coordinates={walkingPathStart}
              strokeColor="#38BDF8"
              strokeWidth={3.5}
              lineDashPattern={[6, 6]}
            />
          </>
        )}

        {walkingPathEnd && walkingPathEnd.length > 1 && (
          <>
            <Polyline
              coordinates={walkingPathEnd}
              strokeColor="rgba(0, 0, 0, 0.4)"
              strokeWidth={5}
              lineDashPattern={[6, 6]}
            />
            <Polyline
              coordinates={walkingPathEnd}
              strokeColor="#38BDF8"
              strokeWidth={3.5}
              lineDashPattern={[6, 6]}
            />
          </>
        )}

        {/* ACTIVE ROUTE: ROAD-SNAPPED POLYLINES & PROMINENT STOPS WITH DIRECTION ARROWS */}
        {activeRoute && (
          <>
            {/* Route Polylines: Road Casing & Core Line */}
            {activeRoute.isTransfer ? (
              <>
                {/* Leg 1 Transit Line */}
                {(roadSnappedBusPath1 || activeRoute.routeGeometry1) && (
                  <>
                    <Polyline
                      coordinates={toCoords(roadSnappedBusPath1 || activeRoute.routeGeometry1)}
                      strokeColor="rgba(15, 23, 42, 0.65)"
                      strokeWidth={6.5}
                    />
                    <Polyline
                      coordinates={toCoords(roadSnappedBusPath1 || activeRoute.routeGeometry1)}
                      strokeColor={activeRoute.color || theme.colors.primary}
                      strokeWidth={4.5}
                    />
                  </>
                )}
                {/* Leg 2 Transit Line */}
                {(roadSnappedBusPath2 || activeRoute.routeGeometry2) && (
                  <>
                    <Polyline
                      coordinates={toCoords(roadSnappedBusPath2 || activeRoute.routeGeometry2)}
                      strokeColor="rgba(15, 23, 42, 0.65)"
                      strokeWidth={6.5}
                    />
                    <Polyline
                      coordinates={toCoords(roadSnappedBusPath2 || activeRoute.routeGeometry2)}
                      strokeColor={activeRoute.color2 || theme.colors.fare}
                      strokeWidth={4.5}
                    />
                  </>
                )}
              </>
            ) : (
              (roadSnappedBusPath || activeRoute.routeGeometry) && (
                <>
                  <Polyline
                    coordinates={toCoords(roadSnappedBusPath || activeRoute.routeGeometry)}
                    strokeColor="rgba(15, 23, 42, 0.65)"
                    strokeWidth={6.5}
                  />
                  <Polyline
                    coordinates={toCoords(roadSnappedBusPath || activeRoute.routeGeometry)}
                    strokeColor={activeRoute.color || theme.colors.primary}
                    strokeWidth={4.5}
                  />
                </>
              )
            )}

            {/* Direct Route Stops */}
            {!activeRoute.isTransfer && (
              <>
                {/* 1. Start Boarding Stop (Prominent Green Badge) */}
                {activeRoute.startStop?.lat && activeRoute.startStop?.lon && (
                  <Marker
                    coordinate={{ latitude: activeRoute.startStop.lat, longitude: activeRoute.startStop.lon }}
                    anchor={{ x: 0.5, y: 0.5 }}
                    title={`Biniş: ${activeRoute.startStop.name}`}
                    description={`${activeRoute.line1 || activeRoute.name} Hattı`}
                    tracksViewChanges={false}
                  >
                    <View style={styles.startStopBadge}>
                      <Bus size={13} color="#FFFFFF" />
                    </View>
                  </Marker>
                )}

                {/* 2. Intermediate Stops along the Polyline (Prominent Circle with Travel Direction Arrow) */}
                {directIntermediateStops.map((stop, sIdx) => {
                  if (!stop?.lat || !stop?.lon) return null;
                  const nextStop = fullDirectStops[sIdx + 2];
                  const prevStop = fullDirectStops[sIdx];
                  let bearing = 0;
                  if (nextStop?.lat && nextStop?.lon) {
                    bearing = getBearing(stop.lat, stop.lon, nextStop.lat, nextStop.lon);
                  } else if (prevStop?.lat && prevStop?.lon) {
                    bearing = getBearing(prevStop.lat, prevStop.lon, stop.lat, stop.lon);
                  }

                  return (
                    <Marker
                      key={`direct_stop_${stop.id || sIdx}`}
                      coordinate={{ latitude: stop.lat, longitude: stop.lon }}
                      anchor={{ x: 0.5, y: 0.5 }}
                      title={stop.name}
                      description={`Durak #${sIdx + 1}`}
                      tracksViewChanges={false}
                    >
                      <View style={styles.prominentStopMarker}>
                        <View style={[styles.prominentStopInner, { borderColor: activeRoute.color || theme.colors.primary }]}>
                          <ArrowUp
                            size={11}
                            color="#FFFFFF"
                            strokeWidth={3}
                            style={{ transform: [{ rotate: `${bearing}deg` }] }}
                          />
                        </View>
                      </View>
                    </Marker>
                  );
                })}

                {/* 3. End Alighting Stop (Prominent Red Badge) */}
                {activeRoute.endStop?.lat && activeRoute.endStop?.lon && (
                  <Marker
                    coordinate={{ latitude: activeRoute.endStop.lat, longitude: activeRoute.endStop.lon }}
                    anchor={{ x: 0.5, y: 0.5 }}
                    title={`İniş: ${activeRoute.endStop.name}`}
                    description="Varış Durağı"
                    tracksViewChanges={false}
                  >
                    <View style={styles.endStopBadge}>
                      <Check size={13} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  </Marker>
                )}
              </>
            )}

            {/* Transfer Route Stops */}
            {activeRoute.isTransfer && (
              <>
                {/* 1. Leg 1 Start Stop */}
                {activeRoute.startStop?.lat && activeRoute.startStop?.lon && (
                  <Marker
                    coordinate={{ latitude: activeRoute.startStop.lat, longitude: activeRoute.startStop.lon }}
                    anchor={{ x: 0.5, y: 0.5 }}
                    title={`1. Biniş: ${activeRoute.startStop.name}`}
                    description={`${activeRoute.line1} Hattı`}
                    tracksViewChanges={false}
                  >
                    <View style={styles.startStopBadge}>
                      <Bus size={13} color="#FFFFFF" />
                    </View>
                  </Marker>
                )}

                {/* 2. Leg 1 Intermediate Stops with Direction Arrows */}
                {transferLeg1Stops.map((stop, sIdx) => {
                  if (!stop?.lat || !stop?.lon) return null;
                  const nextStop = fullTransferLeg1[sIdx + 2];
                  const prevStop = fullTransferLeg1[sIdx];
                  let bearing = 0;
                  if (nextStop?.lat && nextStop?.lon) {
                    bearing = getBearing(stop.lat, stop.lon, nextStop.lat, nextStop.lon);
                  } else if (prevStop?.lat && prevStop?.lon) {
                    bearing = getBearing(prevStop.lat, prevStop.lon, stop.lat, stop.lon);
                  }

                  return (
                    <Marker
                      key={`tleg1_stop_${stop.id || sIdx}`}
                      coordinate={{ latitude: stop.lat, longitude: stop.lon }}
                      anchor={{ x: 0.5, y: 0.5 }}
                      title={stop.name}
                      description={`${activeRoute.line1} Durağı`}
                      tracksViewChanges={false}
                    >
                      <View style={styles.prominentStopMarker}>
                        <View style={[styles.prominentStopInner, { borderColor: activeRoute.color || theme.colors.primary }]}>
                          <ArrowUp
                            size={11}
                            color="#FFFFFF"
                            strokeWidth={3}
                            style={{ transform: [{ rotate: `${bearing}deg` }] }}
                          />
                        </View>
                      </View>
                    </Marker>
                  );
                })}

                {/* 3. Transfer Stop (Prominent Amber Badge) */}
                {activeRoute.transferStop?.lat && activeRoute.transferStop?.lon && (
                  <Marker
                    coordinate={{ latitude: activeRoute.transferStop.lat, longitude: activeRoute.transferStop.lon }}
                    anchor={{ x: 0.5, y: 0.5 }}
                    title={`Aktarma: ${activeRoute.transferStop.name}`}
                    description={`${activeRoute.line2} Hattına Geçiş`}
                    tracksViewChanges={false}
                  >
                    <View style={styles.transferStopBadge}>
                      <ArrowRight size={13} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  </Marker>
                )}

                {/* 4. Leg 2 Intermediate Stops with Direction Arrows */}
                {transferLeg2Stops.map((stop, sIdx) => {
                  if (!stop?.lat || !stop?.lon) return null;
                  const nextStop = fullTransferLeg2[sIdx + 2];
                  const prevStop = fullTransferLeg2[sIdx];
                  let bearing = 0;
                  if (nextStop?.lat && nextStop?.lon) {
                    bearing = getBearing(stop.lat, stop.lon, nextStop.lat, nextStop.lon);
                  } else if (prevStop?.lat && prevStop?.lon) {
                    bearing = getBearing(prevStop.lat, prevStop.lon, stop.lat, stop.lon);
                  }

                  return (
                    <Marker
                      key={`tleg2_stop_${stop.id || sIdx}`}
                      coordinate={{ latitude: stop.lat, longitude: stop.lon }}
                      anchor={{ x: 0.5, y: 0.5 }}
                      title={stop.name}
                      description={`${activeRoute.line2} Durağı`}
                      tracksViewChanges={false}
                    >
                      <View style={styles.prominentStopMarker}>
                        <View style={[styles.prominentStopInner, { borderColor: activeRoute.color2 || theme.colors.fare }]}>
                          <ArrowUp
                            size={11}
                            color="#FFFFFF"
                            strokeWidth={3}
                            style={{ transform: [{ rotate: `${bearing}deg` }] }}
                          />
                        </View>
                      </View>
                    </Marker>
                  );
                })}

                {/* 5. Final Alighting Stop */}
                {activeRoute.endStop?.lat && activeRoute.endStop?.lon && (
                  <Marker
                    coordinate={{ latitude: activeRoute.endStop.lat, longitude: activeRoute.endStop.lon }}
                    anchor={{ x: 0.5, y: 0.5 }}
                    title={`İniş: ${activeRoute.endStop.name}`}
                    description="Varış Durağı"
                    tracksViewChanges={false}
                  >
                    <View style={styles.endStopBadge}>
                      <Check size={13} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  </Marker>
                )}
              </>
            )}
          </>
        )}

        {/* LINE PREVIEW (Tüm Hatlar ekranından önizleme) */}
        {activeLineData && activeLineDir && (
          <>
            {activeLineDir.path && (
              <>
                <Polyline
                  coordinates={toCoords(activeLineDir.path)}
                  strokeColor="rgba(15, 23, 42, 0.65)"
                  strokeWidth={6.5}
                />
                <Polyline
                  coordinates={toCoords(activeLineDir.path)}
                  strokeColor={activeLineData.color || theme.colors.primary}
                  strokeWidth={4.5}
                />
              </>
            )}
            {activeLineDir.stopIds?.map((stopId, sIdx, arr) => {
              const stop = allStopsDB[stopId];
              if (!stop?.lat || !stop?.lon) return null;
              const nextStopId = arr[sIdx + 1];
              const nextStop = nextStopId ? allStopsDB[nextStopId] : null;
              const prevStopId = sIdx > 0 ? arr[sIdx - 1] : null;
              const prevStop = prevStopId ? allStopsDB[prevStopId] : null;
              let bearing = 0;
              if (nextStop?.lat && nextStop?.lon) {
                bearing = getBearing(stop.lat, stop.lon, nextStop.lat, nextStop.lon);
              } else if (prevStop?.lat && prevStop?.lon) {
                bearing = getBearing(prevStop.lat, prevStop.lon, stop.lat, stop.lon);
              }

              const isFirst = sIdx === 0;
              const isLast = sIdx === arr.length - 1;

              return (
                <Marker
                  key={`line_stop_${stopId}_${sIdx}`}
                  coordinate={{ latitude: stop.lat, longitude: stop.lon }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  title={stop.name}
                  description={`Durak #${sIdx + 1}`}
                  tracksViewChanges={false}
                >
                  {isFirst ? (
                    <View style={styles.startStopBadge}>
                      <Bus size={13} color="#FFFFFF" />
                    </View>
                  ) : isLast ? (
                    <View style={styles.endStopBadge}>
                      <Check size={13} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  ) : (
                    <View style={styles.prominentStopMarker}>
                      <View style={[styles.prominentStopInner, { borderColor: activeLineData.color || theme.colors.primary }]}>
                        <ArrowUp
                          size={11}
                          color="#FFFFFF"
                          strokeWidth={3}
                          style={{ transform: [{ rotate: `${bearing}deg` }] }}
                        />
                      </View>
                    </View>
                  )}
                </Marker>
              );
            })}
          </>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  mapView: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    flex: 1,
  },

  // Custom User Location Puck (No Apple Puck)
  userLocationContainer: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationPulse: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.5)',
  },
  userLocationDot: {
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#0284C7',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 3,
  },

  // Custom Pin Markers (Teardrop Bubble)
  pinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 38,
  },
  pinBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  pinArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },

  // Prominent Stops on Line with Direction Arrow
  prominentStopMarker: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 3,
    elevation: 4,
  },
  prominentStopInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0F1626',
    borderWidth: 2.2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Start Boarding Stop Badge (Emerald / Green)
  startStopBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },

  // Transfer Stop Badge (Amber)
  transferStopBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F59E0B',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },

  // End Exit Stop Badge (Rose / Red)
  endStopBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
});
