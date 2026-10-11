import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bus, GraduationCap, User } from 'lucide-react-native';
import { theme } from '../theme';

export default function Header({ fareType, setFareType }) {
  return (
    <View style={styles.floatingWrapper}>
      <View style={styles.islandPill}>
        {/* Brand identity */}
        <View style={styles.brandRow}>
          <View style={styles.brandIconBox}>
            <Bus size={15} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brandTitle}>EDİRNE ETUS</Text>
            <Text style={styles.brandSub}>Akıllı Ulaşım Ağı</Text>
          </View>
        </View>

        {/* Micro Segmented Tariff Switcher */}
        <View style={styles.tariffSwitcher}>
          <TouchableOpacity
            style={[styles.tariffBtn, fareType === 'ogrenci' && styles.tariffBtnActiveStudent]}
            onPress={() => setFareType('ogrenci')}
            activeOpacity={0.75}
          >
            <GraduationCap
              size={12}
              color={fareType === 'ogrenci' ? '#FFFFFF' : theme.colors.textSecondary}
            />
            <Text style={[styles.tariffText, fareType === 'ogrenci' && styles.tariffTextActive]}>
              Öğrenci 20₺
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tariffBtn, fareType === 'tam' && styles.tariffBtnActiveAdult]}
            onPress={() => setFareType('tam')}
            activeOpacity={0.75}
          >
            <User
              size={12}
              color={fareType === 'tam' ? '#FFFFFF' : theme.colors.textSecondary}
            />
            <Text style={[styles.tariffText, fareType === 'tam' && styles.tariffTextActive]}>
              Tam 30₺
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
    zIndex: 999,
  },
  islandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.glass,
    borderRadius: theme.radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.violet,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 9,
    fontWeight: '700',
    color: theme.colors.lavender,
    letterSpacing: -0.2,
  },
  tariffSwitcher: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.pill,
    padding: 2,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tariffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: theme.radius.pill,
  },
  tariffBtnActiveStudent: {
    backgroundColor: theme.colors.emerald,
  },
  tariffBtnActiveAdult: {
    backgroundColor: theme.colors.primary,
  },
  tariffText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  tariffTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
