import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
  Keyboard,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import {
  Search,
  Mic,
  Home,
  Briefcase,
  Map,
  Star,
  ChevronRight,
  MapPin,
  Bus,
  Clock,
  Navigation,
  X,
  Train,
  Ship,
  GraduationCap,
  ShoppingBag,
  Landmark,
  Utensils,
  Coffee,
  Pill,
  Bed,
  Store,
  CreditCard,
  Activity
} from 'lucide-react-native';

import { theme } from '../theme';
import { LOCAL_PLACES } from '../data/places';
import { searchPlacesOnline, getCategoryMeta } from '../services/api';

// Recent search items matching reference design (with Edirne transit support)
const DEFAULT_RECENT_SEARCHES = [
  {
    id: 'rec_1',
    type: 'place',
    iconType: 'pin',
    title: 'Selimiye Camii',
    subtitle: 'Edirne Merkez',
    place: { name: 'Selimiye Camii', lat: 41.6781, lon: 26.5594 }
  },
  {
    id: 'rec_2',
    type: 'line',
    iconType: 'bus',
    title: '1A',
    subtitle: 'ETUS Otobüs Hattı · Gazimihal - Kıyık',
    lineCode: '1A'
  },
  {
    id: 'rec_3',
    type: 'route',
    iconType: 'route',
    title: 'Erasta AVM → Trakya Üni',
    subtitle: 'Toplu Taşıma · Hat 3 ile aktarmasız',
    place: { name: 'Trakya Üniversitesi Balkan Kampüsü', lat: 41.6389, lon: 26.6150 }
  },
  {
    id: 'rec_4',
    type: 'place',
    iconType: 'clock',
    title: 'Saraçlar Caddesi',
    subtitle: 'Tarihi Çarşı & Yaya Bölgesi',
    place: { name: 'Saraçlar Caddesi', lat: 41.6735, lon: 26.5537 }
  }
];

// Popular search chips
const POPULAR_SEARCH_CHIPS = [
  { id: 'pop_marmaray', label: 'Marmaray', icon: Train, query: 'Marmaray' },
  { id: 'pop_metrobus', label: 'Metrobüs', icon: Bus, query: 'Metrobüs' },
  { id: 'pop_metro', label: 'Metro', icon: Train, query: 'Metro' },
  { id: 'pop_vapur', label: 'Vapur', icon: Ship, query: 'Vapur' },
  { id: 'pop_etus', label: 'ETUS Hatları', icon: Bus, query: 'ETUS' },
  { id: 'pop_uni', label: 'Trakya Üni', icon: GraduationCap, place: { name: 'Trakya Üniversitesi Balkan Kampüsü', lat: 41.6389, lon: 26.6150 } },
  { id: 'pop_erasta', label: 'Erasta AVM', icon: ShoppingBag, place: { name: 'Erasta AVM', lat: 41.6663, lon: 26.5710 } },
  { id: 'pop_selimiye', label: 'Selimiye', icon: Landmark, place: { name: 'Selimiye Camii', lat: 41.6781, lon: 26.5594 } },
  { id: 'pop_otogar', label: 'Otogar', icon: Bus, place: { name: 'Edirne Otogar', lat: 41.6320, lon: 26.6184 } }
];

