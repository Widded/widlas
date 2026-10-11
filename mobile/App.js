import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import {
  Compass,
  Bus,
  CreditCard,
  Edit3,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  X,
  MapPin,
  Sparkles
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

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function App() {
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'lines' | 'fares'
  const [fareType, setFareType] = useState('ogrenci'); // Default student fare for Edirne

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

    setPreviewLine(null);
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

        {/* Floating Top Header (Hidden in map selection mode) */}
        {!mapSelectionMode && (
          <Header
            fareType={fareType}
            setFareType={setFareType}
          />
        )}

        {/* Map Selection HUD Mode */}
        {mapSelectionMode && (
          <View style={styles.pickerHud}>
            <View style={styles.pickerHudInfo}>
              <MapPin size={20} color={theme.colors.primaryGlow} />
              <View>
                <Text style={styles.pickerHudTitle}>
                  {mapSelectionMode === 'from' ? 'Başlangıç Noktası Seçin' : 'Varış Noktası Seçin'}
                </Text>
                <Text style={styles.pickerHudSub}>Haritada dilediğiniz noktaya dokunun</Text>
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

        {/* Tab 1: Yol Tarifi (Map + Floating Bottom Transit Drawer) */}
        {activeTab === 'search' && (
          <View style={styles.mapCanvasWrapper}>
            {/* Full-bleed Native Map */}
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
              <View style={styles.linePreviewPill}>
                <View style={styles.linePreviewContent}>
                  <View style={[styles.lineBadgePill, { backgroundColor: previewLine.line.color || theme.colors.primary }]}>
                    <Text style={styles.lineBadgePillText}>{previewLine.line.code}</Text>
                  </View>
                  <Text style={styles.linePreviewName} numberOfLines={1}>
                    {previewLine.line.directions?.[previewLine.dirIdx]?.headSign || 'Hat Güzergahı'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.linePreviewClose}
                  onPress={() => setPreviewLine(null)}
                  activeOpacity={0.7}
                >
                  <X size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Floating Bottom Drawer Sheet */}
            {!mapSelectionMode && (
              <View style={[styles.bottomDrawer, hasSearched && styles.bottomDrawerExpanded]}>
                <ScrollView
                  style={styles.drawerScroll}
                  contentContainerStyle={styles.drawerScrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {!hasSearched ? (
                    /* Search Composer */
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
                    /* Search Results */
                    <View style={styles.resultsContainer}>
                      {/* Grabber Bar */}
                      <View style={styles.grabberBox}>
                        <View style={styles.grabberBar} />
                      </View>

                      {/* Journey Summary Capsule */}
                      <TouchableOpacity
                        style={styles.summaryCapsule}
                        onPress={() => setHasSearched(false)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.summaryWaypoints}>
                          <View style={styles.summaryNode}>
                            <View style={[styles.nodeDot, { backgroundColor: theme.colors.primaryGlow }]} />
                            <Text style={styles.nodeText} numberOfLines={1}>
                              {fromLocation.name || 'Konumunuz'}
                            </Text>
                          </View>
                          <ArrowRight size={13} color={theme.colors.textTertiary} />
                          <View style={styles.summaryNode}>
                            <View style={[styles.nodeDot, { backgroundColor: theme.colors.danger }]} />
                            <Text style={styles.nodeText} numberOfLines={1}>
                              {toLocation.name || 'Hedef'}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.editAction}>
                          <Edit3 size={13} color={theme.colors.primaryGlow} />
                          <Text style={styles.editActionText}>Değiştir</Text>
                        </View>
                      </TouchableOpacity>

                      {/* Results Header */}
                      <View style={styles.resultsHeader}>
                        <Text style={styles.resultsTitle}>
                          {searchResults?.routes?.length > 0 ? 'Önerilen Rotalar' : 'Arama Sonucu'}
                        </Text>
                        <TouchableOpacity onPress={() => setHasSearched(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <Text style={styles.newSearchBtn}>Yeni Arama</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Loading State */}
                      {loading && (
                        <View style={styles.loadingBox}>
                          <ActivityIndicator size="large" color={theme.colors.primaryGlow} />
                          <Text style={styles.loadingText}>Rotalar hesaplanıyor...</Text>
                        </View>
                      )}

                      {/* Route Cards */}
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
                        <View style={styles.emptyCard}>
                          <AlertCircle size={32} color={theme.colors.warning} />
                          <Text style={styles.emptyTitle}>Uygun Rota Bulunamadı</Text>
                          <Text style={styles.emptyDesc}>
                            Bu iki nokta arasında doğrudan veya aktarmalı bir hat tespit edilemedi. Lütfen duraklara daha yakın bir nokta seçin.
                          </Text>
                          <TouchableOpacity
                            style={styles.retryBtn}
                            onPress={() => setHasSearched(false)}
                            activeOpacity={0.8}
                          >
                            <RefreshCw size={14} color="#FFFFFF" />
                            <Text style={styles.retryBtnText}>Yeni Arama Yap</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Tab 2: Hat Rehberi */}
        {activeTab === 'lines' && (
          <ScrollView
            style={styles.tabScroll}
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

        {/* Tab 3: Tarifeler */}
        {activeTab === 'fares' && (
          <FaresView
            fareType={fareType}
            setFareType={setFareType}
          />
        )}

        {/* Floating Glass Bottom Navigation Bar */}
        {!mapSelectionMode && (
          <View style={styles.bottomBarContainer}>
            <View style={styles.bottomBarGlass}>
              <TouchableOpacity
                style={styles.bottomNavTab}
                onPress={() => setActiveTab('search')}
                activeOpacity={0.7}
              >
                <Compass
                  size={22}
                  color={activeTab === 'search' ? theme.colors.primaryGlow : theme.colors.textTertiary}
                />
                <Text style={[styles.bottomNavText, activeTab === 'search' && styles.bottomNavTextActive]}>
                  Yol Tarifi
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bottomNavTab}
                onPress={() => setActiveTab('lines')}
                activeOpacity={0.7}
              >
                <Bus
                  size={22}
                  color={activeTab === 'lines' ? theme.colors.primaryGlow : theme.colors.textTertiary}
                />
                <Text style={[styles.bottomNavText, activeTab === 'lines' && styles.bottomNavTextActive]}>
                  Hatlar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.bottomNavTab}
                onPress={() => setActiveTab('fares')}
                activeOpacity={0.7}
              >
                <CreditCard
                  size={22}
                  color={activeTab === 'fares' ? theme.colors.primaryGlow : theme.colors.textTertiary}
                />
                <Text style={[styles.bottomNavText, activeTab === 'fares' && styles.bottomNavTextActive]}>
                  Tarifeler
                </Text>
              </TouchableOpacity>
            </View>
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
  mapCanvasWrapper: {
    flex: 1,
    position: 'relative',
  },
  bottomDrawer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: SCREEN_HEIGHT * 0.54,
    backgroundColor: theme.colors.sheetBg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  bottomDrawerExpanded: {
    maxHeight: SCREEN_HEIGHT * 0.62,
  },
  drawerScroll: {
    flex: 1,
  },
  drawerScrollContent: {
    paddingBottom: 24,
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  grabberBox: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  grabberBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    marginBottom: 12,
  },
  summaryWaypoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  summaryNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  nodeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nodeText: {
    fontSize: 13,
    fontWeight: '700',
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
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primaryGlow,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: theme.colors.textMain,
    letterSpacing: -0.3,
  },
  newSearchBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primaryGlow,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyCard: {
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
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.sm,
    marginTop: 6,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  linePreviewPill: {
    position: 'absolute',
    top: 70,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(18, 25, 41, 0.96)',
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
    fontWeight: '900',
  },
  linePreviewName: {
    color: theme.colors.textMain,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  linePreviewClose: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  pickerHud: {
    position: 'absolute',
    top: 20,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(18, 25, 41, 0.96)',
    borderRadius: theme.radius.lg,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  pickerHudInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  pickerHudTitle: {
    fontSize: 14,
    fontWeight: '800',
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
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  tabScroll: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  tabScrollContent: {
    padding: 16,
  },
  bottomBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    paddingTop: 4,
    backgroundColor: theme.colors.bg,
  },
  bottomBarGlass: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomNavTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  bottomNavText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textTertiary,
  },
  bottomNavTextActive: {
    color: theme.colors.primaryGlow,
    fontWeight: '800',
  },
});
