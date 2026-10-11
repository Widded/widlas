import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet } from 'react-native';
import { ChevronDown, ChevronUp, MapPin, Bus, Map as MapIcon, Search } from 'lucide-react-native';
import { theme } from '../theme';
import { etusLines, allStopsDB } from '../data/db';

export default function LinesExplorer({ onSelectLineOnMap }) {
  const [expandedCode, setExpandedCode] = useState(null);
  const [filterText, setFilterText] = useState('');

  const allLines = Object.values(etusLines).sort((a, b) => {
    const getNum = (c) => parseInt(c) || 0;
    return getNum(a.code) - getNum(b.code) || a.code.localeCompare(b.code);
  });

  const filteredLines = filterText.trim()
    ? allLines.filter(l => {
        const q = filterText.toLowerCase();
        return (
          l.code.toLowerCase().includes(q) ||
          l.directions.some(d => (d.headSign || '').toLowerCase().includes(q))
        );
      })
    : allLines;

  return (
    <View style={styles.container}>
      {/* Search Header for Lines */}
      <View style={styles.searchBox}>
        <Search size={16} color={theme.colors.textDim} />
        <TextInput
          style={styles.searchInput}
          placeholder="Hat ara (örn: 1A, 3C, Otogar...)"
          placeholderTextColor={theme.colors.textDim}
          value={filterText}
          onChangeText={setFilterText}
        />
        {filterText.length > 0 && (
          <TouchableOpacity onPress={() => setFilterText('')}>
            <Text style={styles.clearSearchText}>Temizle</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title}>
        Tüm ETUS Hatları ({filteredLines.length})
      </Text>

      {filteredLines.map((line) => {
        const isExpanded = expandedCode === line.code;
        const mainDir = line.directions?.[0];

        return (
          <View key={line.code} style={styles.lineCard}>
            <TouchableOpacity
              style={styles.lineHeader}
              onPress={() => setExpandedCode(isExpanded ? null : line.code)}
              activeOpacity={0.7}
            >
              <View style={[styles.codeBadge, { backgroundColor: line.color || theme.colors.primary }]}>
                <Text style={styles.codeText}>{line.code}</Text>
              </View>

              <View style={styles.lineMeta}>
                <Text style={styles.lineTitle} numberOfLines={1}>
                  {mainDir?.headSign?.split(' - ')[0] || `Hat ${line.code}`}
                </Text>
                <Text style={styles.lineSubtitle} numberOfLines={1}>
                  {mainDir?.headSign || 'ETUS Şehir İçi Hattı'}
                </Text>
              </View>

              {isExpanded ? (
                <ChevronUp size={20} color={theme.colors.textMuted} />
              ) : (
                <ChevronDown size={20} color={theme.colors.textMuted} />
              )}
            </TouchableOpacity>

            {isExpanded && (
              <View style={styles.expandedContent}>
                {/* Directions */}
                {line.directions.map((dir, dIdx) => (
                  <View key={dIdx} style={styles.dirBlock}>
                    <View style={styles.dirHeaderRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.dirHead}>Yön {dIdx + 1}: {dir.headSign}</Text>
                        <Text style={styles.dirCount}>{dir.stopIds?.length || 0} Durak</Text>
                      </View>

                      {onSelectLineOnMap && (
                        <TouchableOpacity
                          style={styles.previewBtn}
                          onPress={() => onSelectLineOnMap(line, dIdx)}
                          activeOpacity={0.7}
                        >
                          <MapIcon size={14} color="#fff" />
                          <Text style={styles.previewBtnText}>Haritada Gör</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <ScrollView style={styles.stopsList} nestedScrollEnabled={true}>
                      {dir.stopIds?.map((stopId, sIdx) => {
                        const stop = allStopsDB[stopId];
                        return (
                          <View key={stopId + '_' + sIdx} style={styles.stopItem}>
                            <View style={[styles.stopDot, { backgroundColor: line.color || theme.colors.primary }]} />
                            <Text style={styles.stopItemName} numberOfLines={1}>
                              {stop?.name || `Durak #${stopId}`}
                            </Text>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                ))}
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
    paddingBottom: 24,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    marginBottom: 16,
    gap: 8,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textMain,
    fontSize: 14,
  },
  clearSearchText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textMain,
    marginBottom: 12,
  },
  lineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 10,
    overflow: 'hidden',
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  codeBadge: {
    width: 44,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  lineMeta: {
    flex: 1,
  },
  lineTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  lineSubtitle: {
    fontSize: 12,
    color: theme.colors.textDim,
    marginTop: 2,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: 14,
    backgroundColor: theme.colors.bg,
  },
  dirBlock: {
    marginBottom: 14,
  },
  dirHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  dirHead: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  dirCount: {
    fontSize: 11,
    color: theme.colors.textDim,
    marginTop: 2,
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  previewBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  stopsList: {
    maxHeight: 180,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.sm,
    padding: 10,
  },
  stopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  stopDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stopItemName: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
});
