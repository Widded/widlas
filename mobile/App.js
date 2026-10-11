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
  Platform,
  Switch
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
  Check,
  MapPin,
  Map,
  Globe,
  Droplets,
  Wind
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
import SettingsView from './src/components/SettingsView';

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
  const [layerModalVisible, setLayerModalVisible] = useState(false);
  const [weatherModalVisible, setWeatherModalVisible] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  // Map & App Settings state (Synced globally)
  const [mapType, setMapType] = useState('Standart'); // 'Standart' | 'Uydu'
  const [accuracy, setAccuracy] = useState('Yüksek'); // 'Yüksek' | 'Dengeli'
  const [walkingDistance, setWalkingDistance] = useState('500 m');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  // Line preview mode from explorer
  const [previewLine, setPreviewLine] = useState(null);

  // Continuous Live GPS Watcher (Reacts to accuracy preference)
  useEffect(() => {
    let locationSubscription = null;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: accuracy === 'Yüksek' ? Location.Accuracy.High : Location.Accuracy.Balanced
          });
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
              accuracy: accuracy === 'Yüksek' ? Location.Accuracy.High : Location.Accuracy.Balanced,
              distanceInterval: accuracy === 'Yüksek' ? 5 : 15,
              timeInterval: accuracy === 'Yüksek' ? 2500 : 7000
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
  }, [accuracy]);

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

  // Force GPS Recenter & Map Animation
  const handleUseGps = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Konumunuza erişmek için lütfen izin verin.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: accuracy === 'Yüksek' ? Location.Accuracy.High : Location.Accuracy.Balanced
      });
      const userCoords = {
        name: 'Mevcut Konumunuz',
        lat: loc.coords.latitude,
        lon: loc.coords.longitude
      };
      setUserLocation(userCoords);
      setFromLocation(userCoords);
      setRecenterTrigger(prev => prev + 1);

      if (toLocation?.lat) {
        executeRouteSearch(userCoords, toLocation);
      }
    } catch (e) {
      Alert.alert('Hata', 'Konumunuz tespit edilemedi.');
    }
  };

  // Compass / Orientation & Recenter
  const handleCompassPress = () => {
    setRecenterTrigger(prev => prev + 1);
    handleUseGps();
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

  // Map Long Press / Pin Dropping (Hold map to pick destination)
  const handleMapLongPress = async (coord) => {
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

  // Positioning floating widgets cleanly ABOVE the bottom navigation bar with 14px breathing room
  const floatingWidgetsBottom = bottomNavHeight + 14;

  // Positioning top compass & layer buttons cleanly BELOW the search bar pill and chips
  const topFloatingTop = topPadding + 114;

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
      ) : activeTab === 'settings' ? (
        <SettingsView
          topPadding={topPadding}
          bottomPadding={bottomNavHeight}
          fareType={fareType}
          onFareTypeChange={setFareType}
          mapView={mapType}
          onMapViewChange={setMapType}
          accuracy={accuracy}
          onAccuracyChange={setAccuracy}
          walkingDistance={walkingDistance}
          onWalkingDistanceChange={setWalkingDistance}
          notificationsEnabled={notificationsEnabled}
          onNotificationsChange={setNotificationsEnabled}
          onOpenLines={() => setLinesModalVisible(true)}
          onOpenProfile={() => setProfileModalVisible(true)}
          onBack={() => setActiveTab('explore')}
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
            onMapLongPress={handleMapLongPress}
            mapType={mapType}
            recenterTrigger={recenterTrigger}
          />

      {/* 2. TOP PILL SEARCH BAR & HORIZONTAL PRESET CHIPS (Safe Area Protected) */}
      <View style={[styles.topHeaderCard, { paddingTop: topPadding + 8 }]} pointerEvents="box-none">
        <View style={styles.searchPill}>
          <TouchableOpacity
            style={styles.searchPillInputArea}
            onPress={() => {
              setSearchTargetType('to');
              setSearchModalVisible(true);
            }}
            activeOpacity={0.85}
          >
            <Search size={18} color="#3B82F6" />
            <Text style={styles.searchPillPlaceholder}>Varış noktası veya hat ara...</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.searchMicBtn}
            onPress={() => setVoiceModalVisible(true)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Mic size={17} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        {/* Horizontal Scrollable Quick Destination Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickChipsScroll}
          style={styles.quickChipsWrapper}
        >
          {/* Ev */}
          <TouchableOpacity
            style={styles.quickChip}
            onPress={() => handleQuickPreset('home')}
            activeOpacity={0.75}
          >
            <Home size={15} color="#3B82F6" />
            <Text style={styles.quickChipText}>Ev</Text>
            <Text style={styles.quickChipSub}>22 dk</Text>
          </TouchableOpacity>

          {/* İş */}
          <TouchableOpacity
            style={styles.quickChip}
            onPress={() => handleQuickPreset('work')}
            activeOpacity={0.75}
          >
            <Briefcase size={15} color="#24C795" />
            <Text style={styles.quickChipText}>İş</Text>
            <Text style={styles.quickChipSub}>35 dk</Text>
          </TouchableOpacity>

          {/* Trakya Üniversitesi */}
          <TouchableOpacity
            style={styles.quickChip}
            onPress={() => handleQuickPreset('uni')}
            activeOpacity={0.75}
          >
            <GraduationCap size={15} color="#818CF8" />
            <Text style={styles.quickChipText}>Trakya Üni</Text>
            <Text style={styles.quickChipSub}>18 dk</Text>
          </TouchableOpacity>

          {/* Erasta AVM */}
          <TouchableOpacity
            style={styles.quickChip}
            onPress={() => executeRouteSearch(fromLocation, { name: 'Erasta AVM', lat: 41.6663, lon: 26.5710 })}
            activeOpacity={0.75}
          >
            <MapPin size={15} color="#F59E0B" />
            <Text style={styles.quickChipText}>Erasta AVM</Text>
          </TouchableOpacity>

          {/* Selimiye Camii */}
          <TouchableOpacity
            style={styles.quickChip}
            onPress={() => executeRouteSearch(fromLocation, { name: 'Selimiye Camii', lat: 41.6781, lon: 26.5594 })}
            activeOpacity={0.75}
          >
            <MapPin size={15} color="#EC4899" />
            <Text style={styles.quickChipText}>Selimiye</Text>
          </TouchableOpacity>

          {/* Edirne Otogar */}
          <TouchableOpacity
            style={styles.quickChip}
            onPress={() => executeRouteSearch(fromLocation, { name: 'Edirne Otogar', lat: 41.6320, lon: 26.6184 })}
            activeOpacity={0.75}
          >
            <Bus size={15} color="#06B6D4" />
            <Text style={styles.quickChipText}>Otogar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 3. FLOATING MAP CONTROLS (Top Right Compass & Layers - Placed below search bar) */}
      <View style={[styles.topFloatingControls, { top: topFloatingTop }]}>
        <TouchableOpacity
          style={styles.circleMapBtn}
          onPress={handleCompassPress}
          activeOpacity={0.8}
        >
          <Navigation size={18} color="#E2E8F0" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.circleMapBtn, mapType === 'Uydu' && styles.circleMapBtnActive]}
          onPress={() => setLayerModalVisible(true)}
          activeOpacity={0.8}
        >
          <Layers size={18} color={mapType === 'Uydu' ? '#3B82F6' : '#E2E8F0'} />
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
        <TouchableOpacity
          style={[styles.weatherWidget, { bottom: floatingWidgetsBottom }]}
          onPress={() => setWeatherModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.weatherTempRow}>
            <Cloud size={15} color="#E2E8F0" />
            <Text style={styles.weatherTempText}>18°</Text>
          </View>
          <View style={styles.weatherStatusRow}>
            <View style={styles.weatherAqiDot} />
            <Text style={styles.weatherAqiText}>AQI 42</Text>
          </View>
        </TouchableOpacity>
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

      {/* 8. BOTTOM SHEET: ROUTE RESULT SHEET */}
      {searchResults && !loading && (
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

      {/* 15. MODAL: HARİTA KATMANLARI & GÖRÜNÜM */}
      <Modal
        visible={layerModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLayerModalVisible(false)}
      >
        <SafeAreaView style={styles.sheetModalContainer}>
          <View style={styles.sheetModalHeader}>
            <Text style={styles.sheetModalTitle}>Harita Katmanları & Görünüm</Text>
            <TouchableOpacity
              onPress={() => setLayerModalVisible(false)}
              style={styles.sheetModalClose}
            >
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.sheetModalContent}>
            <Text style={styles.sheetSectionLabel}>HARİTA TÜRÜ</Text>
            <View style={styles.sheetGroupCard}>
              {/* Standart Koyu */}
              <TouchableOpacity
                style={styles.sheetRowItem}
                onPress={() => {
                  setMapType('Standart');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.sheetIconCircle}>
                  <Map size={18} color="#3B82F6" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.sheetRowTitle}>Standart Koyu (OLED)</Text>
                  <Text style={styles.sheetRowSubtitle}>Yüksek kontrastlı gece teması</Text>
                </View>
                {mapType === 'Standart' && <Check size={18} color="#3B82F6" />}
              </TouchableOpacity>

              <View style={styles.sheetRowDivider} />

              {/* Uydu */}
              <TouchableOpacity
                style={styles.sheetRowItem}
                onPress={() => {
                  setMapType('Uydu');
                }}
                activeOpacity={0.7}
              >
                <View style={styles.sheetIconCircle}>
                  <Globe size={18} color="#24C795" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.sheetRowTitle}>Uydu Haritası</Text>
                  <Text style={styles.sheetRowSubtitle}>Detaylı hava ve coğrafi uydu görüntüsü</Text>
                </View>
                {mapType === 'Uydu' && <Check size={18} color="#3B82F6" />}
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetSectionLabel}>TOPLU TAŞIMA REHBERİ</Text>
            <View style={styles.sheetGroupCard}>
              {/* Tüm Hatları Aç */}
              <TouchableOpacity
                style={styles.sheetRowItem}
                onPress={() => {
                  setLayerModalVisible(false);
                  setLinesModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.sheetIconCircle}>
                  <Bus size={18} color="#818CF8" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.sheetRowTitle}>ETUS Hatları & Güzergahlar</Text>
                  <Text style={styles.sheetRowSubtitle}>Tüm otobüs hatlarını ve kalkış saatlerini gör</Text>
                </View>
                <ChevronRight size={18} color="#475569" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 16. MODAL: EDİRNE HAVA DURUMU & ULAŞIM RAPORU */}
      <Modal
        visible={weatherModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setWeatherModalVisible(false)}
      >
        <SafeAreaView style={styles.sheetModalContainer}>
          <View style={styles.sheetModalHeader}>
            <Text style={styles.sheetModalTitle}>Edirne Canlı Hava & Ulaşım</Text>
            <TouchableOpacity
              onPress={() => setWeatherModalVisible(false)}
              style={styles.sheetModalClose}
            >
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.sheetModalContent}>
            {/* Main Weather Card */}
            <View style={styles.weatherMainHeroCard}>
              <View style={styles.weatherHeroRow}>
                <View>
                  <Text style={styles.weatherHeroTemp}>18°C</Text>
                  <Text style={styles.weatherHeroCondition}>Parçalı Bulutlu</Text>
                </View>
                <Cloud size={48} color="#94A3B8" />
              </View>

              <View style={styles.weatherAqiBadgeRow}>
                <View style={styles.weatherAqiBadge}>
                  <View style={styles.weatherAqiDot} />
                  <Text style={styles.weatherAqiBadgeText}>Hava Kalitesi: AQI 42 (Mükemmel)</Text>
                </View>
              </View>
            </View>

            {/* Weather Metrics Grid */}
            <View style={styles.weatherGrid}>
              <View style={styles.weatherGridItem}>
                <Droplets size={16} color="#3B82F6" />
                <Text style={styles.weatherGridVal}>%52</Text>
                <Text style={styles.weatherGridLabel}>Nem</Text>
              </View>

              <View style={styles.weatherGridItem}>
                <Wind size={16} color="#24C795" />
                <Text style={styles.weatherGridVal}>14 km/s</Text>
                <Text style={styles.weatherGridLabel}>Rüzgar (KB)</Text>
              </View>

              <View style={styles.weatherGridItem}>
                <Crosshair size={16} color="#F59E0B" />
                <Text style={styles.weatherGridVal}>1018 hPa</Text>
                <Text style={styles.weatherGridLabel}>Basınç</Text>
              </View>

              <View style={styles.weatherGridItem}>
                <Navigation size={16} color="#818CF8" />
                <Text style={styles.weatherGridVal}>10 km</Text>
                <Text style={styles.weatherGridLabel}>Görüş</Text>
              </View>
            </View>

            {/* Live Transit Status Card */}
            <Text style={styles.sheetSectionLabel}>ETUS CANLI SEFER DURUMU</Text>
            <View style={styles.sheetGroupCard}>
              <View style={styles.transitStatusCard}>
                <View style={styles.transitStatusHeader}>
                  <View style={styles.transitLiveDot} />
                  <Text style={styles.transitStatusTitle}>Tüm Seferler Normal</Text>
                </View>
                <Text style={styles.transitStatusDesc}>
                  Edirne genelinde tüm ETUS güzergahlarında otobüsler planlanan sefer saatlerinde hizmet vermektedir. Herhangi bir yol çalışması veya hat kesintisi bulunmamaktadır.
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 17. MODAL: SESLİ ARAMA & HIZLI NOKTALAR */}
      <Modal
        visible={voiceModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVoiceModalVisible(false)}
      >
        <SafeAreaView style={styles.sheetModalContainer}>
          <View style={styles.sheetModalHeader}>
            <Text style={styles.sheetModalTitle}>Sesli Arama & Hızlı Rota</Text>
            <TouchableOpacity
              onPress={() => setVoiceModalVisible(false)}
              style={styles.sheetModalClose}
            >
              <X size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.sheetModalContent}>
            {/* Glowing Voice Mic Visual */}
            <View style={styles.voiceHeroBox}>
              <View style={styles.voiceMicOuterPulse}>
                <View style={styles.voiceMicInner}>
                  <Mic size={32} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.voiceHeroTitle}>Nereye gitmek istiyorsunuz?</Text>
              <Text style={styles.voiceHeroSubtitle}>Aşağıdaki popüler noktalardan birine tek dokunuşla rota oluşturun:</Text>
            </View>

            {/* Quick 1-Tap Voice Destinations */}
            <View style={styles.sheetGroupCard}>
              {[
                { name: 'Erasta AVM', sub: 'Abdurrahman Mah. · Alışveriş & Sinema', lat: 41.6663, lon: 26.5710 },
                { name: 'Trakya Üniversitesi Balkan Kampüsü', sub: 'Balkan Yerleşkesi · Fakülteler', lat: 41.6389, lon: 26.6150 },
                { name: 'Selimiye Camii & Meydanı', sub: 'Merkez Tarihi Alan', lat: 41.6781, lon: 26.5594 },
                { name: 'Edirne Otogar', sub: 'Şehirlerarası Otobüs Terminali', lat: 41.6320, lon: 26.6184 },
                { name: 'Saraçlar Caddesi', sub: 'Trafiğe Kapalı Alışveriş Caddesi', lat: 41.6735, lon: 26.5537 },
                { name: 'Sultan 1. Murat Devlet Hastanesi', sub: 'Kocasinan Mah. · Sağlık', lat: 41.6545, lon: 26.6060 },
                { name: 'Karaağaç Lozan Anıtı', sub: 'Karaağaç Tarihi Bölgesi', lat: 41.6535, lon: 26.5208 },
              ].map((dest, i, arr) => (
                <React.Fragment key={dest.name}>
                  <TouchableOpacity
                    style={styles.sheetRowItem}
                    onPress={() => {
                      setVoiceModalVisible(false);
                      executeRouteSearch(fromLocation, dest);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.sheetIconCircle}>
                      <MapPin size={18} color="#3B82F6" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.sheetRowTitle}>{dest.name}</Text>
                      <Text style={styles.sheetRowSubtitle}>{dest.sub}</Text>
                    </View>
                    <ChevronRight size={18} color="#475569" />
                  </TouchableOpacity>
                  {i < arr.length - 1 && <View style={styles.sheetRowDivider} />}
                </React.Fragment>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
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
    backgroundColor: '#12161E',
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1E2538',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  searchPillPlaceholder: {
    flex: 1,
    fontSize: 14.5,
    color: '#94A3B8',
    fontWeight: '400',
  },

  // Horizontal Quick Destination Chips
  quickChipsWrapper: {
    marginTop: 10,
  },
  quickChipsScroll: {
    paddingRight: 20,
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12161E',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1E2538',
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  quickChipSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 2,
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
    backgroundColor: '#12161E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E2538',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },

  // Weather & Air Quality Widget (Bottom-Left above sheet)
  weatherWidget: {
    position: 'absolute',
    left: 18,
    backgroundColor: '#12161E',
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: '#1E2538',
    zIndex: 85,
    gap: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
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

  // Preset Bottom Sheet Card (Matching OLED dark schema)
  presetSheetContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#12161E',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderTopWidth: 1,
    borderColor: '#1E2538',
    paddingHorizontal: 20,
    paddingBottom: 14,
    zIndex: 80,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  sheetGrabberBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2A344A',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  presetList: {
    gap: 2,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 14,
  },
  presetIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#182030',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E2538',
  },
  presetItemSeparator: {
    height: 1,
    backgroundColor: '#182030',
    marginLeft: 54,
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

  // Interactive Layer, Weather, Voice Sheet Modals
  sheetModalContainer: {
    flex: 1,
    backgroundColor: '#090B0F',
  },
  sheetModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A202C',
  },
  sheetModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sheetModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A202C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetModalContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sheetSectionLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 18,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  sheetGroupCard: {
    backgroundColor: '#12161E',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E2538',
    overflow: 'hidden',
  },
  sheetRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  sheetIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#182030',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetRowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sheetRowSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  sheetRowDivider: {
    height: 1,
    backgroundColor: '#182030',
    marginLeft: 66,
  },
  circleMapBtnActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#1A2234',
  },
  searchPillInputArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchMicBtn: {
    padding: 6,
  },

  // Weather Modal Styles
  weatherMainHeroCard: {
    backgroundColor: '#12161E',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E2538',
    marginBottom: 16,
  },
  weatherHeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weatherHeroTemp: {
    fontSize: 44,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weatherHeroCondition: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 4,
  },
  weatherAqiBadgeRow: {
    marginTop: 14,
  },
  weatherAqiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(36, 199, 149, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  weatherAqiBadgeText: {
    color: '#24C795',
    fontSize: 13,
    fontWeight: '600',
  },
  weatherGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  weatherGridItem: {
    flex: 1,
    backgroundColor: '#12161E',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E2538',
    gap: 4,
  },
  weatherGridVal: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  weatherGridLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  transitStatusCard: {
    padding: 16,
  },
  transitStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  transitLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#24C795',
  },
  transitStatusTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#24C795',
  },
  transitStatusDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 19,
  },

  // Voice Search Modal Styles
  voiceHeroBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  voiceMicOuterPulse: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  voiceMicInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceHeroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  voiceHeroSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
