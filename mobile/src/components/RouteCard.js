import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowRight, Footprints, ChevronRight, Check, Clock, Bus } from 'lucide-react-native';
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
      style={[styles.ticketCard, isSelected && styles.ticketCardActive]}
      onPress={onSelect}
      activeOpacity={0.85}
    >
      {/* Top Banner: Badges & Travel Time */}
      <View style={styles.topBanner}>
        {/* Route Pills Chain */}
        <View style={styles.chainBox}>
          {route.isWalkOnly ? (
            <View style={styles.walkBadgePill}>
              <Footprints size={14} color={theme.colors.success} />
              <Text style={styles.walkBadgePillText}>Yürüyerek Ulaşım</Text>
            </View>
          ) : route.isTransfer ? (
            <View style={styles.transferChain}>
              <View style={[styles.lineBadge, { backgroundColor: route.color || theme.colors.primary }]}>
                <Text style={styles.lineBadgeText}>{route.line1}</Text>
              </View>
              <ArrowRight size={13} color={theme.colors.textTertiary} />
              <View style={[styles.lineBadge, { backgroundColor: route.color2 || theme.colors.warning }]}>
                <Text style={styles.lineBadgeText}>{route.line2}</Text>
              </View>
            </View>
          ) : (
            <View style={[styles.lineBadge, { backgroundColor: route.color || theme.colors.primary }]}>
              <Text style={styles.lineBadgeText}>{route.name || route.lineCode}</Text>
            </View>
          )}

          {isFastest && (
            <View style={styles.fastestTag}>
              <Text style={styles.fastestTagText}>EN HIZLI</Text>
            </View>
          )}
          {isDirect && !isFastest && (
            <View style={styles.directTag}>
              <Text style={styles.directTagText}>TEK HAT</Text>
            </View>
          )}
        </View>

        {/* Travel Time Display */}
        <View style={styles.timeBox}>
          <Text style={styles.timeValue}>{route.totalTime}</Text>
          <Text style={styles.timeUnit}>dk</Text>
        </View>
      </View>

      {/* Center Ticket Segment: Boarding & Alighting Waypoints */}
      {!route.isWalkOnly && (
        <View style={styles.waypointSegment}>
          {/* Timeline rail */}
          <View style={styles.railCol}>
            <View style={[styles.railDot, { backgroundColor: theme.colors.primaryGlow }]} />
            <View style={styles.railLine} />
            {route.isTransfer && (
              <>
                <View style={[styles.railDot, { backgroundColor: theme.colors.warning }]} />
                <View style={styles.railLine} />
              </>
            )}
            <View style={[styles.railDot, { backgroundColor: theme.colors.danger }]} />
          </View>

          {/* Stop names */}
          <View style={styles.stopsCol}>
            <View style={styles.stopRow}>
              <Text style={styles.stopNameText} numberOfLines={1}>
                {route.startStop?.name || 'İlk Durak'}
              </Text>
              <Text style={styles.stopRoleText}>Biniş</Text>
            </View>

            {route.isTransfer && (
              <View style={styles.stopRow}>
                <Text style={[styles.stopNameText, { color: theme.colors.warning }]} numberOfLines={1}>
                  {route.transferStop?.name || 'Aktarma Noktası'}
                </Text>
                <Text style={styles.stopRoleText}>Aktarma</Text>
              </View>
            )}

            <View style={styles.stopRow}>
              <Text style={styles.stopNameText} numberOfLines={1}>
                {route.endStop?.name || 'Son Durak'}
              </Text>
              <Text style={styles.stopRoleText}>İniş</Text>
            </View>
          </View>
        </View>
      )}

      {/* Perforated Divider */}
      <View style={styles.perforatedLine} />

      {/* Ticket Footer: Walk summary, Fare, and Details action */}
      <View style={styles.footerRow}>
        <View style={styles.footerLeft}>
          {route.walkDistanceStart > 0 && (
            <View style={styles.walkMeta}>
              <Footprints size={12} color={theme.colors.success} />
              <Text style={styles.walkMetaText}>{fmtWalk(route.walkDistanceStart)} yürüme</Text>
            </View>
          )}

          <View style={styles.fareTagPill}>
            <Text style={styles.fareTagText}>{formatFare(fare)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.detailsAction}
          onPress={onOpenDetails}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.detailsActionText}>Tüm Adımlar</Text>
          <ChevronRight size={14} color={theme.colors.primaryGlow} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  ticketCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  ticketCardActive: {
    borderColor: theme.colors.primaryGlow,
    backgroundColor: theme.colors.surfaceElevated,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 5,
  },
  topBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chainBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  transferChain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  lineBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  walkBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: theme.radius.pill,
  },
  walkBadgePillText: {
    color: theme.colors.success,
    fontSize: 12,
    fontWeight: '700',
  },
  fastestTag: {
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  fastestTagText: {
    color: theme.colors.success,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  directTag: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  directTagText: {
    color: theme.colors.primaryGlow,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginLeft: 8,
  },
  timeValue: {
    fontSize: 26,
    fontWeight: '900',
    color: theme.colors.textMain,
    letterSpacing: -0.5,
  },
  timeUnit: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  waypointSegment: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  railCol: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    width: 12,
  },
  railDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  railLine: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.hairline,
    marginVertical: 2,
  },
  stopsCol: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 6,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textMain,
    flex: 1,
    paddingRight: 8,
  },
  stopRoleText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
  },
  perforatedLine: {
    height: 1,
    backgroundColor: theme.colors.hairline,
    marginVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  walkMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walkMetaText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  fareTagPill: {
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.sm,
  },
  fareTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primaryGlow,
  },
  detailsAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  detailsActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primaryGlow,
  },
});
