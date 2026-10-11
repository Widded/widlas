import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
  LayoutAnimation,
  UIManager
} from 'react-native';
import {
  X,
  ArrowRight,
  Footprints,
  Clock,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Bus,
  MapPin,
  Navigation,
  Zap,
  Repeat,
  GraduationCap,
  User,
  Minimize2,
  Maximize2,
  RefreshCw,
  Compass
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

  // If no routes found, render empty state card
  if (!routes || routes.length === 0) {
    return (
      <View style={styles.sheetContainer}>
        <View style={styles.grabberBox}>
          <View style={styles.grabberBar} />
        </View>

        <View style={styles.emptyCardBox}>
          <View style={styles.emptyIconCircle}>
            <Bus size={22} color={theme.colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>Uygun ETUS Hattı Bulunamadı</Text>
          <Text style={styles.emptySubtitle}>
            {toLocation?.name
              ? `"${toLocation.name}" konumuna doğrudan veya tek aktarmalı bir sefer eşleşmedi.`
              : 'Bu iki konum arasında toplu taşıma güzergahı tespit edilemedi.'}
          </Text>
          <Text style={styles.emptyHint}>
            Duraklara daha yakın bir nokta belirleyebilir veya harita üzerinden farklı bir hedef seçebilirsiniz.
          </Text>

          <TouchableOpacity
            style={styles.emptyRetryBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <RefreshCw size={15} color="#FFFFFF" />
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

  // MINIMIZED CAPSULE VIEW (Leaves 90% map visible)
  if (isMinimized) {
    return (
      <TouchableOpacity
        style={styles.minimizedContainer}
        onPress={toggleMinimize}
        activeOpacity={0.9}
      >
        <View style={styles.minimizedGrabber} />
        <View style={styles.minimizedRow}>
          {/* Badge */}
          <View style={[styles.miniLineBadge, { backgroundColor: currentRoute.color || theme.colors.violet }]}>
            <Text style={styles.miniLineBadgeText}>
              {currentRoute.isWalkOnly ? 'Yürüme' : currentRoute.isTransfer ? `${currentRoute.line1}+${currentRoute.line2}` : currentRoute.name || currentRoute.lineCode}
            </Text>
          </View>

          {/* Info */}
          <View style={styles.minimizedInfo}>
            <Text style={styles.minimizedDest} numberOfLines={1}>
              {toLocation?.name || 'Seçilen Rota'}
            </Text>
            <Text style={styles.minimizedSub}>
              {currentRoute.totalTime} dk • Varış ~{getEta(currentRoute.totalTime)} • {formatFare(fare)}
            </Text>
          </View>

          {/* Action icon */}
          <View style={styles.expandActionBubble}>
            <Maximize2 size={16} color={theme.colors.lavender} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // EXPANDED BOARDING PASS CARD
  return (
    <View style={styles.sheetContainer}>
      {/* Top Grabber Handle (Tap to minimize) */}
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
          <View style={styles.destBadgeRow}>
            <MapPin size={13} color={theme.colors.rose} />
            <Text style={styles.destLabel}>VARIŞ NOKTASI</Text>
            {fromLocation?.name && (
              <Text style={styles.fromLocationSub} numberOfLines={1}>
                • {fromLocation.name} kalkışlı
              </Text>
            )}
          </View>
          <Text style={styles.destTitle} numberOfLines={1}>
            {toLocation?.name || 'Seçilen Hedef'}
          </Text>
        </View>

        <View style={styles.headerControlsRow}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={toggleMinimize}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Minimize2 size={15} color={theme.colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={16} color={theme.colors.textPrimary} />
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
                style={[styles.routeTabPill, isTabActive && styles.routeTabPillActive]}
                onPress={() => onSelectIdx(idx)}
                activeOpacity={0.75}
              >
                {idx === 0 && (
                  <Zap size={11} color={isTabActive ? theme.colors.emerald : theme.colors.textMuted} />
                )}
                <Text style={[styles.routeTabTime, isTabActive && styles.routeTabTimeActive]}>
                  {r.totalTime} dk
                </Text>
                <View style={styles.tabDivider} />
                <Text style={[styles.routeTabCode, isTabActive && styles.routeTabCodeActive]}>
                  {r.isWalkOnly ? 'Yürüme' : r.isTransfer ? `${r.line1} ➔ ${r.line2}` : r.line1 || r.name}
                </Text>
                {idx === 0 && isTabActive && (
                  <View style={styles.fastestMiniDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Hero Boarding Pass Transit Card */}
      <View style={styles.heroPassCard}>
        {/* Pass Top Bar: Line Badges + Travel Duration + ETA */}
        <View style={styles.passTopBar}>
          <View style={styles.lineBadgesGroup}>
            {currentRoute.isWalkOnly ? (
              <View style={styles.walkBadgePill}>
                <Footprints size={15} color={theme.colors.emerald} />
                <Text style={styles.walkBadgePillText}>Sadece Yürüme</Text>
              </View>
            ) : currentRoute.isTransfer ? (
              <View style={styles.transferBadgeChain}>
                <View style={[styles.lineBadge, { backgroundColor: currentRoute.color || theme.colors.violet }]}>
                  <Text style={styles.lineBadgeText}>{currentRoute.line1}</Text>
                </View>
                <ArrowRight size={13} color={theme.colors.textMuted} />
                <View style={[styles.lineBadge, { backgroundColor: currentRoute.color2 || theme.colors.amber }]}>
                  <Text style={styles.lineBadgeText}>{currentRoute.line2}</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.lineBadge, { backgroundColor: currentRoute.color || theme.colors.violet }]}>
                <Text style={styles.lineBadgeText}>{currentRoute.name || currentRoute.lineCode}</Text>
              </View>
            )}

            {isFastest && (
              <View style={styles.statusPillFastest}>
                <Zap size={10} color={theme.colors.emerald} />
                <Text style={styles.statusPillFastestText}>EN HIZLI</Text>
              </View>
            )}
            {isDirect && !isFastest && (
              <View style={styles.statusPillDirect}>
                <Text style={styles.statusPillDirectText}>TEK HAT</Text>
              </View>
            )}
            {currentRoute.isTransfer && (
              <View style={styles.statusPillTransfer}>
                <Repeat size={10} color={theme.colors.amber} />
                <Text style={styles.statusPillTransferText}>1 AKTARMA</Text>
              </View>
            )}
          </View>

          {/* Time & ETA */}
          <View style={styles.timeGroup}>
            <View style={styles.durationRow}>
              <Text style={styles.durationNumber}>{currentRoute.totalTime}</Text>
              <Text style={styles.durationUnit}>dk</Text>
            </View>
            <Text style={styles.etaText}>Varış ~{getEta(currentRoute.totalTime)}</Text>
          </View>
        </View>

        {/* Transit Timeline Flow Rail */}
        {!currentRoute.isWalkOnly ? (
          <View style={styles.subwayRailChamber}>
            {/* 1. Origin Node (Biniş Durağı) */}
            <View style={styles.subwayNodeRow}>
              <View style={[styles.subwayDot, { backgroundColor: theme.colors.emerald }]} />
              <View style={styles.subwayStationCol}>
                <Text style={styles.subwayRole}>BİNİŞ DURAĞI</Text>
                <Text style={styles.subwayStationName} numberOfLines={1}>
                  {currentRoute.startStop?.name || 'İlk Durak'}
                </Text>
              </View>
              {currentRoute.walkDistanceStart > 0 && (
                <View style={styles.walkTagInline}>
                  <Footprints size={11} color={theme.colors.emerald} />
                  <Text style={styles.walkTagInlineText}>{fmtWalk(currentRoute.walkDistanceStart)}</Text>
                </View>
              )}
            </View>

            {/* 2. Bus Leg 1 Connector & Stop Accordion */}
            <View style={styles.subwayConnectorRow}>
              <View style={[styles.subwayVerticalLine, { backgroundColor: currentRoute.color || theme.colors.violet }]} />
              <View style={styles.busLegHintCol}>
                <View style={styles.busLegHeaderRow}>
                  <Text style={styles.busLegLineName}>
                    {currentRoute.isTransfer ? currentRoute.line1 : currentRoute.name} Hattı
                  </Text>
                  <Text style={styles.busLegTimeHint}>
                    • ~{currentRoute.busTimeMins || 12} dk
                  </Text>
                </View>

                {/* Stop Count & Accordion Toggle */}
                {leg1Stops.length > 0 && (
                  <TouchableOpacity
                    style={styles.accordionToggleBtn}
                    onPress={toggleLeg1Stops}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.accordionToggleText}>
                      {leg1Stops.length} Ara Durak {showStopsLeg1 ? 'Gizle' : 'Göster'}
                    </Text>
                    {showStopsLeg1 ? (
                      <ChevronUp size={12} color={theme.colors.lavender} />
                    ) : (
                      <ChevronDown size={12} color={theme.colors.lavender} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Unfolded Intermediate Stops for Leg 1 */}
            {showStopsLeg1 && leg1Stops.length > 0 && (
              <View style={styles.expandedStopsContainer}>
                {leg1Stops.map((stopName, sIdx) => (
                  <View key={sIdx} style={styles.expandedStopRow}>
                    <View style={styles.expandedStopDot} />
                    <Text style={styles.expandedStopName} numberOfLines={1}>
                      {stopName}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* 3. Transfer Node if any */}
            {currentRoute.isTransfer && currentRoute.transferStop && (
              <>
                <View style={styles.subwayNodeRow}>
                  <View style={[styles.subwayDot, { backgroundColor: theme.colors.amber }]} />
                  <View style={styles.subwayStationCol}>
                    <Text style={[styles.subwayRole, { color: theme.colors.amber }]}>AKTARMA NOKTASI</Text>
                    <Text style={[styles.subwayStationName, { color: theme.colors.amber }]} numberOfLines={1}>
                      {currentRoute.transferStop.name}
                    </Text>
                  </View>
                  <View style={styles.transferWaitBadge}>
                    <Repeat size={10} color={theme.colors.amber} />
                    <Text style={styles.transferWaitBadgeText}>{currentRoute.line2} Hattı</Text>
                  </View>
                </View>

                {/* Bus Leg 2 Connector */}
                <View style={styles.subwayConnectorRow}>
                  <View style={[styles.subwayVerticalLine, { backgroundColor: currentRoute.color2 || theme.colors.amber }]} />
                  <View style={styles.busLegHintCol}>
                    <View style={styles.busLegHeaderRow}>
                      <Text style={[styles.busLegLineName, { color: theme.colors.amber }]}>
                        {currentRoute.line2} Hattı
                      </Text>
                    </View>

                    {leg2Stops.length > 0 && (
                      <TouchableOpacity
                        style={styles.accordionToggleBtn}
                        onPress={toggleLeg2Stops}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.accordionToggleText}>
                          {leg2Stops.length} Ara Durak {showStopsLeg2 ? 'Gizle' : 'Göster'}
                        </Text>
                        {showStopsLeg2 ? (
                          <ChevronUp size={12} color={theme.colors.amber} />
                        ) : (
                          <ChevronDown size={12} color={theme.colors.amber} />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Unfolded Intermediate Stops for Leg 2 */}
                {showStopsLeg2 && leg2Stops.length > 0 && (
                  <View style={styles.expandedStopsContainer}>
                    {leg2Stops.map((stopName, sIdx) => (
                      <View key={sIdx} style={styles.expandedStopRow}>
                        <View style={[styles.expandedStopDot, { backgroundColor: theme.colors.amber }]} />
                        <Text style={styles.expandedStopName} numberOfLines={1}>
                          {stopName}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}

            {/* 4. Destination Node (İniş Durağı) */}
            <View style={styles.subwayNodeRow}>
              <View style={[styles.subwayDot, { backgroundColor: theme.colors.rose }]} />
              <View style={styles.subwayStationCol}>
                <Text style={[styles.subwayRole, { color: theme.colors.rose }]}>İNİŞ DURAĞI</Text>
                <Text style={styles.subwayStationName} numberOfLines={1}>
                  {currentRoute.endStop?.name || 'Varış Durağı'}
                </Text>
              </View>
              {currentRoute.walkDistanceEnd > 0 && (
                <View style={styles.walkTagInline}>
                  <Footprints size={11} color={theme.colors.emerald} />
                  <Text style={styles.walkTagInlineText}>{fmtWalk(currentRoute.walkDistanceEnd)}</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          /* Walk Only Chamber */
          <View style={styles.walkOnlyChamber}>
            <View style={styles.walkOnlyIconCircle}>
              <Footprints size={20} color={theme.colors.emerald} />
            </View>
            <View style={styles.walkOnlyInfo}>
              <Text style={styles.walkOnlyTitle}>Doğrudan Yürüyüş Güzergahı</Text>
              <Text style={styles.walkOnlyDesc}>
                Yaklaşık {fmtWalk(currentRoute.walkDistanceStart)} mesafe yürüyerek {currentRoute.totalTime} dakikada hedefinize ulaşabilirsiniz.
              </Text>
            </View>
          </View>
        )}

        {/* Card Footer: Fare Cluster + CTAs */}
        <View style={styles.passFooterBar}>
          {/* Fare cluster with optional quick toggle */}
          <View style={styles.fareCluster}>
            <Text style={styles.farePriceValue}>{formatFare(fare)}</Text>

            {onFareTypeChange ? (
              <TouchableOpacity
                style={styles.fareTypeTogglePill}
                onPress={() => onFareTypeChange(fareType === 'ogrenci' ? 'tam' : 'ogrenci')}
                activeOpacity={0.7}
              >
                {fareType === 'ogrenci' ? (
                  <>
                    <GraduationCap size={11} color={theme.colors.lavender} />
                    <Text style={styles.fareTypeToggleText}>Öğrenci ▾</Text>
                  </>
                ) : (
                  <>
                    <User size={11} color={theme.colors.amber} />
                    <Text style={[styles.fareTypeToggleText, { color: theme.colors.amber }]}>Tam ▾</Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.fareTypePill}>
                <Text style={styles.fareTypePillText}>
                  {fareType === 'ogrenci' ? 'Öğrenci Tarifesi' : 'Tam Tarife'}
                </Text>
              </View>
            )}
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.detailsCtaBtn}
            onPress={onOpenDetails}
            activeOpacity={0.8}
          >
            <Text style={styles.detailsCtaText}>Tüm Adımlar</Text>
            <ChevronRight size={15} color="#FFFFFF" />
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
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 22,
    elevation: 16,
    zIndex: 95,
  },
  grabberBox: {
    alignItems: 'center',
    paddingVertical: 5,
  },
  grabberBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
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
  destBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  destLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.6,
  },
  fromLocationSub: {
    fontSize: 9,
    fontWeight: '600',
    color: theme.colors.textMuted,
    flexShrink: 1,
  },
  destTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  routeTabsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  routeTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceElevated,
    paddingVertical: 6,
    paddingHorizontal: 11,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  routeTabPillActive: {
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    borderColor: theme.colors.lavender,
  },
  tabDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  routeTabTime: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  routeTabTimeActive: {
    color: theme.colors.lavender,
  },
  routeTabCode: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '700',
  },
  routeTabCodeActive: {
    color: '#FFFFFF',
  },
  fastestMiniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: theme.colors.emerald,
  },
  heroPassCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginTop: 4,
  },
  passTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  lineBadgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    flex: 1,
  },
  lineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lineBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.2,
  },
  transferBadgeChain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  walkBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.emeraldLight,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  walkBadgePillText: {
    color: theme.colors.emerald,
    fontSize: 12,
    fontWeight: '700',
  },
  statusPillFastest: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.emeraldLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusPillFastestText: {
    color: theme.colors.emerald,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusPillDirect: {
    backgroundColor: theme.colors.lavenderLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusPillDirectText: {
    color: theme.colors.lavender,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusPillTransfer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.amberLight,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusPillTransferText: {
    color: theme.colors.amber,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  timeGroup: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  durationNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    letterSpacing: -0.5,
  },
  durationUnit: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.textSecondary,
  },
  etaText: {
    fontSize: 10,
    color: theme.colors.textMuted,
    fontWeight: '700',
    marginTop: 1,
  },
  subwayRailChamber: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: 14,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  subwayNodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subwayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subwayStationCol: {
    flex: 1,
  },
  subwayRole: {
    fontSize: 8.5,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
  },
  subwayStationName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  walkTagInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.emeraldLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  walkTagInlineText: {
    color: theme.colors.emerald,
    fontSize: 10,
    fontWeight: '700',
  },
  subwayConnectorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 4,
  },
  subwayVerticalLine: {
    width: 2.5,
    height: '100%',
    minHeight: 22,
    borderRadius: 1.5,
    marginLeft: 2.5,
  },
  busLegHintCol: {
    flex: 1,
  },
  busLegHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  busLegLineName: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.lavender,
  },
  busLegTimeHint: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  accordionToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
    marginTop: 3,
  },
  accordionToggleText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: theme.colors.lavender,
  },
  expandedStopsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 14,
    marginBottom: 6,
    gap: 4,
  },
  expandedStopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandedStopDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.lavender,
  },
  expandedStopName: {
    fontSize: 10.5,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  transferWaitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.amberLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  transferWaitBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.amber,
  },
  walkOnlyChamber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.colors.inputBg,
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  walkOnlyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.emeraldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walkOnlyInfo: {
    flex: 1,
  },
  walkOnlyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.emerald,
    marginBottom: 2,
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
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 8,
  },
  fareCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  farePriceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: theme.colors.lavender,
  },
  fareTypeTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fareTypeToggleText: {
    fontSize: 10,
    fontWeight: '800',
    color: theme.colors.lavender,
  },
  fareTypePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fareTypePillText: {
    fontSize: 9.5,
    color: theme.colors.textMuted,
    fontWeight: '700',
  },
  detailsCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.violet,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    shadowColor: theme.colors.violet,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3,
  },
  detailsCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  /* Minimized capsule style */
  minimizedContainer: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 6,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 95,
  },
  minimizedGrabber: {
    width: 32,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: 6,
  },
  minimizedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniLineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  miniLineBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 12,
  },
  minimizedInfo: {
    flex: 1,
  },
  minimizedDest: {
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  minimizedSub: {
    fontSize: 10.5,
    fontWeight: '600',
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  expandActionBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  /* Empty State Card */
  emptyCardBox: {
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  emptyIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 10.5,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 14,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  emptyRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.violet,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  emptyRetryBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
