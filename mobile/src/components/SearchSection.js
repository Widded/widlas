import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { LocateFixed, MapPin, ArrowUpDown, Sparkles, Navigation, ChevronRight } from 'lucide-react-native';
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
    <View style={styles.sheetContainer}>
      {/* Drawer Drag Grabber */}
      <View style={styles.grabberBox}>
        <View style={styles.grabberBar} />
      </View>

      {/* Main Journey Planner Chamber */}
      <View style={styles.journeyChamber}>
        {/* Origin field */}
        <TouchableOpacity
          style={styles.locationField}
          onPress={() => onOpenSearch('from')}
          activeOpacity={0.7}
        >
          <View style={styles.originBeacon}>
            <View style={styles.originBeaconInner} />
          </View>

          <View style={styles.fieldTextCol}>
            <Text style={styles.fieldLabel}>BAŞLANGIÇ</Text>
            <Text
              style={[styles.fieldValue, !fromLocation?.name && styles.placeholderValue]}
              numberOfLines={1}
            >
              {fromLocation?.name || 'Mevcut konumunuz...'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.gpsSnapBtn}
            onPress={onUseGps}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <LocateFixed size={16} color={theme.colors.primaryGlow} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Floating Swap Junction */}
        <View style={styles.junctionRow}>
          <View style={styles.junctionLine} />
          <TouchableOpacity
            style={styles.swapJunctionBtn}
            onPress={onSwap}
            activeOpacity={0.8}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowUpDown size={14} color={theme.colors.textMain} />
          </TouchableOpacity>
        </View>

        {/* Destination field */}
        <TouchableOpacity
          style={styles.locationField}
          onPress={() => onOpenSearch('to')}
          activeOpacity={0.7}
        >
          <View style={styles.destBeacon}>
            <MapPin size={16} color={theme.colors.danger} />
          </View>

          <View style={styles.fieldTextCol}>
            <Text style={styles.fieldLabel}>VARIŞ NOKTASI</Text>
            <Text
              style={[styles.fieldValue, !toLocation?.name && styles.placeholderValue]}
              numberOfLines={1}
            >
              {toLocation?.name || 'Nereye gitmek istiyorsunuz?'}
            </Text>
          </View>

          <ChevronRight size={18} color={theme.colors.textTertiary} />
        </TouchableOpacity>
      </View>

      {/* Quick Location Shortcuts */}
      <View style={styles.shortcutsRow}>
        <TouchableOpacity
          style={styles.shortcutPill}
          onPress={onPickOnMap}
          activeOpacity={0.7}
        >
          <MapPin size={13} color={theme.colors.warning} />
          <Text style={styles.shortcutPillText}>Haritada İşaretle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shortcutPill}
          onPress={onUseGps}
          activeOpacity={0.7}
        >
          <LocateFixed size={13} color={theme.colors.primaryGlow} />
          <Text style={styles.shortcutPillText}>GPS Konumumu Al</Text>
        </TouchableOpacity>
      </View>

      {/* Popular Edirne Destinations */}
      <View style={styles.popularSection}>
        <View style={styles.sectionTitleRow}>
          <Sparkles size={13} color={theme.colors.primaryGlow} />
          <Text style={styles.sectionTitleText}>Popüler Varış Noktaları</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.popularScroll}
        >
          {QUICK_PLACES.map((place) => {
            const isSelected = toLocation?.name === place.name;
            return (
              <TouchableOpacity
                key={place.name}
                style={[styles.placePill, isSelected && styles.placePillActive]}
                onPress={() => onSelectQuickPlace(place)}
                activeOpacity={0.7}
              >
                <Text style={styles.placePillIcon}>{place.icon}</Text>
                <Text
                  style={[styles.placePillText, isSelected && styles.placePillTextActive]}
                  numberOfLines={1}
                >
                  {place.shortName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
        onPress={onSearch}
        activeOpacity={0.85}
        disabled={loading}
      >
        <Navigation size={18} color="#FFFFFF" />
        <Text style={styles.ctaButtonText}>
          {loading ? 'En Uygun Güzergah Aranıyor...' : hasSearched ? 'Rotayı Yenile' : 'En İyi Rotaları Bul'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
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
  journeyChamber: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  locationField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 12,
  },
  originBeacon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  originBeaconInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primaryGlow,
  },
  destBeacon: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldTextCol: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textTertiary,
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  placeholderValue: {
    color: theme.colors.textTertiary,
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
    position: 'relative',
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  junctionLine: {
    position: 'absolute',
    left: 20,
    top: -4,
    bottom: -4,
    width: 2,
    backgroundColor: theme.colors.hairline,
  },
  swapJunctionBtn: {
    position: 'absolute',
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  shortcutPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    paddingVertical: 9,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  shortcutPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  popularSection: {
    marginTop: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  sectionTitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  popularScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  placePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  placePillActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primaryGlow,
  },
  placePillIcon: {
    fontSize: 13,
  },
  placePillText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMain,
  },
  placePillTextActive: {
    color: theme.colors.primaryGlow,
    fontWeight: '800',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingVertical: 14,
    marginTop: 14,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
