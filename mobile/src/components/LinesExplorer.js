import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Search, ChevronDown, ChevronUp, MapPin, Map as MapIcon, X } from 'lucide-react-native';
import { theme } from '../theme';
import { etusLines, allStopsDB } from '../data/db';

const CATEGORIES = [
  { id: 'all', label: 'Tümü' },
  { id: 'kampus', label: 'Kampüs & Fakülte' },
  { id: 'otogar', label: 'Otogar Hatları' },
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
      // Category filter
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

      // Text query filter
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
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Search size={16} color={theme.colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Hat numarası veya durak ara (1A, Otogar...)"
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

      {/* Filter Categories */}
      <View style={styles.categoriesRow}>
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catChip, isActive && styles.catChipActive]}
              onPress={() => setActiveCategory(cat.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.catText, isActive && styles.catTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Lines Counter Header */}
      <View style={styles.listHeader}>
        <Text style={styles.listCountText}>
          {filteredLines.length} ETUS Hattı Listeleniyor
        </Text>
      </View>

      {/* Lines List */}
      {filteredLines.map(line => {
        const isExpanded = expandedCode === line.code;
        const currentDirIdx = selectedDirectionIdx[line.code] || 0;
        const activeDir = line.directions?.[currentDirIdx] || line.directions?.[0];
        const stopsCount = activeDir?.stopIds?.length || 0;

        return (
          <View key={line.code} style={styles.lineCard}>
            {/* Header summary row */}
            <TouchableOpacity
              style={styles.lineHeader}
              onPress={() => setExpandedCode(isExpanded ? null : line.code)}
              activeOpacity={0.7}
            >
              <View style={[styles.badgeBox, { backgroundColor: line.color || theme.colors.primary }]}>
                <Text style={styles.badgeText}>{line.code}</Text>
              </View>

              <View style={styles.lineInfoCol}>
                <Text style={styles.lineTitle} numberOfLines={1}>
                  {activeDir?.headSign || `Hat ${line.code}`}
                </Text>
                <View style={styles.lineMetaRow}>
                  <Text style={styles.stopCountText}>{stopsCount} Durak</Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.directionLabel}>
                    {line.directions?.length > 1 ? `${line.directions.length} Yön Mevcut` : 'Tek Yön'}
                  </Text>
                </View>
              </View>

              <View style={styles.headerActions}>
                {/* Direct Map Preview Button */}
                {onSelectLineOnMap && (
                  <TouchableOpacity
                    style={styles.mapActionBtn}
                    onPress={() => onSelectLineOnMap(line, currentDirIdx)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MapIcon size={14} color={theme.colors.primary} />
                  </TouchableOpacity>
                )}

                <View style={styles.chevronBox}>
                  {isExpanded ? (
                    <ChevronUp size={18} color={theme.colors.textSecondary} />
                  ) : (
                    <ChevronDown size={18} color={theme.colors.textSecondary} />
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* Expanded Stops & Direction Switcher */}
            {isExpanded && (
              <View style={styles.expandedSection}>
                {/* Direction Switcher (if more than 1 direction) */}
                {line.directions?.length > 1 && (
                  <View style={styles.directionSwitcher}>
                    {line.directions.map((dir, dIdx) => {
                      const isDirSelected = currentDirIdx === dIdx;
                      return (
                        <TouchableOpacity
                          key={dIdx}
                          style={[styles.dirBtn, isDirSelected && styles.dirBtnSelected]}
                          onPress={() => toggleDirection(line.code, dIdx)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[styles.dirBtnText, isDirSelected && styles.dirBtnTextSelected]}
                            numberOfLines={1}
                          >
                            Yön {dIdx + 1}: {dir.headSign?.split(' - ')[0] || `Yön ${dIdx + 1}`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Map Action Banner */}
                <TouchableOpacity
                  style={styles.fullMapBanner}
                  onPress={() => onSelectLineOnMap(line, currentDirIdx)}
                  activeOpacity={0.8}
                >
                  <MapPin size={15} color="#FFFFFF" />
                  <Text style={styles.fullMapBannerText}>
                    Bu Hattı ve Durakları Haritada Göster
                  </Text>
                </TouchableOpacity>

                {/* Stops Timeline (Clean flat items) */}
                <View style={styles.stopsTimeline}>
                  <Text style={styles.stopsTimelineTitle}>Güzergah Durakları:</Text>
                  {activeDir?.stopIds?.map((stopId, sIdx) => {
                    const stop = allStopsDB[stopId];
                    const isFirst = sIdx === 0;
                    const isLast = sIdx === activeDir.stopIds.length - 1;

                    return (
                      <View key={`${stopId}_${sIdx}`} style={styles.stopRow}>
                        <View style={styles.timelineNode}>
                          <View
                            style={[
                              styles.timelineDot,
                              isFirst && styles.timelineDotStart,
                              isLast && styles.timelineDotEnd,
                              !isFirst && !isLast && { backgroundColor: line.color || theme.colors.primary }
                            ]}
                          />
                          {!isLast && <View style={styles.timelineSegment} />}
                        </View>
                        <Text
                          style={[
                            styles.stopLabel,
                            (isFirst || isLast) && styles.stopLabelImportant
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
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.textMain,
    fontWeight: '500',
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  catChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  catChipActive: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  catTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  listHeader: {
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  listCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    marginBottom: 10,
    overflow: 'hidden',
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  badgeBox: {
    width: 44,
    height: 38,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  lineInfoCol: {
    flex: 1,
  },
  lineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textMain,
    letterSpacing: -0.2,
  },
  lineMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  stopCountText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  dotSeparator: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  directionLabel: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedSection: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.hairline,
    backgroundColor: theme.colors.surfaceElevated,
    padding: 14,
  },
  directionSwitcher: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  dirBtn: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  dirBtnSelected: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primary,
  },
  dirBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  dirBtnTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  fullMapBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    borderRadius: theme.radius.sm,
    marginBottom: 14,
  },
  fullMapBannerText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  stopsTimeline: {
    paddingLeft: 4,
  },
  stopsTimelineTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 28,
  },
  timelineNode: {
    alignItems: 'center',
    width: 14,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timelineDotStart: {
    backgroundColor: theme.colors.success,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineDotEnd: {
    backgroundColor: theme.colors.danger,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineSegment: {
    width: 2,
    flex: 1,
    minHeight: 18,
    backgroundColor: theme.colors.hairline,
    marginVertical: 2,
  },
  stopLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    flex: 1,
    paddingBottom: 8,
  },
  stopLabelImportant: {
    color: theme.colors.textMain,
    fontWeight: '700',
  },
});
