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
  Trash2,
  Clock,
  Navigation,
  Bus,
  MapPin,
  ChevronRight,
  MoreVertical,
  RotateCcw
} from 'lucide-react-native';

const INITIAL_TODAY_HISTORY = [
  {
    id: 'h1',
    title: 'Erasta AVM → Tıp Fakültesi',
    subtitle: 'Hat 3 ile · Bugün 14:20 · 20 ₺',
    type: 'route',
    from: { name: 'Erasta AVM', lat: 41.6663, lon: 26.5710 },
    to: { name: 'Trakya Üni. Tıp Fakültesi', lat: 41.6389, lon: 26.6150 },
    lineCode: '3'
  },
  {
    id: 'h2',
    title: 'Saraçlar Caddesi',
    subtitle: 'Mekan Araması · Bugün 11:05',
    type: 'place',
    to: { name: 'Saraçlar Caddesi', lat: 41.6735, lon: 26.5537 }
  }
];

const INITIAL_WEEK_HISTORY = [
  {
    id: 'h3',
    title: 'Edirne Otogar → Şükrüpaşa Gölet',
    subtitle: 'Hat 1T ile · Dün 18:45 · 20 ₺',
    type: 'route',
    from: { name: 'Edirne Otogar', lat: 41.6320, lon: 26.6184 },
    to: { name: 'Şükrüpaşa Gölet', lat: 41.6670, lon: 26.5911 },
    lineCode: '1T'
  },
  {
    id: 'h4',
    title: 'Trakya Üniversitesi Balkan Kampüsü',
    subtitle: 'Rotalandı · 3 gün önce · 16:30',
    type: 'place',
    to: { name: 'Trakya Üniversitesi Balkan Kampüsü', lat: 41.6395, lon: 26.6190 }
  },
  {
    id: 'h5',
    title: 'Selimiye Camii & Heykel',
    subtitle: 'Merkez · 4 gün önce · 12:15',
    type: 'place',
    to: { name: 'Selimiye Camii', lat: 41.6781, lon: 26.5594 }
  },
  {
    id: 'h6',
    title: 'Karaağaç Lozan Anıtı',
    subtitle: 'Hat 2A ile · 5 gün önce · 15:40',
    type: 'route',
    from: { name: 'Merkez Heykel', lat: 41.6771, lon: 26.5550 },
    to: { name: 'Karaağaç Lozan Anıtı', lat: 41.6535, lon: 26.5208 },
    lineCode: '2A'
  },
  {
    id: 'h7',
    title: 'Margi Outlet',
    subtitle: 'Alışveriş · 6 gün önce · 19:10',
    type: 'place',
    to: { name: 'Margi Outlet', lat: 41.6620, lon: 26.5813 }
  }
];

export default function HistoryView({
  onSelectHistoryItem,
  onBack,
  topPadding = 12,
  bottomPadding = 80
}) {
  const [selectedSegment, setSelectedSegment] = useState('all'); // 'all' | 'routes' | 'places'
  const [todayList, setTodayList] = useState(INITIAL_TODAY_HISTORY);
  const [weekList, setWeekList] = useState(INITIAL_WEEK_HISTORY);

  // Clear all history
  const handleClearAll = () => {
    Alert.alert(
      'Geçmişi Temizle',
      'Tüm seyahat ve arama geçmişiniz silinsin mi?',
      [
        {
          text: 'Temizle',
          style: 'destructive',
          onPress: () => {
            setTodayList([]);
            setWeekList([]);
          }
        },
        { text: 'Vazgeç', style: 'cancel' }
      ]
    );
  };

  // Item options menu
  const handleItemOptions = (item) => {
    Alert.alert(
      item.title,
      item.subtitle,
      [
        {
          text: 'Rotayı Tekrarla',
          onPress: () => onSelectHistoryItem(item)
        },
        {
          text: 'Geçmişten Sil',
          style: 'destructive',
          onPress: () => {
            setTodayList(prev => prev.filter(x => x.id !== item.id));
            setWeekList(prev => prev.filter(x => x.id !== item.id));
          }
        },
        { text: 'Vazgeç', style: 'cancel' }
      ]
    );
  };

  // Filter items
  const filterFilterFn = (item) => {
    if (selectedSegment === 'routes') return item.type === 'route';
    if (selectedSegment === 'places') return item.type === 'place';
    return true;
  };

  const filteredToday = todayList.filter(filterFilterFn);
  const filteredWeek = weekList.filter(filterFilterFn);
  const isEmpty = filteredToday.length === 0 && filteredWeek.length === 0;

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      {/* 1. Header Row (Back Arrow & Clear Button) */}
      <View style={styles.topNavRow}>
        <TouchableOpacity
          style={styles.iconNavBtn}
          onPress={onBack}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>

        {!isEmpty && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClearAll}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Trash2 size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Page Title & Subtitle */}
      <View style={styles.titleContainer}>
        <Text style={styles.pageTitle}>Geçmiş</Text>
        <Text style={styles.pageSubtitle}>
          Son aradığınız rotalar ve ziyaret ettiğiniz duraklar.
        </Text>
      </View>

      {/* 3. Segmented Capsule Control (Tümü, Rotalar, Mekanlar) */}
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
            selectedSegment === 'routes' && styles.segmentTabActive
          ]}
          onPress={() => setSelectedSegment('routes')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentText,
              selectedSegment === 'routes' && styles.segmentTextActive
            ]}
          >
            Rotalar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.segmentTab,
            selectedSegment === 'places' && styles.segmentTabActive
          ]}
          onPress={() => setSelectedSegment('places')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentText,
              selectedSegment === 'places' && styles.segmentTextActive
            ]}
          >
            Mekanlar
          </Text>
        </TouchableOpacity>
      </View>

      {/* 4. Scrollable History List */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: bottomPadding + 30 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {isEmpty ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Clock size={36} color="#64748B" />
            </View>
            <Text style={styles.emptyTitle}>Henüz geçmiş kaydı yok</Text>
            <Text style={styles.emptySubtitle}>
              Yaptığınız seyahatler ve aradığınız noktalar burada listelenecektir.
            </Text>
          </View>
        ) : (
          <>
            {/* SECTION 1: BUGÜN */}
            {filteredToday.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeaderTitle}>BUGÜN</Text>

                <View style={styles.cardList}>
                  {filteredToday.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.cardItem}
                      onPress={() => onSelectHistoryItem(item)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.iconCircle}>
                        {item.type === 'route' ? (
                          <Navigation size={19} color="#3B82F6" />
                        ) : (
                          <MapPin size={19} color="#E2E8F0" />
                        )}
                      </View>

                      <View style={styles.textColumn}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.itemSubtitle} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
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

            {/* SECTION 2: BU HAFTA */}
            {filteredWeek.length > 0 && (
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeaderTitle}>BU HAFTA</Text>

                <View style={styles.cardList}>
                  {filteredWeek.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.cardItem}
                      onPress={() => onSelectHistoryItem(item)}
                      activeOpacity={0.75}
                    >
                      <View style={styles.iconCircle}>
                        {item.type === 'route' ? (
                          <Navigation size={19} color="#3B82F6" />
                        ) : (
                          <MapPin size={19} color="#E2E8F0" />
                        )}
                      </View>

                      <View style={styles.textColumn}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {item.title}
                        </Text>
                        <Text style={styles.itemSubtitle} numberOfLines={1}>
                          {item.subtitle}
                        </Text>
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
          </>
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
  clearBtn: {
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#12161E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 18,
  },
});
