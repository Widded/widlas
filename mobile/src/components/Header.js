import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bus } from 'lucide-react-native';
import { theme } from '../theme';

export default function Header({ fareType, setFareType }) {
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <View style={styles.logoBadge}>
          <Bus size={22} color="#fff" />
        </View>
        <Text style={styles.title}>Edirne Ulaşım</Text>
      </View>

      {/* Fare Selector */}
      <View style={styles.fareSwitch}>
        <TouchableOpacity
          style={[styles.fareBtn, fareType === 'tam' && styles.fareBtnActive]}
          onPress={() => setFareType('tam')}
          activeOpacity={0.7}
        >
          <Text style={[styles.fareBtnText, fareType === 'tam' && styles.fareBtnTextActive]}>
            Tam
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fareBtn, fareType === 'ogrenci' && styles.fareBtnActive]}
          onPress={() => setFareType('ogrenci')}
          activeOpacity={0.7}
        >
          <Text style={[styles.fareBtnText, fareType === 'ogrenci' && styles.fareBtnTextActive]}>
            Öğrenci
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    backgroundColor: theme.colors.primary,
    padding: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: theme.colors.textMain,
    letterSpacing: -0.3,
  },
  fareSwitch: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fareBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 7,
  },
  fareBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  fareBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
  fareBtnTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
});
