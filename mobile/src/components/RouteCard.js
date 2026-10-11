import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowRight, Footprints, ChevronRight, Check } from 'lucide-react-native';
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
  fareType,
  index = 0
}) {
  const fare = calculateFare(fareType, route.isTransfer);
  const isDirect = !route.isTransfer && !route.isWalkOnly;
  const isFastest = index === 0;

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onSelect}
      activeOpacity={0.8}
    >
      {/* Top Row: Time, Badges, Fare */}
      <View style={styles.headerRow}>
        {/* Left: Duration & Tags */}
        <View style={styles.durationCol}>
          <View style={styles.timeWrapper}>
            <Text style={styles.durationNumber}>{route.totalTime}</Text>
            <Text style={styles.durationUnit}>dk</Text>
          </View>
          {isFastest && (
            <View style={styles.fastestPill}>
              <Text style={styles.fastestText}>En Hızlı</Text>
            </View>
          )}
          {isDirect && !isFastest && (
            <View style={styles.directPill}>
              <Text style={styles.directText}>Aktarmasız</Text>
            </View>
          )}
        </View>

        {/* Right: Fare & Selection Indicator */}
        <View style={styles.metaCol}>
          <View style={styles.fareBadge}>
            <Text style={styles.fareText}>{formatFare(fare)}</Text>
          </View>
          {isSelected && (
            <View style={styles.selectedBadge}>
              <Check size={12} color="#FFFFFF" />
              <Text style={styles.selectedText}>Haritada</Text>
            </View>
          )}
        </View>
      </View>

      {/* Transit Journey Chain (Badges) */}
      <View style={styles.chainRow}>
        {route.isWalkOnly ? (
          <View style={styles.walkChain}>
            <Footprints size={15} color={theme.colors.success} />
            <Text style={styles.walkChainText}>Yalnızca Yürüme ({fmtWalk(route.walkDistanceStart)})</Text>
          </View>
        ) : route.isTransfer ? (
          <View style={styles.transferChain}>
            {route.walkDistanceStart > 0 && (
              <View style={styles.walkMini}>
                <Footprints size={12} color={theme.colors.textSecondary} />
                <Text style={styles.walkMiniText}>{fmtWalk(route.walkDistanceStart)}</Text>
                <ArrowRight size={11} color={theme.colors.textTertiary} />
              </View>
            )}

            <View style={[styles.lineBadge, { backgroundColor: route.color || theme.colors.primary }]}>
              <Text style={styles.lineBadgeText}>{route.line1}</Text>
            </View>

            <ArrowRight size={13} color={theme.colors.textTertiary} />

            <View style={[styles.lineBadge, { backgroundColor: route.color2 || theme.colors.warning }]}>
              <Text style={styles.lineBadgeText}>{route.line2}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.directChain}>
            {route.walkDistanceStart > 0 && (
              <View style={styles.walkMini}>
                <Footprints size={12} color={theme.colors.textSecondary} />
                <Text style={styles.walkMiniText}>{fmtWalk(route.walkDistanceStart)}</Text>
                <ArrowRight size={11} color={theme.colors.textTertiary} />
              </View>
            )}

            <View style={[styles.lineBadge, { backgroundColor: route.color || theme.colors.primary }]}>
              <Text style={styles.lineBadgeText}>{route.name || route.lineCode}</Text>
            </View>

            <Text style={styles.directSubtitle} numberOfLines={1}>
              {route.startStop?.name ? `${route.startStop.name} durağından biniş` : 'Doğrudan hat'}
            </Text>
          </View>
        )}
      </View>

      {/* Stops summary row */}
      {!route.isWalkOnly && (
        <View style={styles.stopsPathRow}>
          <Text style={styles.stopText} numberOfLines={1}>
            {route.startStop?.name}
          </Text>
          <Text style={styles.arrowChar}>➔</Text>
          {route.isTransfer && (
            <>
              <Text style={[styles.stopText, { color: theme.colors.warning }]} numberOfLines={1}>
                {route.transferStop?.name}
              </Text>
              <Text style={styles.arrowChar}>➔</Text>
            </>
          )}
          <Text style={styles.stopText} numberOfLines={1}>
            {route.endStop?.name}
          </Text>
        </View>
      )}

      {/* Card Footer: Detail navigation */}
      <View style={styles.footerRow}>
        <Text style={styles.footerHint}>
          {isSelected ? 'Güzergah haritada çizili' : 'Haritada görmek için dokunun'}
        </Text>

        <TouchableOpacity
          style={styles.detailsBtn}
          onPress={onOpenDetails}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.detailsBtnText}>Tüm Adımlar</Text>
          <ChevronRight size={14} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    marginBottom: 12,
  },
  cardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceElevated,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  durationCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  timeWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  durationNumber: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textMain,
    letterSpacing: -0.5,
  },
  durationUnit: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  fastestPill: {
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  fastestText: {
    color: theme.colors.success,
    fontSize: 11,
    fontWeight: '700',
  },
  directPill: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  directText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fareBadge: {
    backgroundColor: theme.colors.surfaceHighlight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  fareText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  selectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
  },
  selectedText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  chainRow: {
    marginBottom: 10,
  },
  walkChain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walkChainText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.success,
  },
  transferChain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  directChain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  directSubtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  walkMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  walkMiniText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  stopsPathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.sm,
    marginBottom: 10,
  },
  stopText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    flexShrink: 1,
  },
  arrowChar: {
    fontSize: 11,
    color: theme.colors.textTertiary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
    paddingTop: 10,
  },
  footerHint: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  detailsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
