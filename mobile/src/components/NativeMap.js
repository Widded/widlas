import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Navigation } from 'lucide-react-native';
import { theme } from '../theme';
import { allStopsDB } from '../data/db';

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#121214" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#000000" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8e8e93" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#aeaeb2" }]
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#636366" }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#14261d" }]
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#242426" }]
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1c1c1e" }]
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#aeaeb2" }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3a3a3c" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#1c1c1e" }]
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
          edgePadding: { top: 90, right: 60, bottom: 90, left: 60 },
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
          edgePadding: { top: 90, right: 60, bottom: 100, left: 60 },
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
            pinColor={theme.colors.primary}
          />
        )}

        {/* Destination Marker */}
        {toLocation?.lat && (
          <Marker
            coordinate={{ latitude: toLocation.lat, longitude: toLocation.lon }}
            title="Varış Noktası"
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
                pinColor="#0A84FF"
              />
            )}

            {/* Transfer Bus Stop */}
            {activeRoute.isTransfer && activeRoute.transferStop?.lat && (
              <Marker
                coordinate={{ latitude: activeRoute.transferStop.lat, longitude: activeRoute.transferStop.lon }}
                title={`Aktarma: ${activeRoute.transferStop.name}`}
                description={`${activeRoute.line2 || ''} Hattına Geçiş`}
                pinColor="#FF9F0A"
              />
            )}

            {/* End Bus Stop */}
            {activeRoute.endStop?.lat && (
              <Marker
                coordinate={{ latitude: activeRoute.endStop.lat, longitude: activeRoute.endStop.lon }}
                title={`İniş: ${activeRoute.endStop.name}`}
                pinColor="#FF453A"
              />
            )}

            {/* Polylines */}
            {activeRoute.isTransfer ? (
              <>
                {activeRoute.routeGeometry1 && (
                  <Polyline
                    coordinates={toCoords(activeRoute.routeGeometry1)}
                    strokeColor={activeRoute.color || '#0A84FF'}
                    strokeWidth={5}
                  />
                )}
                {activeRoute.routeGeometry2 && (
                  <Polyline
                    coordinates={toCoords(activeRoute.routeGeometry2)}
                    strokeColor={activeRoute.color2 || '#FF9F0A'}
                    strokeWidth={5}
                  />
                )}
              </>
            ) : (
              activeRoute.routeGeometry && (
                <Polyline
                  coordinates={toCoords(activeRoute.routeGeometry)}
                  strokeColor={activeRoute.color || '#0A84FF'}
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
                  pinColor={activeLineData.color || '#0A84FF'}
                />
              );
            })}
          </>
        )}
      </MapView>

      {/* Sleek Floating GPS Recenter Button */}
      {userLocation?.lat && (
        <TouchableOpacity style={styles.recenterBtn} onPress={recenterUser} activeOpacity={0.8}>
          <Navigation size={18} color={theme.colors.primary} />
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
    top: 14,
    right: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
});
