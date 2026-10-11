import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert
} from 'react-native';
import {
  ArrowLeft,
  Plus,
  Home,
  Briefcase,
  MapPin,
  ChevronRight,
  MoreVertical
} from 'lucide-react-native';

const INITIAL_PRIMARY_PLACES = [
  {
    id: 'home',
    title: 'Ev',
    subtitle: 'Şükrüpaşa, Edirne',
    category: 'home',
    lat: 41.6670,
    lon: 26.5911
  },
  {
    id: 'work',
    title: 'İş',
    subtitle: 'Saraçlar Caddesi, Edirne',
    category: 'work',
    lat: 41.6735,
    lon: 26.5537
  }
];

const INITIAL_SAVED_PLACES = [
  {
    id: 'erasta',
    title: 'Erasta AVM',
    subtitle: 'Abdurrahman, Edirne',
    category: 'other',
    lat: 41.6663,
    lon: 26.5710
  },
  {
    id: 'uni',
    title: 'Trakya Üniversitesi',
    subtitle: 'Balkan Yerleşkesi, Edirne',
    category: 'other',
    lat: 41.6389,
    lon: 26.6150
  },
  {
    id: 'margi',
    title: 'Margi Outlet',
    subtitle: '1. Murat, Edirne',
    category: 'other',
    lat: 41.6620,
    lon: 26.5813
  },
  {
    id: 'otogar',
    title: 'Edirne Otogar',
    subtitle: 'Terminal, Edirne',
    category: 'other',
    lat: 41.6320,
    lon: 26.6184
  },
  {
    id: 'selimiye',
    title: 'Selimiye Camii',
    subtitle: 'Meydan, Edirne',
    category: 'other',
    lat: 41.6781,
    lon: 26.5594
  },
  {
    id: 'karaagac',
    title: 'Karaağaç Lozan Anıtı',
    subtitle: 'Karaağaç, Edirne',
    category: 'other',
    lat: 41.6535,
    lon: 26.5208
  },
  {
    id: 'hastane',
    title: 'Sultan 1. Murat Devlet Hastanesi',
    subtitle: 'Kocasinan, Edirne',
    category: 'other',
    lat: 41.6545,
    lon: 26.6060
  }
];

export default function SavedView({
  onSelectPlace,
  onOpenSearch,
  onBack,
  topPadding = 12,
  bottomPadding = 80
}) {
  const [selectedSegment, setSelectedSegment] = useState('all'); // 'all' | 'home' | 'work' | 'other'
  const [primaryPlaces, setPrimaryPlaces] = useState(INITIAL_PRIMARY_PLACES);
  const [savedPlaces, setSavedPlaces] = useState(INITIAL_SAVED_PLACES);

  // Handle item options (More button)
  const handleItemOptions = (item) => {
    Alert.alert(
      item.title,
      item.subtitle,
      [
        {
          text: 'Rotayı Başlat',
          onPress: () => onSelectPlace(item)
        },
        {
          text: 'Listeden Kaldır',
          style: 'destructive',
          onPress: () => {
            setPrimaryPlaces(prev => prev.filter(p => p.id !== item.id));
            setSavedPlaces(prev => prev.filter(p => p.id !== item.id));
          }
        },
        { text: 'Vazgeç', style: 'cancel' }
      ]
    );
  };

  // Filter items based on segmented control
  const showPrimary =
    selectedSegment === 'all' || selectedSegment === 'home' || selectedSegment === 'work';
  const showOther = selectedSegment === 'all' || selectedSegment === 'other';

  const filteredPrimary = primaryPlaces.filter(p => {
    if (selectedSegment === 'home') return p.id === 'home';
    if (selectedSegment === 'work') return p.id === 'work';
    return true;
  });

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* 1. Header Row (Back Arrow & Plus Button) */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          style={styles.iconNavBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.plusBtn}
          onPress={onOpenSearch}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Plus size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 2. Page Title & Subtitle */}
      <View style={styles.titleContainer}>
        <Text style={styles.pageTitle}>Kaydedilenler</Text>
        <Text style={styles.pageSubtitle}>
          Daha sonra kolayca ulaşmak için konumlarını kaydet.
        </Text>
      </View>

      {/* 3. Segmented Capsule Control (Tümü, Ev, İş, Diğer) */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[
            styles.segmentTab,
            selectedSegment === 'all' && styles.segmentTabActive
          ]}
          onPress={() => setSelectedSegment('all')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentText,
              selectedSegment === 'all' && styles.segmentTextActive
            ]}
          >
            Tümü
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentTab,
            selectedSegment === 'home' && styles.segmentTabActive
          ]}
          onPress={() => setSelectedSegment('home')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentText,
              selectedSegment === 'home' && styles.segmentTextActive
            ]}
          >
            Ev
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentTab,
            selectedSegment === 'work' && styles.segmentTabActive
          ]}
          onPress={() => setSelectedSegment('work')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentText,
              selectedSegment === 'work' && styles.segmentTextActive
            ]}
          >
            İş
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentTab,
            selectedSegment === 'other' && styles.segmentTabActive
          ]}
          onPress={() => setSelectedSegment('other')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentText,
              selectedSegment === 'other' && styles.segmentTextActive
            ]}
          >
            Diğer
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Scrollable Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding + 30 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION 1: ÖNE ÇIKANLAR (Ev & İş) */}
        {showPrimary && filteredPrimary.length > 0 && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeaderTitle}>ÖNE ÇIKANLAR</Text>

            <View style={styles.cardList}>
              {filteredPrimary.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.cardItem}
                  onPress={() => onSelectPlace(item)}
                  activeOpacity={0.75}
                >
                  <View style={styles.iconCircle}>
                    {item.id === 'home' ? (
                      <Home size={19} color="#E2E8F0" />
                    ) : (
                      <Briefcase size={19} color="#E2E8F0" />
                    )}
                  </View>

                  <View style={styles.textColumn}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                  </View>

                  <View style={styles.rightActionsRow}>
                    <ChevronRight size={18} color="#475569" />
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleItemOptions(item);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                      style={styles.dotsBtn}
                    >
                      <MoreVertical size={18} color="#475569" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* SECTION 2: KAYDEDİLEN YERLER */}
        {showOther && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionHeaderTitle}>KAYDEDİLEN YERLER</Text>

            <View style={styles.cardList}>
              {savedPlaces.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.cardItem}
                  onPress={() => onSelectPlace(item)}
                  activeOpacity={0.75}
                >
                  <View style={styles.iconCircle}>
                    <MapPin size={19} color="#E2E8F0" />
                  </View>

                  <View style={styles.textColumn}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
                  </View>

                  <View style={styles.rightActionsRow}>
                    <ChevronRight size={18} color="#475569" />
                    <TouchableOpacity
                      onPress={(e) => {
                        e.stopPropagation();
                        handleItemOptions(item);
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                      style={styles.dotsBtn}
                    >
                      <MoreVertical size={18} color="#475569" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090B0F',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  iconNavBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  plusBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  titleContainer: {
    paddingHorizontal: 20,
    marginTop: 6,
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 27,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 13.5,
    color: '#94A3B8',
    marginTop: 6,
    lineHeight: 18,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(22, 27, 34, 0.8)',
    marginHorizontal: 20,
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginBottom: 20,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  segmentTabActive: {
    backgroundColor: '#202633',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94A3B8',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 22,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
    marginLeft: 2,
  },
  cardList: {
    gap: 8,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12161E',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#181E29',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  textColumn: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15.5,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dotsBtn: {
    padding: 2,
  },
});
