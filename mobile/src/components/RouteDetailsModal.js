import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { X, Footprints, Bus, MapPin, Flag, Repeat, ChevronDown, ChevronUp } from 'lucide-react-native';
import { theme } from '../theme';
import { FARES, calculateFare, formatFare } from '../data/fares';

const fmtM = (km) => {
  if (!km) return '0 m';
  const m = km * 1000;
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
};

export default function RouteDetailsModal({ visible, route, onClose }) {
  if (!route) return null;

  const [expandedStops, setExpandedStops] = useState(false);
  const isTransfer = route.isTransfer;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Modal Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Güzergah Detayları</Text>
            <Text style={styles.headerSub}>Toplam Süre: ~{route.totalTime} dakika</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={20} color={theme.colors.textMain} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Quick Route Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.badgesRow}>
              {route.isWalkOnly ? (
                <View style={styles.walkPill}>
                  <Footprints size={14} color={theme.colors.success} />
                  <Text style={styles.walkPillText}>Sadece Yürüme</Text>
                </View>
              ) : isTransfer ? (
                <View style={styles.transferBadges}>
                  <View style={[styles.lineBadge, { backgroundColor: route.color || theme.colors.primary }]}>
                    <Text style={styles.lineBadgeText}>{route.line1}</Text>
                  </View>
                  <Text style={styles.transferArrow}>➔</Text>
                  <View style={[styles.lineBadge, { backgroundColor: route.color2 || theme.colors.warning }]}>
                    <Text style={styles.lineBadgeText}>{route.line2}</Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.lineBadge, { backgroundColor: route.color || theme.colors.primary }]}>
                  <Text style={styles.lineBadgeText}>{route.name || route.lineCode}</Text>
                </View>
              )}
            </View>

            <Text style={styles.summaryTitle}>
              {route.isWalkOnly
                ? `${fmtM(route.walkDistanceStart)} yürüyerek hedefe varış`
                : `${route.startStop?.name} ➔ ${route.endStop?.name}`}
            </Text>
          </View>

          {/* Turn-by-Turn Steps Timeline */}
          <View style={styles.stepsCard}>
            <Text style={styles.cardHeaderTitle}>Adım Adım Yol Tarifi</Text>

            {/* Step 1: Walk to first stop */}
            <View style={styles.stepItem}>
              <View style={[styles.stepIconBox, { backgroundColor: theme.colors.successLight }]}>
                <Footprints size={16} color={theme.colors.success} />
              </View>
              <View style={styles.stepTextCol}>
                <Text style={styles.stepHeading}>İlk Durağa Yürüyün</Text>
                <Text style={styles.stepDesc}>
                  {fmtM(route.walkDistanceStart)} mesafe (~{Math.max(1, Math.ceil(route.walkDistanceStart * 1.4 * 12))} dk)
                </Text>
              </View>
            </View>

            {/* Step 2: Board first bus */}
            {!route.isWalkOnly && route.startStop && (
              <View style={styles.stepItem}>
                <View style={[styles.stepIconBox, { backgroundColor: theme.colors.primaryLight }]}>
                  <Bus size={16} color={theme.colors.primary} />
                </View>
                <View style={styles.stepTextCol}>
                  <View style={styles.stepBadgeLine}>
                    <View style={[styles.miniBadge, { backgroundColor: route.color || theme.colors.primary }]}>
                      <Text style={styles.miniBadgeText}>{route.line1 || route.name}</Text>
                    </View>
                    <Text style={styles.stepHeading}>{route.startStop.name} Durağı</Text>
                  </View>
                  <Text style={styles.stepDesc}>
                    Otobüse binin ({route.line1 || route.name} Hattı)
                  </Text>
                </View>
              </View>
            )}

            {/* Step 3: Transfer if applicable */}
            {isTransfer && route.transferStop && (
              <View style={styles.stepItem}>
                <View style={[styles.stepIconBox, { backgroundColor: theme.colors.warningLight }]}>
                  <Repeat size={16} color={theme.colors.warning} />
                </View>
                <View style={styles.stepTextCol}>
                  <Text style={[styles.stepHeading, { color: theme.colors.warning }]}>
                    {route.transferStop.name} (Aktarma Durağı)
                  </Text>
                  <Text style={styles.stepDesc}>
                    {route.line1} hattından inip {route.line2} hattına aktarma yapın
                  </Text>
                </View>
              </View>
            )}

            {/* Step 4: Alight destination stop */}
            {!route.isWalkOnly && route.endStop && (
              <View style={styles.stepItem}>
                <View style={[styles.stepIconBox, { backgroundColor: theme.colors.dangerLight }]}>
                  <MapPin size={16} color={theme.colors.danger} />
                </View>
                <View style={styles.stepTextCol}>
                  <Text style={styles.stepHeading}>{route.endStop.name} Durağı</Text>
                  <Text style={styles.stepDesc}>Otobüsten inin</Text>
                </View>
              </View>
            )}

            {/* Step 5: Final walk */}
            {route.walkDistanceEnd > 0 && (
              <View style={styles.stepItem}>
                <View style={[styles.stepIconBox, { backgroundColor: theme.colors.successLight }]}>
                  <Flag size={16} color={theme.colors.success} />
                </View>
                <View style={styles.stepTextCol}>
                  <Text style={styles.stepHeading}>Hedefe Yürüyün</Text>
                  <Text style={styles.stepDesc}>
                    {fmtM(route.walkDistanceEnd)} mesafe (~{Math.max(1, Math.ceil(route.walkDistanceEnd * 1.4 * 12))} dk)
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Official 2026 ETUS Fares Card */}
          {!route.isWalkOnly && (
            <View style={styles.fareCard}>
              <Text style={styles.cardHeaderTitle}>Tahmini Bilet Ücreti (2026)</Text>

              <View style={styles.fareGrid}>
                <View style={styles.fareBox}>
                  <Text style={styles.fareBoxLabel}>Öğrenci</Text>
                  <Text style={[styles.fareBoxPrice, { color: theme.colors.success }]}>
                    {formatFare(calculateFare('ogrenci', isTransfer))}
                  </Text>
                </View>

                <View style={styles.fareBox}>
                  <Text style={styles.fareBoxLabel}>Sivil / Tam</Text>
                  <Text style={[styles.fareBoxPrice, { color: theme.colors.primary }]}>
                    {formatFare(calculateFare('tam', isTransfer))}
                  </Text>
                </View>

                <View style={styles.fareBox}>
                  <Text style={styles.fareBoxLabel}>Temassız / QR</Text>
                  <Text style={[styles.fareBoxPrice, { color: theme.colors.warning }]}>
                    {formatFare(calculateFare('temassiz', isTransfer))}
                  </Text>
                </View>
              </View>

              {isTransfer && (
                <Text style={styles.fareNote}>
                  * 45 dakika içinde gerçekleşen 2. binişlerde aktarma indirimi geçerlidir.
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.hairline,
    backgroundColor: theme.colors.bg,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textMain,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    marginBottom: 14,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  walkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.successLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  walkPillText: {
    color: theme.colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  transferBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lineBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.xs,
  },
  lineBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  transferArrow: {
    color: theme.colors.textTertiary,
    fontSize: 13,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textMain,
    letterSpacing: -0.3,
  },
  stepsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    marginBottom: 14,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 16,
  },
  stepIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextCol: {
    flex: 1,
  },
  stepBadgeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  miniBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  miniBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  stepDesc: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  fareCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
  },
  fareGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  fareBox: {
    flex: 1,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    padding: 12,
    alignItems: 'center',
  },
  fareBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  fareBoxPrice: {
    fontSize: 16,
    fontWeight: '800',
  },
  fareNote: {
    fontSize: 11,
    color: theme.colors.textTertiary,
    marginTop: 10,
    textAlign: 'center',
  },
});
