import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LocateFixed, MapPin, ArrowUpDown, ChevronRight, Navigation, Compass } from 'lucide-react-native';
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
  return (
    <View style={styles.composerWrapper}>
      {/* Drawer Grabber Handle */}
      <View style={styles.handleContainer}>
        <View style={styles.handleIndicator} />
      </View>

      {/* Main Waypoint Stage */}
      <View style={styles.waypointBox}>
        {/* Origin Field */}
        <TouchableOpacity
          style={styles.fieldTouch}
          onPress={() => onOpenSearch('from')}
          activeOpacity={0.7}
        >
          <View style={styles.cyanBeacon}>
            <View style={styles.cyanBeaconCore} />
          </View>

          <View style={styles.fieldInfo}>
            <Text style={styles.fieldMicroTitle}>BAŞLANGIÇ NOKTASI</Text>
            <Text
              style={[styles.fieldName, !fromLocation?.name && styles.placeholderName]}
              numberOfLines={1}
            >
              {fromLocation?.name || 'Konumunuz tespit ediliyor...'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.gpsSnapBtn}
            onPress={onUseGps}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <LocateFixed size={15} color={theme.colors.primaryGlow} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Junction & Swap Button */}
        <View style={styles.junctionRow}>
          <View style={styles.junctionRail} />
          <TouchableOpacity
            style={styles.swapFloatingBtn}
            onPress={onSwap}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowUpDown size={13} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Destination Field */}
        <TouchableOpacity
          style={styles.fieldTouch}
          onPress={() => onOpenSearch('to')}
          activeOpacity={0.7}
        >
          <View style={styles.roseBeacon}>
            <MapPin size={15} color={theme.colors.rose} />
          </View>

          <View style={styles.fieldInfo}>
            <Text style={styles.fieldMicroTitle}>VARIŞ NOKTASI</Text>
            <Text
              style={[styles.fieldName, !toLocation?.name && styles.placeholderName]}
              numberOfLines={1}
            >
              {toLocation?.name || 'Nereye gitmek istiyorsunuz?'}
            </Text>
          </View>

          <ChevronRight size={16} color={theme.colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Quick Action Shortcuts */}
      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={styles.actionChip}
          onPress={onPickOnMap}
          activeOpacity={0.75}
        >
          <MapPin size={13} color={theme.colors.amber} />
          <Text style={styles.actionChipLabel}>Haritada Seç</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionChip}
          onPress={onUseGps}
          activeOpacity={0.75}
        >
          <Compass size={13} color={theme.colors.primaryGlow} />
          <Text style={styles.actionChipLabel}>Mevcut Konumum</Text>
        </TouchableOpacity>
      </View>

      {/* Curated Fast-Pick Destinations */}
      <View style={styles.fastPicksSection}>
        <Text style={styles.fastPicksTitle}>SIK GİDİLEN DURAKLAR & HEDEFLER</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.fastPicksScroll}
        >
          {QUICK_PLACES.map((place) => {
            const isSelected = toLocation?.name === place.name;
            return (
              <TouchableOpacity
                key={place.name}
                style={[styles.stationChip, isSelected && styles.stationChipActive]}
                onPress={() => onSelectQuickPlace(place)}
                activeOpacity={0.7}
              >
                <Text style={styles.stationChipIcon}>{place.icon}</Text>
                <Text
                  style={[styles.stationChipText, isSelected && styles.stationChipTextActive]}
                  numberOfLines={1}
                >
                  {place.shortName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Execute Route Search CTA */}
      <TouchableOpacity
        style={[styles.searchCtaBtn, loading && styles.searchCtaDisabled]}
        onPress={onSearch}
        activeOpacity={0.85}
        disabled={loading}
      >
        <Navigation size={17} color="#FFFFFF" />
        <Text style={styles.searchCtaText}>
          {loading ? 'En Uygun Güzergah Aranıyor...' : hasSearched ? 'Rotayı Güncelle' : 'En Uygun Rotaları Hesapla'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  composerWrapper: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 20,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handleIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  waypointBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  fieldTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  cyanBeacon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cyanBeaconCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primaryGlow,
  },
  roseBeacon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldInfo: {
    flex: 1,
  },
  fieldMicroTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  fieldName: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  placeholderName: {
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  gpsSnapBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  junctionRow: {
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  junctionRail: {
    position: 'absolute',
    left: 20,
    top: -4,
    bottom: -4,
    width: 2,
    backgroundColor: theme.colors.border,
  },
  swapFloatingBtn: {
    position: 'absolute',
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    zIndex: 10,
  },
  actionsBar: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionChipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  fastPicksSection: {
    marginTop: 14,
  },
  fastPicksTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  fastPicksScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  stationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  stationChipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primaryGlow,
  },
  stationChipIcon: {
    fontSize: 13,
  },
  stationChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  stationChipTextActive: {
    color: theme.colors.primaryGlow,
    fontWeight: '800',
  },
  searchCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.violet,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    marginTop: 14,
    shadowColor: theme.colors.violet,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 5,
  },
  searchCtaDisabled: {
    opacity: 0.6,
  },
  searchCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
