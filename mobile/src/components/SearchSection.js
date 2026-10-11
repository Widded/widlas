import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LocateFixed, Map as MapIcon, ArrowUpDown } from 'lucide-react-native';
import { theme } from '../theme';
import { QUICK_PLACES } from '../data/places';

export default function SearchSection({
  fromLocation,
  toLocation,
  onOpenSearch,
  onSwap,
  onUseGps,
  onPickOnMap,
  onSelectQuickPlace,
  onSearch,
  hasSearched
}) {
  return (
    <View style={styles.card}>
      {/* Timeline inputs widget */}
      <View style={styles.searchWidget}>
        <View style={styles.timeline}>
          <View style={styles.dotFrom} />
          <View style={styles.timelineLine} />
          <View style={styles.dotTo} />
        </View>

        <View style={styles.inputsColumn}>
          <TouchableOpacity
            style={styles.inputRow}
            onPress={() => onOpenSearch('from')}
            activeOpacity={0.7}
          >
            <Text style={[styles.inputText, !fromLocation.name && styles.placeholderText]} numberOfLines={1}>
              {fromLocation.name || 'Başlangıç noktası...'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.inputRow}
            onPress={() => onOpenSearch('to')}
            activeOpacity={0.7}
          >
            <Text style={[styles.inputText, !toLocation.name && styles.placeholderText]} numberOfLines={1}>
              {toLocation.name || 'Nereye gitmek istiyorsunuz?'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Swap button */}
        <TouchableOpacity style={styles.swapBtn} onPress={onSwap} activeOpacity={0.7}>
          <ArrowUpDown size={16} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Quick Action Pills */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.pill} onPress={onUseGps} activeOpacity={0.7}>
          <LocateFixed size={15} color={theme.colors.primary} />
          <Text style={styles.pillText}>Konumum</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.pill} onPress={onPickOnMap} activeOpacity={0.7}>
          <MapIcon size={15} color={theme.colors.primary} />
          <Text style={styles.pillText}>Haritadan Seç</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Destinations (1-Tap) */}
      <View style={styles.quickDestSection}>
        <Text style={styles.quickDestTitle}>Hızlı Hedefler</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickDestScroll}
        >
          {QUICK_PLACES.map((place) => (
            <TouchableOpacity
              key={place.name}
              style={styles.chip}
              onPress={() => onSelectQuickPlace(place)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipIcon}>{place.icon}</Text>
              <Text style={styles.chipText}>{place.shortName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search CTA */}
      <TouchableOpacity style={styles.searchCta} onPress={onSearch} activeOpacity={0.8}>
        <Text style={styles.searchCtaText}>
          {hasSearched ? 'Rotayı Güncelle' : 'Rotayı Bul'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 12,
  },
  searchWidget: {
    flexDirection: 'row',
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    position: 'relative',
  },
  timeline: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  dotFrom: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.bg,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: theme.colors.borderFocus,
    marginVertical: 4,
  },
  dotTo: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.danger,
  },
  inputsColumn: {
    flex: 1,
    paddingVertical: 2,
    paddingRight: 36,
  },
  inputRow: {
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  inputText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textMain,
  },
  placeholderText: {
    color: theme.colors.textDim,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 8,
  },
  swapBtn: {
    position: 'absolute',
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceHover,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMain,
  },
  quickDestSection: {
    marginTop: 14,
  },
  quickDestTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  quickDestScroll: {
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceHover,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMain,
  },
  searchCta: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  searchCtaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
