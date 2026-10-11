import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Bus, GraduationCap, User } from 'lucide-react-native';
import { theme } from '../theme';

export default function Header({ fareType, setFareType }) {
  return (
    <View style={styles.floatingContainer}>
      <View style={styles.glassBar}>
        {/* Brand identity */}
        <View style={styles.brandCapsule}>
          <View style={styles.busIconBubble}>
            <Bus size={16} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brandName}>EDİRNE ULAŞIM</Text>
            <Text style={styles.brandTag}>ETUS Canlı Rehber</Text>
          </View>
        </View>

        {/* Micro Fare Segment Switcher */}
        <View style={styles.fareSwitch}>
          <TouchableOpacity
            style={[styles.fareTab, fareType === 'ogrenci' && styles.fareTabActiveStudent]}
            onPress={() => setFareType('ogrenci')}
            activeOpacity={0.7}
          >
            <GraduationCap size={13} color={fareType === 'ogrenci' ? '#FFFFFF' : theme.colors.textSecondary} />
            <Text style={[styles.fareTabText, fareType === 'ogrenci' && styles.fareTabTextActive]}>
              Öğrenci
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.fareTab, fareType === 'tam' && styles.fareTabActiveAdult]}
            onPress={() => setFareType('tam')}
            activeOpacity={0.7}
          >
            <User size={13} color={fareType === 'tam' ? '#FFFFFF' : theme.colors.textSecondary} />
            <Text style={[styles.fareTabText, fareType === 'tam' && styles.fareTabTextActive]}>
              Tam
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingContainer: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 6,
    zIndex: 999,
  },
  glassBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.glassBg,
    borderRadius: theme.radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  brandCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  busIconBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 2,
  },
  brandName: {
    fontSize: 13,
    fontWeight: '900',
    color: theme.colors.textMain,
    letterSpacing: 0.5,
  },
  brandTag: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primaryGlow,
    letterSpacing: -0.2,
  },
  fareSwitch: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  fareTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: theme.radius.pill,
  },
  fareTabActiveStudent: {
    backgroundColor: theme.colors.success,
  },
  fareTabActiveAdult: {
    backgroundColor: theme.colors.primary,
  },
  fareTabText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  fareTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});
