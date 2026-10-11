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
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import {
  Search,
  Mic,
  User,
  Navigation,
  Layers,
  Crosshair,
  Cloud,
  Home,
  Briefcase,
  GraduationCap,
  ChevronRight,
  Bookmark,
  Clock,
  Settings,
  Bus,
  CreditCard,
  X,
  Check
} from 'lucide-react-native';

import { theme } from './src/theme';
import NativeMap from './src/components/NativeMap';
import RouteDetailsModal from './src/components/RouteDetailsModal';
import LinesExplorer from './src/components/LinesExplorer';
import SearchModal from './src/components/SearchModal';
import FaresView from './src/components/FaresView';
import RouteResultSheet from './src/components/RouteResultSheet';
import SavedView from './src/components/SavedView';
import HistoryView from './src/components/HistoryView';

import { calculateSmartRoute } from './src/data/routes';
import { fetchWalkingPath, reverseGeocodeCoord } from './src/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function MainScreen() {
  const insets = useSafeAreaInsets();

  const [fareType, setFareType] = useState('ogrenci'); // 'ogrenci' | 'tam'
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'saved' | 'history' | 'settings'

  // Locations
  const [fromLocation, setFromLocation] = useState({ name: 'Konumunuz', lat: null, lon: null });
  const [toLocation, setToLocation] = useState({ name: '', lat: null, lon: null });
  const [userLocation, setUserLocation] = useState(null);

  // Routing State
  const [searchResults, setSearchResults] = useState(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [loading, setLoading] = useState(false);

  // Pedestrian Walking Polylines (Real Street Sidewalks from Mapbox)
  const [walkingPathStart, setWalkingPathStart] = useState([]);
  const [walkingPathEnd, setWalkingPathEnd] = useState([]);

  // Modals & Panels
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchTargetType, setSearchTargetType] = useState('to'); // 'from' | 'to'
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [linesModalVisible, setLinesModalVisible] = useState(false);
  const [faresModalVisible, setFaresModalVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // Line preview mode from explorer
  const [previewLine, setPreviewLine] = useState(null);

  // Continuous Live GPS Watcher
  useEffect(() => {
    let locationSubscription = null;
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

          // Watch position continuously
          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              distanceInterval: 10,
              timeInterval: 4000
            },
            (newLoc) => {
              const updated = {
                name: 'Mevcut Konumunuz',
                lat: newLoc.coords.latitude,
                lon: newLoc.coords.longitude
              };
              setUserLocation(updated);
            }
          );
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

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const activeRoute = searchResults?.routes?.[selectedRouteIdx] || null;

  // Real Mapbox Pedestrian Walking Paths when route is active
  useEffect(() => {
    if (!activeRoute || !fromLocation?.lat || !toLocation?.lat) {
      setWalkingPathStart([]);
      setWalkingPathEnd([]);
      return;
    }

    if (activeRoute.isWalkOnly) {
      fetchWalkingPath(fromLocation.lat, fromLocation.lon, toLocation.lat, toLocation.lon)
        .then(setWalkingPathStart);
      setWalkingPathEnd([]);
    } else {
      if (activeRoute.startStop?.lat) {
        fetchWalkingPath(fromLocation.lat, fromLocation.lon, activeRoute.startStop.lat, activeRoute.startStop.lon)
          .then(setWalkingPathStart);
      }
      if (activeRoute.endStop?.lat) {
        fetchWalkingPath(activeRoute.endStop.lat, activeRoute.endStop.lon, toLocation.lat, toLocation.lon)
          .then(setWalkingPathEnd);
      }
    }
  }, [activeRoute?.id, fromLocation?.lat, fromLocation?.lon, toLocation?.lat, toLocation?.lon]);

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

  // Map Tap / Pin Dropping (Web parity: tap map to pick destination)
  const handleMapPress = async (coord) => {
    if (!coord?.latitude || !coord?.longitude) return;
    const placeName = await reverseGeocodeCoord(coord.latitude, coord.longitude);
    executeRouteSearch(fromLocation, {
      name: placeName,
      lat: coord.latitude,
      lon: coord.longitude
    });
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
    setWalkingPathStart([]);
    setWalkingPathEnd([]);
  };

  // Preset quick navigation targets
  const handleQuickPreset = (presetKey) => {
    if (presetKey === 'home') {
      executeRouteSearch(fromLocation, {
        name: 'Ev (Şükrüpaşa)',
        lat: 41.6670,
        lon: 26.5911
      });
    } else if (presetKey === 'work') {
      executeRouteSearch(fromLocation, {
        name: 'İş (Saraçlar Caddesi)',
        lat: 41.6735,
        lon: 26.5537
      });
    } else if (presetKey === 'uni') {
      executeRouteSearch(fromLocation, {
        name: 'Trakya Üniversitesi Balkan Kampüsü',
        lat: 41.6389,
        lon: 26.6150
      });
    }
  };

  // Safe area metrics & dynamic collision-free positioning
  const topPadding = insets.top > 0 ? insets.top : (Platform.OS === 'android' ? 16 : 10);
  const bottomPadding = insets.bottom > 0 ? insets.bottom : 8;

  // Bottom nav bar total height (including home bar safe area)
  const bottomNavHeight = 56 + bottomPadding;

  // Height of the preset bottom drawer
  const sheetHeight = 224;

  // Positioning floating widgets cleanly ABOVE the bottom drawer with 14px breathing room
  const floatingWidgetsBottom = bottomNavHeight + sheetHeight + 14;

  // Positioning top compass & layer buttons cleanly BELOW the search bar pill
  const topFloatingTop = topPadding + 132;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {activeTab === 'saved' ? (
        <SavedView
          topPadding={topPadding}
          bottomPadding={bottomNavHeight}
          onSelectPlace={(place) => {
            setActiveTab('explore');
            executeRouteSearch(fromLocation, place);
          }}
          onOpenSearch={() => {
            setSearchTargetType('to');
            setSearchModalVisible(true);
          }}
          onBack={() => {
            setActiveTab('explore');
          }}
        />
      ) : activeTab === 'history' ? (
        <HistoryView
          topPadding={topPadding}
          bottomPadding={bottomNavHeight}
          onSelectHistoryItem={(item) => {
            setActiveTab('explore');
            executeRouteSearch(item.from || fromLocation, item.to);
          }}
          onBack={() => {
            setActiveTab('explore');
          }}
        />
      ) : (
        <>
          {/* 1. FULL-SCREEN DARK NATIVE MAP */}
          <NativeMap
            style={StyleSheet.absoluteFillObject}
            fromLocation={fromLocation}
            toLocation={toLocation}
            activeRoute={previewLine ? null : activeRoute}
        activeLineData={previewLine?.line}
        activeLineDirIdx={previewLine?.dirIdx}
        userLocation={userLocation}
        walkingPathStart={walkingPathStart}
        walkingPathEnd={walkingPathEnd}
        onMapPress={handleMapPress}
      />

      {/* 2. TOP GREETING & PILL SEARCH BAR (Safe Area Protected) */}
      <View style={[styles.topHeaderCard, { paddingTop: topPadding + 4 }]} pointerEvents="box-none">
        {/* Greeting Row with Profile Avatar */}
        <View style={styles.greetingRow}>
          <View style={styles.greetingTextCol}>
            <Text style={styles.greetingTitle}>Merhaba,</Text>
            <Text style={styles.greetingSubtitle}>Nereye gideceksin?</Text>
          </View>

          <TouchableOpacity
            style={styles.profileBtn}
            onPress={() => setProfileModalVisible(true)}
            activeOpacity={0.8}
          >
            <User size={18} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* Pill Search Input Button */}
        <TouchableOpacity
          style={styles.searchPill}
          onPress={() => {
            setSearchTargetType('to');
            setSearchModalVisible(true);
          }}
          activeOpacity={0.85}
        >
          <Search size={17} color="#94A3B8" />
          <Text style={styles.searchPillPlaceholder}>Varış noktası ara</Text>
          <Mic size={17} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* 3. FLOATING MAP CONTROLS (Top Right Compass & Layers - Placed below search bar) */}
      <View style={[styles.topFloatingControls, { top: topFloatingTop }]}>
        <TouchableOpacity
          style={styles.circleMapBtn}
          onPress={handleUseGps}
          activeOpacity={0.8}
        >
          <Navigation size={18} color="#E2E8F0" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.circleMapBtn}
          onPress={() => setLinesModalVisible(true)}
          activeOpacity={0.8}
        >
          <Layers size={18} color="#E2E8F0" />
        </TouchableOpacity>
      </View>

      {/* 4. ACTIVE LINE PREVIEW BANNER (When inspecting line from Explorer) */}
      {previewLine && (
        <View style={[styles.previewLineBanner, { top: topFloatingTop }]}>
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

      {/* 5. WEATHER & LIVE TRANSIT WIDGET (Bottom-Left - Positioned cleanly ABOVE the sheet) */}
      {!searchResults && (
        <View style={[styles.weatherWidget, { bottom: floatingWidgetsBottom }]}>
          <View style={styles.weatherTempRow}>
            <Cloud size={15} color="#E2E8F0" />
            <Text style={styles.weatherTempText}>18°</Text>
          </View>
          <View style={styles.weatherStatusRow}>
            <View style={styles.weatherAqiDot} />
            <Text style={styles.weatherAqiText}>AQI 42</Text>
          </View>
        </View>
      )}

      {/* 6. BOTTOM-RIGHT RECENTER BUTTON (Positioned cleanly ABOVE the sheet) */}
      {!searchResults && (
        <View style={[styles.bottomRecenterContainer, { bottom: floatingWidgetsBottom }]}>
          <TouchableOpacity
            style={styles.circleMapBtn}
            onPress={handleUseGps}
            activeOpacity={0.8}
          >
            <Crosshair size={18} color="#E2E8F0" />
          </TouchableOpacity>
        </View>
      )}

      {/* 7. LOADING SPINNER OVERLAY */}
      {loading && (
        <View style={[styles.loadingBanner, { bottom: bottomNavHeight + 20 }]}>
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text style={styles.loadingBannerText}>En uygun ETUS rotaları hesaplanıyor...</Text>
        </View>
      )}

      {/* 8. BOTTOM SHEET: PRESET DESTINATIONS OR ROUTE RESULT SHEET */}
      {searchResults && !loading ? (
        <View style={[styles.routeResultSheetWrapper, { bottom: bottomNavHeight }]}>
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
        </View>
      ) : (
        !loading && (
          <View style={[styles.presetSheetContainer, { bottom: bottomNavHeight }]}>
            {/* Grabber Handle */}
            <View style={styles.sheetGrabberBar} />

            {/* Destination Preset Items */}
            <View style={styles.presetList}>
              {/* 1. Ev */}
              <TouchableOpacity
                style={styles.presetItem}
                onPress={() => handleQuickPreset('home')}
                activeOpacity={0.7}
              >
                <View style={styles.presetIconBox}>
                  <Home size={18} color="#E2E8F0" />
                </View>
                <View style={styles.presetTextCol}>
                  <Text style={styles.presetTitle}>Ev</Text>
                  <Text style={styles.presetSubtitle}>Tahmini süre · 22 dk</Text>
                </View>
                <ChevronRight size={18} color="#475569" />
              </TouchableOpacity>

              {/* 2. İş */}
              <TouchableOpacity
                style={styles.presetItem}
                onPress={() => handleQuickPreset('work')}
                activeOpacity={0.7}
              >
                <View style={styles.presetIconBox}>
                  <Briefcase size={18} color="#E2E8F0" />
                </View>
                <View style={styles.presetTextCol}>
                  <Text style={styles.presetTitle}>İş</Text>
                  <Text style={styles.presetSubtitle}>Tahmini süre · 35 dk</Text>
                </View>
                <ChevronRight size={18} color="#475569" />
              </TouchableOpacity>

              {/* 3. Trakya Üniversitesi */}
              <TouchableOpacity
                style={styles.presetItem}
                onPress={() => handleQuickPreset('uni')}
                activeOpacity={0.7}
              >
                <View style={styles.presetIconBox}>
                  <GraduationCap size={18} color="#E2E8F0" />
                </View>
                <View style={styles.presetTextCol}>
                  <Text style={styles.presetTitle}>Trakya Üniversitesi</Text>
                  <Text style={styles.presetSubtitle}>Balkan Kampüsü · 18 dk</Text>
                </View>
                <ChevronRight size={18} color="#475569" />
              </TouchableOpacity>
            </View>
          </View>
        )
      )}
      </>
      )}

      {/* 9. FIXED BOTTOM NAVIGATION BAR (Exact Match to Reference Design) */}
      <View style={[styles.bottomNav, { height: bottomNavHeight, paddingBottom: bottomPadding }]}>
        {/* Tab 1: Keşfet */}
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => {
            setActiveTab('explore');
            handleClearRoute();
          }}
          activeOpacity={0.75}
        >
          <Navigation
            size={20}
            color={activeTab === 'explore' ? '#3B82F6' : '#64748B'}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeTab === 'explore' && styles.navTabLabelActive
            ]}
          >
            Keşfet
          </Text>
        </TouchableOpacity>

        {/* Tab 2: Kaydedilenler */}
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => {
            setActiveTab('saved');
          }}
          activeOpacity={0.75}
        >
          <Bookmark
            size={20}
            color={activeTab === 'saved' ? '#3B82F6' : '#64748B'}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeTab === 'saved' && styles.navTabLabelActive
            ]}
          >
            Kaydedilenler
          </Text>
        </TouchableOpacity>

        {/* Tab 3: Geçmiş */}
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => {
            setActiveTab('history');
          }}
          activeOpacity={0.75}
        >
          <Clock
            size={20}
            color={activeTab === 'history' ? '#3B82F6' : '#64748B'}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeTab === 'history' && styles.navTabLabelActive
            ]}
          >
            Geçmiş
          </Text>
        </TouchableOpacity>

        {/* Tab 4: Ayarlar */}
        <TouchableOpacity
          style={styles.navTab}
          onPress={() => {
            setActiveTab('settings');
            setProfileModalVisible(true);
          }}
          activeOpacity={0.75}
        >
          <Settings
            size={20}
            color={activeTab === 'settings' ? '#3B82F6' : '#64748B'}
          />
          <Text
            style={[
              styles.navTabLabel,
              activeTab === 'settings' && styles.navTabLabelActive
            ]}
          >
            Ayarlar
          </Text>
        </TouchableOpacity>
      </View>

      {/* 10. MODAL: PROFILE & FARE SETTINGS */}
      <Modal
        visible={profileModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setProfileModalVisible(false)}
      >
        <SafeAreaView style={styles.profileModalContainer}>
          <View style={styles.profileModalHeader}>
            <Text style={styles.profileModalTitle}>Tercihler & Tarife</Text>
            <TouchableOpacity
              onPress={() => setProfileModalVisible(false)}
              style={styles.profileModalClose}
            >
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.profileModalContent}>
            {/* Fare Segment Selection */}
            <Text style={styles.profileSectionTitle}>ETUS BİLET TARİFESİ</Text>
            <View style={styles.profileFareGroup}>
              <TouchableOpacity
                style={[styles.profileFareCard, fareType === 'ogrenci' && styles.profileFareCardActive]}
                onPress={() => setFareType('ogrenci')}
                activeOpacity={0.75}
              >
                <View style={styles.profileFareIconBox}>
                  <GraduationCap size={20} color={fareType === 'ogrenci' ? '#3B82F6' : '#94A3B8'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileFareCardTitle}>Öğrenci Tarifesi</Text>
                  <Text style={styles.profileFareCardSub}>Geçerli Kentkart ile 20,00 ₺</Text>
                </View>
                {fareType === 'ogrenci' && <Check size={18} color="#3B82F6" />}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.profileFareCard, fareType === 'tam' && styles.profileFareCardActive]}
                onPress={() => setFareType('tam')}
                activeOpacity={0.75}
              >
                <View style={styles.profileFareIconBox}>
                  <User size={20} color={fareType === 'tam' ? '#3B82F6' : '#94A3B8'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileFareCardTitle}>Tam / Sivil Tarifesi</Text>
                  <Text style={styles.profileFareCardSub}>Standart Kentkart ile 30,00 ₺</Text>
                </View>
                {fareType === 'tam' && <Check size={18} color="#3B82F6" />}
              </TouchableOpacity>
            </View>

            {/* Transit Tools Quick Links */}
            <Text style={styles.profileSectionTitle}>ULAŞIM ARAÇLARI</Text>
            <TouchableOpacity
              style={styles.profileActionRow}
              onPress={() => {
                setProfileModalVisible(false);
                setLinesModalVisible(true);
              }}
              activeOpacity={0.75}
            >
              <View style={styles.profileActionIconBox}>
                <Bus size={18} color="#24C795" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileActionTitle}>ETUS Hat Rehberi</Text>
                <Text style={styles.profileActionSub}>Tüm güzergahlar ve kalkış saatleri</Text>
              </View>
              <ChevronRight size={18} color="#475569" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.profileActionRow}
              onPress={() => {
                setProfileModalVisible(false);
                setFaresModalVisible(true);
              }}
              activeOpacity={0.75}
            >
              <View style={styles.profileActionIconBox}>
                <CreditCard size={18} color="#F59E0B" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileActionTitle}>Ücret Tarifeleri & Aktarma</Text>
                <Text style={styles.profileActionSub}>Detaylı tarife tablosu ve aktarma kuralları</Text>
              </View>
              <ChevronRight size={18} color="#475569" />
            </TouchableOpacity>

            <View style={styles.appVersionBox}>
              <Text style={styles.appVersionText}>ETUS Edirne Toplu Taşıma · v2.4</Text>
              <Text style={styles.appVersionSub}>Canlı TomTom ve Mapbox ile güçlendirilmiştir.</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 11. SEARCH MODAL (TomTom + Mapbox + Nominatim + 745 Stops Live Search) */}
      <SearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        targetType={searchTargetType}
        currentName={searchTargetType === 'from' ? fromLocation.name : toLocation.name}
        onSelect={handleModalSelect}
      />

      {/* 12. ROUTE DETAILS TURN-BY-TURN MODAL */}
      <RouteDetailsModal
        visible={detailsModalVisible}
        route={activeRoute}
        onClose={() => setDetailsModalVisible(false)}
      />

      {/* 13. LINES EXPLORER MODAL */}
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

      {/* 14. FARES & TARIFFS MODAL */}
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
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090B0F',
  },
  // Top Header Area (Greeting + Pill Search Bar)
  topHeaderCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 90,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  greetingTextCol: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  greetingSubtitle: {
    fontSize: 14.5,
    fontWeight: '400',
    color: '#94A3B8',
    marginTop: 2,
  },
  profileBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(22, 27, 34, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22, 27, 34, 0.95)',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
  },
  searchPillPlaceholder: {
    flex: 1,
    fontSize: 14.5,
    color: '#94A3B8',
    fontWeight: '400',
  },

  // Floating Right Map Controls (Compass & Layers)
  topFloatingControls: {
    position: 'absolute',
    right: 18,
    gap: 10,
    zIndex: 85,
  },
  circleMapBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(22, 27, 34, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Weather & Air Quality Widget (Bottom-Left above sheet)
  weatherWidget: {
    position: 'absolute',
    left: 18,
    backgroundColor: 'rgba(22, 27, 34, 0.94)',
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 85,
    gap: 3,
  },
  weatherTempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherTempText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14.5,
  },
  weatherStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  weatherAqiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#24C795',
  },
  weatherAqiText: {
    color: '#24C795',
    fontSize: 10.5,
    fontWeight: '600',
  },

  // Recenter GPS Button (Bottom-Right above sheet)
  bottomRecenterContainer: {
    position: 'absolute',
    right: 18,
    zIndex: 85,
  },

  // Preview Line Banner
  previewLineBanner: {
    position: 'absolute',
    left: 18,
    right: 70,
    backgroundColor: '#161B24',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#252C36',
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
    borderRadius: 6,
  },
  previewLineBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  previewLineName: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
    flex: 1,
  },
  previewLineClose: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E2530',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  // Preset Bottom Sheet Card (Matching screenshot)
  presetSheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#11151B',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 20,
    paddingBottom: 14,
    zIndex: 80,
  },
  sheetGrabberBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#333C4D',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  presetList: {
    gap: 4,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 14,
  },
  presetIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#181E29',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  presetTextCol: {
    flex: 1,
  },
  presetTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  presetSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },

  // Active Route Sheet Wrapper
  routeResultSheetWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 90,
  },

  // Loading Banner
  loadingBanner: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: '#161B24',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    zIndex: 95,
  },
  loadingBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },

  // Bottom Fixed Navigation Bar (Exact Match)
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#090B0F',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    zIndex: 100,
  },
  navTab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 4,
    paddingVertical: 6,
  },
  navTabLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#64748B',
  },
  navTabLabelActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },

  // Profile & Tariffs Modal
  profileModalContainer: {
    flex: 1,
    backgroundColor: '#090B0F',
  },
  profileModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  profileModalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E2530',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileModalContent: {
    padding: 20,
    gap: 16,
  },
  profileSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginTop: 8,
  },
  profileFareGroup: {
    gap: 10,
  },
  profileFareCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12161E',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  profileFareCardActive: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  profileFareIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#181E29',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileFareCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  profileFareCardSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  profileActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12161E',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  profileActionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#181E29',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileActionTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  profileActionSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  appVersionBox: {
    alignItems: 'center',
    marginTop: 24,
    gap: 4,
  },
  appVersionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  appVersionSub: {
    fontSize: 11,
    color: '#475569',
  },
  modalBody: {
    flex: 1,
    backgroundColor: '#090B0F',
  },
});
