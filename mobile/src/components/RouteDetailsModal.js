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
import { calculateFare, formatFare } from '../data/fares';

const fmtM = (km) => {
  if (!km) return '0 m';
  const m = km * 1000;
  return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
};

export default function RouteDetailsModal({ visible, route, onClose }) {
  if (!route) return null;

  const isTransfer = route.isTransfer;
  const hasStartWalk = !route.isWalkOnly && ((route.walkDistanceStart || 0) > 0.04);
  const hasEndWalk = !route.isWalkOnly && ((route.walkDistanceEnd || 0) > 0.04);

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
            <Text style={styles.headerTitle}>Adım Adım Yol Tarifi</Text>
            <Text style={styles.headerSubtitle}>
              Toplam Süre: ~{route.totalTime} dakika
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={16} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Transit Summary Box */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryTopRow}>
              {route.isWalkOnly ? (
                <View style={styles.walkBadge}>
                  <Footprints size={14} color="#38BDF8" />
                  <Text style={styles.walkBadgeText}>
                    Yürüyüş Rotası ({fmtM(route.walkDistanceStart || route.totalDistance)})
                  </Text>
                </View>
              ) : (
                <View style={styles.flowChainContainer}>
                  {hasStartWalk && (
                    <>
                      <View style={styles.flowWalkPill}>
                        <Footprints size={12} color="#38BDF8" />
                        <Text style={styles.flowWalkText}>{fmtM(route.walkDistanceStart)}</Text>
                      </View>
                      <ArrowRight size={11} color="#64748B" />
                    </>
                  )}

                  {isTransfer ? (
                    <View style={styles.transferChain}>
                      <View style={[styles.badge, { backgroundColor: route.color || '#3B82F6' }]}>
                        <Bus size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
                        <Text style={styles.badgeText}>{route.line1}</Text>
                      </View>
                      <ArrowRight size={11} color="#64748B" />
                      <View style={[styles.badge, { backgroundColor: route.color2 || '#8B5CF6' }]}>
                        <Bus size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
                        <Text style={styles.badgeText}>{route.line2}</Text>
                      </View>
                    </View>
                  ) : (
                    <View style={[styles.badge, { backgroundColor: route.color || '#3B82F6' }]}>
                      <Bus size={12} color="#FFFFFF" style={{ marginRight: 3 }} />
                      <Text style={styles.badgeText}>{route.name || route.lineCode}</Text>
                    </View>
                  )}

                  {hasEndWalk && (
                    <>
                      <ArrowRight size={11} color="#64748B" />
                      <View style={styles.flowWalkPill}>
                        <Footprints size={12} color="#38BDF8" />
                        <Text style={styles.flowWalkText}>{fmtM(route.walkDistanceEnd)}</Text>
                      </View>
                    </>
                  )}
                </View>
              )}

              <View style={styles.durationBadge}>
                <Clock size={12} color="#94A3B8" />
                <Text style={styles.durationBadgeText}>~{route.totalTime} dk</Text>
              </View>
            </View>

            <Text style={styles.destinationTitle}>
              {route.isWalkOnly
                ? `${fmtM(route.walkDistanceStart)} yürüyerek varış`
                : `${route.startStop?.name || 'İlk Durak'} ➔ ${route.endStop?.name || 'Varış Durağı'}`}
            </Text>
          </View>

          {/* Turn-by-Turn Timeline */}
          <View style={styles.timelineSection}>
            <Text style={styles.sectionHeading}>GÜZERGAH AŞAMALARI</Text>

            {/* Step 1: Walk to first stop (if applicable) */}
            {hasStartWalk && (
              <View style={styles.stepItem}>
                <View style={styles.stepTrackCol}>
                  <View style={[styles.stepNode, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                    <Footprints size={13} color="#38BDF8" />
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
            )}

            {/* Step 2: Board bus */}
            {!route.isWalkOnly && route.startStop && (
              <View style={styles.stepItem}>
                <View style={styles.stepTrackCol}>
                  <View style={[styles.stepNode, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                    <Bus size={13} color="#3B82F6" />
                  </View>
                  <View style={styles.trackLine} />
                </View>
                <View style={styles.stepContentCol}>
                  <View style={styles.inlineLineRow}>
                    <Text style={styles.stepTitle}>{route.startStop.name} Durağı</Text>
                    <View style={[styles.miniBadge, { backgroundColor: route.color || '#3B82F6' }]}>
                      <Text style={styles.miniBadgeText}>{route.line1 || route.lineCode}</Text>
                    </View>
                  </View>
                  <Text style={styles.stepSubtitle}>
                    Otobüse binin ({route.line1 || route.name} Hattı ile ~{route.busTimeMins || 12} dk)
                  </Text>
                </View>
              </View>
            )}

            {/* Step 3: Transfer if applicable */}
            {isTransfer && route.transferStop && (
              <View style={styles.stepItem}>
                <View style={styles.stepTrackCol}>
                  <View style={[styles.stepNode, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
                    <Repeat size={13} color="#F59E0B" />
                  </View>
                  <View style={styles.trackLine} />
                </View>
                <View style={styles.stepContentCol}>
                  <Text style={[styles.stepTitle, { color: '#F59E0B' }]}>
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
                  <View style={[styles.stepNode, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <MapPin size={13} color="#EF4444" />
                  </View>
                  {hasEndWalk && <View style={styles.trackLine} />}
                </View>
                <View style={styles.stepContentCol}>
                  <Text style={styles.stepTitle}>{route.endStop.name} Durağı</Text>
                  <Text style={styles.stepSubtitle}>Otobüsten inin</Text>
                </View>
              </View>
            )}

            {/* Step 5: Final walk or reached destination */}
            {hasEndWalk ? (
              <View style={styles.stepItem}>
                <View style={styles.stepTrackCol}>
                  <View style={[styles.stepNode, { backgroundColor: 'rgba(36, 199, 149, 0.15)' }]}>
                    <Flag size={13} color="#24C795" />
                  </View>
                </View>
                <View style={styles.stepContentCol}>
                  <Text style={styles.stepTitle}>Hedefe Yürüyün</Text>
                  <Text style={styles.stepSubtitle}>
                    {fmtM(route.walkDistanceEnd)} mesafe (~{Math.max(1, Math.ceil(route.walkDistanceEnd * 1.4 * 12))} dk)
                  </Text>
                </View>
              </View>
            ) : !route.isWalkOnly && (
              <View style={styles.stepItem}>
                <View style={styles.stepTrackCol}>
                  <View style={[styles.stepNode, { backgroundColor: 'rgba(36, 199, 149, 0.15)' }]}>
                    <Flag size={13} color="#24C795" />
                  </View>
                </View>
                <View style={styles.stepContentCol}>
                  <Text style={styles.stepTitle}>Hedefe Ulaştınız</Text>
                  <Text style={styles.stepSubtitle}>İniş durağı varış noktanızdadır.</Text>
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
                  <Text style={[styles.fareRowValue, { color: '#38BDF8' }]}>
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
                  <Text style={styles.fareRowLabel}>Temassız Kredi Kartı & QR</Text>
                  <Text style={styles.fareRowValue}>
                    {formatFare(calculateFare('temassiz', isTransfer))}
                  </Text>
                </View>
              </View>
              {isTransfer && (
                <Text style={styles.transferNote}>
                  * 45 dakika içinde gerçekleşen 2. binişte indirimli ETUS aktarma tarifesi geçerlidir.
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
    backgroundColor: '#090B0F',
  },
  grabberBox: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  grabberBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2A344A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E2538',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#161B24',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E2538',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 36,
    gap: 18,
  },
  summaryCard: {
    backgroundColor: '#12161E',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E2538',
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  walkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  walkBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  flowChainContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    paddingRight: 8,
  },
  flowWalkPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  flowWalkText: {
    color: '#38BDF8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  transferChain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#161B24',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E2538',
  },
  durationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  destinationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  timelineSection: {
    gap: 10,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  stepTrackCol: {
    alignItems: 'center',
    width: 28,
  },
  stepNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1E2538',
  },
  trackLine: {
    width: 2,
    minHeight: 30,
    backgroundColor: '#1E2538',
    marginVertical: 3,
  },
  stepContentCol: {
    flex: 1,
    paddingTop: 3,
    paddingBottom: 12,
  },
  inlineLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  miniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  miniBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepSubtitle: {
    fontSize: 12.5,
    color: '#94A3B8',
    marginTop: 2.5,
  },
  fareSection: {
    gap: 8,
  },
  fareTableCard: {
    backgroundColor: '#12161E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1E2538',
    overflow: 'hidden',
  },
  fareTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  fareTableDivider: {
    height: 1,
    backgroundColor: '#1E2538',
    marginLeft: 16,
  },
  fareRowLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  fareRowValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  transferNote: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginTop: 2,
    paddingHorizontal: 2,
  },
});
