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
                  ? 'Başlangıç durağı veya konum...'
                  : 'Nereye gitmek istiyorsunuz?'
              }
              placeholderTextColor={theme.colors.textMuted}
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
            style={[styles.filterChip, activeTab === 'stops' && styles.filterChipActive]}
            onPress={() => setActiveTab('stops')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, activeTab === 'stops' && styles.filterChipTextActive]}>
              ETUS Durakları
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeTab === 'places' && styles.filterChipActive]}
            onPress={() => setActiveTab('places')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterChipText, activeTab === 'places' && styles.filterChipTextActive]}>
              Önemli Noktalar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {query.length < 1 ? 'ÖNERİLEN NOKTALAR' : `SONUÇLAR (${filteredResults.length})`}
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
                <View style={[styles.iconBox, isStop ? styles.iconBoxStop : styles.iconBoxPlace]}>
                  {isStop ? (
                    <Bus size={15} color={theme.colors.primary} />
                  ) : (
                    <MapPin size={15} color={theme.colors.fare} />
                  )}
                </View>

                <View style={styles.itemTextCol}>
                  <Text style={styles.itemTitleText} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.itemSubText}>
                    {isStop ? 'ETUS Otobüs Durağı' : item.shortName || 'Popüler Konum'}
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
    paddingVertical: 5,
    paddingHorizontal: 10,
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
    width: 32,
    height: 32,
    borderRadius: theme.radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxStop: {
    backgroundColor: theme.colors.primaryLight,
  },
  iconBoxPlace: {
    backgroundColor: theme.colors.fareLight,
  },
  itemTextCol: {
    flex: 1,
  },
  itemTitleText: {
    fontSize: 13.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  itemSubText: {
    fontSize: 11.5,
    color: theme.colors.textSecondary,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: theme.colors.hairline,
    marginLeft: 44,
  },
});
