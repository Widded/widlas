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
  X,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Navigation
} from 'lucide-react-native';
import { theme } from '../theme';
import { etusLines, allStopsDB } from '../data/db';

const CORRIDORS = [
  { id: 'all', title: 'Tüm Hatlar' },
  { id: 'kampus', title: 'Kampüs / Üniversite' },
  { id: 'otogar', title: 'Otogar' },
  { id: 'merkez', title: 'Çarşı / Merkez' },
];

export default function LinesExplorer({ onSelectLine, onSelectLineOnMap, onClose }) {
  const [filterText, setFilterText] = useState('');
  const [selectedCorridor, setSelectedCorridor] = useState('all');
  const [expandedLineCode, setExpandedLineCode] = useState('1A');
  const [selectedDirIdx, setSelectedDirIdx] = useState(0);
  const [showAllStops, setShowAllStops] = useState(false);

  const handleSelectOnMap = onSelectLine || onSelectLineOnMap;

  // Sorted numerically
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

  const toggleLine = (code) => {
    if (expandedLineCode === code) {
      setExpandedLineCode(null);
    } else {
      setExpandedLineCode(code);
      setSelectedDirIdx(0);
      setShowAllStops(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>ETUS Hatları</Text>
          <Text style={styles.headerSubtitle}>
            {allLines.length} aktif hat • Edirne Toplu Taşıma
          </Text>
        </View>

        {onClose && (
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={16} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Bar Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={15} color={theme.colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Hat kodu veya güzergah ara (1A, Otogar...)"
            placeholderTextColor={theme.colors.textMuted}
            value={filterText}
            onChangeText={setFilterText}
            autoCorrect={false}
          />
          {filterText.length > 0 && (
            <TouchableOpacity onPress={() => setFilterText('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={14} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Corridor Filter Chips */}
      <View style={styles.corridorContainer}>
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
                style={[styles.corridorChip, isActive && styles.corridorChipActive]}
                onPress={() => setSelectedCorridor(cor.id)}
                activeOpacity={0.7}
              >
                <Text style={[styles.corridorChipText, isActive && styles.corridorChipTextActive]}>
                  {cor.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Lines Stream List */}
      <ScrollView contentContainerStyle={styles.linesListContent} showsVerticalScrollIndicator={false}>
        {filteredLines.length === 0 ? (
          <View style={styles.emptyResultsBox}>
            <Text style={styles.emptyResultsTitle}>Sonuç Bulunamadı</Text>
            <Text style={styles.emptyResultsSub}>Arama kriterinize uygun ETUS hattı bulunamadı.</Text>
          </View>
        ) : (
          filteredLines.map(line => {
            const isExpanded = expandedLineCode === line.code;
            const currentDir = line.directions?.[selectedDirIdx] || line.directions?.[0];
            const stopIds = currentDir?.stopIds || [];
            const displayedStops = showAllStops ? stopIds : stopIds.slice(0, 6);

            return (
              <View key={line.code} style={styles.lineCardItem}>
                {/* Line Row Summary */}
                <TouchableOpacity
                  style={[styles.lineSummaryRow, isExpanded && styles.lineSummaryRowExpanded]}
                  onPress={() => toggleLine(line.code)}
                  activeOpacity={0.75}
                >
                  {/* Badge */}
                  <View style={[styles.lineBadgeBox, { backgroundColor: line.color || theme.colors.primary }]}>
                    <Text style={styles.lineBadgeText}>{line.code}</Text>
                  </View>

                  {/* Info */}
                  <View style={styles.lineInfoCol}>
                    <Text style={styles.lineHeadSign} numberOfLines={1}>
                      {line.directions?.[0]?.headSign || `Hat ${line.code}`}
                    </Text>
                    <Text style={styles.lineMeta}>
                      {line.directions?.length || 1} Yön • {line.directions?.[0]?.stopIds?.length || 0} Durak
                    </Text>
                  </View>

                  {/* Toggle Arrow */}
                  <View style={styles.expandChevronBox}>
                    {isExpanded ? (
                      <ChevronUp size={16} color={theme.colors.textSecondary} />
                    ) : (
                      <ChevronRight size={16} color={theme.colors.textMuted} />
                    )}
                  </View>
                </TouchableOpacity>

                {/* Expanded Details Section */}
                {isExpanded && (
                  <View style={styles.expandedDetailsSection}>
                    {/* Direction Switcher (if multiple directions) */}
                    {line.directions?.length > 1 && (
                      <View style={styles.dirSegmentRow}>
                        {line.directions.map((dir, dIdx) => {
                          const isDirActive = selectedDirIdx === dIdx;
                          return (
                            <TouchableOpacity
                              key={dIdx}
                              style={[styles.dirSegmentBtn, isDirActive && styles.dirSegmentBtnActive]}
                              onPress={() => {
                                setSelectedDirIdx(dIdx);
                                setShowAllStops(false);
                              }}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[styles.dirSegmentText, isDirActive && styles.dirSegmentTextActive]}
                                numberOfLines={1}
                              >
                                {dir.headSign || `Yön ${dIdx + 1}`}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}

                    {/* View on Map CTA */}
                    {handleSelectOnMap && (
                      <TouchableOpacity
                        style={styles.viewOnMapBtn}
                        onPress={() => handleSelectOnMap(line, selectedDirIdx)}
                        activeOpacity={0.8}
                      >
                        <Navigation size={14} color={theme.colors.textPrimary} />
                        <Text style={styles.viewOnMapBtnText}>
                          {line.code} Hattını Haritada Göster
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Stops List */}
                    <View style={styles.stopsBlock}>
                      <View style={styles.stopsHeaderRow}>
                        <Text style={styles.stopsHeaderTitle}>
                          Güzergah Durakları ({stopIds.length})
                        </Text>
                        {stopIds.length > 6 && (
                          <TouchableOpacity
                            onPress={() => setShowAllStops(!showAllStops)}
                            activeOpacity={0.7}
                            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          >
                            <Text style={styles.stopsToggleLink}>
                              {showAllStops ? 'Daha Az' : 'Tümünü Gör'}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      <View style={styles.stopsTimelineContainer}>
                        {displayedStops.map((stopId, sIdx) => {
                          const stop = allStopsDB[stopId];
                          const isFirst = sIdx === 0;
                          const isLast = sIdx === stopIds.length - 1;

                          return (
                            <View key={`${stopId}_${sIdx}`} style={styles.stopTimelineItem}>
                              <View style={styles.stopIndexCol}>
                                <Text style={styles.stopIndexText}>{sIdx + 1}</Text>
                              </View>
                              <View style={styles.stopDotCol}>
                                <View
                                  style={[
                                    styles.stopDotCore,
                                    isFirst && { backgroundColor: theme.colors.primary },
                                    isLast && { backgroundColor: theme.colors.error },
                                    !isFirst && !isLast && { backgroundColor: theme.colors.border }
                                  ]}
                                />
                                {sIdx < displayedStops.length - 1 && <View style={styles.stopDotLine} />}
                              </View>
                              <Text
                                style={[
                                  styles.stopNameText,
                                  (isFirst || isLast) && styles.stopNameTextHighlight
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
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    height: 40,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 12.5,
    paddingVertical: 0,
  },
  corridorContainer: {
    paddingVertical: 8,
  },
  corridorScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  corridorChip: {
    backgroundColor: theme.colors.surface,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.radius.xs,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  corridorChipActive: {
    backgroundColor: theme.colors.surfaceHover,
    borderColor: theme.colors.border,
  },
  corridorChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  corridorChipTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  linesListContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 8,
  },
  emptyResultsBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyResultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  emptyResultsSub: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  lineCardItem: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  lineSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  lineSummaryRowExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
  },
  lineBadgeBox: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: theme.radius.xs,
    minWidth: 34,
    alignItems: 'center',
  },
  lineBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  lineInfoCol: {
    flex: 1,
  },
  lineHeadSign: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  lineMeta: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  expandChevronBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedDetailsSection: {
    backgroundColor: theme.colors.surfaceElevated,
    padding: 12,
    gap: 10,
  },
  dirSegmentRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xs,
    padding: 2,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    gap: 2,
  },
  dirSegmentBtn: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  dirSegmentBtnActive: {
    backgroundColor: theme.colors.surfaceHover,
  },
  dirSegmentText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  dirSegmentTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  viewOnMapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.surfaceHover,
    paddingVertical: 8,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  viewOnMapBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  stopsBlock: {
    gap: 8,
  },
  stopsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopsHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.4,
  },
  stopsToggleLink: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  stopsTimelineContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  stopTimelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
  },
  stopIndexCol: {
    width: 20,
  },
  stopIndexText: {
    fontSize: 9.5,
    color: theme.colors.textMuted,
    fontWeight: '500',
  },
  stopDotCol: {
    width: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopDotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stopDotLine: {
    position: 'absolute',
    top: 6,
    bottom: -18,
    width: 1,
    backgroundColor: theme.colors.hairline,
  },
  stopNameText: {
    fontSize: 11.5,
    color: theme.colors.textSecondary,
    flex: 1,
    marginLeft: 6,
  },
  stopNameTextHighlight: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
});
