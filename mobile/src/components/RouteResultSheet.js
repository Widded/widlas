import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  LayoutAnimation,
  UIManager
} from 'react-native';
import {
  X,
  ArrowRight,
  Footprints,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Bus,
  MapPin,
  Zap,
  Repeat,
  GraduationCap,
  User,
  Minimize2,
  Maximize2,
  RefreshCw
} from 'lucide-react-native';
import { theme } from '../theme';
import { calculateFare, formatFare } from '../data/fares';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const fmtWalk = (km) => {
  if (!km) return '0 m';
  const m = km * 1000;
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
};

const getEta = (totalMinutes) => {
  const now = new Date();
  const eta = new Date(now.getTime() + (totalMinutes || 15) * 60000);
  const hh = String(eta.getHours()).padStart(2, '0');
  const mm = String(eta.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

export default function RouteResultSheet({
  routes,
  selectedIdx = 0,
  onSelectIdx,
  toLocation,
  fromLocation,
  fareType = 'ogrenci',
  onFareTypeChange,
  onOpenDetails,
  onClose
}) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showStopsLeg1, setShowStopsLeg1] = useState(false);
  const [showStopsLeg2, setShowStopsLeg2] = useState(false);

  const toggleMinimize = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsMinimized(prev => !prev);
  };

  const toggleLeg1Stops = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowStopsLeg1(prev => !prev);
  };

  const toggleLeg2Stops = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowStopsLeg2(prev => !prev);
  };

  // Empty State
  if (!routes || routes.length === 0) {
    return (
      <View style={styles.sheetContainer}>
        <View style={styles.grabberBox}>
          <View style={styles.grabberBar} />
        </View>

        <View style={styles.emptyCardBox}>
          <View style={styles.emptyIconCircle}>
            <Bus size={20} color={theme.colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Uygun Hat Bulunamadı</Text>
          <Text style={styles.emptySubtitle}>
            {toLocation?.name
              ? `"${toLocation.name}" için doğrudan veya tek aktarmalı ETUS seferi tespit edilemedi.`
              : 'Bu iki konum arasında uygun hat bulunamadı.'}
          </Text>

          <TouchableOpacity
            style={styles.emptyRetryBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <RefreshCw size={14} color={theme.colors.textPrimary} />
            <Text style={styles.emptyRetryBtnText}>Yeni Arama Yap</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentRoute = routes[selectedIdx] || routes[0];
  const fare = calculateFare(fareType, currentRoute.isTransfer);
  const isDirect = !currentRoute.isTransfer && !currentRoute.isWalkOnly;
  const isFastest = selectedIdx === 0;

  // Split intermediate stops for direct vs transfer
  let leg1Stops = [];
  let leg2Stops = [];
  if (currentRoute.isTransfer) {
    if (Array.isArray(currentRoute.passedStops)) {
      const tIdx = currentRoute.passedStops.indexOf('>>>TRANSFER<<<');
      if (tIdx !== -1) {
        leg1Stops = currentRoute.passedStops.slice(0, tIdx);
        leg2Stops = currentRoute.passedStops.slice(tIdx + 1);
      } else {
        leg1Stops = currentRoute.passedStops;
      }
    }
  } else {
    leg1Stops = Array.isArray(currentRoute.passedStops)
      ? currentRoute.passedStops.filter(s => s !== '>>>TRANSFER<<<')
      : [];
  }

  // MINIMIZED CAPSULE VIEW
  if (isMinimized) {
    return (
      <TouchableOpacity
        style={styles.minimizedContainer}
        onPress={toggleMinimize}
        activeOpacity={0.9}
      >
        <View style={styles.minimizedRow}>
          <View style={[styles.miniLineBadge, { backgroundColor: currentRoute.color || theme.colors.primary }]}>
            <Text style={styles.miniLineBadgeText}>
              {currentRoute.isWalkOnly ? 'Yürüme' : currentRoute.isTransfer ? `${currentRoute.line1}+${currentRoute.line2}` : currentRoute.name || currentRoute.lineCode}
            </Text>
          </View>

          <View style={styles.minimizedInfo}>
            <Text style={styles.minimizedDest} numberOfLines={1}>
              {toLocation?.name || 'Seçilen Hedef'}
            </Text>
            <Text style={styles.minimizedSub}>
              {currentRoute.totalTime} dk • Varış ~{getEta(currentRoute.totalTime)} • {formatFare(fare)}
            </Text>
          </View>

          <View style={styles.expandIconBox}>
            <Maximize2 size={15} color={theme.colors.textSecondary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.sheetContainer}>
      {/* Top Grabber */}
      <TouchableOpacity
        style={styles.grabberBox}
        onPress={toggleMinimize}
        activeOpacity={0.7}
      >
        <View style={styles.grabberBar} />
      </TouchableOpacity>

      {/* Header: Destination & Controls */}
      <View style={styles.headerRow}>
        <View style={styles.destinationCol}>
          <View style={styles.destMetaRow}>
            <MapPin size={12} color={theme.colors.error} />
            <Text style={styles.destMetaLabel}>VARIŞ NOKTASI</Text>
            {fromLocation?.name && (
              <Text style={styles.fromLocationHint} numberOfLines={1}>
                • {fromLocation.name}
              </Text>
            )}
          </View>
          <Text style={styles.destTitle} numberOfLines={1}>
            {toLocation?.name || 'Seçilen Hedef'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={toggleMinimize}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Minimize2 size={14} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={15} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Alternative Routes Selector Tabs (If multiple routes) */}
      {routes.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.routeTabsScroll}
        >
          {routes.map((r, idx) => {
            const isTabActive = selectedIdx === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.routeTab, isTabActive && styles.routeTabActive]}
                onPress={() => onSelectIdx(idx)}
                activeOpacity={0.75}
              >
                {idx === 0 && (
                  <Zap size={11} color={isTabActive ? theme.colors.primary : theme.colors.textMuted} />
                )}
                <Text style={[styles.routeTabTime, isTabActive && styles.routeTabTimeActive]}>
                  {r.totalTime} dk
                </Text>
                <View style={styles.routeTabDivider} />
                <Text style={[styles.routeTabCode, isTabActive && styles.routeTabCodeActive]}>
                  {r.isWalkOnly ? 'Yürüme' : r.isTransfer ? `${r.line1}+${r.line2}` : r.line1 || r.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Hero Transit Card */}
      <View style={styles.heroPassCard}>
        {/* Pass Top Bar */}
        <View style={styles.passTopBar}>
          <View style={styles.lineBadgesRow}>
            {currentRoute.isWalkOnly ? (
              <View style={styles.walkBadgePill}>
                <Footprints size={14} color={theme.colors.primary} />
                <Text style={styles.walkBadgePillText}>Sadece Yürüme</Text>
              </View>
            ) : currentRoute.isTransfer ? (
              <View style={styles.transferBadgesRow}>
                <View style={[styles.lineBadge, { backgroundColor: currentRoute.color || theme.colors.primary }]}>
                  <Text style={styles.lineBadgeText}>{currentRoute.line1}</Text>
                </View>
                <ArrowRight size={12} color={theme.colors.textMuted} />
                <View style={[styles.lineBadge, { backgroundColor: currentRoute.color2 || theme.colors.fare }]}>
                  <Text style={styles.lineBadgeText}>{currentRoute.line2}</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.lineBadge, { backgroundColor: currentRoute.color || theme.colors.primary }]}>
                <Text style={styles.lineBadgeText}>{currentRoute.name || currentRoute.lineCode}</Text>
              </View>
            )}

            {isFastest && (
              <View style={styles.fastestTag}>
                <Text style={styles.fastestTagText}>EN HIZLI</Text>
              </View>
            )}
            {isDirect && !isFastest && (
              <View style={styles.directTag}>
                <Text style={styles.directTagText}>DİREKT</Text>
              </View>
            )}
            {currentRoute.isTransfer && (
              <View style={styles.transferTag}>
                <Text style={styles.transferTagText}>AKTARMA</Text>
              </View>
            )}
          </View>

          {/* Time & ETA */}
          <View style={styles.timeCluster}>
            <View style={styles.durationRow}>
              <Text style={styles.durationBig}>{currentRoute.totalTime}</Text>
              <Text style={styles.durationUnit}>dk</Text>
            </View>
            <Text style={styles.etaText}>Varış ~{getEta(currentRoute.totalTime)}</Text>
          </View>
        </View>

        {/* Transit Timeline Flow */}
        {!currentRoute.isWalkOnly ? (
          <View style={styles.subwayTimelineBox}>
            {/* 1. Origin Stop (Biniş Durağı) */}
            <View style={styles.stationRow}>
              <View style={[styles.stationDot, { backgroundColor: theme.colors.primary }]} />
              <View style={styles.stationCol}>
                <Text style={styles.stationRoleLabel}>BİNİŞ DURAĞI</Text>
                <Text style={styles.stationName} numberOfLines={1}>
                  {currentRoute.startStop?.name || 'İlk Durak'}
                </Text>
              </View>
              {currentRoute.walkDistanceStart > 0 && (
                <View style={styles.walkPillInline}>
                  <Footprints size={10} color={theme.colors.primary} />
                  <Text style={styles.walkPillText}>{fmtWalk(currentRoute.walkDistanceStart)}</Text>
                </View>
              )}
            </View>

            {/* 2. Leg 1 Connector */}
            <View style={styles.connectorRow}>
              <View style={[styles.connectorLine, { backgroundColor: currentRoute.color || theme.colors.primary }]} />
              <View style={styles.legInfoCol}>
                <Text style={styles.legLineName}>
                  {currentRoute.isTransfer ? currentRoute.line1 : currentRoute.name} Hattı (~{currentRoute.busTimeMins || 12} dk)
                </Text>

                {leg1Stops.length > 0 && (
                  <TouchableOpacity
                    style={styles.accordionToggle}
                    onPress={toggleLeg1Stops}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.accordionToggleText}>
                      {leg1Stops.length} Ara Durak {showStopsLeg1 ? 'Gizle' : 'Göster'}
                    </Text>
                    {showStopsLeg1 ? (
                      <ChevronUp size={11} color={theme.colors.textSecondary} />
                    ) : (
                      <ChevronDown size={11} color={theme.colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Unfolded Intermediate Stops (Leg 1) */}
            {showStopsLeg1 && leg1Stops.length > 0 && (
              <View style={styles.stopsDropdown}>
                {leg1Stops.map((stopName, sIdx) => (
                  <View key={sIdx} style={styles.dropdownStopRow}>
                    <View style={styles.dropdownStopDot} />
                    <Text style={styles.dropdownStopName} numberOfLines={1}>
                      {stopName}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* 3. Transfer Stop (If Transfer) */}
            {currentRoute.isTransfer && currentRoute.transferStop && (
              <>
                <View style={styles.stationRow}>
                  <View style={[styles.stationDot, { backgroundColor: theme.colors.fare }]} />
                  <View style={styles.stationCol}>
                    <Text style={[styles.stationRoleLabel, { color: theme.colors.fare }]}>AKTARMA DURAĞI</Text>
                    <Text style={[styles.stationName, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                      {currentRoute.transferStop.name}
                    </Text>
                  </View>
                  <View style={styles.transferNoticePill}>
                    <Repeat size={10} color={theme.colors.fare} />
                    <Text style={styles.transferNoticeText}>{currentRoute.line2} Hattı</Text>
                  </View>
                </View>

                {/* Leg 2 Connector */}
                <View style={styles.connectorRow}>
                  <View style={[styles.connectorLine, { backgroundColor: currentRoute.color2 || theme.colors.fare }]} />
                  <View style={styles.legInfoCol}>
                    <Text style={[styles.legLineName, { color: theme.colors.fare }]}>
                      {currentRoute.line2} Hattı
                    </Text>

                    {leg2Stops.length > 0 && (
                      <TouchableOpacity
                        style={styles.accordionToggle}
                        onPress={toggleLeg2Stops}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.accordionToggleText}>
                          {leg2Stops.length} Ara Durak {showStopsLeg2 ? 'Gizle' : 'Göster'}
                        </Text>
                        {showStopsLeg2 ? (
                          <ChevronUp size={11} color={theme.colors.textSecondary} />
                        ) : (
                          <ChevronDown size={11} color={theme.colors.textSecondary} />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Unfolded Intermediate Stops (Leg 2) */}
                {showStopsLeg2 && leg2Stops.length > 0 && (
                  <View style={styles.stopsDropdown}>
                    {leg2Stops.map((stopName, sIdx) => (
                      <View key={sIdx} style={styles.dropdownStopRow}>
                        <View style={[styles.dropdownStopDot, { backgroundColor: theme.colors.fare }]} />
                        <Text style={styles.dropdownStopName} numberOfLines={1}>
                          {stopName}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* 4. Alight Stop (İniş Durağı) */}
            <View style={styles.stationRow}>
              <View style={[styles.stationDot, { backgroundColor: theme.colors.error }]} />
              <View style={styles.stationCol}>
                <Text style={[styles.stationRoleLabel, { color: theme.colors.error }]}>İNİŞ DURAĞI</Text>
                <Text style={styles.stationName} numberOfLines={1}>
                  {currentRoute.endStop?.name || 'Varış Durağı'}
                </Text>
              </View>
              {currentRoute.walkDistanceEnd > 0 && (
                <View style={styles.walkPillInline}>
                  <Footprints size={10} color={theme.colors.primary} />
                  <Text style={styles.walkPillText}>{fmtWalk(currentRoute.walkDistanceEnd)}</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          /* Walk Only Mode */
          <View style={styles.walkOnlyBox}>
            <View style={styles.walkIconBox}>
              <Footprints size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.walkOnlyInfo}>
              <Text style={styles.walkOnlyTitle}>Yürüyüş Rotası</Text>
              <Text style={styles.walkOnlyDesc}>
                {fmtWalk(currentRoute.walkDistanceStart)} mesafe (~{currentRoute.totalTime} dk) yürüyerek varabilirsiniz.
              </Text>
            </View>
          </View>
        )}

        {/* Card Footer: Fare & Action */}
        <View style={styles.passFooterBar}>
          <View style={styles.fareCluster}>
            <Text style={styles.fareAmount}>{formatFare(fare)}</Text>

            {onFareTypeChange ? (
              <TouchableOpacity
                style={styles.fareTypePill}
                onPress={() => onFareTypeChange(fareType === 'ogrenci' ? 'tam' : 'ogrenci')}
                activeOpacity={0.7}
              >
                {fareType === 'ogrenci' ? (
                  <>
                    <GraduationCap size={11} color={theme.colors.textSecondary} />
                    <Text style={styles.fareTypePillText}>Öğrenci ▾</Text>
                  </>
                ) : (
                  <>
                    <User size={11} color={theme.colors.textSecondary} />
                    <Text style={styles.fareTypePillText}>Tam ▾</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <Text style={styles.fareTypeLabel}>
                {fareType === 'ogrenci' ? 'Öğrenci' : 'Tam'}
              </Text>
            )}
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={onOpenDetails}
            activeOpacity={0.8}
          >
            <Text style={styles.detailsBtnText}>Tüm Adımlar</Text>
            <ChevronRight size={14} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.floating,
    zIndex: 95,
  },
  grabberBox: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  grabberBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  destinationCol: {
    flex: 1,
    paddingRight: 10,
  },
  destMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  destMetaLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  fromLocationHint: {
    fontSize: 9,
    color: theme.colors.textMuted,
    flexShrink: 1,
  },
  destTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBtn: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  routeTabsScroll: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 6,
  },
  routeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceElevated,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  routeTabActive: {
    backgroundColor: theme.colors.surfaceHover,
    borderColor: theme.colors.primary,
  },
  routeTabDivider: {
    width: 1,
    height: 9,
    backgroundColor: theme.colors.border,
  },
  routeTabTime: {
    fontSize: 11.5,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  routeTabTimeActive: {
    color: theme.colors.primary,
  },
  routeTabCode: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '600',
  },
  routeTabCodeActive: {
    color: theme.colors.textPrimary,
  },
  heroPassCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    marginTop: 4,
  },
  passTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  lineBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  lineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  lineBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12.5,
  },
  transferBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  walkBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  walkBadgePillText: {
    color: theme.colors.primary,
    fontSize: 11.5,
    fontWeight: '600',
  },
  fastestTag: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.xs,
  },
  fastestTagText: {
    color: theme.colors.primary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  directTag: {
    backgroundColor: theme.colors.surfaceHover,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.xs,
  },
  directTagText: {
    color: theme.colors.textSecondary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  transferTag: {
    backgroundColor: theme.colors.fareLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: theme.radius.xs,
  },
  transferTagText: {
    color: theme.colors.fare,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  timeCluster: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  durationBig: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.4,
  },
  durationUnit: {
    fontSize: 11.5,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  etaText: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  subwayTimelineBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stationDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  stationCol: {
    flex: 1,
  },
  stationRoleLabel: {
    fontSize: 8.5,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.4,
  },
  stationName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  walkPillInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: theme.radius.xs,
  },
  walkPillText: {
    color: theme.colors.primary,
    fontSize: 9.5,
    fontWeight: '600',
  },
  connectorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 3,
  },
  connectorLine: {
    width: 2,
    minHeight: 20,
    borderRadius: 1,
    marginLeft: 2.5,
  },
  legInfoCol: {
    flex: 1,
  },
  legLineName: {
    fontSize: 10.5,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  accordionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    paddingVertical: 2,
    marginTop: 2,
  },
  accordionToggleText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  stopsDropdown: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.xs,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginLeft: 14,
    marginBottom: 4,
    gap: 3,
  },
  dropdownStopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dropdownStopDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: theme.colors.textMuted,
  },
  dropdownStopName: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  transferNoticePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.fareLight,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: theme.radius.xs,
  },
  transferNoticeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: theme.colors.fare,
  },
  walkOnlyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  walkIconBox: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walkOnlyInfo: {
    flex: 1,
  },
  walkOnlyTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  walkOnlyDesc: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    lineHeight: 15,
  },
  passFooterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderSubtle,
    paddingTop: 8,
  },
  fareCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fareAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.fare,
  },
  fareTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: theme.radius.xs,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  fareTypePillText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  fareTypeLabel: {
    fontSize: 9.5,
    color: theme.colors.textMuted,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surfaceHover,
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  detailsBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 11.5,
    fontWeight: '600',
  },
  /* Minimized capsule */
  minimizedContainer: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.subtle,
    zIndex: 95,
  },
  minimizedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniLineBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  miniLineBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 11,
  },
  minimizedInfo: {
    flex: 1,
  },
  minimizedDest: {
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  minimizedSub: {
    fontSize: 10,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  expandIconBox: {
    width: 26,
    height: 26,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  /* Empty State */
  emptyCardBox: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  emptyIconCircle: {
    width: 38,
    height: 38,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: 3,
  },
  emptySubtitle: {
    fontSize: 11.5,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  emptyRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.surfaceHover,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyRetryBtnText: {
    color: theme.colors.textPrimary,
    fontSize: 11.5,
    fontWeight: '600',
  },
});
