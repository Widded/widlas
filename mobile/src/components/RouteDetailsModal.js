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
import { X, Footprints, Bus, MapPin, Flag, Repeat } from 'lucide-react-native';
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Yolculuk Detayları</Text>
            <Text style={styles.headerSub}>Toplam Süre: ~{route.totalTime} dakika</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <X size={22} color={theme.colors.textMain} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
          {/* Timeline Nodes */}
          <View style={styles.timelineCard}>
            {/* 1. Start Walk */}
            <View style={styles.stepRow}>
              <View style={[styles.stepIconBox, { backgroundColor: '#10b98125' }]}>
                <Footprints size={18} color={theme.colors.success} />
              </View>
              <View style={styles.stepInfo}>
                <Text style={styles.stepTitle}>İlk Durağa Yürüme</Text>
                <Text style={styles.stepSub}>
                  {fmtM(route.walkDistanceStart)} (~{Math.ceil(route.walkDistanceStart * 1.4 * 12)} dk)
                </Text>
              </View>
            </View>

            {/* 2. Board First Bus */}
            {!route.isWalkOnly && route.startStop && (
              <View style={styles.stepRow}>
                <View style={[styles.stepIconBox, { backgroundColor: '#3b82f625' }]}>
                  <Bus size={18} color={theme.colors.primary} />
                </View>
                <View style={styles.stepInfo}>
                  <View style={styles.lineTagRow}>
                    <View style={[styles.badge, { backgroundColor: route.color || theme.colors.primary }]}>
                      <Text style={styles.badgeText}>{route.line1 || route.name}</Text>
                    </View>
                    <Text style={styles.stepTitle}>{route.startStop.name} Durağı</Text>
                  </View>
                  <Text style={styles.stepSub}>Otobüse binin</Text>
                </View>
              </View>
            )}

            {/* 3. Transfer Node if any */}
            {isTransfer && route.transferStop && (
              <>
                <View style={styles.stepRow}>
                  <View style={[styles.stepIconBox, { backgroundColor: '#f59e0b25' }]}>
                    <Repeat size={18} color={theme.colors.warning} />
                  </View>
                  <View style={styles.stepInfo}>
                    <Text style={[styles.stepTitle, { color: theme.colors.warning }]}>
                      {route.transferStop.name} (Aktarma)
                    </Text>
                    <Text style={styles.stepSub}>
                      {route.line1} hattından inip {route.line2} hattına aktarma yapın
                    </Text>
                  </View>
                </View>
              </>
            )}

            {/* 4. Alight End Stop */}
            {!route.isWalkOnly && route.endStop && (
              <View style={styles.stepRow}>
                <View style={[styles.stepIconBox, { backgroundColor: '#ef444425' }]}>
                  <MapPin size={18} color={theme.colors.danger} />
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepTitle}>{route.endStop.name} Durağı</Text>
                  <Text style={styles.stepSub}>Otobüsten inin</Text>
                </View>
              </View>
            )}

            {/* 5. Final Walk */}
            {route.walkDistanceEnd > 0 && (
              <View style={styles.stepRow}>
                <View style={[styles.stepIconBox, { backgroundColor: '#10b98125' }]}>
                  <Flag size={18} color={theme.colors.success} />
                </View>
                <View style={styles.stepInfo}>
                  <Text style={styles.stepTitle}>Hedefe Yürüme</Text>
                  <Text style={styles.stepSub}>
                    {fmtM(route.walkDistanceEnd)} (~{Math.ceil(route.walkDistanceEnd * 1.4 * 12)} dk)
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Fares Card */}
          {!route.isWalkOnly && (
            <View style={styles.fareCard}>
              <Text style={styles.fareCardTitle}>Tahmini Bilet Ücreti (2026)</Text>
              <View style={styles.fareGrid}>
                <View style={styles.fareBox}>
                  <Text style={styles.fareBoxType}>{FARES.ogrenci.label}</Text>
                  <Text style={styles.fareBoxVal}>
                    {formatFare(calculateFare('ogrenci', isTransfer))}
                  </Text>
                </View>

                <View style={styles.fareBox}>
                  <Text style={styles.fareBoxType}>{FARES.tam.label}</Text>
                  <Text style={styles.fareBoxVal}>
                    {formatFare(calculateFare('tam', isTransfer))}
                  </Text>
                </View>

                <View style={styles.fareBox}>
                  <Text style={styles.fareBoxType}>{FARES.temassiz.label}</Text>
                  <Text style={styles.fareBoxVal}>
                    {formatFare(calculateFare('temassiz', isTransfer))}
                  </Text>
                </View>
              </View>
              {isTransfer && (
                <Text style={styles.fareNote}>* 45 dakika içi aktarma indirimi dahil edilmiştir.</Text>
              )}
            </View>
          )}
        </ScrollView>
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textMain,
  },
  headerSub: {
    fontSize: 13,
    color: theme.colors.textDim,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    padding: 16,
  },
  timelineCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 18,
  },
  stepIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInfo: {
    flex: 1,
  },
  lineTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  stepSub: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  fareCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  fareCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.textMain,
    marginBottom: 12,
  },
  fareGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  fareBox: {
    flex: 1,
    backgroundColor: theme.colors.surfaceHover,
    borderRadius: theme.radius.sm,
    padding: 10,
    alignItems: 'center',
  },
  fareBoxType: {
    fontSize: 11,
    color: theme.colors.textDim,
    textAlign: 'center',
    marginBottom: 4,
  },
  fareBoxVal: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  fareNote: {
    fontSize: 11,
    color: theme.colors.textDim,
    marginTop: 8,
    textAlign: 'center',
  },
});
