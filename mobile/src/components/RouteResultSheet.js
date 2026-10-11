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
  RefreshCw,
  Navigation,
  Clock
} from 'lucide-react-native';
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

  // 1. EMPTY STATE (No route found)
  if (!routes || routes.length === 0) {
    return (
      <View style={styles.sheetContainer}>
        <View style={styles.grabberBox}>
          <View style={styles.grabberBar} />
        </View>

        <View style={styles.emptyCardBox}>
          <View style={styles.emptyIconCircle}>
            <Bus size={22} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Doğrudan Hat Bulunamadı</Text>
          <Text style={styles.emptySubtitle}>
            {toLocation?.name
              ? `"${toLocation.name}" için mevcut ETUS güzergahlarında doğrudan sefer bulunamadı.`
              : 'Seçilen noktalar arasında uygun hat tespit edilemedi.'}
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

  // 2. MINIMIZED FLOATING CAPSULE VIEW (For full map visibility)
  if (isMinimized) {
    return (
      <View style={styles.minimizedWrapper}>
        <TouchableOpacity
          style={styles.minimizedContainer}
          onPress={toggleMinimize}
          activeOpacity={0.85}
        >
          <View style={styles.minimizedRow}>
            {/* Line Badge */}
            <View style={[styles.miniLineBadge, { backgroundColor: currentRoute.color || '#3B82F6' }]}>
              <Text style={styles.miniLineBadgeText}>
                {currentRoute.isWalkOnly
                  ? 'Yürüme'
                  : currentRoute.isTransfer
                    ? `${currentRoute.line1}+${currentRoute.line2}`
                    : currentRoute.name || currentRoute.lineCode}
              </Text>
            </View>

            {/* Destination Info */}
            <View style={styles.minimizedInfo}>
              <Text style={styles.minimizedDest} numberOfLines={1}>
                {toLocation?.name || 'Seçilen Hedef'}
              </Text>
              <Text style={styles.minimizedSub}>
                {currentRoute.totalTime} dk • Varış ~{getEta(currentRoute.totalTime)} • {formatFare(fare)}
              </Text>
            </View>

            {/* Expand Action Button */}
            <View style={styles.miniExpandBtn}>
              <Maximize2 size={16} color="#38BDF8" />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. FULL BOTTOM SHEET DRAWER (Customer-Centric OLED Dark Experience)
  return (
    <View style={styles.sheetContainer}>
      {/* Top Grabber Handle */}
      <TouchableOpacity
        style={styles.grabberBox}
        onPress={toggleMinimize}
        activeOpacity={0.7}
        hitSlop={{ top: 12, bottom: 12, left: 20, right: 20 }}
      >
        <View style={styles.grabberBar} />
      </TouchableOpacity>

      {/* Header: Destination Title & Quick Actions */}
      <View style={styles.headerRow}>
        <View style={styles.destinationCol}>
          <View style={styles.destMetaRow}>
            <MapPin size={13} color="#EF4444" />
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
            style={styles.circleActionBtn}
            onPress={toggleMinimize}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronDown size={18} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.circleActionBtn}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Alternative Routes Selector Tabs (When multiple routes available) */}
      {routes.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.routeTabsScroll}
          style={styles.routeTabsWrapper}
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
                  <Zap size={13} color={isTabActive ? '#38BDF8' : '#24C795'} />
                )}
                <Text style={[styles.routeTabTime, isTabActive && styles.routeTabTimeActive]}>
                  {r.totalTime} dk
                </Text>
                <View style={[styles.routeTabDivider, isTabActive && styles.routeTabDividerActive]} />
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
        {/* Pass Top Row: Badges, Tags and Duration */}
        <View style={styles.passTopBar}>
          <View style={styles.lineBadgesRow}>
            {currentRoute.isWalkOnly ? (
              <View style={styles.walkBadgePill}>
                <Footprints size={15} color="#38BDF8" />
                <Text style={styles.walkBadgePillText}>Sadece Yürüme</Text>
              </View>
            ) : currentRoute.isTransfer ? (
              <View style={styles.transferBadgesRow}>
                <View style={[styles.lineBadge, { backgroundColor: currentRoute.color || '#3B82F6' }]}>
                  <Text style={styles.lineBadgeText}>{currentRoute.line1}</Text>
                </View>
                <ArrowRight size={13} color="#94A3B8" />
                <View style={[styles.lineBadge, { backgroundColor: currentRoute.color2 || '#8B5CF6' }]}>
                  <Text style={styles.lineBadgeText}>{currentRoute.line2}</Text>
                </View>
              </View>
            ) : (
              <View style={[styles.lineBadge, { backgroundColor: currentRoute.color || '#3B82F6' }]}>
                <Text style={styles.lineBadgeText}>{currentRoute.name || currentRoute.lineCode}</Text>
              </View>
            )}

            {isFastest && (
              <View style={styles.fastestTag}>
                <Zap size={11} color="#24C795" />
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
                <Repeat size={11} color="#F59E0B" />
                <Text style={styles.transferTagText}>AKTARMA</Text>
              </View>
            )}
          </View>

          {/* Time & ETA Cluster */}
          <View style={styles.timeCluster}>
            <View style={styles.durationRow}>
              <Text style={styles.durationBig}>{currentRoute.totalTime}</Text>
              <Text style={styles.durationUnit}>dk</Text>
            </View>
            <View style={styles.etaRow}>
              <Clock size={11} color="#94A3B8" />
              <Text style={styles.etaText}>Varış ~{getEta(currentRoute.totalTime)}</Text>
            </View>
          </View>
        </View>

        {/* Transit Timeline Flow (Visual Journey Path) */}
        {!currentRoute.isWalkOnly ? (
          <View style={styles.subwayTimelineBox}>
            {/* 1. Origin Stop (Biniş Durağı) */}
            <View style={styles.stationRow}>
              <View style={[styles.stationDot, { backgroundColor: '#38BDF8' }]} />
              <View style={styles.stationCol}>
                <Text style={styles.stationRoleLabel}>BİNİŞ DURAĞI</Text>
                <Text style={styles.stationName} numberOfLines={1}>
                  {currentRoute.startStop?.name || 'İlk Durak'}
                </Text>
              </View>
              {currentRoute.walkDistanceStart > 0 && (
                <View style={styles.walkPillInline}>
                  <Footprints size={11} color="#38BDF8" />
                  <Text style={styles.walkPillText}>{fmtWalk(currentRoute.walkDistanceStart)}</Text>
                </View>
              )}
            </View>

            {/* 2. Leg 1 Line Travel & Intermediate Stops */}
            <View style={styles.connectorRow}>
              <View style={[styles.connectorLine, { backgroundColor: currentRoute.color || '#3B82F6' }]} />
              <View style={styles.legInfoCol}>
                <Text style={styles.legLineName}>
                  {currentRoute.isTransfer ? currentRoute.line1 : currentRoute.name} Hattı ile ~{currentRoute.busTimeMins || 12} dk
                </Text>

                {leg1Stops.length > 0 && (
                  <TouchableOpacity
                    style={styles.accordionToggle}
                    onPress={toggleLeg1Stops}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.accordionToggleText}>
                      {leg1Stops.length} Ara Durak {showStopsLeg1 ? '(Gizle)' : '(Göster)'}
                    </Text>
                    {showStopsLeg1 ? (
                      <ChevronUp size={13} color="#94A3B8" />
                    ) : (
                      <ChevronDown size={13} color="#94A3B8" />
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

            {/* 3. Transfer Stop (If transfer route) */}
            {currentRoute.isTransfer && currentRoute.transferStop && (
              <>
                <View style={styles.stationRow}>
                  <View style={[styles.stationDot, { backgroundColor: '#F59E0B' }]} />
                  <View style={styles.stationCol}>
                    <Text style={[styles.stationRoleLabel, { color: '#F59E0B' }]}>AKTARMA NOKTASI</Text>
                    <Text style={styles.stationName} numberOfLines={1}>
                      {currentRoute.transferStop.name}
                    </Text>
                  </View>
                  <View style={styles.transferBadgePill}>
                    <Repeat size={11} color="#F59E0B" />
                    <Text style={styles.transferBadgePillText}>Aktarma</Text>
                  </View>
                </View>

                {/* Leg 2 Line Connector */}
                <View style={styles.connectorRow}>
                  <View style={[styles.connectorLine, { backgroundColor: currentRoute.color2 || '#8B5CF6' }]} />
                  <View style={styles.legInfoCol}>
                    <Text style={styles.legLineName}>
                      {currentRoute.line2} Hattı ile ~{currentRoute.busTime2Mins || 10} dk
                    </Text>

                    {leg2Stops.length > 0 && (
                      <TouchableOpacity
                        style={styles.accordionToggle}
                        onPress={toggleLeg2Stops}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.accordionToggleText}>
                          {leg2Stops.length} Ara Durak {showStopsLeg2 ? '(Gizle)' : '(Göster)'}
                        </Text>
                        {showStopsLeg2 ? (
                          <ChevronUp size={13} color="#94A3B8" />
                        ) : (
                          <ChevronDown size={13} color="#94A3B8" />
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
                        <View style={[styles.dropdownStopDot, { backgroundColor: '#8B5CF6' }]} />
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
              <View style={[styles.stationDot, { backgroundColor: '#EF4444' }]} />
              <View style={styles.stationCol}>
                <Text style={[styles.stationRoleLabel, { color: '#EF4444' }]}>İNİŞ DURAĞI</Text>
                <Text style={styles.stationName} numberOfLines={1}>
                  {currentRoute.endStop?.name || 'Varış Durağı'}
                </Text>
              </View>
              {currentRoute.walkDistanceEnd > 0 && (
                <View style={styles.walkPillInline}>
                  <Footprints size={11} color="#38BDF8" />
                  <Text style={styles.walkPillText}>{fmtWalk(currentRoute.walkDistanceEnd)}</Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          /* Walk Only Mode */
          <View style={styles.walkOnlyBox}>
            <View style={styles.walkIconBox}>
              <Footprints size={20} color="#38BDF8" />
            </View>
            <View style={styles.walkOnlyInfo}>
              <Text style={styles.walkOnlyTitle}>Yürüyüş Rotası</Text>
              <Text style={styles.walkOnlyDesc}>
                {fmtWalk(currentRoute.walkDistanceStart)} mesafe (~{currentRoute.totalTime} dk) yürüyerek rahatça ulaşabilirsiniz.
              </Text>
            </View>
          </View>
        )}

        {/* Card Footer: Kentkart Fare Pill & Primary Guide Action */}
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
                    <GraduationCap size={12} color="#94A3B8" />
                    <Text style={styles.fareTypePillText}>Öğrenci ▾</Text>
                  </>
                ) : (
                  <>
                    <User size={12} color="#94A3B8" />
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

          {/* Primary Action Button: Detaylı Yol Tarifi */}
          <TouchableOpacity
            style={styles.detailsBtn}
            onPress={onOpenDetails}
            activeOpacity={0.8}
          >
            <Navigation size={15} color="#FFFFFF" />
            <Text style={styles.detailsBtnText}>Detaylı Rehber</Text>
            <ChevronRight size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main Bottom Sheet Drawer Container
  sheetContainer: {
    backgroundColor: '#12161E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: '#1E2538',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 16,
  },

  // Grabber Handle
  grabberBox: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  grabberBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2A344A',
  },

  // Header Row
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  destinationCol: {
    flex: 1,
    paddingRight: 12,
  },
  destMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 3,
  },
  destMetaLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  fromLocationHint: {
    fontSize: 10,
    color: '#64748B',
    flexShrink: 1,
  },
  destTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#161B24',
    borderWidth: 1,
    borderColor: '#1E2538',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Alternative Route Selector Tabs
  routeTabsWrapper: {
    marginTop: 6,
    marginBottom: 4,
  },
  routeTabsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  routeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#161B24',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1E2538',
  },
  routeTabActive: {
    backgroundColor: '#1E293B',
    borderColor: '#38BDF8',
  },
  routeTabDivider: {
    width: 1,
    height: 10,
    backgroundColor: '#2A344A',
  },
  routeTabDividerActive: {
    backgroundColor: '#38BDF8',
  },
  routeTabTime: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  routeTabTimeActive: {
    color: '#38BDF8',
  },
  routeTabCode: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  routeTabCodeActive: {
    color: '#FFFFFF',
  },

  // Hero Transit Pass Card
  heroPassCard: {
    backgroundColor: '#161B24',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#1E2538',
    marginTop: 8,
  },
  passTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lineBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  lineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  lineBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  transferBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fastestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(36, 199, 149, 0.15)',
    borderWidth: 1,
    borderColor: '#24C795',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  fastestTagText: {
    color: '#24C795',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  directTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  directTagText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  transferTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  transferTagText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '700',
  },
  walkBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  walkBadgePillText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },

  // Time & ETA
  timeCluster: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  durationBig: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  durationUnit: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  etaText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Subway Route Visualizer
  subwayTimelineBox: {
    backgroundColor: '#0E121A',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E2538',
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stationCol: {
    flex: 1,
  },
  stationRoleLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  stationName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 1,
  },
  walkPillInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  walkPillText: {
    color: '#38BDF8',
    fontSize: 10.5,
    fontWeight: '600',
  },
  transferBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  transferBadgePillText: {
    color: '#F59E0B',
    fontSize: 10,
    fontWeight: '600',
  },

  // Connector Track Line
  connectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    marginLeft: 3,
    gap: 12,
  },
  connectorLine: {
    width: 2,
    height: 28,
    borderRadius: 1,
  },
  legInfoCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  legLineName: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  accordionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  accordionToggleText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
  },
  stopsDropdown: {
    marginLeft: 15,
    marginBottom: 8,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#1E2538',
    gap: 4,
  },
  dropdownStopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  dropdownStopDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#64748B',
  },
  dropdownStopName: {
    fontSize: 11.5,
    color: '#94A3B8',
  },

  // Walk Only Mode
  walkOnlyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0E121A',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E2538',
    marginBottom: 12,
  },
  walkIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walkOnlyInfo: {
    flex: 1,
  },
  walkOnlyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  walkOnlyDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Pass Footer
  passFooterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  fareCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fareAmount: {
    fontSize: 19,
    fontWeight: '800',
    color: '#38BDF8',
  },
  fareTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1E2538',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  fareTypePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  fareTypeLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 14,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  detailsBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // Minimized Capsule Mode
  minimizedWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  minimizedContainer: {
    backgroundColor: '#12161E',
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#1E2538',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  minimizedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  miniLineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniLineBadgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  minimizedInfo: {
    flex: 1,
  },
  minimizedDest: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  minimizedSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  miniExpandBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#161B24',
    borderWidth: 1,
    borderColor: '#1E2538',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Empty State
  emptyCardBox: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  emptyIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#161B24',
    borderWidth: 1,
    borderColor: '#1E2538',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyRetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
  },
  emptyRetryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
