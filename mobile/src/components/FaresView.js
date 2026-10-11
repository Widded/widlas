import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { CreditCard, GraduationCap, User, QrCode, Clock, Moon, Phone, AlertCircle, Sparkles } from 'lucide-react-native';
import { theme } from '../theme';

export default function FaresView({ fareType, setFareType }) {
  const handleCall = () => {
    Linking.openURL('tel:02842139140').catch(() => {});
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Title Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ETUS 2026 Tarifeleri</Text>
        <Text style={styles.subtitle}>Güncel Edirne Toplu Ulaşım Ücretleri ve Kuralları</Text>
      </View>

      {/* Main Fares Grid */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Resmi Biniş Ücretleri</Text>

        {/* Ogrenci */}
        <TouchableOpacity
          style={[styles.fareRow, fareType === 'ogrenci' && styles.fareRowActive]}
          onPress={() => setFareType('ogrenci')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBox, { backgroundColor: theme.colors.successLight }]}>
            <GraduationCap size={20} color={theme.colors.success} />
          </View>
          <View style={styles.fareInfo}>
            <View style={styles.fareTitleRow}>
              <Text style={styles.fareName}>Öğrenci Kentkart</Text>
              {fareType === 'ogrenci' && (
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>Seçili</Text>
                </View>
              )}
            </View>
            <Text style={styles.fareDesc}>Tüm örgün eğitim öğrencileri için geçerlidir</Text>
          </View>
          <Text style={[styles.farePrice, { color: theme.colors.success }]}>20,00 ₺</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Tam / Sivil */}
        <TouchableOpacity
          style={[styles.fareRow, fareType === 'tam' && styles.fareRowActive]}
          onPress={() => setFareType('tam')}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBox, { backgroundColor: theme.colors.primaryLight }]}>
            <User size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.fareInfo}>
            <View style={styles.fareTitleRow}>
              <Text style={styles.fareName}>Sivil / Tam Kentkart</Text>
              {fareType === 'tam' && (
                <View style={styles.activePill}>
                  <Text style={styles.activePillText}>Seçili</Text>
                </View>
              )}
            </View>
            <Text style={styles.fareDesc}>Standart Edirne Kentkart binişi</Text>
          </View>
          <Text style={[styles.farePrice, { color: theme.colors.primary }]}>30,00 ₺</Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Temassiz / QR */}
        <View style={styles.fareRow}>
          <View style={[styles.iconBox, { backgroundColor: theme.colors.warningLight }]}>
            <CreditCard size={20} color={theme.colors.warning} />
          </View>
          <View style={styles.fareInfo}>
            <Text style={styles.fareName}>Kredi Kartı / QR / Temassız</Text>
            <Text style={styles.fareDesc}>Banka kartı veya mobil QR ile biniş</Text>
          </View>
          <Text style={[styles.farePrice, { color: theme.colors.warning }]}>33,00 ₺</Text>
        </View>
      </View>

      {/* Transfer Rules Card */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Clock size={16} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>45 Dakika Aktarma Kuralı</Text>
        </View>
        <Text style={styles.cardBodyText}>
          İlk binişten sonraki 45 dakika içerisinde gerçekleşen 2. hat binişlerinde indirimli aktarma tarifesi uygulanır:
        </Text>
        <View style={styles.transferGrid}>
          <View style={styles.transferBox}>
            <Text style={styles.transferBoxLabel}>Öğrenci 2. Biniş</Text>
            <Text style={[styles.transferBoxPrice, { color: theme.colors.success }]}>10,00 ₺</Text>
          </View>
          <View style={styles.transferBox}>
            <Text style={styles.transferBoxLabel}>Tam 2. Biniş</Text>
            <Text style={[styles.transferBoxPrice, { color: theme.colors.primary }]}>15,00 ₺</Text>
          </View>
        </View>
      </View>

      {/* Night Service Info */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Moon size={16} color={theme.colors.warning} />
          <Text style={styles.cardTitle}>Gece Nöbetçi Seferleri (00:00 - 06:00)</Text>
        </View>
        <Text style={styles.cardBodyText}>
          Gece saatlerinde 1A, 3 ve 3A ana güzergah hatları ile Otogar ve Trakya Üniversitesi Tıp Fakültesi arasında nöbetçi seferler hizmet vermektedir. Sefer aralıkları 30-45 dakikadır.
        </Text>
      </View>

      {/* Contact & Support */}
      <View style={styles.contactCard}>
        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>ETUS Danışma & Destek</Text>
          <Text style={styles.contactSub}>Kayıp eşya, hat ve durak şikayetleri için</Text>
        </View>
        <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.8}>
          <Phone size={14} color="#FFFFFF" />
          <Text style={styles.callBtnText}>0284 213 91 40</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textMain,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    marginBottom: 14,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMain,
    marginBottom: 12,
  },
  cardBodyText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  fareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderRadius: theme.radius.md,
  },
  fareRowActive: {
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fareInfo: {
    flex: 1,
  },
  fareTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fareName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  activePill: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activePillText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  fareDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  farePrice: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.hairline,
    marginVertical: 4,
  },
  transferGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  transferBox: {
    flex: 1,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.md,
    padding: 12,
    alignItems: 'center',
  },
  transferBoxLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  transferBoxPrice: {
    fontSize: 17,
    fontWeight: '800',
  },
  contactCard: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textMain,
  },
  contactSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: theme.radius.sm,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
