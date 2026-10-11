import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { CreditCard, GraduationCap, User, Clock, Moon, Phone, ShieldCheck, Zap } from 'lucide-react-native';
import { theme } from '../theme';

export default function FaresView({ fareType, setFareType }) {
  const handleCall = () => {
    Linking.openURL('tel:02842139140').catch(() => {});
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Wallet Header */}
      <View style={styles.header}>
        <Text style={styles.title}>ETUS 2026 Tarife & Kart</Text>
        <Text style={styles.subtitle}>Edirne Toplu Ulaşım Sistemi Resmi Ücret Tarifeleri</Text>
      </View>

      {/* Digital Transit Pass Cards */}
      <View style={styles.passesSection}>
        {/* Student Pass Card */}
        <TouchableOpacity
          style={[styles.passCard, fareType === 'ogrenci' && styles.passCardActiveStudent]}
          onPress={() => setFareType('ogrenci')}
          activeOpacity={0.8}
        >
          <View style={styles.passTopRow}>
            <View style={[styles.passIconBox, { backgroundColor: theme.colors.successLight }]}>
              <GraduationCap size={20} color={theme.colors.success} />
            </View>
            <View style={styles.passBadgeCol}>
              <Text style={styles.passCategory}>İNDİRİMLİ TARİFE</Text>
              <Text style={styles.passTitle}>Öğrenci Kentkart</Text>
            </View>
            <Text style={[styles.passPrice, { color: theme.colors.success }]}>20,00 ₺</Text>
          </View>
          <Text style={styles.passDetail}>
            Trakya Üniversitesi ve tüm örgün lise/ortaokul öğrencileri için geçerlidir.
          </Text>
          {fareType === 'ogrenci' && (
            <View style={styles.activeTagStudent}>
              <Zap size={11} color="#FFFFFF" />
              <Text style={styles.activeTagText}>Uygulamada Aktif Tarife</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Adult Standard Pass Card */}
        <TouchableOpacity
          style={[styles.passCard, fareType === 'tam' && styles.passCardActiveAdult]}
          onPress={() => setFareType('tam')}
          activeOpacity={0.8}
        >
          <View style={styles.passTopRow}>
            <View style={[styles.passIconBox, { backgroundColor: theme.colors.primaryLight }]}>
              <User size={20} color={theme.colors.primaryGlow} />
            </View>
            <View style={styles.passBadgeCol}>
              <Text style={styles.passCategory}>STANDART TARİFE</Text>
              <Text style={styles.passTitle}>Sivil Kentkart</Text>
            </View>
            <Text style={[styles.passPrice, { color: theme.colors.primaryGlow }]}>30,00 ₺</Text>
          </View>
          <Text style={styles.passDetail}>
            Tüm vatandaşlar için standart şehir içi ETUS biniş tarifesi.
          </Text>
          {fareType === 'tam' && (
            <View style={styles.activeTagAdult}>
              <Zap size={11} color="#FFFFFF" />
              <Text style={styles.activeTagText}>Uygulamada Aktif Tarife</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Contactless / QR Pass Card */}
        <View style={styles.passCard}>
          <View style={styles.passTopRow}>
            <View style={[styles.passIconBox, { backgroundColor: theme.colors.warningLight }]}>
              <CreditCard size={20} color={theme.colors.warning} />
            </View>
            <View style={styles.passBadgeCol}>
              <Text style={styles.passCategory}>KARTSIZ / TEMASSIZ</Text>
              <Text style={styles.passTitle}>Kredi Kartı & QR</Text>
            </View>
            <Text style={[styles.passPrice, { color: theme.colors.warning }]}>33,00 ₺</Text>
          </View>
          <Text style={styles.passDetail}>
            Kentkart olmadan temassız banka/kredi kartı veya mobil QR ile binişlerde geçerlidir.
          </Text>
        </View>
      </View>

      {/* 45 Min Transfer Discount Rule */}
      <View style={styles.infoBox}>
        <View style={styles.infoTitleRow}>
          <Clock size={16} color={theme.colors.primaryGlow} />
          <Text style={styles.infoBoxTitle}>45 Dakika Aktarma Kuralı</Text>
        </View>
        <Text style={styles.infoBoxBody}>
          İlk binişten sonraki 45 dakika içerisinde yapılan 2. hat binişlerinde indirimli tarife otomatik yansıtılır:
        </Text>
        <View style={styles.transferRatesRow}>
          <View style={styles.transferRatePill}>
            <Text style={styles.rateRole}>Öğrenci 2. Biniş</Text>
            <Text style={[styles.rateValue, { color: theme.colors.success }]}>10,00 ₺</Text>
          </View>
          <View style={styles.transferRatePill}>
            <Text style={styles.rateRole}>Sivil 2. Biniş</Text>
            <Text style={[styles.rateValue, { color: theme.colors.primaryGlow }]}>15,00 ₺</Text>
          </View>
        </View>
      </View>

      {/* Night Owl Service Notice */}
      <View style={styles.infoBox}>
        <View style={styles.infoTitleRow}>
          <Moon size={16} color={theme.colors.warning} />
          <Text style={styles.infoBoxTitle}>Gece Nöbetçi Seferleri (00:00 - 06:00)</Text>
        </View>
        <Text style={styles.infoBoxBody}>
          Gece 00:00 ile 06:00 saatleri arasında 1A, 3 ve 3A ana hatları ile Otogar - Tıp Fakültesi hattında nöbetçi servisler sefer yapmaktadır.
        </Text>
      </View>

      {/* ETUS Hotline Support */}
      <View style={styles.hotlineBox}>
        <View style={styles.hotlineInfo}>
          <Text style={styles.hotlineTitle}>ETUS Danışma & Destek</Text>
          <Text style={styles.hotlineSub}>Kayıp eşya, durak şikayeti ve sefer bilgisi</Text>
        </View>
        <TouchableOpacity style={styles.callButton} onPress={handleCall} activeOpacity={0.8}>
          <Phone size={14} color="#FFFFFF" />
          <Text style={styles.callButtonText}>0284 213 91 40</Text>
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
    fontWeight: '900',
    color: theme.colors.textMain,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 3,
  },
  passesSection: {
    gap: 12,
    marginBottom: 16,
  },
  passCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  passCardActiveStudent: {
    borderColor: theme.colors.success,
    backgroundColor: theme.colors.surfaceElevated,
  },
  passCardActiveAdult: {
    borderColor: theme.colors.primaryGlow,
    backgroundColor: theme.colors.surfaceElevated,
  },
  passTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  passIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passBadgeCol: {
    flex: 1,
  },
  passCategory: {
    fontSize: 9,
    fontWeight: '800',
    color: theme.colors.textTertiary,
    letterSpacing: 0.5,
  },
  passTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textMain,
  },
  passPrice: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  passDetail: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 17,
  },
  activeTagStudent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  activeTagAdult: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.sm,
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  activeTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  infoBox: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.hairline,
    marginBottom: 14,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoBoxTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.textMain,
  },
  infoBoxBody: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  transferRatesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  transferRatePill: {
    flex: 1,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.md,
    padding: 12,
    alignItems: 'center',
  },
  rateRole: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '700',
    marginBottom: 4,
  },
  rateValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  hotlineBox: {
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
  hotlineInfo: {
    flex: 1,
  },
  hotlineTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.textMain,
  },
  hotlineSub: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.primary,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: theme.radius.sm,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
