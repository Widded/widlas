import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  StyleSheet
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import {
  Search,
  Bus,
  CreditCard,
  X,
  LocateFixed,
  GraduationCap,
  User
} from 'lucide-react-native';

import { theme } from './src/theme';
import NativeMap from './src/components/NativeMap';
import RouteDetailsModal from './src/components/RouteDetailsModal';
import LinesExplorer from './src/components/LinesExplorer';
import SearchModal from './src/components/SearchModal';
import FaresView from './src/components/FaresView';
import RouteResultSheet from './src/components/RouteResultSheet';

import { calculateSmartRoute } from './src/data/routes';
import { QUICK_PLACES } from './src/data/places';

export default function App() {
  const [fareType, setFareType] = useState('ogrenci'); // 'ogrenci' | 'tam'

  // Locations
  const [fromLocation, setFromLocation] = useState({ name: 'Konumunuz', lat: null, lon: null });
  const [toLocation, setToLocation] = useState({ name: '', lat: null, lon: null });
  const [userLocation, setUserLocation] = useState(null);

  // Routing State
  const [searchResults, setSearchResults] = useState(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  // Modals & Panels
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchTargetType, setSearchTargetType] = useState('to'); // 'from' | 'to'
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [linesModalVisible, setLinesModalVisible] = useState(false);
  const [faresModalVisible, setFaresModalVisible] = useState(false);

  // Line preview mode from explorer
  const [previewLine, setPreviewLine] = useState(null);

  // GPS on initial load
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const userCoords = {
            name: 'Mevcut Konumunuz',
            lat: loc.coords.latitude,
            lon: loc.coords.longitude
          };
          setUserLocation(userCoords);
          setFromLocation(userCoords);
        } else {
          setFromLocation({
            name: 'Edirne Merkez',
            lat: 41.6771,
            lon: 26.5557
          });
        }
      } catch (err) {
        setFromLocation({
          name: 'Edirne Merkez',
          lat: 41.6771,
          lon: 26.5557
        });
      }
    })();
  }, []);

  // Force GPS Recenter
  const handleUseGps = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Konumunuza erişmek için lütfen izin verin.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const userCoords = {
        name: 'Mevcut Konumunuz',
        lat: loc.coords.latitude,
        lon: loc.coords.longitude
      };
      setUserLocation(userCoords);
      setFromLocation(userCoords);

      if (toLocation?.lat) {
        executeRouteSearch(userCoords, toLocation);
      }
    } catch (e) {
      Alert.alert('Hata', 'Konumunuz tespit edilemedi.');
    }
  };

  // Run Route Search
  const executeRouteSearch = async (from, to) => {
    if (!to?.lat) {
      Alert.alert('Eksik Bilgi', 'Lütfen gitmek istediğiniz konumu seçin.');
      return;
    }

    const startPoint = from?.lat ? from : (userLocation?.lat ? userLocation : {
      name: 'Edirne Merkez',
      lat: 41.6771,
      lon: 26.5557
    });

    setFromLocation(startPoint);
    setToLocation(to);
    setPreviewLine(null);
    setLoading(true);

    try {
      const res = await calculateSmartRoute(startPoint.lat, startPoint.lon, to.lat, to.lon);
      setSearchResults(res);
      setSelectedRouteIdx(0);
    } catch (e) {
      Alert.alert('Hata', 'Rota hesaplanırken bir sorun oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // 1-Tap Quick Destination Select
  const handleSelectQuickDestination = (place) => {
    executeRouteSearch(fromLocation, place);
  };

  // Search Modal Select
  const handleModalSelect = (place) => {
    setSearchModalVisible(false);
    if (searchTargetType === 'from') {
      setFromLocation(place);
      if (toLocation?.lat) {
        executeRouteSearch(place, toLocation);
      }
    } else {
      executeRouteSearch(fromLocation, place);
    }
  };

  // Clear current route / back to clean map
  const handleClearRoute = () => {
    setSearchResults(null);
    setToLocation({ name: '', lat: null, lon: null });
  };

  const activeRoute = searchResults?.routes?.[selectedRouteIdx] || null;

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* 1. FULL-SCREEN NATIVE MAP (Zero Split, 100% Canvas) */}
        <NativeMap
          style={StyleSheet.absoluteFillObject}
          fromLocation={fromLocation}
          toLocation={toLocation}
          activeRoute={previewLine ? null : activeRoute}
          activeLineData={previewLine?.line}
          activeLineDirIdx={previewLine?.dirIdx}
          userLocation={userLocation}
        />

        {/* 2. COMPACT TOP HEADER BAR (Minimal & Apple Maps inspired) */}
        <SafeAreaView style={styles.topSafeArea}>
          <View style={styles.topBar}>
            {/* ETUS Brand */}
            <View style={styles.brandGroup}>
              <View style={styles.brandIconBox}>
                <Bus size={14} color={theme.colors.primary} />
              </View>
              <Text style={styles.brandTitle}>ETUS</Text>
            </View>

            {/* Clean Segmented Fare Switcher */}
            <View style={styles.fareSegmentedControl}>
              <TouchableOpacity
                style={[styles.fareSegment, fareType === 'ogrenci' && styles.fareSegmentActive]}
                onPress={() => setFareType('ogrenci')}
                activeOpacity={0.7}
              >
                <GraduationCap
                  size={12}
                  color={fareType === 'ogrenci' ? theme.colors.textPrimary : theme.colors.textMuted}
                />
                <Text style={[styles.fareSegmentText, fareType === 'ogrenci' && styles.fareSegmentTextActive]}>
                  Öğrenci 20₺
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.fareSegment, fareType === 'tam' && styles.fareSegmentActive]}
                onPress={() => setFareType('tam')}
                activeOpacity={0.7}
              >
                <User
                  size={12}
                  color={fareType === 'tam' ? theme.colors.textPrimary : theme.colors.textMuted}
                />
                <Text style={[styles.fareSegmentText, fareType === 'tam' && styles.fareSegmentTextActive]}>
                  Tam 30₺
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        {/* 3. MAP CONTROLS STACK (Controlled 40x40px, high-contrast minimal buttons) */}
        <View style={styles.floatingControlsStack}>
          {/* Recenter GPS */}
          <TouchableOpacity
            style={styles.controlSquareBtn}
            onPress={handleUseGps}
            activeOpacity={0.8}
          >
            <LocateFixed size={18} color={theme.colors.primary} />
          </TouchableOpacity>

          {/* All Lines Sheet */}
          <TouchableOpacity
            style={styles.controlSquareBtn}
            onPress={() => setLinesModalVisible(true)}
            activeOpacity={0.8}
          >
            <Bus size={18} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          {/* Fares & Tariffs Sheet */}
          <TouchableOpacity
            style={styles.controlSquareBtn}
            onPress={() => setFaresModalVisible(true)}
            activeOpacity={0.8}
          >
            <CreditCard size={18} color={theme.colors.fare} />
          </TouchableOpacity>
        </View>

        {/* 4. ACTIVE LINE PREVIEW BANNER (When viewing a line from explorer) */}
        {previewLine && (
          <View style={styles.previewLineBanner}>
            <View style={styles.previewLineInfo}>
              <View style={[styles.previewLineBadge, { backgroundColor: previewLine.line.color || theme.colors.primary }]}>
                <Text style={styles.previewLineBadgeText}>{previewLine.line.code}</Text>
              </View>
              <Text style={styles.previewLineName} numberOfLines={1}>
                {previewLine.line.directions?.[previewLine.dirIdx]?.headSign || 'Hat Güzergahı'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.previewLineClose}
              onPress={() => setPreviewLine(null)}
              activeOpacity={0.7}
            >
              <X size={14} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* 5. MINIMAL BOTTOM SEARCH BAR (Idle Map State) */}
        {!searchResults && !loading && (
          <View style={styles.bottomSearchContainer}>
            {/* The Main "Nereye?" Search Bar */}
            <TouchableOpacity
              style={styles.searchBarInput}
              onPress={() => {
                setSearchTargetType('to');
                setSearchModalVisible(true);
              }}
              activeOpacity={0.85}
            >
              <Search size={16} color={theme.colors.textMuted} />
              <Text style={styles.searchBarPlaceholder}>
                Nereye gitmek istiyorsunuz?
              </Text>
            </TouchableOpacity>

            {/* Quick Destination Chips (Compact, minimal 10px radius) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickChipsScroll}
            >
              {QUICK_PLACES.map((place) => (
                <TouchableOpacity
                  key={place.name}
                  style={styles.quickChip}
                  onPress={() => handleSelectQuickDestination(place)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.quickChipText}>{place.shortName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 6. LOADING SPINNER OVERLAY */}
        {loading && (
          <View style={styles.loadingBanner}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingBannerText}>En uygun ETUS rotaları hesaplanıyor...</Text>
          </View>
        )}

        {/* 7. ROUTE RESULTS FLOATING SHEET (Digital Boarding Pass) */}
        {searchResults && !loading && (
          <RouteResultSheet
            routes={searchResults.routes}
            selectedIdx={selectedRouteIdx}
            onSelectIdx={setSelectedRouteIdx}
            toLocation={toLocation}
            fromLocation={fromLocation}
            fareType={fareType}
            onFareTypeChange={setFareType}
            onOpenDetails={() => setDetailsModalVisible(true)}
            onClose={handleClearRoute}
          />
        )}

        {/* 8. SEARCH MODAL (Full Autocomplete across all 745+ stops) */}
        <SearchModal
          visible={searchModalVisible}
          onClose={() => setSearchModalVisible(false)}
          targetType={searchTargetType}
          currentName={searchTargetType === 'from' ? fromLocation.name : toLocation.name}
          onSelect={handleModalSelect}
        />

        {/* 9. ROUTE DETAILS TURN-BY-TURN MODAL */}
        <RouteDetailsModal
          visible={detailsModalVisible}
          route={activeRoute}
          onClose={() => setDetailsModalVisible(false)}
        />

        {/* 10. LINES EXPLORER MODAL */}
        <Modal
          visible={linesModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setLinesModalVisible(false)}
        >
          <View style={styles.modalBody}>
            <LinesExplorer
              onSelectLine={(line, dirIdx) => {
                setLinesModalVisible(false);
                setPreviewLine({ line, dirIdx });
              }}
              onClose={() => setLinesModalVisible(false)}
            />
          </View>
        </Modal>

        {/* 11. FARES & TARIFFS MODAL */}
        <Modal
          visible={faresModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setFaresModalVisible(false)}
        >
          <View style={styles.modalBody}>
            <FaresView
              selectedType={fareType}
              onSelectType={(t) => {
                setFareType(t);
                setFaresModalVisible(false);
              }}
              onClose={() => setFaresModalVisible(false)}
            />
          </View>
        </Modal>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  topSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 90,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.subtle,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconBox: {
    width: 26,
    height: 26,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: 0.2,
  },
  fareSegmentedControl: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.sm,
    padding: 2,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  fareSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.radius.xs,
  },
  fareSegmentActive: {
    backgroundColor: theme.colors.surfaceHover,
  },
  fareSegmentText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  fareSegmentTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  floatingControlsStack: {
    position: 'absolute',
    right: 16,
    bottom: 146,
    gap: 8,
    zIndex: 90,
  },
  controlSquareBtn: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.subtle,
  },
  previewLineBanner: {
    position: 'absolute',
    top: 76,
    left: 16,
    right: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.subtle,
    zIndex: 95,
  },
  previewLineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  previewLineBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: theme.radius.xs,
  },
  previewLineBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  previewLineName: {
    color: theme.colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  previewLineClose: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  bottomSearchContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    zIndex: 90,
    gap: 8,
  },
  searchBarInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    height: 46,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.subtle,
  },
  searchBarPlaceholder: {
    fontSize: 13.5,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    letterSpacing: -0.1,
  },
  quickChipsScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  quickChip: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  loadingBanner: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 34,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.subtle,
    zIndex: 90,
  },
  loadingBannerText: {
    color: theme.colors.textPrimary,
    fontSize: 12.5,
    fontWeight: '500',
  },
  modalBody: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
});
