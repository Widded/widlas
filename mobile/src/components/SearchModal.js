import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet
} from 'react-native';
import {
  ArrowLeft,
  X,
  MapPin,
  Bus,
  Search,
  Utensils,
  Coffee,
  Pill,
  Bed,
  ShoppingBag,
  Store,
  Landmark,
  CreditCard,
  Activity,
  Star
} from 'lucide-react-native';
import { theme } from '../theme';
import { LOCAL_PLACES } from '../data/places';
import { searchPlacesOnline, getCategoryMeta } from '../services/api';

export default function SearchModal({
  visible,
  onClose,
  targetType,
  currentName,
  onSelect
}) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'places' | 'stops'
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    if (visible) {
      const initialText =
        currentName === 'Konumunuz' || currentName === 'Edirne Merkez'
          ? ''
          : currentName || '';
      setQuery(initialText);
      setActiveTab('all');
      setResults(LOCAL_PLACES.map(p => ({ ...p, type: 'place', source: 'local' })));
    }
  }, [visible, currentName]);

  // Debounced Live Search with TomTom Live POIs, Mapbox, Nominatim & ETUS DB
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const q = query.trim();
    if (!q || q.length < 2) {
      setResults(LOCAL_PLACES.map(p => ({ ...p, type: 'place', source: 'local' })));
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await searchPlacesOnline(q);
        setResults(res);
      } catch (err) {
        console.warn('Search error:', err);
      } finally {
        setSearching(false);
      }
    }, 220);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Filter tabs: 'all' | 'places' (businesses, cafes, shops) | 'stops' (bus stops)
  const filteredResults = results.filter(item => {
    if (activeTab === 'stops') return item.type === 'stop';
    if (activeTab === 'places') return item.type === 'place';
    return true;
  });

  // Render contextual Icon based on category
  const renderItemIcon = (meta) => {
    const size = 15;
    const color = meta.color;

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

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Top Grabber */}
        <View style={styles.grabberBox}>
          <View style={styles.grabberBar} />
        </View>

        {/* Search Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={18} color={theme.colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <Search size={15} color={theme.colors.textMuted} />
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder={
                targetType === 'from'
                  ? 'Başlangıç durağı, işletme veya sokak...'
                  : 'Nereye gitmek istiyorsunuz? (Kafe, AVM, durak...)'
              }
              placeholderTextColor={theme.colors.textMuted}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
            {searching && (
              <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 4 }} />
            )}
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={14} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Segment Chips */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, activeTab === 'all' && styles.filterChipActive]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, activeTab === 'all' && styles.filterChipTextActive]}>
              Tümü
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeTab === 'places' && styles.filterChipActive]}
            onPress={() => setActiveTab('places')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, activeTab === 'places' && styles.filterChipTextActive]}>
              İşletme & Mekan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeTab === 'stops' && styles.filterChipActive]}
            onPress={() => setActiveTab('stops')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, activeTab === 'stops' && styles.filterChipTextActive]}>
              ETUS Durakları
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {query.length < 2 ? 'ÖNERİLEN POPÜLER NOKTALAR' : `SONUÇLAR (${filteredResults.length})`}
          </Text>
          {searching && (
            <Text style={styles.sectionSearchingText}>Canlı taranıyor...</Text>
          )}
        </View>

        {/* Results List */}
        <FlatList
          data={filteredResults}
          keyExtractor={(item, index) => `${item.name}_${item.lat}_${item.lon}_${index}`}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          ListEmptyComponent={
            !searching && query.length >= 2 ? (
              <View style={styles.emptyResultsBox}>
                <Text style={styles.emptyResultsText}>Sonuç bulunamadı.</Text>
                <Text style={styles.emptyResultsSub}>
                  Farklı bir işletme adı, cadde veya ETUS durağı deneyebilirsiniz.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isStop = item.type === 'stop';
            const meta = getCategoryMeta(item);

            return (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
              >
                {/* Visual Icon with Tinted Badge Background */}
                <View style={[styles.iconBox, { backgroundColor: meta.bg }]}>
                  {renderItemIcon(meta)}
                </View>

                {/* Information Column */}
                <View style={styles.itemTextCol}>
                  <View style={styles.titleRow}>
                    <Text style={styles.itemTitleText} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={[styles.categoryBadge, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.categoryBadgeText, { color: meta.color }]}>
                        {meta.label}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.itemSubText} numberOfLines={1}>
                    {item.detail || (isStop ? 'ETUS Otobüs Durağı' : item.shortName || 'Edirne')}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  grabberBox: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  grabberBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    color: theme.colors.textPrimary,
    fontWeight: '500',
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  filterChipActive: {
    backgroundColor: theme.colors.surfaceHover,
    borderColor: theme.colors.border,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  filterChipTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  sectionSearchingText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 2,
  },
  itemTitleText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  categoryBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  itemSubText: {
    fontSize: 11.5,
    color: theme.colors.textSecondary,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: theme.colors.hairline,
    marginLeft: 46,
  },
  emptyResultsBox: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  emptyResultsText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  emptyResultsSub: {
    fontSize: 11.5,
    color: theme.colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
});
