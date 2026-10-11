import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Search, ChevronDown, ChevronUp, MapPin, Map as MapIcon, X, Route } from 'lucide-react-native';
import { theme } from '../theme';
import { etusLines, allStopsDB } from '../data/db';

const CATEGORIES = [
  { id: 'all', label: 'Tümü' },
  { id: 'kampus', label: 'Kampüs & Fakülte' },
  { id: 'otogar', label: 'Otogar' },
  { id: 'merkez', label: 'Çarşı & Merkez' },
];

export default function LinesExplorer({ onSelectLineOnMap }) {
  const [filterText, setFilterText] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedCode, setExpandedCode] = useState(null);
  const [selectedDirectionIdx, setSelectedDirectionIdx] = useState({});

  const allLines = useMemo(() => {
    return Object.values(etusLines).sort((a, b) => {
      const getNum = (c) => parseInt(c) || 0;
      return getNum(a.code) - getNum(b.code) || a.code.localeCompare(b.code);
    });
  }, []);

  const filteredLines = useMemo(() => {
    return allLines.filter(line => {
      if (activeCategory === 'kampus') {
        const hasCampus = line.directions.some(d =>
          (d.headSign || '').toLowerCase().includes('fakülte') ||
          (d.headSign || '').toLowerCase().includes('üniversite') ||
          (d.headSign || '').toLowerCase().includes('balkan')
        );
        if (!hasCampus) return false;
      } else if (activeCategory === 'otogar') {
        const hasOtogar = line.directions.some(d =>
          (d.headSign || '').toLowerCase().includes('otogar')
        );
        if (!hasOtogar) return false;
      } else if (activeCategory === 'merkez') {
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
  }, [allLines, filterText, activeCategory]);

  const toggleDirection = (lineCode, dirIdx) => {
    setSelectedDirectionIdx(prev => ({
      ...prev,
      [lineCode]: dirIdx
    }));
  };

  return (
    <View style={styles.container}>
      {/* Search Bar Capsule */}
      <View style={styles.searchBar}>
        <Search size={16} color={theme.colors.primaryGlow} />
        <TextInput
          style={styles.searchInput}
          placeholder="Hat no veya güzergah ara (1A, Otogar...)"
          placeholderTextColor={theme.colors.textTertiary}
          value={filterText}
          onChangeText={setFilterText}
          autoCorrect={false}
        />
        {filterText.length > 0 && (
          <TouchableOpacity onPress={() => setFilterText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <X size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills */}
      <View style={styles.categoriesRow}>
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catPill, isActive && styles.catPillActive]}
              onPress={() => setActiveCategory(cat.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* List Header */}
      <View style={styles.listHeaderRow}>
        <Text style={styles.listHeaderText}>
          ETUS Hat Rehberi ({filteredLines.length} Hat)
        </Text>
      </View>

      {/* Lines Grid Cards */}
      {filteredLines.map(line => {
        const isExpanded = expandedCode === line.code;
        const currentDirIdx = selectedDirectionIdx[line.code] || 0;
        const activeDir = line.directions?.[currentDirIdx] || line.directions?.[0];
        const stopsCount = activeDir?.stopIds?.length || 0;

        return (
          <View key={line.code} style={styles.lineCard}>
            {/* Top Line Card Row */}
            <View style={styles.lineTopRow}>
              {/* Badge */}
              <View style={[styles.badgeBubble, { backgroundColor: line.color || theme.colors.primary }]}>
                <Text style={styles.badgeText}>{line.code}</Text>
              </View>

              {/* Line Headsign / Route */}
              <View style={styles.lineInfoCol}>
                <Text style={styles.lineTitle} numberOfLines={1}>
                  {activeDir?.headSign || `Hat ${line.code}`}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{stopsCount} Durak</Text>
                  <Text style={styles.metaBullet}>•</Text>
                  <Text style={styles.metaText}>
                    {line.directions?.length > 1 ? `${line.directions.length} Yön` : 'Tek Yön'}
                  </Text>
                </View>
              </View>

              {/* Direct Map Preview Icon Button */}
              {onSelectLineOnMap && (
                <TouchableOpacity
                  style={styles.mapCircleAction}
                  onPress={() => onSelectLineOnMap(line, currentDirIdx)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MapIcon size={16} color={theme.colors.primaryGlow} />
                </TouchableOpacity>
              )}
            </View>

            {/* Expand / Collapse Button Bar */}
            <TouchableOpacity
              style={styles.expandToggleBar}
              onPress={() => setExpandedCode(isExpanded ? null : line.code)}
              activeOpacity={0.7}
            >
              <Text style={styles.expandToggleText}>
                {isExpanded ? 'Durak Listesini Gizle' : 'Durakları ve Güzergahı Gör'}
              </Text>
              {isExpanded ? (
                <ChevronUp size={16} color={theme.colors.textSecondary} />
              ) : (
                <ChevronDown size={16} color={theme.colors.textSecondary} />
              )}
            </TouchableOpacity>

            {/* Expanded Content */}
            {isExpanded && (
              <View style={styles.expandedContent}>
                {/* Direction Switcher */}
                {line.directions?.length > 1 && (
                  <View style={styles.directionSegmentRow}>
                    {line.directions.map((dir, dIdx) => {
                      const isDirSelected = currentDirIdx === dIdx;
                      return (
                        <TouchableOpacity
                          key={dIdx}
                          style={[styles.dirPill, isDirSelected && styles.dirPillActive]}
                          onPress={() => toggleDirection(line.code, dIdx)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[styles.dirPillText, isDirSelected && styles.dirPillTextActive]}
                            numberOfLines={1}
                          >
                            Yön {dIdx + 1}: {dir.headSign?.split(' - ')[0] || `Yön ${dIdx + 1}`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Map Preview Banner */}
                <TouchableOpacity
                  style={styles.mapBannerBtn}
                  onPress={() => onSelectLineOnMap(line, currentDirIdx)}
                  activeOpacity={0.8}
                >
                  <MapPin size={15} color="#FFFFFF" />
                  <Text style={styles.mapBannerBtnText}>Bu Hattı Haritada Çiz ve Takip Et</Text>
                </TouchableOpacity>

                {/* Stops Timeline */}
                <View style={styles.stopsTimelineBox}>
                  {activeDir?.stopIds?.map((stopId, sIdx) => {
                    const stop = allStopsDB[stopId];
                    const isFirst = sIdx === 0;
                    const isLast = sIdx === activeDir.stopIds.length - 1;

                    return (
                      <View key={`${stopId}_${sIdx}`} style={styles.stationRow}>
                        <View style={styles.stationRailCol}>
                          <View
                            style={[
                              styles.stationDot,
                              isFirst && styles.stationDotStart,
                              isLast && styles.stationDotEnd,
                              !isFirst && !isLast && { backgroundColor: line.color || theme.colors.primary }
                            ]}
                          />
                          {!isLast && <View style={styles.stationRailLine} />}
                        </View>
                        <Text
                          style={[
                            styles.stationName,
                            (isFirst || isLast) && styles.stationNameTerminus
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
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 28,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textMain,
    fontWeight: '600',
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  catPill: {
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  catPillActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primaryGlow,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  catPillTextActive: {
    color: theme.colors.primaryGlow,
    fontWeight: '800',
  },
  listHeaderRow: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  listHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  lineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  lineTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  badgeBubble: {
    width: 44,
    height: 40,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  lineInfoCol: {
    flex: 1,
  },
  lineTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textMain,
    letterSpacing: -0.3,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  metaText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  metaBullet: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  mapCircleAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandToggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
    backgroundColor: theme.colors.surfaceElevated,
  },
  expandToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
    backgroundColor: theme.colors.bgSecondary,
    padding: 14,
  },
  directionSegmentRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dirPill: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  dirPillActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primaryGlow,
  },
  dirPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  dirPillTextActive: {
    color: theme.colors.primaryGlow,
    fontWeight: '800',
  },
  mapBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    marginBottom: 14,
  },
  mapBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  stopsTimelineBox: {
    paddingLeft: 4,
  },
  stationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 28,
  },
  stationRailCol: {
    alignItems: 'center',
    width: 14,
  },
  stationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stationDotStart: {
    backgroundColor: theme.colors.success,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stationDotEnd: {
    backgroundColor: theme.colors.danger,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stationRailLine: {
    width: 2,
    flex: 1,
    minHeight: 18,
    backgroundColor: theme.colors.hairline,
    marginVertical: 2,
  },
  stationName: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    flex: 1,
    paddingBottom: 8,
    fontWeight: '500',
  },
  stationNameTerminus: {
    color: theme.colors.textMain,
    fontWeight: '800',
  },
});
