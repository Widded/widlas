import React from 'react';
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { X, Footprints, Bus, MapPin, Flag, Repeat, Clock, ArrowRight } from 'lucide-react-native';
import { theme } from '../theme';
import { calculateFare, formatFare } from '../data/fares';

const fmtM = (km) => {
  if (!km) return '0 m';
  const m = km * 1000;
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
};

export default function RouteDetailsModal({ visible, route, onClose }) {
  if (!route) return null;

  const isTransfer = route.isTransfer;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.sheetContainer}>
        {/* Grabber Bar */}
        <View style={styles.grabberBox}>
          <View style={styles.grabberBar} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Güzergah Rehberi</Text>
            <Text style={styles.headerSubtitle}>
              Toplam Seyahat Süresi: ~{route.totalTime} dakika
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={15} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Transit Summary Box */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              {route.isWalkOnly ? (
                <View style={styles.walkBadge}>
                  <Footprints size={13} color={theme.colors.primary} />
                  <Text style={styles.walkBadgeText}>Yürüyüş Rotası</Text>
                </View>
              ) : isTransfer ? (
                <View style={styles.transferChain}>
                  <View style={[styles.badge, { backgroundColor: route.color || theme.colors.primary }]}>
                    <Text style={styles.badgeText}>{route.line1}</Text>
                  </View>
                  <ArrowRight size={12} color={theme.colors.textMuted} />
                  <View style={[styles.badge, { backgroundColor: route.color2 || theme.colors.fare }]}>
                    <Text style={styles.badgeText}>{route.line2}</Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.badge, { backgroundColor: route.color || theme.colors.primary }]}>
                  <Text style={styles.badgeText}>{route.name || route.lineCode}</Text>
                </View>
              )}

              <View style={styles.durationBadge}>
                <Clock size={11} color={theme.colors.textSecondary} />
                <Text style={styles.durationBadgeText}>~{route.totalTime} dk</Text>
              </View>
            </View>

            <Text style={styles.destinationTitle}>
              {route.isWalkOnly
                ? `${fmtM(route.walkDistanceStart)} yürüyerek varış`
                : `${route.startStop?.name || 'İlk Durak'} ➔ ${route.endStop?.name || 'Varış Durağı'}`}
            </Text>
          </View>

          {/* Turn-by-Turn Metro Timeline */}
          <View style={styles.timelineSection}>
            <Text style={styles.sectionHeading}>ADIM ADIM YOL TARİFİ</Text>

            {/* Step 1: Walk to first stop */}
            <View style={styles.stepItem}>
              <View style={styles.stepTrackCol}>
                <View style={[styles.stepNode, { backgroundColor: theme.colors.primaryLight }]}>
                  <Footprints size={12} color={theme.colors.primary} />
                </View>
                <View style={styles.trackLine} />
              </View>
              <View style={styles.stepContentCol}>
                <Text style={styles.stepTitle}>İlk Durağa Yürüyün</Text>
                <Text style={styles.stepSubtitle}>
                  {fmtM(route.walkDistanceStart)} mesafe (~{Math.max(1, Math.ceil(route.walkDistanceStart * 1.4 * 12))} dk)
                </Text>
              </View>
            </View>

            {/* Step 2: Board first bus */}
            {!route.isWalkOnly && route.startStop && (
              <View style={styles.stepItem}>
                <View style={styles.stepTrackCol}>
                  <View style={[styles.stepNode, { backgroundColor: theme.colors.primaryLight }]}>
                    <Bus size={12} color={theme.colors.primary} />
                  </View>
                  <View style={styles.trackLine} />
                </View>
                <View style={styles.stepContentCol}>
                  <View style={styles.inlineLineRow}>
                    <View style={[styles.miniBadge, { backgroundColor: route.color || theme.colors.primary }]}>
                      <Text style={styles.miniBadgeText}>{route.line1 || route.name}</Text>
                    </View>
                    <Text style={styles.stepTitle}>{route.startStop.name} Durağı</Text>
                  </View>
                  <Text style={styles.stepSubtitle}>
                    Otobüse binin ({route.line1 || route.name} Hattı)
                  </Text>
                </View>
              </View>
            )}

            {/* Step 3: Transfer if applicable */}
            {isTransfer && route.transferStop && (
              <View style={styles.stepItem}>
                <View style={styles.stepTrackCol}>
                  <View style={[styles.stepNode, { backgroundColor: theme.colors.fareLight }]}>
                    <Repeat size={12} color={theme.colors.fare} />
                  </View>
                  <View style={styles.trackLine} />
                </View>
                <View style={styles.stepContentCol}>
                  <Text style={[styles.stepTitle, { color: theme.colors.fare }]}>
                    {route.transferStop.name} (Aktarma Noktası)
                  </Text>
                  <Text style={styles.stepSubtitle}>
                    {route.line1} hattından inip {route.line2} hattına aktarma yapın
                  </Text>
                </View>
              </View>
            )}

            {/* Step 4: Alight bus */}
            {!route.isWalkOnly && route.endStop && (
              <View style={styles.stepItem}>
                <View style={styles.stepTrackCol}>
                  <View style={[styles.stepNode, { backgroundColor: theme.colors.errorLight }]}>
                    <MapPin size={12} color={theme.colors.error} />
                  </View>
                  {route.walkDistanceEnd > 0 && <View style={styles.trackLine} />}
                </View>
                <View style={styles.stepContentCol}>
                  <Text style={styles.stepTitle}>{route.endStop.name} Durağı</Text>
                  <Text style={styles.stepSubtitle}>Otobüsten inin</Text>
                </View>
              </View>
            )}

            {/* Step 5: Final walk */}
            {route.walkDistanceEnd > 0 && (
              <View style={styles.stepItem}>
                <View style={styles.stepTrackCol}>
                  <View style={[styles.stepNode, { backgroundColor: theme.colors.primaryLight }]}>
                    <Flag size={12} color={theme.colors.primary} />
                  </View>
                </View>
                <View style={styles.stepContentCol}>
                  <Text style={styles.stepTitle}>Hedefe Yürüyün</Text>
                  <Text style={styles.stepSubtitle}>
                    {fmtM(route.walkDistanceEnd)} mesafe (~{Math.max(1, Math.ceil(route.walkDistanceEnd * 1.4 * 12))} dk)
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Fare Information Table */}
          {!route.isWalkOnly && (
            <View style={styles.fareSection}>
              <Text style={styles.sectionHeading}>BU ROTA İÇİN ÜCRET TARİFESİ</Text>
              <View style={styles.fareTableCard}>
                <View style={styles.fareTableRow}>
                  <Text style={styles.fareRowLabel}>Öğrenci Kentkart</Text>
                  <Text style={[styles.fareRowValue, { color: theme.colors.primary }]}>
                    {formatFare(calculateFare('ogrenci', isTransfer))}
                  </Text>
                </View>
                <View style={styles.fareTableDivider} />
                <View style={styles.fareTableRow}>
                  <Text style={styles.fareRowLabel}>Sivil / Tam Kentkart</Text>
                  <Text style={styles.fareRowValue}>
                    {formatFare(calculateFare('tam', isTransfer))}
                  </Text>
                </View>
                <View style={styles.fareTableDivider} />
                <View style={styles.fareTableRow}>
                  <Text style={styles.fareRowLabel}>Temassız Banka Kartı & QR</Text>
                  <Text style={styles.fareRowValue}>
                    {formatFare(calculateFare('temassiz', isTransfer))}
                  </Text>
                </View>
              </View>
              {isTransfer && (
                <Text style={styles.transferNote}>
                  * 45 dakika içinde gerçekleşen 2. binişte indirimli aktarma tarifesi uygulanır.
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
  sheetContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  grabberBox: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  grabberBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
    gap: 16,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  walkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  walkBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  transferChain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: theme.radius.xs,
  },
  durationBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  destinationTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  timelineSection: {
    gap: 8,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepTrackCol: {
    alignItems: 'center',
    width: 26,
  },
  stepNode: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackLine: {
    width: 2,
    minHeight: 28,
    backgroundColor: theme.colors.border,
    marginVertical: 2,
  },
  stepContentCol: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 10,
  },
  inlineLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  miniBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
  },
  miniBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  stepSubtitle: {
    fontSize: 11.5,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  fareSection: {
    gap: 6,
  },
  fareTableCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  fareTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  fareTableDivider: {
    height: 1,
    backgroundColor: theme.colors.hairline,
    marginLeft: 14,
  },
  fareRowLabel: {
    fontSize: 12.5,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  fareRowValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: theme.colors.fare,
  },
  transferNote: {
    fontSize: 10.5,
    color: theme.colors.textMuted,
    lineHeight: 14,
    marginTop: 2,
    paddingHorizontal: 2,
  },
});
