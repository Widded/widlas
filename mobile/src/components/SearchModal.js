import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet
} from 'react-native';
import { ArrowLeft, X, MapPin, Bus } from 'lucide-react-native';
import { theme } from '../theme';
import { LOCAL_PLACES, normalizeTr } from '../data/places';
import { allStopsDB } from '../data/db';

export default function SearchModal({
  visible,
  onClose,
  targetType,
  currentName,
  onSelect
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setQuery(currentName || '');
      setResults(LOCAL_PLACES);
    }
  }, [visible, currentName]);

  const handleTextChange = (text) => {
    setQuery(text);
    if (!text || text.trim().length < 2) {
      setResults(LOCAL_PLACES);
      return;
    }

    const norm = normalizeTr(text);

    // 1. Local places match
    const localMatches = LOCAL_PLACES.filter(p =>
      normalizeTr(p.name).includes(norm)
    ).map(p => ({ ...p, type: 'place' }));

    // 2. Bus stops match from database
    const stopMatches = Object.values(allStopsDB)
      .filter(s => s.lat && s.lon && (s.searchIndex || '').includes(norm))
      .slice(0, 15)
      .map(s => ({
        name: s.name,
        lat: s.lat,
        lon: s.lon,
        type: 'stop'
      }));

    setResults([...localMatches, ...stopMatches]);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={theme.colors.textMain} />
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder={targetType === 'from' ? 'Başlangıç noktası ara...' : 'Nereye gitmek istiyorsunuz?'}
              placeholderTextColor={theme.colors.textDim}
              value={query}
              onChangeText={handleTextChange}
              autoFocus
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => handleTextChange('')} style={styles.clearBtn}>
                <X size={16} color={theme.colors.textDim} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Section title */}
        <View style={styles.listHeader}>
          <Text style={styles.listHeaderText}>
            {query.length < 2 ? 'Popüler Noktalar' : `Sonuçlar (${results.length})`}
          </Text>
        </View>

        {/* Results List */}
        <FlatList
          data={results}
          keyExtractor={(item, index) => item.name + '_' + index}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.itemRow}
              onPress={() => onSelect(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, item.type === 'stop' && styles.iconBoxStop]}>
                {item.type === 'stop' ? (
                  <Bus size={18} color={theme.colors.primary} />
                ) : (
                  <MapPin size={18} color={theme.colors.textDim} />
                )}
              </View>

              <View style={styles.itemTextCol}>
                <Text style={styles.itemName} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={styles.itemSub}>
                  {item.type === 'stop' ? 'Otobüs Durağı' : 'Önemli Nokta'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    gap: 8,
  },
  backBtn: {
    padding: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.borderFocus,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    height: 42,
    fontSize: 16,
    color: theme.colors.textMain,
    fontWeight: '600',
  },
  clearBtn: {
    padding: 6,
  },
  listHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  listHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textDim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxStop: {
    backgroundColor: theme.colors.primaryLight,
  },
  itemTextCol: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.textMain,
    marginBottom: 2,
  },
  itemSub: {
    fontSize: 12,
    color: theme.colors.textDim,
  },
});
