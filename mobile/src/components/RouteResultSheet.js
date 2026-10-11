import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  LayoutAnimation,
  UIManager,
  Dimensions
} from 'react-native';
import {
  SlidersHorizontal,
  Clock,
  Repeat,
  Footprints,
  Bus,
  ChevronRight,
  ChevronDown,
  Navigation,
  Maximize2,
  RefreshCw,
  ArrowRight,
  MapPin,
  X
} from 'lucide-react-native';
import { calculateFare, formatFare } from '../data/fares';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const fmtDuration = (totalMinutes) => {
  if (!totalMinutes) return '0 dk';
  const m = Math.round(totalMinutes);
  if (m >= 60) {
    const hours = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${hours} sa ${rem} dk` : `${hours} sa`;
  }
  return `${m} dk`;
};

const fmtDist = (route) => {
  if (!route) return '';
  const km = route.totalDistanceKm || (route.isWalkOnly ? route.walkDistanceStart : (route.busTimeMins || 10) * 0.38) || 3.5;
  return `${Number(km).toFixed(1).replace('.', ',')} km`;
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
  const [filterType, setFilterType] = useState('fastest'); // 'fastest' | 'least_transfers'
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleMinimize = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsMinimized(prev => !prev);
  };

  // Map routes with their original index so selection stays accurate
  const indexedRoutes = useMemo(() => {
    if (!routes || !Array.isArray(routes)) return [];
    return routes.map((r, idx) => ({ ...r, _originalIdx: idx }));
  }, [routes]);

  // Sort routes according to filter
  const sortedRoutes = useMemo(() => {
    const list = [...indexedRoutes];
    if (filterType === 'fastest') {
      return list.sort((a, b) => (a.totalTime || 0) - (b.totalTime || 0));
    }
    if (filterType === 'least_transfers') {
      return list.sort((a, b) => {
        const transA = a.isWalkOnly ? 0 : a.isTransfer ? 1 : 0;
        const transB = b.isWalkOnly ? 0 : b.isTransfer ? 1 : 0;
        if (transA !== transB) return transA - transB;
        return (a.totalTime || 0) - (b.totalTime || 0);
      });
    }
    return list;
  }, [indexedRoutes, filterType]);

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
              ? `"${toLocation.name}" için mevcut ETUS güzergahlarında uygun sefer bulunamadı.`
              : 'Seçilen noktalar arasında rota tespit edilemedi.'}
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
  const fare = calculateFare(fareType, currentRoute?.isTransfer);

  // 2. MINIMIZED FLOATING CAPSULE VIEW (For full map inspection)
  if (isMinimized) {
    return (
      <View style={styles.minimizedWrapper}>
        <TouchableOpacity
          style={styles.minimizedContainer}
          onPress={toggleMinimize}
          activeOpacity={0.85}
        >
          <View style={styles.minimizedRow}>
            {/* Active route badge */}
            <View style={[styles.miniBadge, { backgroundColor: currentRoute.color || '#3B82F6' }]}>
              {currentRoute.isWalkOnly ? (
                <Footprints size={13} color="#FFFFFF" />
              ) : (
                <Bus size={13} color="#FFFFFF" />
              )}
              <Text style={styles.miniBadgeText}>
                {currentRoute.isWalkOnly
                  ? 'Yürüyüş'
                  : currentRoute.isTransfer
                    ? `${currentRoute.line1}+${currentRoute.line2}`
                    : currentRoute.name || currentRoute.lineCode}
              </Text>
            </View>

            <View style={styles.minimizedInfo}>
              <Text style={styles.minimizedDest} numberOfLines={1}>
                {toLocation?.name || 'Seçilen Hedef'}
              </Text>
              <Text style={styles.minimizedSub}>
                {fmtDuration(currentRoute.totalTime)} • {fmtDist(currentRoute)} • {formatFare(fare)}
              </Text>
            </View>

            <View style={styles.miniExpandBtn}>
              <Maximize2 size={16} color="#38BDF8" />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. FULL "TÜM ROTALAR" LIST SHEET (Matches Reference Screenshot)
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

      {/* Header: "Tüm Rotalar" & Filter Pills */}
      <View style={styles.sheetHeader}>
        <View style={styles.headerTitleCol}>
          <View style={styles.headerTitleRow}>
            <SlidersHorizontal size={17} color="#94A3B8" style={{ marginRight: 7 }} />
            <Text style={styles.headerMainTitle}>Tüm Rotalar</Text>
          </View>
          <Text style={styles.headerSubtitle}>
            Konumuna giden {routes.length} farklı seçenek
          </Text>
        </View>

        {/* Filter Pills: En hızlı / En az aktarma */}
        <View style={styles.filterPillsGroup}>
          <TouchableOpacity
            style={[styles.filterPill, filterType === 'fastest' && styles.filterPillActive]}
            onPress={() => setFilterType('fastest')}
            activeOpacity={0.75}
          >
            <Clock size={12} color={filterType === 'fastest' ? '#38BDF8' : '#94A3B8'} />
            <Text style={[styles.filterPillText, filterType === 'fastest' && styles.filterPillTextActive]}>
              En hızlı
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filterType === 'least_transfers' && styles.filterPillActive]}
            onPress={() => setFilterType('least_transfers')}
            activeOpacity={0.75}
          >
            <Repeat size={12} color={filterType === 'least_transfers' ? '#38BDF8' : '#94A3B8'} />
            <Text style={[styles.filterPillText, filterType === 'least_transfers' && styles.filterPillTextActive]}>
              En az aktarma
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Vertical List of Route Options */}
      <ScrollView
        style={styles.routesScroll}
        contentContainerStyle={styles.routesScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedRoutes.map((r) => {
          const isSelected = selectedIdx === r._originalIdx;
          const hasStartWalk = !r.isWalkOnly && ((r.walkDistanceStart || 0) > 0.04);
          const hasEndWalk = !r.isWalkOnly && ((r.walkDistanceEnd || 0) > 0.04);

          return (
            <TouchableOpacity
              key={r.id || r._originalIdx}
              style={[styles.routeCard, isSelected && styles.routeCardSelected]}
              onPress={() => onSelectIdx(r._originalIdx)}
              activeOpacity={0.85}
            >
              <View style={styles.cardMainRow}>
                {/* Radio Button Indicator */}
                <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>

                {/* Left/Center Content: Badges Flow & Subtitle */}
                <View style={styles.cardCenterCol}>
                  {/* Journey Badges Flow */}
                  <View style={styles.journeyBadgesRow}>
                    {r.isWalkOnly ? (
                      <View style={styles.walkHeaderRow}>
                        <Footprints size={18} color="#38BDF8" style={{ marginRight: 6 }} />
                        <Text style={styles.walkTitle}>Yürüyüş</Text>
                      </View>
                    ) : (
                      <>
                        {hasStartWalk && (
                          <View style={styles.flowWalkInline}>
                            <Footprints size={12} color="#38BDF8" />
                          </View>
                        )}
                        {hasStartWalk && <ArrowRight size={10} color="#64748B" />}

                        {r.isTransfer ? (
                          <View style={styles.flowTransferRow}>
                            <View style={[styles.cardLineBadge, { backgroundColor: r.color || '#3B82F6' }]}>
                              <Bus size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
                              <Text style={styles.cardLineBadgeText}>{r.line1}</Text>
                            </View>
                            <ArrowRight size={11} color="#64748B" />
                            <View style={[styles.cardLineBadge, { backgroundColor: r.color2 || '#8B5CF6' }]}>
                              <Bus size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
                              <Text style={styles.cardLineBadgeText}>{r.line2}</Text>
                            </View>
                          </View>
                        ) : (
                          <View style={[styles.cardLineBadge, { backgroundColor: r.color || '#3B82F6' }]}>
                            <Bus size={11} color="#FFFFFF" style={{ marginRight: 3 }} />
                            <Text style={styles.cardLineBadgeText}>{r.name || r.lineCode}</Text>
                          </View>
                        )}

                        {hasEndWalk && <ArrowRight size={10} color="#64748B" />}
                        {hasEndWalk && (
                          <View style={styles.flowWalkInline}>
                            <Footprints size={12} color="#38BDF8" />
                          </View>
                        )}
                      </>
                    )}
                  </View>

                  {/* Subtitle / Transfer Meta */}
                  <Text style={styles.cardSubtitle} numberOfLines={1}>
                    {r.isWalkOnly
                      ? 'Direkt rota'
                      : r.isTransfer
                        ? `1 aktarma • ${fmtDuration(r.totalTime)}`
                        : `Aktarmasız • ${fmtDuration(r.totalTime)}`}
                  </Text>
                </View>

                {/* Right Column: Time & Distance */}
                <View style={styles.cardRightCol}>
                  <View style={styles.cardMetaCol}>
                    <Text style={styles.cardDurationText}>{fmtDuration(r.totalTime)}</Text>
                    <Text style={styles.cardDistanceText}>{fmtDist(r)}</Text>
                  </View>
                  <ChevronRight size={16} color={isSelected ? '#38BDF8' : '#64748B'} style={{ marginLeft: 6 }} />
                </View>
              </View>

              {/* If Selected: Sleek Button to open Turn-by-Turn Steps */}
              {isSelected && (
                <View style={styles.selectedActionDividerRow}>
                  <TouchableOpacity
                    style={styles.openDetailsBtn}
                    onPress={() => onOpenDetails && onOpenDetails(r)}
                    activeOpacity={0.75}
                  >
                    <Navigation size={13} color="#38BDF8" />
                    <Text style={styles.openDetailsBtnText}>Detaylı Adımları Gör</Text>
                    <ChevronRight size={13} color="#38BDF8" />
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Main Sheet Container
  sheetContainer: {
    backgroundColor: '#0D111A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: '#1E2538',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 16,
    maxHeight: Math.min(SCREEN_HEIGHT * 0.58, 520),
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 20,
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

  // Sheet Header
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 6,
  },
  headerTitleCol: {
    flex: 1,
    paddingRight: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerMainTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  filterPillsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#161B24',
    borderWidth: 1,
    borderColor: '#1E2538',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
  },
  filterPillActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  filterPillText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },

  // Routes Scroll
  routesScroll: {
    flexGrow: 0,
  },
  routesScrollContent: {
    paddingBottom: 8,
  },

  // Route Item Card
  routeCard: {
    backgroundColor: '#121620',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E2538',
    padding: 13,
    marginBottom: 9,
  },
  routeCardSelected: {
    backgroundColor: '#0E1726',
    borderColor: '#0284C7',
    borderWidth: 1.5,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Radio Indicator
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#38BDF8',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#38BDF8',
  },

  // Card Center
  cardCenterCol: {
    flex: 1,
    marginHorizontal: 12,
  },
  journeyBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 4,
  },
  walkHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walkTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  flowWalkInline: {
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 6,
  },
  cardLineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
  },
  cardLineBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12.5,
  },
  flowTransferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // Card Right
  cardRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardMetaCol: {
    alignItems: 'flex-end',
  },
  cardDurationText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardDistanceText: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },

  // Selected Action
  selectedActionDividerRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(56, 189, 248, 0.2)',
  },
  openDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  openDetailsBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#38BDF8',
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
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12.5,
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
