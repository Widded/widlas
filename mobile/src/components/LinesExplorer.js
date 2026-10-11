import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet
} from 'react-native';
import {
  Search,
  Route,
  MapPin,
  Map as MapIcon,
  X,
  Compass,
  ArrowRight,
  Layers,
  Activity,
  SlidersHorizontal,
  ChevronRight,
  CheckCircle2,
  Navigation
} from 'lucide-react-native';
import { etusLines, allStopsDB } from '../data/db';

const CORRIDORS = [
  { id: 'all', title: 'Tüm Şebeke', subtitle: 'Tüm ETUS hatları' },
  { id: 'kampus', title: 'Kampüs Aksı', subtitle: 'Balkan & Ayşekadın hatları' },
  { id: 'otogar', title: 'Otogar Ekspres', subtitle: 'Terminal bağlantıları' },
  { id: 'merkez', title: 'Tarihi Merkez', subtitle: 'Çarşı & Saraçlar hatları' },
];

export default function LinesExplorer({ onSelectLineOnMap }) {
  const [filterText, setFilterText] = useState('');
  const [selectedCorridor, setSelectedCorridor] = useState('all');
  const [activeLineCode, setActiveLineCode] = useState('1A');
  const [selectedDirIdx, setSelectedDirIdx] = useState(0);
  const [showAllStations, setShowAllStations] = useState(false);

  // Parse all lines sorted numerically
  const allLines = useMemo(() => {
    return Object.values(etusLines).sort((a, b) => {
      const getNum = (c) => parseInt(c) || 0;
      return getNum(a.code) - getNum(b.code) || a.code.localeCompare(b.code);
    });
  }, []);

  // Filter lines by corridor and search query
  const filteredLines = useMemo(() => {
    return allLines.filter(line => {
      if (selectedCorridor === 'kampus') {
        const hasCampus = line.directions.some(d =>
          (d.headSign || '').toLowerCase().includes('fakülte') ||
          (d.headSign || '').toLowerCase().includes('üniversite') ||
          (d.headSign || '').toLowerCase().includes('balkan')
        );
        if (!hasCampus) return false;
      } else if (selectedCorridor === 'otogar') {
        const hasOtogar = line.directions.some(d =>
          (d.headSign || '').toLowerCase().includes('otogar')
        );
        if (!hasOtogar) return false;
      } else if (selectedCorridor === 'merkez') {
        const hasMerkez = line.directions.some(d =>
          (d.headSign || '').toLowerCase().includes('çarşı') ||
          (d.headSign || '').toLowerCase().includes('merkez') ||
          (d.headSign || '').toLowerCase().includes('saraçlar')
        );
        if (!hasMerkez) return false;
      }

      if (!filterText.trim()) return true;
      const q = filterText.toLowerCase();
      return (
        line.code.toLowerCase().includes(q) ||
        line.directions.some(d => (d.headSign || '').toLowerCase().includes(q))
      );
    });
  }, [allLines, filterText, selectedCorridor]);

  // Active line currently highlighted on the stage
  const activeLine = useMemo(() => {
    const found = allLines.find(l => l.code === activeLineCode);
    return found || filteredLines[0] || allLines[0];
  }, [allLines, filteredLines, activeLineCode]);

  const activeDirection = activeLine?.directions?.[selectedDirIdx] || activeLine?.directions?.[0];
  const stopIds = activeDirection?.stopIds || [];
  const totalStopsCount = stopIds.length;

  // Key Terminus and Interchange points
  const firstStop = stopIds[0] ? allStopsDB[stopIds[0]] : null;
  const lastStop = stopIds[stopIds.length - 1] ? allStopsDB[stopIds[stopIds.length - 1]] : null;
  const midStop = stopIds[Math.floor(stopIds.length / 2)] ? allStopsDB[stopIds[Math.floor(stopIds.length / 2)]] : null;

  // Stations to render (either all or compact summary)
  const displayedStopIds = showAllStations ? stopIds : stopIds.slice(0, 8);

  const handleSelectLine = (code) => {
    setActiveLineCode(code);
    setSelectedDirIdx(0);
    setShowAllStations(false);
  };

  return (
    <View style={styles.studioContainer}>
      {/* 1. Network Intelligence Header */}
      <View style={styles.heroPanel}>
        <View style={styles.heroHeaderRow}>
          <View style={styles.pulseIndicator}>
            <View style={styles.pulseDot} />
            <Text style={styles.pulseLabel}>CANLI ŞEBEKE ANALİZİ</Text>
          </View>
          <Text style={styles.networkBadge}>ETUS 2026</Text>
        </View>

        <Text style={styles.heroTitle}>Toplu Taşıma Koridorları</Text>
        <Text style={styles.heroSubtitle}>
          Edirne genelinde 23 aktif hat, 745 durak ve 4 stratejik transfer aksı
        </Text>

        {/* Live Network Metric Cards */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricVal}>{allLines.length}</Text>
            <Text style={styles.metricLabel}>Şehir İçi Hat</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: '#C4B5FD' }]}>745+</Text>
            <Text style={styles.metricLabel}>Kayıtlı Durak</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: '#A78BFA' }]}>4</Text>
            <Text style={styles.metricLabel}>Ana Koridor</Text>
          </View>
        </View>
      </View>

      {/* 2. Corridor Filter Switcher */}
      <View style={styles.corridorSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.corridorScroll}
        >
          {CORRIDORS.map(cor => {
            const isActive = selectedCorridor === cor.id;
            return (
              <TouchableOpacity
                key={cor.id}
                style={[styles.corridorTab, isActive && styles.corridorTabActive]}
                onPress={() => setSelectedCorridor(cor.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.corridorTitle, isActive && styles.corridorTitleActive]}>
                  {cor.title}
                </Text>
                <Text style={styles.corridorSubtitle}>{cor.subtitle}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Search Field Bar */}
      <View style={styles.searchBarContainer}>
        <Search size={16} color="#A78BFA" />
        <TextInput
          style={styles.searchTextInput}
          placeholder="Hat no veya güzergah terminali ara (1A, Otogar...)"
          placeholderTextColor="#64748B"
          value={filterText}
          onChangeText={setFilterText}
          autoCorrect={false}
        />
        {filterText.length > 0 && (
          <TouchableOpacity onPress={() => setFilterText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={15} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* 4. Horizontal Line Selector Rail */}
      <View style={styles.selectorRailSection}>
        <Text style={styles.sectionHeaderTitle}>HIZLI HAT SEÇİCİ</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.selectorRailScroll}
        >
          {filteredLines.map(l => {
            const isCurrent = l.code === activeLine?.code;
            return (
              <TouchableOpacity
                key={l.code}
                style={[styles.linePillBtn, isCurrent && styles.linePillBtnActive]}
                onPress={() => handleSelectLine(l.code)}
                activeOpacity={0.7}
              >
                <View style={[styles.linePillDot, { backgroundColor: l.color || '#8B5CF6' }]} />
                <Text style={[styles.linePillText, isCurrent && styles.linePillTextActive]}>
                  {l.code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 5. Featured Line Interactive Stage */}
      {activeLine && (
        <View style={styles.showcaseStage}>
          {/* Stage Top Bar */}
          <View style={styles.stageHeroRow}>
            <View style={styles.stageBadgeCol}>
              <View style={[styles.largeBadge, { backgroundColor: activeLine.color || '#7C3AED' }]}>
                <Text style={styles.largeBadgeText}>{activeLine.code}</Text>
              </View>
              <View style={styles.verifiedDot}>
                <CheckCircle2 size={12} color="#C4B5FD" />
                <Text style={styles.verifiedText}>Aktif Hat</Text>
              </View>
            </View>

            <View style={styles.stageInfoCol}>
              <Text style={styles.stageHeadsign} numberOfLines={2}>
                {activeDirection?.headSign || `Hat ${activeLine.code}`}
              </Text>
              <Text style={styles.stageMeta}>
                Toplam {totalStopsCount} Durak • {activeLine.directions?.length || 1} Yön
              </Text>
            </View>
          </View>

          {/* Direction Switcher Tabs */}
          {activeLine.directions?.length > 1 && (
            <View style={styles.dirSegmentContainer}>
              {activeLine.directions.map((dir, dIdx) => {
                const isSelected = selectedDirIdx === dIdx;
                return (
                  <TouchableOpacity
                    key={dIdx}
                    style={[styles.dirSegmentTab, isSelected && styles.dirSegmentTabActive]}
                    onPress={() => setSelectedDirIdx(dIdx)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[styles.dirSegmentText, isSelected && styles.dirSegmentTextActive]}
                      numberOfLines={1}
                    >
                      Yön {dIdx + 1}: {dir.headSign?.split(' - ')[0] || `Yön ${dIdx + 1}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Terminal Station Waypoint Ribbon */}
          <View style={styles.waypointRibbon}>
            <View style={styles.ribbonItem}>
              <View style={[styles.terminalIndicator, { backgroundColor: '#10B981' }]} />
              <View style={styles.ribbonTextCol}>
                <Text style={styles.ribbonRole}>BAŞLANGIÇ</Text>
                <Text style={styles.ribbonName} numberOfLines={1}>
                  {firstStop?.name || 'İlk İstasyon'}
                </Text>
              </View>
            </View>

            <View style={styles.ribbonDividerRow}>
              <View style={styles.ribbonDividerLine} />
              <ArrowRight size={13} color="#A78BFA" />
              <View style={styles.ribbonDividerLine} />
            </View>

            <View style={styles.ribbonItem}>
              <View style={[styles.terminalIndicator, { backgroundColor: '#EF4444' }]} />
              <View style={styles.ribbonTextCol}>
                <Text style={styles.ribbonRole}>VARIŞ</Text>
                <Text style={styles.ribbonName} numberOfLines={1}>
                  {lastStop?.name || 'Son İstasyon'}
                </Text>
              </View>
            </View>
          </View>

          {/* Primary Action Button: View on Map */}
          {onSelectLineOnMap && (
            <TouchableOpacity
              style={styles.mapActionTrigger}
              onPress={() => onSelectLineOnMap(activeLine, selectedDirIdx)}
              activeOpacity={0.85}
            >
              <Navigation size={16} color="#FFFFFF" />
              <Text style={styles.mapActionTriggerText}>
                {activeLine.code} Hattını Haritada Canlı Gör
              </Text>
            </TouchableOpacity>
          )}

          {/* Stations Runway Sequence */}
          <View style={styles.runwaySection}>
            <View style={styles.runwayHeader}>
              <Text style={styles.runwayHeaderTitle}>
                Güzergah Durak Listesi ({displayedStopIds.length}/{totalStopsCount})
              </Text>
              {totalStopsCount > 8 && (
                <TouchableOpacity
                  onPress={() => setShowAllStations(!showAllStations)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text style={styles.runwayToggleText}>
                    {showAllStations ? 'Daha Az Göster' : 'Tümünü Göster'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.stationListGrid}>
              {displayedStopIds.map((stopId, sIdx) => {
                const stop = allStopsDB[stopId];
                const isFirst = sIdx === 0;
                const isLast = sIdx === totalStopsCount - 1;

                return (
                  <View key={`${stopId}_${sIdx}`} style={styles.stationItem}>
                    <View style={styles.stationIndexBox}>
                      <Text style={styles.stationIndexNum}>{sIdx + 1}</Text>
                    </View>
                    <View style={styles.stationDotIndicator}>
                      <View
                        style={[
                          styles.dotCore,
                          isFirst && styles.dotStart,
                          isLast && styles.dotEnd,
                          !isFirst && !isLast && { backgroundColor: activeLine.color || '#8B5CF6' }
                        ]}
                      />
                    </View>
                    <Text
                      style={[
                        styles.stationNameLabel,
                        (isFirst || isLast) && styles.stationNameLabelHighlight
                      ]}
                      numberOfLines={1}
                    >
                      {stop?.name || `Durak #${stopId}`}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      )}

      {/* 6. Corridor Line Cards Matrix */}
      <View style={styles.matrixSection}>
        <Text style={styles.sectionHeaderTitle}>
          TÜM HATLAR KATALOĞU ({filteredLines.length})
        </Text>

        <View style={styles.linesMatrixGrid}>
          {filteredLines.map(l => {
            const isSelected = l.code === activeLine?.code;
            const dir1 = l.directions?.[0];
            const count = dir1?.stopIds?.length || 0;

            return (
              <TouchableOpacity
                key={l.code}
                style={[styles.matrixCard, isSelected && styles.matrixCardSelected]}
                onPress={() => handleSelectLine(l.code)}
                activeOpacity={0.75}
              >
                <View style={styles.matrixCardTop}>
                  <View style={[styles.matrixBadge, { backgroundColor: l.color || '#7C3AED' }]}>
                    <Text style={styles.matrixBadgeText}>{l.code}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.quickMapMiniBtn}
                    onPress={() => onSelectLineOnMap && onSelectLineOnMap(l, 0)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MapIcon size={13} color="#C4B5FD" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.matrixLineName} numberOfLines={2}>
                  {dir1?.headSign || `Hat ${l.code}`}
                </Text>

                <View style={styles.matrixFooter}>
                  <Text style={styles.matrixStopsCount}>{count} Durak</Text>
                  <ChevronRight size={13} color="#64748B" />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  studioContainer: {
    paddingBottom: 40,
    backgroundColor: '#0B0E14',
  },
  heroPanel: {
    backgroundColor: '#121622',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    marginBottom: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pulseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  pulseLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
    letterSpacing: 0.8,
  },
  networkBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#C4B5FD',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 3,
    lineHeight: 17,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#181F30',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  corridorSection: {
    marginBottom: 12,
  },
  corridorScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  corridorTab: {
    backgroundColor: '#121622',
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  corridorTabActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    borderColor: '#8B5CF6',
  },
  corridorTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
  },
  corridorTitleActive: {
    color: '#C4B5FD',
  },
  corridorSubtitle: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#121622',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    paddingHorizontal: 14,
    height: 44,
    gap: 10,
    marginBottom: 14,
  },
  searchTextInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  selectorRailSection: {
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  selectorRailScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  linePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#121622',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  linePillBtnActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
    borderColor: '#A78BFA',
  },
  linePillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  linePillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94A3B8',
  },
  linePillTextActive: {
    color: '#FFFFFF',
  },
  showcaseStage: {
    backgroundColor: '#121622',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    marginBottom: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  stageHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  stageBadgeCol: {
    alignItems: 'center',
    gap: 4,
  },
  largeBadge: {
    width: 52,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  largeBadgeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  verifiedDot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  verifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#C4B5FD',
  },
  stageInfoCol: {
    flex: 1,
  },
  stageHeadsign: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    lineHeight: 22,
  },
  stageMeta: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '600',
  },
  dirSegmentContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dirSegmentTab: {
    flex: 1,
    backgroundColor: '#181F30',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  dirSegmentTabActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.25)',
    borderColor: '#8B5CF6',
  },
  dirSegmentText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  dirSegmentTextActive: {
    color: '#C4B5FD',
    fontWeight: '800',
  },
  waypointRibbon: {
    backgroundColor: '#181F30',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  ribbonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  terminalIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ribbonTextCol: {
    flex: 1,
  },
  ribbonRole: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  ribbonName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ribbonDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 8,
    paddingLeft: 3,
  },
  ribbonDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  mapActionTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C3AED',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  mapActionTriggerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  runwaySection: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 12,
  },
  runwayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  runwayHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  runwayToggleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C4B5FD',
  },
  stationListGrid: {
    gap: 6,
  },
  stationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
  },
  stationIndexBox: {
    width: 20,
    alignItems: 'center',
  },
  stationIndexNum: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
  stationDotIndicator: {
    width: 12,
    alignItems: 'center',
  },
  dotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotStart: {
    backgroundColor: '#10B981',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotEnd: {
    backgroundColor: '#EF4444',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stationNameLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    flex: 1,
  },
  stationNameLabelHighlight: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  matrixSection: {
    marginTop: 4,
  },
  linesMatrixGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  matrixCard: {
    width: '48%',
    backgroundColor: '#121622',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'space-between',
    minHeight: 100,
  },
  matrixCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#181F30',
  },
  matrixCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  matrixBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  matrixBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  quickMapMiniBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  matrixLineName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 16,
    flex: 1,
    marginBottom: 6,
  },
  matrixFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.04)',
    paddingTop: 6,
  },
  matrixStopsCount: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
  },
});
