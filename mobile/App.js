import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import {
  Navigation as NavIcon,
  MapPin,
  X,
  Compass,
  Bus,
  CreditCard,
  Edit3,
  ArrowRight,
  AlertCircle,
  RefreshCw
} from 'lucide-react-native';

import { theme } from './src/theme';
import Header from './src/components/Header';
import SearchSection from './src/components/SearchSection';
import NativeMap from './src/components/NativeMap';
import RouteCard from './src/components/RouteCard';
import RouteDetailsModal from './src/components/RouteDetailsModal';
import LinesExplorer from './src/components/LinesExplorer';
import SearchModal from './src/components/SearchModal';
import FaresView from './src/components/FaresView';

import { calculateSmartRoute } from './src/data/routes';

export default function App() {
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'lines' | 'fares'
  const [fareType, setFareType] = useState('ogrenci'); // 'ogrenci' default for student city Edirne

  const [fromLocation, setFromLocation] = useState({ name: 'Konumunuz', lat: null, lon: null });
  const [toLocation, setToLocation] = useState({ name: '', lat: null, lon: null });
  const [userLocation, setUserLocation] = useState(null);

  const [searchResults, setSearchResults] = useState(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // Active line preview on map (from Lines Explorer)
  const [previewLine, setPreviewLine] = useState(null); // { line, dirIdx }

  // Modals & Modes
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchTargetType, setSearchTargetType] = useState('to'); // 'from' | 'to'
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [mapSelectionMode, setMapSelectionMode] = useState(null); // 'from' | 'to' | null

  // Auto-get user GPS on launch
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
          setFromLocation(prev => ({
            ...prev,
            lat: userCoords.lat,
            lon: userCoords.lon
          }));
        }
      } catch (err) {
        console.log('GPS alınamadı', err);
      }
    })();
  }, []);

  // Use GPS button handler
  const handleUseGps = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Konum İzni Gerekli', 'Lütfen telefon ayarlarından konum erişimine izin verin.');
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

  // Swap locations
  const handleSwap = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  // Execute Route Search
  const runRouteSearch = async (from, to) => {
    if (!from?.lat || !to?.lat) {
      Alert.alert('Eksik Bilgi', 'Lütfen başlangıç ve varış noktasını belirleyin.');
      return;
    }

    setPreviewLine(null); // Clear line preview when searching route
    setLoading(true);
    try {
      const res = await calculateSmartRoute(from.lat, from.lon, to.lat, to.lon);
      setSearchResults(res);
      setSelectedRouteIdx(0);
      setHasSearched(true);
    } catch (e) {
      Alert.alert('Hata', 'Rota hesaplanırken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-tap destination select
  const handleSelectQuickPlace = (place) => {
    setToLocation(place);
    if (fromLocation.lat) {
      runRouteSearch(fromLocation, place);
    } else if (userLocation?.lat) {
      runRouteSearch(userLocation, place);
    } else {
      handleUseGps();
    }
  };

  // Modal search select
  const handleModalSelect = (place) => {
    setSearchModalVisible(false);
    if (searchTargetType === 'from') {
      setFromLocation(place);
      if (toLocation.lat) {
        runRouteSearch(place, toLocation);
      }
    } else {
      setToLocation(place);
      if (fromLocation.lat) {
        runRouteSearch(fromLocation, place);
      }
    }
  };

  // Map click handler (when picking from map)
  const handleMapPress = (coords) => {
    if (!mapSelectionMode) return;

    const picked = {
      name: 'Haritadan Seçilen Nokta',
      lat: coords.latitude,
      lon: coords.longitude
    };

    if (mapSelectionMode === 'from') {
      setFromLocation(picked);
      setMapSelectionMode(null);
      if (toLocation.lat) runRouteSearch(picked, toLocation);
    } else {
      setToLocation(picked);
      setMapSelectionMode(null);
      if (fromLocation.lat) runRouteSearch(fromLocation, picked);
    }
  };

  const activeRoute = searchResults?.routes?.[selectedRouteIdx] || null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />

        {/* Sleek Native Header */}
        {!mapSelectionMode && (
          <Header
            fareType={fareType}
            setFareType={setFareType}
            title="Edirne Ulaşım"
            subtitle="ETUS Akıllı Rehber"
          />
        )}

        {/* Map Selection HUD Banner */}
        {mapSelectionMode && (
          <View style={styles.pickerHud}>
            <View style={styles.pickerHudInfo}>
              <MapPin size={20} color={theme.colors.primary} />
              <View>
                <Text style={styles.pickerHudTitle}>
                  {mapSelectionMode === 'from' ? 'Başlangıç Noktası Seçin' : 'Varış Noktası Seçin'}
                </Text>
                <Text style={styles.pickerHudSub}>Haritada istediğiniz konuma dokunun</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.pickerHudCancel}
              onPress={() => setMapSelectionMode(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerHudCancelText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content Area */}
        <View style={styles.mainContainer}>
          {activeTab === 'search' && (
            <View style={styles.searchTabContainer}>
              {/* Map Canvas */}
              <View style={mapSelectionMode ? styles.mapFullScreen : styles.mapSplit}>
                <NativeMap
                  style={StyleSheet.absoluteFillObject}
                  fromLocation={fromLocation}
                  toLocation={toLocation}
                  activeRoute={previewLine ? null : activeRoute}
                  activeLineData={previewLine?.line}
                  activeLineDirIdx={previewLine?.dirIdx}
                  userLocation={userLocation}
                  mapSelectionMode={mapSelectionMode}
                  onMapPress={handleMapPress}
                />

                {/* Floating Line Preview Pill on Map */}
                {previewLine && (
                  <View style={styles.linePreviewCapsule}>
                    <View style={styles.linePreviewContent}>
                      <View style={[styles.lineBadgePill, { backgroundColor: previewLine.line.color || theme.colors.primary }]}>
                        <Text style={styles.lineBadgePillText}>{previewLine.line.code}</Text>
                      </View>
                      <Text style={styles.linePreviewName} numberOfLines={1}>
                        {previewLine.line.directions?.[previewLine.dirIdx]?.headSign || 'Hat Güzergahı'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.linePreviewCloseBtn}
                      onPress={() => setPreviewLine(null)}
                      activeOpacity={0.7}
                    >
                      <X size={15} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Bottom Interactive Content (Hidden during full-screen map picker) */}
              {!mapSelectionMode && (
                <ScrollView
                  style={styles.bottomScroll}
                  contentContainerStyle={styles.bottomScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {!hasSearched ? (
                    /* Initial Search Composer */
                    <SearchSection
                      fromLocation={fromLocation}
                      toLocation={toLocation}
                      onOpenSearch={(type) => {
                        setSearchTargetType(type);
                        setSearchModalVisible(true);
                      }}
                      onSwap={handleSwap}
                      onUseGps={handleUseGps}
                      onPickOnMap={() => setMapSelectionMode(fromLocation.lat ? 'to' : 'from')}
                      onSelectQuickPlace={handleSelectQuickPlace}
                      onSearch={() => runRouteSearch(fromLocation, toLocation)}
                      hasSearched={hasSearched}
                      loading={loading}
                    />
                  ) : (
                    /* Search Results State */
                    <>
                      {/* Active Journey Capsule */}
                      <TouchableOpacity
                        style={styles.journeyCapsule}
                        onPress={() => setHasSearched(false)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.journeyWaypoints}>
                          <View style={styles.waypointItem}>
                            <View style={[styles.waypointDot, { backgroundColor: theme.colors.primary }]} />
                            <Text style={styles.waypointText} numberOfLines={1}>
                              {fromLocation.name || 'Konumunuz'}
                            </Text>
                          </View>
                          <ArrowRight size={13} color={theme.colors.textTertiary} />
                          <View style={styles.waypointItem}>
                            <View style={[styles.waypointDot, { backgroundColor: theme.colors.danger }]} />
                            <Text style={styles.waypointText} numberOfLines={1}>
                              {toLocation.name || 'Hedef'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.editAction}>
                          <Edit3 size={14} color={theme.colors.primary} />
                          <Text style={styles.editActionText}>Değiştir</Text>
                        </View>
                      </TouchableOpacity>

                      {/* Results Header */}
                      <View style={styles.resultsHeaderRow}>
                        <Text style={styles.resultsHeaderTitle}>
                          {searchResults?.routes?.length > 0 ? 'Önerilen Rotalar' : 'Arama Sonucu'}
                        </Text>
                        <TouchableOpacity onPress={() => setHasSearched(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Text style={styles.newSearchAction}>Yeni Arama</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Loading State */}
                      {loading && (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="large" color={theme.colors.primary} />
                          <Text style={styles.loadingLabel}>En uygun rotalar hesaplanıyor...</Text>
                        </View>
                      )}

                      {/* Route Cards List */}
                      {!loading && searchResults?.routes?.map((route, idx) => (
                        <RouteCard
                          key={idx}
                          index={idx}
                          route={route}
                          isSelected={selectedRouteIdx === idx}
                          onSelect={() => setSelectedRouteIdx(idx)}
                          onOpenDetails={() => {
                            setSelectedRouteIdx(idx);
                            setDetailsModalVisible(true);
                          }}
                          fareType={fareType}
                        />
                      ))}

                      {/* Empty Route Result */}
                      {!loading && (!searchResults?.routes || searchResults.routes.length === 0) && (
                        <View style={styles.emptyContainer}>
                          <AlertCircle size={34} color={theme.colors.warning} />
                          <Text style={styles.emptyTitle}>Uygun Rota Bulunamadı</Text>
                          <Text style={styles.emptyDesc}>
                            Seçilen noktalar arasında doğrudan veya aktarmalı bir ETUS hattı bulunamadı. Lütfen daha yakın bir durak seçin veya haritadan işaretleyin.
                          </Text>
                          <TouchableOpacity
                            style={styles.emptyRetryBtn}
                            onPress={() => setHasSearched(false)}
                            activeOpacity={0.8}
                          >
                            <RefreshCw size={14} color="#FFFFFF" />
                            <Text style={styles.emptyRetryText}>Aramayı Düzenle</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </>
                  )}
                </ScrollView>
              )}
            </View>
          )}

          {/* Tab 2: All ETUS Lines */}
          {activeTab === 'lines' && (
            <ScrollView
              style={styles.tabScrollContainer}
              contentContainerStyle={styles.tabScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <LinesExplorer
                onSelectLineOnMap={(line, dirIdx) => {
                  setPreviewLine({ line, dirIdx });
                  setActiveTab('search');
                }}
              />
            </ScrollView>
          )}

          {/* Tab 3: Fares & Rules */}
          {activeTab === 'fares' && (
            <FaresView
              fareType={fareType}
              setFareType={setFareType}
            />
          )}
        </View>

        {/* Native Bottom Navigation Bar */}
        {!mapSelectionMode && (
          <View style={styles.bottomNav}>
            {/* Tab 1 */}
            <TouchableOpacity
              style={styles.navTab}
              onPress={() => setActiveTab('search')}
              activeOpacity={0.7}
            >
              <Compass
                size={22}
                color={activeTab === 'search' ? theme.colors.primary : theme.colors.textTertiary}
              />
              <Text style={[styles.navText, activeTab === 'search' && styles.navTextActive]}>
                Yol Tarifi
              </Text>
            </TouchableOpacity>

            {/* Tab 2 */}
            <TouchableOpacity
              style={styles.navTab}
              onPress={() => setActiveTab('lines')}
              activeOpacity={0.7}
            >
              <Bus
                size={22}
                color={activeTab === 'lines' ? theme.colors.primary : theme.colors.textTertiary}
              />
              <Text style={[styles.navText, activeTab === 'lines' && styles.navTextActive]}>
                Hatlar
              </Text>
            </TouchableOpacity>

            {/* Tab 3 */}
            <TouchableOpacity
              style={styles.navTab}
              onPress={() => setActiveTab('fares')}
              activeOpacity={0.7}
            >
              <CreditCard
                size={22}
                color={activeTab === 'fares' ? theme.colors.primary : theme.colors.textTertiary}
              />
              <Text style={[styles.navText, activeTab === 'fares' && styles.navTextActive]}>
                Tarifeler
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Search Modal */}
        <SearchModal
          visible={searchModalVisible}
          onClose={() => setSearchModalVisible(false)}
          targetType={searchTargetType}
          currentName={searchTargetType === 'from' ? fromLocation.name : toLocation.name}
          onSelect={handleModalSelect}
        />

        {/* Route Details Itinerary Modal */}
        <RouteDetailsModal
          visible={detailsModalVisible}
          route={activeRoute}
          onClose={() => setDetailsModalVisible(false)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  mainContainer: {
    flex: 1,
  },
  searchTabContainer: {
    flex: 1,
  },
  mapSplit: {
    height: '44%',
    width: '100%',
    position: 'relative',
  },
  mapFullScreen: {
    flex: 1,
    width: '100%',
  },
  linePreviewCapsule: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(28, 28, 30, 0.96)',
    borderRadius: theme.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  linePreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  lineBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  lineBadgePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  linePreviewName: {
    color: theme.colors.textMain,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  linePreviewCloseBtn: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  bottomScroll: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  bottomScrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  journeyCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    marginBottom: 14,
  },
  journeyWaypoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  waypointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  waypointDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  waypointText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMain,
    flexShrink: 1,
  },
  editAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
  },
  editActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textMain,
    letterSpacing: -0.3,
  },
  newSearchAction: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  loadingContainer: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 12,
  },
  loadingLabel: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    padding: 24,
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textMain,
  },
  emptyDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.sm,
    marginTop: 6,
  },
  emptyRetryText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pickerHud: {
    position: 'absolute',
    top: 55,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(28, 28, 30, 0.96)',
    borderRadius: theme.radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  pickerHudInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pickerHudTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  pickerHudSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 1,
  },
  pickerHudCancel: {
    backgroundColor: theme.colors.surfaceElevated,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  pickerHudCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMain,
  },
  tabScrollContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  tabScrollContent: {
    padding: 16,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  navText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textTertiary,
  },
  navTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
