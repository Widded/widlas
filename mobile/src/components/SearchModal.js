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
import { ArrowLeft, X, MapPin, Bus, Search, Sparkles } from 'lucide-react-native';
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
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'stops' | 'places'
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
      return LOCAL_PLACES.map(p => ({ ...p, type: 'place' }));
    }

    const norm = normalizeTr(q);

    let placesMatches = LOCAL_PLACES.filter(p =>
      normalizeTr(p.name).includes(norm) ||
      (p.tags && p.tags.some(t => normalizeTr(t).includes(norm)))
    ).map(p => ({ ...p, type: 'place' }));

    let stopMatches = allStopsList.filter(s =>
      s.searchIndex.includes(norm)
    ).slice(0, 30);

    if (activeTab === 'places') return placesMatches;
    if (activeTab === 'stops') return stopMatches;
    return [...placesMatches, ...stopMatches];
  }, [query, activeTab, allStopsList]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.sheetContainer}>
        {/* Top Grabber */}
        <View style={styles.grabberRow}>
          <View style={styles.grabberBar} />
        </View>

        {/* Search Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backCircleBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color={theme.colors.textMain} />
          </TouchableOpacity>

          <View style={styles.inputCapsule}>
            <Search size={16} color={theme.colors.primaryGlow} />
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder={
                targetType === 'from'
                  ? 'Başlangıç durağı veya konum yazın...'
                  : 'Nereye gitmek istiyorsunuz?'
              }
              placeholderTextColor={theme.colors.textTertiary}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => setQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterPillsRow}>
          <TouchableOpacity
            style={[styles.filterPill, activeTab === 'all' && styles.filterPillActive]}
            onPress={() => setActiveTab('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterPillText, activeTab === 'all' && styles.filterPillTextActive]}>
              Tümü
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeTab === 'stops' && styles.filterPillActive]}
            onPress={() => setActiveTab('stops')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterPillText, activeTab === 'stops' && styles.filterPillTextActive]}>
              ETUS Durakları
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, activeTab === 'places' && styles.filterPillActive]}
            onPress={() => setActiveTab('places')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterPillText, activeTab === 'places' && styles.filterPillTextActive]}>
              Önemli Noktalar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {query.length < 1 ? 'Önerilen Popüler Yerler' : `Sonuçlar (${filteredResults.length})`}
          </Text>
        </View>

        {/* Results List */}
        <FlatList
          data={filteredResults}
          keyExtractor={(item, index) => `${item.name}_${index}`}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          renderItem={({ item }) => {
            const isStop = item.type === 'stop';
            return (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => onSelect(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconCircle, isStop ? styles.iconCircleStop : styles.iconCirclePlace]}>
                  {isStop ? (
                    <Bus size={17} color={theme.colors.primaryGlow} />
                  ) : (
                    <MapPin size={17} color={theme.colors.warning} />
                  )}
                </View>

                <View style={styles.itemTextCol}>
                  <Text style={styles.itemTitleText} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemSubText}>
                    {isStop ? 'ETUS Otobüs Durağı • Edirne' : item.shortName || 'Popüler Konum'}
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
  sheetContainer: {
    flex: 1,
    backgroundColor: theme.colors.sheetBg,
  },
  grabberRow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  grabberBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  backCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  inputCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textMain,
    fontWeight: '600',
  },
  filterPillsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterPill: {
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primaryGlow,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  filterPillTextActive: {
    color: theme.colors.primaryGlow,
    fontWeight: '800',
  },
  sectionHeader: {
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 36,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleStop: {
    backgroundColor: theme.colors.primaryLight,
  },
  iconCirclePlace: {
    backgroundColor: theme.colors.warningLight,
  },
  itemTextCol: {
    flex: 1,
  },
  itemTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textMain,
    marginBottom: 2,
  },
  itemSubText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: theme.colors.hairline,
    marginLeft: 54,
  },
});
