import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet
} from 'react-native';
import { ArrowLeft, X, MapPin, Bus, Search } from 'lucide-react-native';
import { theme } from '../theme';
import { LOCAL_PLACES, normalizeTr } from '../data/places';
import { allStopsDB } from '../data/db';

export default function SearchModal({
  visible,
  onClose,
  targetType,
  currentName,
  onSelect
}) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'places' | 'stops'
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setQuery(currentName === 'Konumunuz' ? '' : currentName || '');
      setActiveTab('all');
    }
  }, [visible, currentName]);

  const allStopsList = useMemo(() => {
    return Object.values(allStopsDB)
      .filter(s => s.lat && s.lon)
      .map(s => ({
        name: s.name,
        lat: s.lat,
        lon: s.lon,
        searchIndex: s.searchIndex || normalizeTr(s.name),
        type: 'stop'
      }));
  }, []);

  const filteredResults = useMemo(() => {
    const q = query.trim();
    if (!q || q.length < 1) {
      // Return popular places
      return LOCAL_PLACES.map(p => ({ ...p, type: 'place' }));
    }

    const norm = normalizeTr(q);

    let placesMatches = LOCAL_PLACES.filter(p =>
      normalizeTr(p.name).includes(norm) ||
      (p.tags && p.tags.some(t => normalizeTr(t).includes(norm)))
    ).map(p => ({ ...p, type: 'place' }));

    let stopMatches = allStopsList.filter(s =>
      s.searchIndex.includes(norm)
    ).slice(0, 25);

    if (activeTab === 'places') return placesMatches;
    if (activeTab === 'stops') return stopMatches;
    return [...placesMatches, ...stopMatches];
  }, [query, activeTab, allStopsList]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header with Search Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={22} color={theme.colors.textMain} />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <Search size={16} color={theme.colors.textSecondary} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder={
                targetType === 'from'
                  ? 'Başlangıç durağı veya konum ara...'
                  : 'Nereye gitmek istiyorsunuz?'
              }
              placeholderTextColor={theme.colors.textTertiary}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
              clearButtonMode="while-editing"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <X size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab Filters (Tümü, Önemli Yerler, Duraklar) */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'all' && styles.tabPillActive]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabPillText, activeTab === 'all' && styles.tabPillTextActive]}>
              Tümü
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'places' && styles.tabPillActive]}
            onPress={() => setActiveTab('places')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabPillText, activeTab === 'places' && styles.tabPillTextActive]}>
              Popüler Noktalar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabPill, activeTab === 'stops' && styles.tabPillActive]}
            onPress={() => setActiveTab('stops')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabPillText, activeTab === 'stops' && styles.tabPillTextActive]}>
              ETUS Durakları
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results Counter / Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {query.length < 1 ? 'Önerilen Noktalar' : `Bulunan Sonuçlar (${filteredResults.length})`}
          </Text>
        </View>

        {/* Results List */}
        <FlatList
          data={filteredResults}
          keyExtractor={(item, index) => `${item.name}_${index}`}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.rowDivider} />}
          renderItem={({ item }) => {
            const isStop = item.type === 'stop';
            return (
              <TouchableOpacity
                style={styles.itemRow}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, isStop ? styles.iconCircleStop : styles.iconCirclePlace]}>
                  {isStop ? (
                    <Bus size={17} color={theme.colors.primary} />
                  ) : (
                    <MapPin size={17} color={theme.colors.warning} />
                  )}
                </View>

                <View style={styles.itemInfo}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemSubtitle}>
                    {isStop ? 'ETUS Şehir İçi Otobüs Durağı' : item.shortName || 'Popüler Nokta • Edirne'}
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
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: theme.colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
    gap: 8,
  },
  backBtn: {
    padding: 6,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textMain,
    fontWeight: '600',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: theme.colors.bg,
  },
  tabPill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  tabPillActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  tabPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  tabPillTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 14,
    paddingBottom: 32,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleStop: {
    backgroundColor: theme.colors.primaryLight,
  },
  iconCirclePlace: {
    backgroundColor: theme.colors.warningLight,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textMain,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  rowDivider: {
    height: 1,
    backgroundColor: theme.colors.hairline,
    marginLeft: 50,
  },
});
