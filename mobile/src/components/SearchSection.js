import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LocateFixed, MapPin, ArrowUpDown, Navigation, ChevronRight } from 'lucide-react-native';
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
  hasSearched,
  loading
}) {
  const isFromGps = fromLocation?.name === 'Konumunuz' || !fromLocation?.lat;

  return (
    <View style={styles.container}>
      {/* Search Input Box */}
      <View style={styles.card}>
        <View style={styles.inputsRow}>
          {/* Vertical visual connector */}
          <View style={styles.indicatorCol}>
            <View style={styles.originDot} />
            <View style={styles.connectorLine} />
            <View style={styles.destDot} />
          </View>

          {/* Location touch targets */}
          <View style={styles.fieldsCol}>
            {/* Origin row */}
            <TouchableOpacity
              style={styles.fieldTouch}
              onPress={() => onOpenSearch('from')}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.fieldText, !fromLocation?.name && styles.placeholderText]}
                numberOfLines={1}
              >
                {fromLocation?.name || 'Başlangıç noktası seçin'}
              </Text>
              {isFromGps && (
                <View style={styles.gpsPill}>
                  <Text style={styles.gpsPillText}>GPS</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.hairlineDivider} />

            {/* Destination row */}
            <TouchableOpacity
              style={styles.fieldTouch}
              onPress={() => onOpenSearch('to')}
              activeOpacity={0.7}
            >
              <Text
                style={[styles.fieldText, !toLocation?.name && styles.placeholderText]}
                numberOfLines={1}
              >
                {toLocation?.name || 'Nereye gitmek istiyorsunuz?'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Swap Button */}
          <TouchableOpacity
            style={styles.swapBtn}
            onPress={onSwap}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <ArrowUpDown size={15} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Action Shortcuts: Konumum & Haritadan Seç */}
        <View style={styles.shortcutsRow}>
          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={onUseGps}
            activeOpacity={0.7}
          >
            <LocateFixed size={14} color={theme.colors.primary} />
            <Text style={styles.shortcutText}>Mevcut Konum</Text>
          </TouchableOpacity>

          <View style={styles.verticalSeparator} />

          <TouchableOpacity
            style={styles.shortcutBtn}
            onPress={onPickOnMap}
            activeOpacity={0.7}
          >
            <MapPin size={14} color={theme.colors.warning} />
            <Text style={styles.shortcutText}>Haritadan İşaretle</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Destinations Carousel */}
      <View style={styles.quickSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Sık Gidilen Noktalar</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickScroll}
        >
          {QUICK_PLACES.map((place) => {
            const isSelected = toLocation?.name === place.name;
            return (
              <TouchableOpacity
                key={place.name}
                style={[styles.quickChip, isSelected && styles.quickChipActive]}
                onPress={() => onSelectQuickPlace(place)}
                activeOpacity={0.7}
              >
                <Text style={styles.chipIcon}>{place.icon}</Text>
                <Text
                  style={[styles.chipLabel, isSelected && styles.chipLabelActive]}
                  numberOfLines={1}
                >
                  {place.shortName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Search Route Action */}
      <TouchableOpacity
        style={[styles.searchCta, loading && styles.searchCtaDisabled]}
        onPress={onSearch}
        activeOpacity={0.8}
        disabled={loading}
      >
        <Navigation size={18} color="#FFFFFF" />
        <Text style={styles.searchCtaText}>
          {loading ? 'Rotalar Hesaplanıyor...' : hasSearched ? 'Rotayı Güncelle' : 'Rotaları Bul'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    overflow: 'hidden',
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  indicatorCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    marginRight: 6,
  },
  originDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  connectorLine: {
    width: 2,
    height: 28,
    backgroundColor: theme.colors.hairline,
    marginVertical: 4,
  },
  destDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.danger,
  },
  fieldsCol: {
    flex: 1,
    paddingRight: 8,
  },
  fieldTouch: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  fieldText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textMain,
    flex: 1,
  },
  placeholderText: {
    color: theme.colors.textTertiary,
    fontWeight: '500',
  },
  hairlineDivider: {
    height: 1,
    backgroundColor: theme.colors.hairline,
  },
  gpsPill: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  gpsPillText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  swapBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  shortcutsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
    backgroundColor: theme.colors.surfaceElevated,
  },
  shortcutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
  },
  shortcutText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  verticalSeparator: {
    width: 1,
    height: 18,
    backgroundColor: theme.colors.hairline,
  },
  quickSection: {
    marginTop: 14,
  },
  sectionHeader: {
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  quickScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  quickChipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  chipIcon: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMain,
  },
  chipLabelActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  searchCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    marginTop: 14,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  searchCtaDisabled: {
    opacity: 0.6,
  },
  searchCtaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
