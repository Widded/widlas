import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Bus, GraduationCap, User } from 'lucide-react-native';
import { theme } from '../theme';

export default function Header({ fareType, setFareType, title = 'Edirne Ulaşım', subtitle = 'ETUS Akıllı Rehber' }) {
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.logoPill}>
          <Bus size={18} color="#FFFFFF" />
          <Text style={styles.appName}>{title}</Text>
        </View>
        <Text style={styles.subText}>{subtitle}</Text>
      </View>

      {/* Segmented Fare Toggle (Tam / Öğrenci) */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, fareType === 'tam' && styles.segmentBtnActive]}
          onPress={() => setFareType('tam')}
          activeOpacity={0.7}
        >
          <User size={13} color={fareType === 'tam' ? '#FFFFFF' : theme.colors.textSecondary} />
          <Text style={[styles.segmentText, fareType === 'tam' && styles.segmentTextActive]}>
            Tam
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, fareType === 'ogrenci' && styles.segmentBtnActive]}
          onPress={() => setFareType('ogrenci')}
          activeOpacity={0.7}
        >
          <GraduationCap size={14} color={fareType === 'ogrenci' ? '#FFFFFF' : theme.colors.textSecondary} />
          <Text style={[styles.segmentText, fareType === 'ogrenci' && styles.segmentTextActive]}>
            Öğrenci
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
  },
  brandRow: {
    flex: 1,
  },
  logoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textMain,
    letterSpacing: -0.4,
  },
  subText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.textTertiary,
    marginTop: 1,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: theme.radius.pill,
  },
  segmentBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
