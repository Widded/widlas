import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowRight, Footprints, Bus, ChevronRight } from 'lucide-react-native';
import { theme } from '../theme';
import { calculateFare, formatFare } from '../data/fares';

const fmtWalk = (km) => {
  if (!km) return '';
  const m = km * 1000;
  return m > 1000 ? (m / 1000).toFixed(1) + ' km' : Math.round(m) + ' m';
};

export default function RouteCard({
  route,
  isSelected,
  onSelect,
  onOpenDetails,
  fareType
}) {
  const fare = calculateFare(fareType, route.isTransfer);

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      {/* Top row: Badges, Time, Fare */}
      <View style={styles.topRow}>
        <View style={styles.badgesRow}>
          {route.isWalkOnly ? (
            <View style={styles.walkBadge}>
              <Footprints size={15} color={theme.colors.success} />
              <Text style={styles.walkBadgeText}>Yürüme ({fmtWalk(route.walkDistanceStart)})</Text>
            </View>
          ) : route.isTransfer ? (
            <View style={styles.transferBadges}>
              <View style={[styles.badge, { backgroundColor: route.color || theme.colors.primary }]}>
                <Text style={styles.badgeText}>{route.line1}</Text>
              </View>
              <ArrowRight size={14} color={theme.colors.textDim} />
              <View style={[styles.badge, { backgroundColor: route.color2 || theme.colors.warning }]}>
                <Text style={styles.badgeText}>{route.line2}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.badge, { backgroundColor: route.color || theme.colors.primary }]}>
              <Text style={styles.badgeText}>{route.name || route.lineCode}</Text>
            </View>
          )}

          {route.walkDistanceStart > 0 && !route.isWalkOnly && (
            <View style={styles.walkInfo}>
              <Footprints size={12} color={theme.colors.textDim} />
              <Text style={styles.walkInfoText}>{fmtWalk(route.walkDistanceStart)}</Text>
            </View>
          )}
        </View>

        {/* Time & Price */}
        <View style={styles.priceCol}>
          <Text style={styles.timeText}>{route.totalTime} dk</Text>
          <Text style={styles.fareText}>{formatFare(fare)}</Text>
        </View>
      </View>

      {/* Stops summary */}
      {!route.isWalkOnly && (
        <View style={styles.stopsRow}>
          <Text style={styles.stopName} numberOfLines={1}>{route.startStop?.name}</Text>
          <ArrowRight size={12} color={theme.colors.textDim} />
          {route.isTransfer && (
            <>
              <Text style={[styles.stopName, { color: theme.colors.warning }]} numberOfLines={1}>
                {route.transferStop?.name}
              </Text>
              <ArrowRight size={12} color={theme.colors.textDim} />
            </>
          )}
          <Text style={styles.stopName} numberOfLines={1}>{route.endStop?.name}</Text>
        </View>
      )}

      {/* Action footer */}
      <View style={styles.footerRow}>
        <Text style={styles.statusText}>
          {isSelected ? 'Haritada aktif güzergah' : 'Seçmek için dokunun'}
        </Text>

        <TouchableOpacity style={styles.detailsBtn} onPress={onOpenDetails} activeOpacity={0.7}>
          <Text style={styles.detailsBtnText}>Detaylar</Text>
          <ChevronRight size={15} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
  },
  cardSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
    backgroundColor: theme.colors.surfaceHover,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  transferBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  walkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walkBadgeText: {
    color: theme.colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  walkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  walkInfoText: {
    fontSize: 12,
    color: theme.colors.textDim,
  },
  priceCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textMain,
    letterSpacing: -0.3,
  },
  fareText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: 2,
  },
  stopsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 6,
    flexWrap: 'wrap',
  },
  stopName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statusText: {
    fontSize: 12,
    color: theme.colors.textDim,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
