import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Navigation, Bus, MapPin } from 'lucide-react-native';
import { theme } from '../theme';
import { allStopsDB } from '../data/db';

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#0c111c" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#718096" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a0aec0" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#4a5568" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#11201d" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1a2333" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#0c111c" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a0aec0" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#2d3748" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#141d2b" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#060911" }]
  }
];

export default function NativeMap({
  fromLocation,
  toLocation,
  activeRoute,
  activeLineData,
  activeLineDirIdx,
  userLocation,
  mapSelectionMode,
  onMapPress,
  style
}) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // 1. Line preview mode
    if (activeLineData) {
      const dir = activeLineData.directions?.[activeLineDirIdx || 0];
      const coords = dir?.path?.map(c => ({ latitude: c[0], longitude: c[1] })) || [];
      if (coords.length > 1) {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 90, right: 60, bottom: 120, left: 60 },
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
      if (Array.isArray(activeRoute.routeGeometry)) {
        activeRoute.routeGeometry.forEach(c => coords.push({ latitude: c[0], longitude: c[1] }));
      }
      if (Array.isArray(activeRoute.routeGeometry1)) {
        activeRoute.routeGeometry1.forEach(c => coords.push({ latitude: c[0], longitude: c[1] }));
      }
      if (Array.isArray(activeRoute.routeGeometry2)) {
        activeRoute.routeGeometry2.forEach(c => coords.push({ latitude: c[0], longitude: c[1] }));
      }

      if (coords.length > 1) {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 90, right: 60, bottom: 140, left: 60 },
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
  }, [activeRoute, activeLineData, activeLineDirIdx, fromLocation?.lat, fromLocation?.lon]);

  const recenterUser = () => {
    if (userLocation?.lat && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.lat,
        longitude: userLocation.lon,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015
      }, 500);
    }
  };

  const toCoords = (geom) => {
    if (!geom || !Array.isArray(geom)) return [];
    return geom.map(c => ({ latitude: c[0], longitude: c[1] }));
  };

  const activeLineDir = activeLineData?.directions?.[activeLineDirIdx || 0];

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: 41.6771,
          longitude: 26.5557,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation={true}
        showsCompass={true}
        customMapStyle={Platform.OS === 'android' ? darkMapStyle : undefined}
        userInterfaceStyle="dark"
        onPress={(e) => {
          if (onMapPress) {
            onMapPress(e.nativeEvent.coordinate);
          }
        }}
      >
        {/* Origin Marker */}
        {fromLocation?.lat && (
          <Marker
            coordinate={{ latitude: fromLocation.lat, longitude: fromLocation.lon }}
            title="Başlangıç"
            description={fromLocation.name}
          >
            <View style={styles.originMarkerBadge}>
              <View style={styles.originMarkerDot} />
            </View>
          </Marker>
        )}

        {/* Destination Marker */}
        {toLocation?.lat && (
          <Marker
            coordinate={{ latitude: toLocation.lat, longitude: toLocation.lon }}
            title="Varış Noktası"
            description={toLocation.name}
          >
            <View style={styles.destMarkerBadge}>
              <MapPin size={16} color="#FFFFFF" />
            </View>
          </Marker>
        )}

        {/* Active Route Polylines & Stops */}
        {activeRoute && (
          <>
            {/* Start Bus Stop */}
            {activeRoute.startStop?.lat && (
              <Marker
                coordinate={{ latitude: activeRoute.startStop.lat, longitude: activeRoute.startStop.lon }}
                title={`Biniş: ${activeRoute.startStop.name}`}
                description={`${activeRoute.line1 || activeRoute.name} Hattı`}
              >
                <View style={[styles.stopMarkerBadge, { backgroundColor: activeRoute.color || theme.colors.primary }]}>
                  <Bus size={13} color="#FFFFFF" />
                </View>
              </Marker>
            )}

            {/* Transfer Bus Stop */}
            {activeRoute.isTransfer && activeRoute.transferStop?.lat && (
              <Marker
                coordinate={{ latitude: activeRoute.transferStop.lat, longitude: activeRoute.transferStop.lon }}
                title={`Aktarma: ${activeRoute.transferStop.name}`}
                description={`${activeRoute.line2 || ''} Hattına Geçiş`}
              >
                <View style={[styles.stopMarkerBadge, { backgroundColor: theme.colors.warning }]}>
                  <Text style={styles.stopMarkerText}>AK</Text>
                </View>
              </Marker>
            )}

            {/* End Bus Stop */}
            {activeRoute.endStop?.lat && (
              <Marker
                coordinate={{ latitude: activeRoute.endStop.lat, longitude: activeRoute.endStop.lon }}
                title={`İniş: ${activeRoute.endStop.name}`}
              >
                <View style={[styles.stopMarkerBadge, { backgroundColor: theme.colors.danger }]}>
                  <MapPin size={13} color="#FFFFFF" />
                </View>
              </Marker>
            )}

            {/* Polylines */}
            {activeRoute.isTransfer ? (
              <>
                {activeRoute.routeGeometry1 && (
                  <Polyline
                    coordinates={toCoords(activeRoute.routeGeometry1)}
                    strokeColor={activeRoute.color || '#0084FF'}
                    strokeWidth={5}
                  />
                )}
                {activeRoute.routeGeometry2 && (
                  <Polyline
                    coordinates={toCoords(activeRoute.routeGeometry2)}
                    strokeColor={activeRoute.color2 || '#FF9100'}
                    strokeWidth={5}
                  />
                )}
              </>
            ) : (
              activeRoute.routeGeometry && (
                <Polyline
                  coordinates={toCoords(activeRoute.routeGeometry)}
                  strokeColor={activeRoute.color || '#0084FF'}
                  strokeWidth={5}
                />
              )
            )}
          </>
        )}

        {/* Active Line (Tüm Hatlar) Preview */}
        {activeLineData && activeLineDir && (
          <>
            {activeLineDir.path && (
              <Polyline
                coordinates={toCoords(activeLineDir.path)}
                strokeColor={activeLineData.color || theme.colors.primary}
                strokeWidth={5}
              />
            )}
            {activeLineDir.stopIds?.map((stopId, sIdx) => {
              const stop = allStopsDB[stopId];
              if (!stop?.lat || !stop?.lon) return null;
              return (
                <Marker
                  key={`line_stop_${stopId}_${sIdx}`}
                  coordinate={{ latitude: stop.lat, longitude: stop.lon }}
                  title={stop.name}
                  description={`Durak #${sIdx + 1}`}
                >
                  <View style={[styles.smallStopDot, { backgroundColor: activeLineData.color || theme.colors.primary }]}>
                    <View style={styles.smallStopInner} />
                  </View>
                </Marker>
              );
            })}
          </>
        )}
      </MapView>

      {/* Floating GPS Recenter Button */}
      {userLocation?.lat && (
        <TouchableOpacity style={styles.recenterBtn} onPress={recenterUser} activeOpacity={0.85}>
          <Navigation size={18} color={theme.colors.primaryGlow} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    position: 'relative',
  },
  recenterBtn: {
    position: 'absolute',
    top: 70,
    right: 14,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.glassBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  originMarkerBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 132, 255, 0.25)',
    borderWidth: 2,
    borderColor: '#0084FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  originMarkerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00D2FF',
  },
  destMarkerBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF3366',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  stopMarkerBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 3,
  },
  stopMarkerText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
  },
  smallStopDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  smallStopInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
});
