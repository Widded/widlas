import React, { useRef, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Navigation, Bus, MapPin } from 'lucide-react-native';
import { theme } from '../theme';
import { allStopsDB } from '../data/db';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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
          edgePadding: { top: 120, right: 60, bottom: 200, left: 60 },
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
          edgePadding: { top: 120, right: 60, bottom: 240, left: 60 },
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

  const toCoords = (geom) => {
    if (!geom || !Array.isArray(geom)) return [];
    return geom.map(c => ({ latitude: c[0], longitude: c[1] }));
  };

  const activeLineDir = activeLineData?.directions?.[activeLineDirIdx || 0];

  // If user opens on Web browser (Chrome/localhost:8081)
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

  // Native Mobile (iOS & Android)
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
        showsUserLocation={true}
        showsCompass={false}
        customMapStyle={Platform.OS === 'android' ? darkMapStyle : undefined}
        userInterfaceStyle="dark"
      >
        {/* Origin Marker */}
        {fromLocation?.lat && (
          <Marker
            coordinate={{ latitude: fromLocation.lat, longitude: fromLocation.lon }}
            title="Başlangıç"
            description={fromLocation.name}
            pinColor="#0084FF"
          />
        )}

        {/* Destination Marker */}
        {toLocation?.lat && (
          <Marker
            coordinate={{ latitude: toLocation.lat, longitude: toLocation.lon }}
            title="Varış Noktası"
            description={toLocation.name}
            pinColor="#F43F5E"
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
                pinColor="#8B5CF6"
              />
            )}

            {/* Transfer Bus Stop */}
            {activeRoute.isTransfer && activeRoute.transferStop?.lat && (
              <Marker
                coordinate={{ latitude: activeRoute.transferStop.lat, longitude: activeRoute.transferStop.lon }}
                title={`Aktarma: ${activeRoute.transferStop.name}`}
                description={`${activeRoute.line2 || ''} Hattına Geçiş`}
                pinColor="#F59E0B"
              />
            )}

            {/* End Bus Stop */}
            {activeRoute.endStop?.lat && (
              <Marker
                coordinate={{ latitude: activeRoute.endStop.lat, longitude: activeRoute.endStop.lon }}
                title={`İniş: ${activeRoute.endStop.name}`}
                pinColor="#F43F5E"
              />
            )}

            {/* Polylines */}
            {activeRoute.isTransfer ? (
              <>
                {activeRoute.routeGeometry1 && (
                  <Polyline
                    coordinates={toCoords(activeRoute.routeGeometry1)}
                    strokeColor={activeRoute.color || '#8B5CF6'}
                    strokeWidth={5}
                  />
                )}
                {activeRoute.routeGeometry2 && (
                  <Polyline
                    coordinates={toCoords(activeRoute.routeGeometry2)}
                    strokeColor={activeRoute.color2 || '#F59E0B'}
                    strokeWidth={5}
                  />
                )}
              </>
            ) : (
              activeRoute.routeGeometry && (
                <Polyline
                  coordinates={toCoords(activeRoute.routeGeometry)}
                  strokeColor={activeRoute.color || '#8B5CF6'}
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
                strokeColor={activeLineData.color || '#8B5CF6'}
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
                  pinColor={activeLineData.color || '#8B5CF6'}
                />
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
  },
  mapView: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    flex: 1,
  },
});
