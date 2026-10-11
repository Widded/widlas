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
import { X, Footprints, Bus, MapPin, Flag, Repeat, Clock, ShieldCheck } from 'lucide-react-native';
import { theme } from '../theme';
import { FARES, calculateFare, formatFare } from '../data/fares';

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
            <X size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Transit Summary Box */}
          <View style={styles.heroBox}>
            <View style={styles.heroBadgesRow}>
              {route.isWalkOnly ? (
                <View style={styles.walkTag}>
                  <Footprints size={14} color={theme.colors.emerald} />
                  <Text style={styles.walkTagText}>Yürüyerek Ulaşım</Text>
                </View>
              ) : isTransfer ? (
                <View style={styles.transferTagChain}>
                  <View style={[styles.badge, { backgroundColor: route.color || theme.colors.violet }]}>
                    <Text style={styles.badgeText}>{route.line1}</Text>
                  </View>
                  <Text style={styles.chainArrow}>➔</Text>
                  <View style={[styles.badge, { backgroundColor: route.color2 || theme.colors.amber }]}>
                    <Text style={styles.badgeText}>{route.line2}</Text>
                  </View>
                </View>
              ) : (
                <View style={[styles.badge, { backgroundColor: route.color || theme.colors.violet }]}>
                  <Text style={styles.badgeText}>{route.name || route.lineCode}</Text>
                </View>
              )}

              <View style={styles.timeTag}>
                <Clock size={12} color={theme.colors.lavender} />
                <Text style={styles.timeTagText}>~{route.totalTime} dk</Text>
              </View>
            </View>

            <Text style={styles.heroDestination}>
              {route.isWalkOnly
                ? `${fmtM(route.walkDistanceStart)} yürüyerek hedefe varış`
                : `${route.startStop?.name} ➔ ${route.endStop?.name}`}
            </Text>
          </View>

          {/* Turn-by-Turn Metro Timeline */}
          <View style={styles.timelineSection}>
            <Text style={styles.sectionHeading}>ADIM ADIM YOL TARİFİ</Text>

            {/* Step 1: Walk to first stop */}
            <View style={styles.stepBlock}>
              <View style={styles.stepRailCol}>
                <View style={[styles.stepIconBubble, { backgroundColor: theme.colors.emeraldLight }]}>
                  <Footprints size={15} color={theme.colors.emerald} />
                </View>
                <View style={styles.railLine} />
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
              <View style={styles.stepBlock}>
                <View style={styles.stepRailCol}>
                  <View style={[styles.stepIconBubble, { backgroundColor: theme.colors.primaryLight }]}>
                    <Bus size={15} color={theme.colors.primaryGlow} />
                  </View>
                  <View style={styles.railLine} />
                </View>
                <View style={styles.stepContentCol}>
                  <View style={styles.lineTagInline}>
                    <View style={[styles.miniBadge, { backgroundColor: route.color || theme.colors.violet }]}>
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
              <View style={styles.stepBlock}>
                <View style={styles.stepRailCol}>
                  <View style={[styles.stepIconBubble, { backgroundColor: theme.colors.amberLight }]}>
                    <Repeat size={15} color={theme.colors.amber} />
                  </View>
                  <View style={styles.railLine} />
                </View>
                <View style={styles.stepContentCol}>
                  <Text style={[styles.stepTitle, { color: theme.colors.amber }]}>
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
              <View style={styles.stepBlock}>
                <View style={styles.stepRailCol}>
                  <View style={[styles.stepIconBubble, { backgroundColor: theme.colors.roseLight }]}>
                    <MapPin size={15} color={theme.colors.rose} />
                  </View>
                  {route.walkDistanceEnd > 0 && <View style={styles.railLine} />}
                </View>
                <View style={styles.stepContentCol}>
                  <Text style={styles.stepTitle}>{route.endStop.name} Durağı</Text>
                  <Text style={styles.stepSubtitle}>Otobüsten inin</Text>
                </View>
              </View>
            )}

            {/* Step 5: Final walk */}
            {route.walkDistanceEnd > 0 && (
              <View style={styles.stepBlock}>
                <View style={styles.stepRailCol}>
                  <View style={[styles.stepIconBubble, { backgroundColor: theme.colors.emeraldLight }]}>
                    <Flag size={15} color={theme.colors.emerald} />
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

          {/* Official 2026 Fare Calculator Card */}
          {!route.isWalkOnly && (
            <View style={styles.fareTicketSection}>
              <View style={styles.fareTitleRow}>
                <ShieldCheck size={16} color={theme.colors.lavender} />
                <Text style={styles.sectionHeading}>RESMİ BİLET ÜCRETİ (2026)</Text>
              </View>

              <View style={styles.fareCardsRow}>
                <View style={styles.fareTicketBox}>
                  <Text style={styles.fareRole}>Öğrenci</Text>
                  <Text style={[styles.farePriceValue, { color: theme.colors.emerald }]}>
                    {formatFare(calculateFare('ogrenci', isTransfer))}
                  </Text>
                </View>

                <View style={styles.fareTicketBox}>
                  <Text style={styles.fareRole}>Sivil / Tam</Text>
                  <Text style={[styles.farePriceValue, { color: theme.colors.primaryGlow }]}>
                    {formatFare(calculateFare('tam', isTransfer))}
                  </Text>
                </View>

                <View style={styles.fareTicketBox}>
                  <Text style={styles.fareRole}>Temassız / QR</Text>
                  <Text style={[styles.farePriceValue, { color: theme.colors.amber }]}>
                    {formatFare(calculateFare('temassiz', isTransfer))}
                  </Text>
                </View>
              </View>

              {isTransfer && (
                <Text style={styles.transferDiscountHint}>
                  * 45 dakika içinde gerçekleşen aktarmada indirimli tarife dahil edilmiştir.
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
    paddingVertical: 8,
  },
  grabberBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 36,
  },
  heroBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  walkTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.emeraldLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  walkTagText: {
    color: theme.colors.emerald,
    fontSize: 12,
    fontWeight: '700',
  },
  transferTagChain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radius.xs,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  chainArrow: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.lavenderLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  timeTagText: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.lavender,
  },
  heroDestination: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    letterSpacing: -0.3,
  },
  timelineSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 14,
  },
  stepBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    minHeight: 52,
  },
  stepRailCol: {
    alignItems: 'center',
    width: 32,
  },
  stepIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railLine: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.border,
    marginVertical: 4,
  },
  stepContentCol: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 10,
  },
  lineTagInline: {
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
    fontWeight: '900',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  stepSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  fareTicketSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fareTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  fareCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  fareTicketBox: {
    flex: 1,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.md,
    padding: 10,
    alignItems: 'center',
  },
  fareRole: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  farePriceValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  transferDiscountHint: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 10,
    textAlign: 'center',
  },
});
