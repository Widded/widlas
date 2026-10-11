import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Navigation } from 'lucide-react-native';
import { theme } from '../theme';
import { allStopsDB } from '../data/db';

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#1e293b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0f172a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#94a3b8" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#164e63" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#334155" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1e293b" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#cbd5e1" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#475569" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1e293b" }]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0f172a" }]
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

  // Focus map when route or points change
  useEffect(() => {
    if (!mapRef.current) return;

    // 1. Line preview mode (Tüm Hatlar sekmesi)
    if (activeLineData) {
      const dir = activeLineData.directions?.[activeLineDirIdx || 0];
      const coords = dir?.path?.map(c => ({ latitude: c[0], longitude: c[1] })) || [];
      if (coords.length > 1) {
        mapRef.current.fitToCoordinates(coords, {
          edgePadding: { top: 70, right: 70, bottom: 70, left: 70 },
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
          edgePadding: { top: 80, right: 60, bottom: 80, left: 60 },
          animated: true
        });
      }
      return;
    }

    // 3. Single location fallback
    if (fromLocation?.lat && fromLocation?.lon) {
      mapRef.current.animateToRegion({
        latitude: fromLocation.lat,
        longitude: fromLocation.lon,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03
      }, 800);
    }
  }, [activeRoute, activeLineData, activeLineDirIdx, fromLocation?.lat, fromLocation?.lon]);

  const recenterUser = () => {
    if (userLocation?.lat && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.lat,
        longitude: userLocation.lon,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015
      }, 600);
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
        {/* Start Point Marker */}
        {fromLocation?.lat && (
          <Marker
            coordinate={{ latitude: fromLocation.lat, longitude: fromLocation.lon }}
            title="Başlangıç"
            description={fromLocation.name}
            pinColor={theme.colors.primary}
          />
        )}

        {/* End Point Marker */}
        {toLocation?.lat && (
          <Marker
            coordinate={{ latitude: toLocation.lat, longitude: toLocation.lon }}
            title="Hedef"
            description={toLocation.name}
            pinColor={theme.colors.danger}
          />
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
                pinColor="#3b82f6"
              />
            )}

            {/* Transfer Bus Stop */}
            {activeRoute.isTransfer && activeRoute.transferStop?.lat && (
              <Marker
                coordinate={{ latitude: activeRoute.transferStop.lat, longitude: activeRoute.transferStop.lon }}
                title={`Aktarma: ${activeRoute.transferStop.name}`}
                description={`${activeRoute.line2 || ''} Hattına Geçiş`}
                pinColor="#f59e0b"
              />
            )}

            {/* End Bus Stop */}
            {activeRoute.endStop?.lat && (
              <Marker
                coordinate={{ latitude: activeRoute.endStop.lat, longitude: activeRoute.endStop.lon }}
                title={`İniş: ${activeRoute.endStop.name}`}
                pinColor="#ef4444"
              />
            )}

            {/* Bus Polylines */}
            {activeRoute.isTransfer ? (
              <>
                {activeRoute.routeGeometry1 && (
                  <Polyline
                    coordinates={toCoords(activeRoute.routeGeometry1)}
                    strokeColor={activeRoute.color || '#3b82f6'}
                    strokeWidth={5}
                  />
                )}
                {activeRoute.routeGeometry2 && (
                  <Polyline
                    coordinates={toCoords(activeRoute.routeGeometry2)}
                    strokeColor={activeRoute.color2 || '#f59e0b'}
                    strokeWidth={5}
                  />
                )}
              </>
            ) : (
              activeRoute.routeGeometry && (
                <Polyline
                  coordinates={toCoords(activeRoute.routeGeometry)}
                  strokeColor={activeRoute.color || '#3b82f6'}
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
                  pinColor={activeLineData.color || '#3b82f6'}
                />
              );
            })}
          </>
        )}
      </MapView>

      {/* Recenter Button */}
      {userLocation?.lat && (
        <TouchableOpacity style={styles.recenterBtn} onPress={recenterUser} activeOpacity={0.8}>
          <Navigation size={20} color={theme.colors.primary} />
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
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
});
