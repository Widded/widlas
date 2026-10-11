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
import { Search, Map as MapIcon, ArrowRight, Edit3, MapPin, X, Moon, AlertCircle, RefreshCw } from 'lucide-react-native';

import { theme } from './src/theme';
import Header from './src/components/Header';
import SearchSection from './src/components/SearchSection';
import NativeMap from './src/components/NativeMap';
import RouteCard from './src/components/RouteCard';
import RouteDetailsModal from './src/components/RouteDetailsModal';
import LinesExplorer from './src/components/LinesExplorer';
import SearchModal from './src/components/SearchModal';

import { calculateSmartRoute } from './src/data/routes';

export default function App() {
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'lines'
  const [fareType, setFareType] = useState('tam'); // 'tam' | 'ogrenci'

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

  const currentHour = new Date().getHours();
  const isNightTime = currentHour >= 0 && currentHour < 6;

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
        Alert.alert('Konum İzni', 'Lütfen telefon ayarlarından konum izni verin.');
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
      Alert.alert('Hata', 'Konumunuz alınamadı.');
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
      Alert.alert('Bilgi', 'Lütfen geçerli bir başlangıç ve varış noktası seçin.');
      return;
    }

    setPreviewLine(null); // Clear line preview when searching custom route
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

        {/* Header */}
        <Header fareType={fareType} setFareType={setFareType} />

        {/* Tab switch bar */}
        {!mapSelectionMode && (
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'search' && styles.tabBtnActive]}
              onPress={() => setActiveTab('search')}
              activeOpacity={0.7}
            >
              <Search size={16} color={activeTab === 'search' ? '#fff' : theme.colors.textMuted} />
              <Text style={[styles.tabBtnText, activeTab === 'search' && styles.tabBtnTextActive]}>
                Rota Bul
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'lines' && styles.tabBtnActive]}
              onPress={() => setActiveTab('lines')}
              activeOpacity={0.7}
            >
              <MapIcon size={16} color={activeTab === 'lines' ? '#fff' : theme.colors.textMuted} />
              <Text style={[styles.tabBtnText, activeTab === 'lines' && styles.tabBtnTextActive]}>
                Tüm Hatlar
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Full-screen map picker banner */}
        {mapSelectionMode && (
          <View style={styles.pickerBanner}>
            <View style={styles.pickerInfo}>
              <MapPin size={22} color={theme.colors.primary} />
              <View>
                <Text style={styles.pickerTitle}>
                  {mapSelectionMode === 'from' ? 'Başlangıç Noktası Seç' : 'Varış Noktası Seç'}
                </Text>
                <Text style={styles.pickerSub}>Haritada istediğin noktaya dokun</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.pickerCancel}
              onPress={() => setMapSelectionMode(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerCancelText}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Content */}
        {activeTab === 'search' ? (
          <View style={styles.mainContent}>
            {/* Native Map */}
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
                <View style={styles.linePreviewPill}>
                  <View style={styles.linePreviewInfo}>
                    <View style={[styles.lineBadgeMini, { backgroundColor: previewLine.line.color || theme.colors.primary }]}>
                      <Text style={styles.lineBadgeText}>{previewLine.line.code}</Text>
                    </View>
                    <Text style={styles.linePreviewText} numberOfLines={1}>
                      {previewLine.line.directions?.[previewLine.dirIdx]?.headSign || 'Hat Güzergahı'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.linePreviewClose}
                    onPress={() => setPreviewLine(null)}
                    activeOpacity={0.7}
                  >
                    <X size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Bottom Scroll Area (Hidden during map selection) */}
            {!mapSelectionMode && (
              <ScrollView
                style={styles.bottomScroll}
                contentContainerStyle={styles.bottomScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Night service notice */}
                {isNightTime && (
                  <View style={styles.nightBanner}>
                    <Moon size={16} color="#f59e0b" />
                    <Text style={styles.nightBannerText}>
                      Gece Seferi: 00:00 - 06:00 saatleri arasında otobüsler sınırlıdır.
                    </Text>
                  </View>
                )}

                {/* Search inputs widget (shown if not searched yet) */}
                {!hasSearched ? (
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
                  />
                ) : (
                  <>
                    {/* Journey Summary Bar */}
                    <TouchableOpacity
                      style={styles.summaryBar}
                      onPress={() => setHasSearched(false)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.summaryPath}>
                        <View style={styles.summaryNode}>
                          <View style={[styles.summaryDot, { backgroundColor: theme.colors.primary }]} />
                          <Text style={styles.summaryText} numberOfLines={1}>
                            {fromLocation.name || 'Konumunuz'}
                          </Text>
                        </View>
                        <ArrowRight size={14} color={theme.colors.textDim} />
                        <View style={styles.summaryNode}>
                          <View style={[styles.summaryDot, { backgroundColor: theme.colors.danger }]} />
                          <Text style={styles.summaryText} numberOfLines={1}>
                            {toLocation.name || 'Hedef'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.editBtn}>
                        <Edit3 size={15} color={theme.colors.primary} />
                        <Text style={styles.editBtnText}>Değiştir</Text>
                      </View>
                    </TouchableOpacity>

                    {/* Results header */}
                    <View style={styles.resultsHeader}>
                      <Text style={styles.resultsTitle}>
                        {searchResults?.routes?.length > 0 ? 'Önerilen Rotalar' : 'Arama Sonucu'}
                      </Text>
                      <TouchableOpacity onPress={() => setHasSearched(false)}>
                        <Text style={styles.newSearchBtn}>Yeni Arama</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Loading spinner */}
                    {loading && (
                      <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text style={styles.loadingText}>Rotalar hesaplanıyor...</Text>
                      </View>
                    )}

                    {/* Routes List */}
                    {!loading && searchResults?.routes?.map((route, idx) => (
                      <RouteCard
                        key={idx}
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

                    {/* Empty Result Card */}
                    {!loading && (!searchResults?.routes || searchResults.routes.length === 0) && (
                      <View style={styles.emptyCard}>
                        <AlertCircle size={32} color={theme.colors.warning} />
                        <Text style={styles.emptyTitle}>Uygun Rota Bulunamadı</Text>
                        <Text style={styles.emptySub}>
                          Seçtiğiniz konumlar arasında doğrudan veya aktarmalı bir hat bulunamadı. Lütfen duraklara daha yakın bir nokta seçin veya haritadan işaretleyin.
                        </Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={() => setHasSearched(false)} activeOpacity={0.8}>
                          <RefreshCw size={15} color="#fff" />
                          <Text style={styles.retryBtnText}>Yeni Arama Yap</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}
              </ScrollView>
            )}
          </View>
        ) : (
          /* Lines Explorer Tab */
          <ScrollView style={styles.linesTab} contentContainerStyle={styles.linesTabContent}>
            <LinesExplorer
              onSelectLineOnMap={(line, dirIdx) => {
                setPreviewLine({ line, dirIdx });
                setActiveTab('search');
              }}
            />
          </ScrollView>
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surfaceHover,
  },
  tabBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  tabBtnTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  mainContent: {
    flex: 1,
  },
  mapSplit: {
    height: '42%',
    width: '100%',
    position: 'relative',
  },
  mapFullScreen: {
    flex: 1,
    width: '100%',
  },
  linePreviewPill: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderRadius: theme.radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  linePreviewInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  lineBadgeMini: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  lineBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  linePreviewText: {
    color: theme.colors.textMain,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  linePreviewClose: {
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    paddingBottom: 32,
  },
  nightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#78350f25',
    borderWidth: 1,
    borderColor: '#f59e0b50',
    borderRadius: theme.radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  nightBannerText: {
    color: '#fbbf24',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  summaryPath: {
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
  summaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMain,
    flexShrink: 1,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textMain,
  },
  newSearchBtn: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  loadingBox: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  emptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
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
  emptySub: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: theme.radius.sm,
    marginTop: 6,
  },
  retryBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  pickerBanner: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(24, 24, 27, 0.94)',
    borderRadius: theme.radius.md,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 1000,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pickerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  pickerSub: {
    fontSize: 12,
    color: theme.colors.textDim,
  },
  pickerCancel: {
    backgroundColor: theme.colors.surfaceHover,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pickerCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMain,
  },
  linesTab: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  linesTabContent: {
    padding: 16,
  },
});