export default function SearchModal({
  visible,
  onClose,
  targetType = 'to',
  currentName,
  onSelect,
  onOpenLines,
  onViewAllHistory,
  onOpenVoice
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'places' | 'stops'
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Real-time keyboard tracking to prevent content from hiding behind keyboard
  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Sync initial query when opened
  useEffect(() => {
    if (visible) {
      const initialText =
        currentName === 'Konumunuz' || currentName === 'Edirne Merkez'
          ? ''
          : currentName || '';
      setQuery(initialText);
      setActiveFilter('all');
      setResults([]);
      setSearching(false);
    }
  }, [visible, currentName]);

  // Live debounced search
  useEffect(() => {
    if (!visible) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const q = query.trim();
    if (!q || q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchPlacesOnline(q);
        setResults(res || []);
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 220);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query, visible]);

  // Handle Quick Action Grid clicks
  const handleActionPress = (actionKey) => {
    if (actionKey === 'home') {
      onSelect({
        name: 'Ev (Şükrüpaşa)',
        lat: 41.6670,
        lon: 26.5911
      });
      onClose();
    } else if (actionKey === 'work') {
      onSelect({
        name: 'İş (Saraçlar Caddesi)',
        lat: 41.6735,
        lon: 26.5537
      });
      onClose();
    } else if (actionKey === 'map') {
      onClose();
    } else if (actionKey === 'favs') {
      onClose();
      if (onOpenLines) onOpenLines();
    }
  };

  // Handle Recent Search Item click
  const handleRecentItemPress = (item) => {
    if (item.place) {
      onSelect(item.place);
      onClose();
    } else if (item.type === 'line') {
      if (onOpenLines) {
        onClose();
        onOpenLines(item.lineCode);
      } else {
        setQuery(item.lineCode);
      }
    }
  };

  // Handle Popular Chip click
  const handlePopularChipPress = (chip) => {
    if (chip.place) {
      onSelect(chip.place);
      onClose();
    } else if (chip.query) {
      setQuery(chip.query);
    }
  };

  // Render Category Icon for live search
  const renderItemIcon = (meta) => {
    const size = 16;
    const color = meta.color || '#38BDF8';

    switch (meta.icon) {
      case 'bus':
        return <Bus size={size} color={color} />;
      case 'utensils':
        return <Utensils size={size} color={color} />;
      case 'coffee':
        return <Coffee size={size} color={color} />;
      case 'pill':
        return <Pill size={size} color={color} />;
      case 'bed':
        return <Bed size={size} color={color} />;
      case 'shopping-bag':
        return <ShoppingBag size={size} color={color} />;
      case 'store':
        return <Store size={size} color={color} />;
      case 'landmark':
        return <Landmark size={size} color={color} />;
      case 'credit-card':
        return <CreditCard size={size} color={color} />;
      case 'activity':
        return <Activity size={size} color={color} />;
      case 'star':
        return <Star size={size} color={color} />;
      default:
        return <MapPin size={size} color={color} />;
    }
  };

  // Filter live results
  const filteredResults = results.filter(item => {
    if (activeFilter === 'stops') return item.type === 'stop';
    if (activeFilter === 'places') return item.type === 'place';
    return true;
  });

  const isLiveSearchActive = query.trim().length >= 2;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* TOP HEADER ROW: Title, Subtitle & Clean Close Button */}
          <View style={styles.headerArea}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.headerTitle}>Ara</Text>
              <Text style={styles.headerSubtitle}>
                {targetType === 'from' ? 'Başlangıç noktası veya konum seçin.' : 'Durak, hat, adres veya konum ara.'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
            >
              <X size={18} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          {/* SEARCH INPUT BAR (Pill Container matching screenshot) */}
          <View style={styles.inputContainer}>
            <Search size={18} color="#64748B" style={styles.searchIcon} />
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder={targetType === 'from' ? 'Başlangıç durağı veya adres ara...' : 'Örn: Selimiye, 1A, Trakya Üniversitesi'}
              placeholderTextColor="#64748B"
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoCorrect={false}
              autoFocus
            />
            {query.length > 0 ? (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => setQuery('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => {
                  if (onOpenVoice) onOpenVoice();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Mic size={17} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* CONTENT AREA: DEFAULT OVERVIEW OR LIVE SEARCH RESULTS */}
          {!isLiveSearchActive ? (
            <ScrollView
              style={styles.scrollContent}
              contentContainerStyle={[
                styles.scrollInner,
                { paddingBottom: Math.max(40, keyboardHeight + 35) }
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
            {/* 4 ACTION GRID CARDS (Ev, İş, Harita, Favori Hatlar) */}
            <View style={styles.actionGrid}>
              {/* Card 1: Ev */}
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleActionPress('home')}
                activeOpacity={0.75}
              >
                <View style={styles.actionIconBox}>
                  <Home size={22} color="#CBD5E1" strokeWidth={1.8} />
                </View>
                <Text style={styles.actionLabel}>Ev</Text>
              </TouchableOpacity>

              {/* Card 2: İş */}
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleActionPress('work')}
                activeOpacity={0.75}
              >
                <View style={styles.actionIconBox}>
                  <Briefcase size={22} color="#CBD5E1" strokeWidth={1.8} />
                </View>
                <Text style={styles.actionLabel}>İş</Text>
              </TouchableOpacity>

              {/* Card 3: Harita */}
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleActionPress('map')}
                activeOpacity={0.75}
              >
                <View style={styles.actionIconBox}>
                  <Map size={22} color="#CBD5E1" strokeWidth={1.8} />
                </View>
                <Text style={styles.actionLabel}>Harita</Text>
              </TouchableOpacity>

              {/* Card 4: Favori Hatlar */}
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => handleActionPress('favs')}
                activeOpacity={0.75}
              >
                <View style={styles.actionIconBox}>
                  <Star size={22} color="#CBD5E1" strokeWidth={1.8} />
                </View>
                <Text style={styles.actionLabel} numberOfLines={1}>Favori Hatlar</Text>
              </TouchableOpacity>
            </View>

            {/* SON ARAMALAR SECTION */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Son Aramalar</Text>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => {
                  onClose();
                  if (onViewAllHistory) onViewAllHistory();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.seeAllText}>Tümünü Gör</Text>
                <ChevronRight size={14} color="#38BDF8" />
              </TouchableOpacity>
            </View>

            <View style={styles.recentList}>
              {DEFAULT_RECENT_SEARCHES.map((item) => {
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.recentRow}
                    onPress={() => handleRecentItemPress(item)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.recentIconCircle}>
                      {item.iconType === 'pin' && <MapPin size={18} color="#38BDF8" />}
                      {item.iconType === 'bus' && <Bus size={18} color="#24C795" />}
                      {item.iconType === 'route' && <Navigation size={18} color="#818CF8" />}
                      {item.iconType === 'clock' && <Clock size={18} color="#F59E0B" />}
                    </View>

                    <View style={styles.recentTextContainer}>
                      <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.recentSubtitle} numberOfLines={1}>{item.subtitle}</Text>
                    </View>

                    <ChevronRight size={16} color="#475569" />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* POPÜLER ARAMALAR SECTION */}
            <View style={[styles.sectionHeaderRow, { marginTop: 28 }]}>
              <Text style={styles.sectionTitle}>Popüler Aramalar</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.popularChipsContainer}
              style={styles.popularChipsScroll}
            >
              {POPULAR_SEARCH_CHIPS.map((chip) => {
                const IconComp = chip.icon;
                return (
                  <TouchableOpacity
                    key={chip.id}
                    style={styles.popularChip}
                    onPress={() => handlePopularChipPress(chip)}
                    activeOpacity={0.75}
                  >
                    <IconComp size={15} color="#94A3B8" />
                    <Text style={styles.popularChipText}>{chip.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </ScrollView>
        ) : (
          /* LIVE RESULTS VIEW */
          <View style={styles.liveResultsContainer}>
            {/* Filter segment tabs */}
            <View style={styles.filterBar}>
              <TouchableOpacity
                style={[styles.filterBtn, activeFilter === 'all' && styles.filterBtnActive]}
                onPress={() => setActiveFilter('all')}
              >
                <Text style={[styles.filterBtnText, activeFilter === 'all' && styles.filterBtnTextActive]}>
                  Tümü
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterBtn, activeFilter === 'stops' && styles.filterBtnActive]}
                onPress={() => setActiveFilter('stops')}
              >
                <Text style={[styles.filterBtnText, activeFilter === 'stops' && styles.filterBtnTextActive]}>
                  ETUS Durakları
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterBtn, activeFilter === 'places' && styles.filterBtnActive]}
                onPress={() => setActiveFilter('places')}
              >
                <Text style={[styles.filterBtnText, activeFilter === 'places' && styles.filterBtnTextActive]}>
                  Mekanlar & Yerler
                </Text>
              </TouchableOpacity>
            </View>

            {searching ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={styles.loadingText}>Sonuçlar aranıyor...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredResults}
                keyExtractor={(item, index) => `${item.name}_${item.lat}_${item.lon}_${index}`}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.resultsListContent,
                  { paddingBottom: Math.max(40, keyboardHeight + 35) }
                ]}
                ListEmptyComponent={
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyTitle}>Sonuç bulunamadı</Text>
                    <Text style={styles.emptySub}>
                      Farklı bir arama terimi, cadde veya ETUS durağı deneyebilirsiniz.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const meta = getCategoryMeta(item);
                  return (
                    <TouchableOpacity
                      style={styles.resultRow}
                      onPress={() => {
                        onSelect(item);
                        onClose();
                      }}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.resultIconCircle, { backgroundColor: meta.bg || '#161B24' }]}>
                        {renderItemIcon(meta)}
                      </View>

                      <View style={styles.resultTextContainer}>
                        <Text style={styles.resultTitle} numberOfLines={1}>{item.name}</Text>
                        <Text style={styles.resultSubtitle} numberOfLines={1}>
                          {item.type === 'stop'
                            ? (item.routes?.length ? `Hatlar: ${item.routes.join(', ')}` : 'ETUS Durağı')
                            : (item.address || meta.label || 'Edirne')}
                        </Text>
                      </View>

                      <ChevronRight size={16} color="#475569" />
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </View>
        )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090B0F',
  },
  headerArea: {
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTextGroup: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.6,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '400',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#12161E',
    borderWidth: 1,
    borderColor: '#1E2538',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  // Input Container
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12161E',
    height: 52,
    borderRadius: 26,
    marginHorizontal: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#1E2538',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: {
    marginRight: -2,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    paddingVertical: 0,
  },
  iconBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll Content
  scrollContent: {
    flex: 1,
  },
  scrollInner: {
    paddingBottom: 24,
  },

  // 4 Action Grid Cards
  actionGrid: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    gap: 10,
  },
  actionCard: {
    flex: 1,
    aspectRatio: 1.05,
    backgroundColor: '#12161E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E2538',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconBox: {
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#CBD5E1',
    textAlign: 'center',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 26,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: -0.2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingLeft: 8,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#38BDF8',
  },

  // Recent Searches List
  recentList: {
    marginHorizontal: 20,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#12161E',
  },
  recentIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#12161E',
    borderWidth: 1,
    borderColor: '#1E2538',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentTextContainer: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  recentTitle: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  recentSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2.5,
  },

  // Popular Chips
  popularChipsScroll: {
    marginTop: 2,
  },
  popularChipsContainer: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
  },
  popularChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12161E',
    borderWidth: 1,
    borderColor: '#1E2538',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 7,
  },
  popularChipText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
  },

  // Live Results Mode
  liveResultsContainer: {
    flex: 1,
    marginTop: 12,
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 10,
  },
  filterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#12161E',
    borderWidth: 1,
    borderColor: '#1E2538',
  },
  filterBtnActive: {
    backgroundColor: '#1E293B',
    borderColor: '#38BDF8',
  },
  filterBtnText: {
    fontSize: 12.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  filterBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 32,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  resultsListContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#12161E',
  },
  resultIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTextContainer: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resultSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  emptyBox: {
    paddingVertical: 48,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptySub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
