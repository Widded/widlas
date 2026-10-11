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
  Navigation,
  Bus,
  CreditCard,
  MapPin,
  X,
  ChevronRight,
  Footprints,
  ArrowRight,
  RefreshCw,
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
import { calculateFare, formatFare } from './src/data/fares';

const fmtWalk = (km) => {
  if (!km) return '';
  const m = km * 1000;
  return m > 1000 ? (m / 1000).toFixed(1) + ' km' : Math.round(m) + ' m';
};

export default function App() {
  const [fareType, setFareType] = useState('ogrenci'); // 'ogrenci' (20₺) | 'tam' (30₺)

  // Locations
  const [fromLocation, setFromLocation] = useState({ name: 'Konumunuz', lat: null, lon: null });
  const [toLocation, setToLocation] = useState({ name: '', lat: null, lon: null });
  const [userLocation, setUserLocation] = useState(null);

  // Routing State
  const [searchResults, setSearchResults] = useState(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  // Active line preview on map (from Lines Explorer)
  const [previewLine, setPreviewLine] = useState(null); // { line, dirIdx }

  // Modals
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchTargetType, setSearchTargetType] = useState('to'); // 'from' | 'to'
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [linesModalVisible, setLinesModalVisible] = useState(false);
  const [faresModalVisible, setFaresModalVisible] = useState(false);

  // Auto-fetch GPS on launch
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const userCoords = {
            name: 'Konumunuz',
            lat: loc.coords.latitude,
            lon: loc.coords.longitude
          };
          setUserLocation(userCoords);
          setFromLocation(userCoords);
        }
      } catch (err) {
        console.log('GPS alınamadı', err);
      }
    })();
  }, []);

  // Use GPS button
  const handleUseGps = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Konum İzni Gerekli', 'Lütfen ayarlardan konum erişimine izin verin.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const userCoords = {
        name: 'Konumunuz',
        lat: loc.coords.latitude,
        lon: loc.coords.longitude
      };
      setUserLocation(userCoords);
      setFromLocation(userCoords);
    } catch (err) {
      Alert.alert('Hata', 'Konumunuz tespit edilemedi.');
    }
  };

  // Run Route Search
  const executeRouteSearch = async (from, to) => {
    if (!to?.lat) {
      Alert.alert('Eksik Bilgi', 'Lütfen gitmek istediğiniz konumu seçin.');
      return;
    }

    // Default to Edirne center if GPS is unavailable
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

        {/* 2. FLOATING TOP ISLAND (Apple Maps / Uber Style Capsule) */}
        <SafeAreaView style={styles.topSafeArea}>
          <View style={styles.topCapsule}>
            {/* Brand Logo */}
            <View style={styles.brandGroup}>
              <View style={styles.busDot}>
                <Bus size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.brandTitle}>EDİRNE ETUS</Text>
            </View>

            {/* Quick Fare Toggle */}
            <View style={styles.fareSwitch}>
              <TouchableOpacity
                style={[styles.fareTab, fareType === 'ogrenci' && styles.fareTabActiveStudent]}
                onPress={() => setFareType('ogrenci')}
                activeOpacity={0.7}
              >
                <GraduationCap size={12} color={fareType === 'ogrenci' ? '#FFFFFF' : theme.colors.textSecondary} />
                <Text style={[styles.fareTabText, fareType === 'ogrenci' && styles.fareTabTextActive]}>
                  Öğrenci 20₺
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.fareTab, fareType === 'tam' && styles.fareTabActiveAdult]}
                onPress={() => setFareType('tam')}
                activeOpacity={0.7}
              >
                <User size={12} color={fareType === 'tam' ? '#FFFFFF' : theme.colors.textSecondary} />
                <Text style={[styles.fareTabText, fareType === 'tam' && styles.fareTabTextActive]}>
                  Tam 30₺
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

        {/* 3. FLOATING ACTION STACK ON RIGHT SIDE */}
        <View style={styles.floatingActionStack}>
          {/* Recenter GPS */}
          <TouchableOpacity
            style={styles.floatingCircleBtn}
            onPress={handleUseGps}
            activeOpacity={0.8}
          >
            <LocateFixed size={18} color={theme.colors.primaryGlow} />
          </TouchableOpacity>

          {/* All Lines Sheet */}
          <TouchableOpacity
            style={styles.floatingCircleBtn}
            onPress={() => setLinesModalVisible(true)}
            activeOpacity={0.8}
          >
            <Bus size={18} color={theme.colors.lavender} />
          </TouchableOpacity>

          {/* Fares & Wallet Sheet */}
          <TouchableOpacity
            style={styles.floatingCircleBtn}
            onPress={() => setFaresModalVisible(true)}
            activeOpacity={0.8}
          >
            <CreditCard size={18} color={theme.colors.amber} />
          </TouchableOpacity>
        </View>

        {/* 4. ACTIVE LINE PREVIEW BANNER (When viewing a line from explorer) */}
        {previewLine && (
          <View style={styles.previewLineBanner}>
            <View style={styles.previewLineInfo}>
              <View style={[styles.previewLineBadge, { backgroundColor: previewLine.line.color || theme.colors.violet }]}>
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
              <X size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* 5. UBER-STYLE BOTTOM SEARCH CAPSULE (When Idle / No Route Active) */}
        {!searchResults && !loading && (
          <View style={styles.uberBottomStage}>
            {/* The Main "Nereye?" Search Bar */}
            <TouchableOpacity
              style={styles.uberSearchBar}
              onPress={() => {
                setSearchTargetType('to');
                setSearchModalVisible(true);
              }}
              activeOpacity={0.85}
            >
              <View style={styles.searchIconHalo}>
                <Search size={18} color={theme.colors.violet} />
              </View>
              <Text style={styles.searchPlaceholderText}>
                Nereye gitmek istiyorsunuz?
              </Text>
            </TouchableOpacity>

            {/* 1-Tap Quick Destination Chips Row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickChipsRow}
            >
              {QUICK_PLACES.map((place) => (
                <TouchableOpacity
                  key={place.name}
                  style={styles.quickChip}
                  onPress={() => handleSelectQuickDestination(place)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.quickChipIcon}>{place.icon}</Text>
                  <Text style={styles.quickChipText}>{place.shortName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 6. LOADING SPINNER OVERLAY */}
        {loading && (
          <View style={styles.loadingCardFloating}>
            <ActivityIndicator size="small" color={theme.colors.lavender} />
            <Text style={styles.loadingCardText}>En uygun ETUS rotaları hesaplanıyor...</Text>
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

        {/* 10. LINES EXPLORER MODAL (Opened from floating bus icon) */}
        <Modal
          visible={linesModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setLinesModalVisible(false)}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Tüm ETUS Hatları</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setLinesModalVisible(false)}
                activeOpacity={0.7}
              >
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScrollBody}>
              <LinesExplorer
                onSelectLineOnMap={(line, dirIdx) => {
                  setPreviewLine({ line, dirIdx });
                  setLinesModalVisible(false);
                  setSearchResults(null);
                }}
              />
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* 11. FARES & WALLET MODAL (Opened from floating card icon) */}
        <Modal
          visible={faresModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setFaresModalVisible(false)}
        >
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Ücret Tarifeleri & Kurallar</Text>
              <TouchableOpacity
                style={styles.modalCloseCircle}
                onPress={() => setFaresModalVisible(false)}
                activeOpacity={0.7}
              >
                <X size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <FaresView
              fareType={fareType}
              setFareType={setFareType}
            />
          </SafeAreaView>
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
    zIndex: 100,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  topCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.glass,
    borderRadius: theme.radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  brandGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  busDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    letterSpacing: 0.5,
  },
  fareSwitch: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.pill,
    padding: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fareTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.radius.pill,
  },
  fareTabActiveStudent: {
    backgroundColor: theme.colors.emerald,
  },
  fareTabActiveAdult: {
    backgroundColor: theme.colors.primary,
  },
  fareTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  fareTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  floatingActionStack: {
    position: 'absolute',
    right: 16,
    bottom: 140,
    gap: 10,
    zIndex: 90,
  },
  floatingCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.glass,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  previewLineBanner: {
    position: 'absolute',
    top: 90,
    left: 16,
    right: 16,
    backgroundColor: theme.colors.glass,
    borderRadius: theme.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 95,
  },
  previewLineInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  previewLineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  previewLineBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  previewLineName: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  previewLineClose: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  uberBottomStage: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    zIndex: 90,
    gap: 10,
  },
  uberSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  searchIconHalo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.lavenderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPlaceholderText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  quickChipsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  quickChipIcon: {
    fontSize: 13,
  },
  quickChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  loadingCardFloating: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 40,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 90,
  },
  loadingCardText: {
    color: theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },

  modalSafeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  modalCloseCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollBody: {
    padding: 16,
  },
});
