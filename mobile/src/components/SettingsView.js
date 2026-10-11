import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert
} from 'react-native';
import {
  User,
  Star,
  Bell,
  Map,
  Navigation,
  Crosshair,
  Palette,
  Globe,
  Download,
  Info,
  ChevronRight
} from 'lucide-react-native';

export default function SettingsView({
  topPadding = 12,
  bottomPadding = 80,
  onOpenLines,
  onOpenProfile,
  fareType = 'ogrenci',
  onFareTypeChange,
  mapView: externalMapView,
  onMapViewChange,
  accuracy: externalAccuracy,
  onAccuracyChange,
  walkingDistance: externalWalkingDistance,
  onWalkingDistanceChange,
  notificationsEnabled: externalNotificationsEnabled,
  onNotificationsChange
}) {
  // Internal fallbacks if not controlled
  const [internalNotifs, setInternalNotifs] = useState(true);
  const [internalMapView, setInternalMapView] = useState('Standart');
  const [internalAccuracy, setInternalAccuracy] = useState('Yüksek');
  const [internalWalkingDistance, setInternalWalkingDistance] = useState('500 m');

  const notificationsEnabled = externalNotificationsEnabled !== undefined ? externalNotificationsEnabled : internalNotifs;
  const setNotificationsEnabled = onNotificationsChange || setInternalNotifs;

  const mapView = externalMapView !== undefined ? externalMapView : internalMapView;
  const accuracy = externalAccuracy !== undefined ? externalAccuracy : internalAccuracy;
  const walkingDistance = externalWalkingDistance !== undefined ? externalWalkingDistance : internalWalkingDistance;

  // Cycle Map View
  const handleToggleMapView = () => {
    const nextView = mapView === 'Standart' ? 'Uydu' : 'Standart';
    if (onMapViewChange) {
      onMapViewChange(nextView);
    } else {
      setInternalMapView(nextView);
    }
    Alert.alert('Harita Görünümü', `Harita görünümü "${nextView}" olarak ayarlandı.`);
  };

  // Cycle Accuracy
  const handleToggleAccuracy = () => {
    const nextAcc = accuracy === 'Yüksek' ? 'Dengeli' : 'Yüksek';
    if (onAccuracyChange) {
      onAccuracyChange(nextAcc);
    } else {
      setInternalAccuracy(nextAcc);
    }
    Alert.alert('Konum Doğruluğu', `GPS doğruluğu "${nextAcc}" moduna alındı.`);
  };

  // Cycle Walking Distance
  const handleToggleWalkingDistance = () => {
    const options = ['300 m', '500 m', '1 km'];
    const nextIdx = (options.indexOf(walkingDistance) + 1) % options.length;
    const nextDist = options[nextIdx];
    if (onWalkingDistanceChange) {
      onWalkingDistanceChange(nextDist);
    } else {
      setInternalWalkingDistance(nextDist);
    }
    Alert.alert('Yürüyüş Mesafesi', `Maksimum durak arama mesafesi ${nextDist} olarak güncellendi.`);
  };

  // Theme info
  const handleThemePress = () => {
    Alert.alert('Tema', 'OLED Koyu Mod şu anda aktif ve optimize edilmiştir.');
  };

  // Language info
  const handleLanguagePress = () => {
    Alert.alert('Dil Tercihi', 'Mevcut dil: Türkçe (Varsayılan)');
  };

  // Update check
  const handleUpdateCheck = () => {
    Alert.alert('Uygulama Güncellemeleri', 'Edirne Ulaşım v1.2.0 son sürümdür. Tüm ETUS hatları ve durakları günceldir.');
  };

  // About modal / info
  const handleAboutPress = () => {
    Alert.alert(
      'Edirne Ulaşım Hakkında',
      'Edirne Ulaşım (ETUS Asistanı) v1.2.0\n\nEdirne toplu taşıma hatları, canlı durak kalkış saatleri, akıllı aktarma algoritmaları ve gerçek yaya rota hesaplaması içerir.\n\n© 2026 Harun. Tüm hakları saklıdır.'
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: topPadding + 16,
            paddingBottom: bottomPadding + 32
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. PAGE TITLE & SUBTITLE */}
        <View style={styles.headerContainer}>
          <Text style={styles.pageTitle}>Ayarlar</Text>
          <Text style={styles.pageSubtitle}>Uygulamanı kişiselleştir.</Text>
        </View>

        {/* 2. USER PROFILE CARD */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={onOpenProfile}
          activeOpacity={0.7}
        >
          <View style={styles.avatarCircle}>
            <User size={22} color="#CBD5E1" />
          </View>
          <View style={styles.profileTextCol}>
            <Text style={styles.profileName}>Harun</Text>
            <Text style={styles.profileEmail}>harun@***.com</Text>
          </View>
          <ChevronRight size={18} color="#475569" />
        </TouchableOpacity>

        {/* 3. SECTION: ULAŞIM TERCİHLERİ (Excluded 'Varsayılan Ulaşım Türü' as requested) */}
        <Text style={styles.sectionTitle}>Ulaşım Tercihleri</Text>
        <View style={styles.cardGroup}>
          {/* Row 1: Favori Hatlar */}
          <TouchableOpacity
            style={styles.rowItem}
            onPress={onOpenLines}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Star size={18} color="#CBD5E1" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Favori Hatlar</Text>
              <Text style={styles.rowSubtitle}>Sık kullandığın hatları seç</Text>
            </View>
            <ChevronRight size={18} color="#475569" />
          </TouchableOpacity>

          <View style={styles.rowSeparator} />

          {/* Row 2: Bildirimler */}
          <View style={styles.rowItem}>
            <View style={styles.iconCircle}>
              <Bell size={18} color="#CBD5E1" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Bildirimler</Text>
              <Text style={styles.rowSubtitle}>Hat değişiklikleri ve gecikmeler</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#1E2538', true: '#3B82F6' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#1E2538"
            />
          </View>
        </View>

        {/* 4. SECTION: HARİTA AYARLARI */}
        <Text style={styles.sectionTitle}>Harita Ayarları</Text>
        <View style={styles.cardGroup}>
          {/* Row 1: Harita Görünümü */}
          <TouchableOpacity
            style={styles.rowItem}
            onPress={handleToggleMapView}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Map size={18} color="#CBD5E1" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Harita Görünümü</Text>
              <Text style={styles.rowSubtitle}>Uydu / Standart</Text>
            </View>
            <View style={styles.valueRow}>
              <Text style={styles.valueText}>{mapView}</Text>
              <ChevronRight size={16} color="#475569" />
            </View>
          </TouchableOpacity>

          <View style={styles.rowSeparator} />

          {/* Row 2: Konum Doğruluğu */}
          <TouchableOpacity
            style={styles.rowItem}
            onPress={handleToggleAccuracy}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Navigation size={18} color="#CBD5E1" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Konum Doğruluğu</Text>
              <Text style={styles.rowSubtitle}>Daha hassas konum için</Text>
            </View>
            <View style={styles.valueRow}>
              <Text style={styles.valueText}>{accuracy}</Text>
              <ChevronRight size={16} color="#475569" />
            </View>
          </TouchableOpacity>

          <View style={styles.rowSeparator} />

          {/* Row 3: Yürüyüş Mesafesi */}
          <TouchableOpacity
            style={styles.rowItem}
            onPress={handleToggleWalkingDistance}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Crosshair size={18} color="#CBD5E1" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Yürüyüş Mesafesi</Text>
              <Text style={styles.rowSubtitle}>Durakları gösterme mesafesi</Text>
            </View>
            <View style={styles.valueRow}>
              <Text style={styles.valueText}>{walkingDistance}</Text>
              <ChevronRight size={16} color="#475569" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 5. SECTION: UYGULAMA */}
        <Text style={styles.sectionTitle}>Uygulama</Text>
        <View style={styles.cardGroup}>
          {/* Row 1: Tema */}
          <TouchableOpacity
            style={styles.rowItem}
            onPress={handleThemePress}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Palette size={18} color="#CBD5E1" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Tema</Text>
              <Text style={styles.rowSubtitle}>Koyu mod</Text>
            </View>
            <View style={styles.valueRow}>
              <Text style={styles.valueText}>Koyu</Text>
              <ChevronRight size={16} color="#475569" />
            </View>
          </TouchableOpacity>

          <View style={styles.rowSeparator} />

          {/* Row 2: Dil */}
          <TouchableOpacity
            style={styles.rowItem}
            onPress={handleLanguagePress}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Globe size={18} color="#CBD5E1" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Dil</Text>
              <Text style={styles.rowSubtitle}>Uygulama dili</Text>
            </View>
            <View style={styles.valueRow}>
              <Text style={styles.valueText}>Türkçe</Text>
              <ChevronRight size={16} color="#475569" />
            </View>
          </TouchableOpacity>

          <View style={styles.rowSeparator} />

          {/* Row 3: Uygulama Güncellemeleri */}
          <TouchableOpacity
            style={styles.rowItem}
            onPress={handleUpdateCheck}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Download size={18} color="#CBD5E1" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Uygulama Güncellemeleri</Text>
              <Text style={styles.rowSubtitle}>Son sürüm</Text>
            </View>
            <View style={styles.valueRow}>
              <Text style={styles.valueText}>v1.2.0</Text>
              <ChevronRight size={16} color="#475569" />
            </View>
          </TouchableOpacity>

          <View style={styles.rowSeparator} />

          {/* Row 4: Hakkında */}
          <TouchableOpacity
            style={styles.rowItem}
            onPress={handleAboutPress}
            activeOpacity={0.7}
          >
            <View style={styles.iconCircle}>
              <Info size={18} color="#CBD5E1" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Hakkında</Text>
              <Text style={styles.rowSubtitle}>Uygulama bilgileri</Text>
            </View>
            <ChevronRight size={18} color="#475569" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090B0F'
  },
  scrollContent: {
    paddingHorizontal: 20
  },
  headerContainer: {
    marginBottom: 20
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.4
  },
  pageSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4
  },
  profileCard: {
    backgroundColor: '#12161E',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E2538',
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1E2538',
    alignItems: 'center',
    justifyContent: 'center'
  },
  profileTextCol: {
    flex: 1,
    marginLeft: 14
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF'
  },
  profileEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 22,
    marginBottom: 8,
    marginLeft: 4
  },
  cardGroup: {
    backgroundColor: '#12161E',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E2538',
    overflow: 'hidden'
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E2538',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rowTextCol: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center'
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF'
  },
  rowSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  valueText: {
    fontSize: 13,
    color: '#94A3B8',
    marginRight: 6
  },
  rowSeparator: {
    height: 1,
    backgroundColor: '#182030',
    marginLeft: 68
  }
});
