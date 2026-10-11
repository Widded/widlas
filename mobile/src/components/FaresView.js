import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { X, Check, Phone } from 'lucide-react-native';
import { theme } from '../theme';

export default function FaresView({
  selectedType,
  onSelectType,
  fareType,
  setFareType,
  onClose
}) {
  const currentType = selectedType || fareType || 'ogrenci';
  const handleSelect = onSelectType || setFareType || (() => {});

  const handleCall = () => {
    Linking.openURL('tel:02842139140').catch(() => {});
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.headerTitle}>Ücret Tarifeleri</Text>
          <Text style={styles.headerSubtitle}>ETUS 2026 Resmi Fiyatlandırma</Text>
        </View>

        {onClose && (
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={16} color={theme.colors.textPrimary} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Kentkart Seçimi */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>KENTKART TARİFELERİ (UYGULAMA TERCİHİ)</Text>
          <View style={styles.tableCard}>
            {/* Öğrenci Row */}
            <TouchableOpacity
              style={[styles.tableRow, currentType === 'ogrenci' && styles.tableRowSelected]}
              onPress={() => handleSelect('ogrenci')}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeftCol}>
                <View style={styles.titleWithCheck}>
                  <Text style={styles.rowTitle}>Öğrenci Kentkart</Text>
                  {currentType === 'ogrenci' && (
                    <View style={styles.activeCheckBadge}>
                      <Check size={11} color={theme.colors.primary} />
                    </View>
                  )}
                </View>
                <Text style={styles.rowSub}>Trakya Üni. ve örgün eğitim öğrencileri</Text>
              </View>
              <Text style={[styles.priceTag, currentType === 'ogrenci' && styles.priceTagActive]}>
                20,00 ₺
              </Text>
            </TouchableOpacity>

            <View style={styles.tableDivider} />

            {/* Sivil Row */}
            <TouchableOpacity
              style={[styles.tableRow, currentType === 'tam' && styles.tableRowSelected]}
              onPress={() => handleSelect('tam')}
              activeOpacity={0.7}
            >
              <View style={styles.rowLeftCol}>
                <View style={styles.titleWithCheck}>
                  <Text style={styles.rowTitle}>Sivil Kentkart</Text>
                  {currentType === 'tam' && (
                    <View style={styles.activeCheckBadge}>
                      <Check size={11} color={theme.colors.primary} />
                    </View>
                  )}
                </View>
                <Text style={styles.rowSub}>Standart tam şehir içi biniş tarifesi</Text>
              </View>
              <Text style={[styles.priceTag, currentType === 'tam' && styles.priceTagActive]}>
                30,00 ₺
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Temassız ve QR */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>DİJİTAL & TEMASSIZ ÖDEME</Text>
          <View style={styles.tableCard}>
            <View style={styles.tableRowStatic}>
              <View style={styles.rowLeftCol}>
                <Text style={styles.rowTitle}>Kredi Kartı / QR Biniş</Text>
                <Text style={styles.rowSub}>Temassız banka/kredi kartı veya mobil QR</Text>
              </View>
              <Text style={styles.priceTagMuted}>33,00 ₺</Text>
            </View>
          </View>
        </View>

        {/* Section 3: Aktarma Kuralları */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>AKTARMA KURALLARI (45 DAKİKA İÇİNDE)</Text>
          <View style={styles.tableCard}>
            <View style={styles.tableRowStatic}>
              <View style={styles.rowLeftCol}>
                <Text style={styles.rowTitle}>Öğrenci 2. Biniş</Text>
                <Text style={styles.rowSub}>İlk basımdan sonraki 45 dakika boyunca</Text>
              </View>
              <Text style={styles.priceTagMuted}>10,00 ₺</Text>
            </View>

            <View style={styles.tableDivider} />

            <View style={styles.tableRowStatic}>
              <View style={styles.rowLeftCol}>
                <Text style={styles.rowTitle}>Sivil 2. Biniş</Text>
                <Text style={styles.rowSub}>İlk basımdan sonraki 45 dakika boyunca</Text>
              </View>
              <Text style={styles.priceTagMuted}>15,00 ₺</Text>
            </View>
          </View>
        </View>

        {/* Section 4: Gece Seferleri */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionLabel}>GECE NÖBETÇİ SEFERLERİ</Text>
          <View style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>00:00 - 06:00 Nöbetçi Hatlar</Text>
            <Text style={styles.noticeBody}>
              1A, 3, 3A ve Otogar - Tıp Fakültesi güzergahında gece boyunca nöbetçi ETUS araçları sefer yapmaktadır.
            </Text>
          </View>
        </View>

        {/* Section 5: Destek Hattı */}
        <View style={styles.supportCard}>
          <View style={styles.supportTextCol}>
            <Text style={styles.supportTitle}>ETUS Danışma ve Destek</Text>
            <Text style={styles.supportSub}>Kayıp eşya ve sefer bilgisi</Text>
          </View>
          <TouchableOpacity style={styles.callBtn} onPress={handleCall} activeOpacity={0.8}>
            <Phone size={13} color={theme.colors.textPrimary} />
            <Text style={styles.callBtnText}>0284 213 91 40</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
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
    paddingBottom: 40,
    gap: 18,
  },
  sectionBlock: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.textMuted,
    letterSpacing: 0.5,
    marginLeft: 2,
  },
  tableCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  tableRowSelected: {
    backgroundColor: theme.colors.surfaceHover,
  },
  tableRowStatic: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  tableDivider: {
    height: 1,
    backgroundColor: theme.colors.hairline,
    marginLeft: 14,
  },
  rowLeftCol: {
    flex: 1,
    paddingRight: 12,
  },
  titleWithCheck: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowTitle: {
    fontSize: 13.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  activeCheckBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowSub: {
    fontSize: 11.5,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  priceTag: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.fare,
    letterSpacing: -0.2,
  },
  priceTagActive: {
    color: theme.colors.primary,
  },
  priceTagMuted: {
    fontSize: 14.5,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: -0.2,
  },
  noticeCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  noticeTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  noticeBody: {
    fontSize: 11.5,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  supportTextCol: {
    flex: 1,
  },
  supportTitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  supportSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 1,
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.surfaceHover,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  callBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
});
