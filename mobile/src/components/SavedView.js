import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView
} from 'react-native';
import {
  Bookmark,
  Home,
  Briefcase,
  GraduationCap,
  ShoppingBag,
  Bus,
  MapPin,
  Navigation,
  Plus,
  ChevronRight,
  X,
  Star
} from 'lucide-react-native';
import { theme } from '../theme';
import { etusLines } from '../data/db';

const DEFAULT_SAVED_PLACES = [
  {
    id: 'home',
    title: 'Ev',
    address: 'Şükrüpaşa Gölet Parkı & Yerleşim',
    estTime: '22 dk',
    iconType: 'home',
    lat: 41.6670,
    lon: 26.5911,
    tag: 'Birincil Konum'
  },
  {
    id: 'work',
    title: 'İş',
    address: 'Saraçlar Caddesi & Heykel (Merkez)',
    estTime: '35 dk',
    iconType: 'work',
    lat: 41.6735,
    lon: 26.5537,
    tag: 'İş Yeri'
  },
  {
    id: 'uni',
    title: 'Trakya Üniversitesi',
    address: 'Balkan Kampüsü & Tıp Fakültesi',
    estTime: '18 dk',
    iconType: 'uni',
    lat: 41.6389,
    lon: 26.6150,
    tag: 'Eğitim & Kampüs'
  },
  {
    id: 'erasta',
    title: 'Erasta AVM',
    address: 'Abdurrahman Mah. Talat Paşa Cad.',
    estTime: '14 dk',
    iconType: 'mall',
    lat: 41.6663,
    lon: 26.5710,
    tag: 'Alışveriş'
  },
  {
    id: 'otogar',
    title: 'Edirne Otogar',
    address: 'Şehirlerarası Otobüs Terminali',
    estTime: '26 dk',
    iconType: 'bus',
    lat: 41.6320,
    lon: 26.6184,
    tag: 'Ulaşım Merkezi'
  }
];

const FAVORITE_STOPS = [
  {
    id: '20001',
    name: 'Otogar Durağı',
    direction: 'Merkez & Kampüs Yönü',
    lines: ['1T', '2A', '3', '3A', '4A', '7E'],
    lat: 41.632311,
    lon: 26.6195089
  },
  {
    id: '20003',
    name: 'Tıp Fakültesi 1',
    direction: 'Balkan Kampüsü Ana Giriş',
    lines: ['1F', '1G', '2A', '3', '5A'],
    lat: 41.6389,
    lon: 26.6150
  },
  {
    id: '20008',
    name: 'Erasta AVM Durağı',
    direction: 'Talat Paşa Bulvarı Yönü',
    lines: ['1A', '2B', '3C', '7A'],
    lat: 41.667416,
    lon: 26.5716615
  },
  {
    id: '20015',
    name: 'Saraçlar / Çarşı Durağı',
    direction: 'Şehir Merkezi & Bankalar',
    lines: ['1A', '2A', '3A', '4A'],
    lat: 41.6740,
    lon: 26.5540
  }
];

const FAVORITE_LINES = ['1A', '3', '2A', '1T'];

export default function SavedView({
  onSelectPlace,
  onSelectLine,
  onOpenSearch,
  onClose
}) {
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'places' | 'stops' | 'lines'
  const [savedPlaces, setSavedPlaces] = useState(DEFAULT_SAVED_PLACES);

  // Render icon based on type
  const renderPlaceIcon = (iconType) => {
    switch (iconType) {
      case 'home':
        return <Home size={18} color="#E2E8F0" />;
      case 'work':
        return <Briefcase size={18} color="#E2E8F0" />;
      case 'uni':
        return <GraduationCap size={18} color="#E2E8F0" />;
      case 'mall':
        return <ShoppingBag size={18} color="#E2E8F0" />;
      case 'bus':
        return <Bus size={18} color="#E2E8F0" />;
      default:
        return <MapPin size={18} color="#E2E8F0" />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerTitleGroup}>
          <View style={styles.headerBadgeRow}>
            <Bookmark size={15} color="#3B82F6" />
            <Text style={styles.headerBadgeText}>KAYITLI NOKTALAR</Text>
          </View>
          <Text style={styles.headerTitle}>Kaydedilenler</Text>
          <Text style={styles.headerSubtitle}>
            Sık kullandığınız adresler, favori ETUS durakları ve hatlar
          </Text>
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={18} color="#E2E8F0" />
        </TouchableOpacity>
      </View>

      {/* 2. Filter Category Pills */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, filterTab === 'all' && styles.filterChipActive]}
          onPress={() => setFilterTab('all')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, filterTab === 'all' && styles.filterChipTextActive]}>
            Tümü ({savedPlaces.length + FAVORITE_STOPS.length + FAVORITE_LINES.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterTab === 'places' && styles.filterChipActive]}
          onPress={() => setFilterTab('places')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, filterTab === 'places' && styles.filterChipTextActive]}>
            Konumlar ({savedPlaces.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterTab === 'stops' && styles.filterChipActive]}
          onPress={() => setFilterTab('stops')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, filterTab === 'stops' && styles.filterChipTextActive]}>
            Duraklar ({FAVORITE_STOPS.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, filterTab === 'lines' && styles.filterChipActive]}
          onPress={() => setFilterTab('lines')}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, filterTab === 'lines' && styles.filterChipTextActive]}>
            Hatlar ({FAVORITE_LINES.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* SECTION A: KAYITLI ADRESLER / KONUMLAR */}
        {(filterTab === 'all' || filterTab === 'places') && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>SIK KULLANILAN KONUMLAR</Text>
              <TouchableOpacity
                style={styles.addLocationBtn}
                onPress={() => {
                  if (onOpenSearch) onOpenSearch();
                }}
                activeOpacity={0.75}
              >
                <Plus size={13} color="#3B82F6" />
                <Text style={styles.addLocationText}>Yeni Ekle</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.cardList}>
              {savedPlaces.map((place) => (
                <TouchableOpacity
                  key={place.id}
                  style={styles.savedCard}
                  onPress={() => onSelectPlace(place)}
                  activeOpacity={0.75}
                >
                  <View style={styles.iconCircle}>
                    {renderPlaceIcon(place.iconType)}
                  </View>

                  <View style={styles.cardInfoCol}>
                    <View style={styles.cardTitleRow}>
                      <Text style={styles.cardTitle}>{place.title}</Text>
                      {place.tag && (
                        <View style={styles.tagBadge}>
                          <Text style={styles.tagBadgeText}>{place.tag}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                      {place.address}
                    </Text>
                  </View>

                  {/* Quick Route Action Pill */}
                  <View style={styles.routeActionPill}>
                    <Navigation size={13} color="#3B82F6" />
                    <Text style={styles.routeActionText}>{place.estTime || 'Rotala'}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* SECTION B: FAVORİ ETUS DURAKLARI */}
        {(filterTab === 'all' || filterTab === 'stops') && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>FAVORİ ETUS DURAKLARI</Text>
            </View>

            <View style={styles.cardList}>
              {FAVORITE_STOPS.map((stop) => (
                <TouchableOpacity
                  key={stop.id}
                  style={styles.savedCard}
                  onPress={() =>
                    onSelectPlace({
                      name: stop.name,
                      lat: stop.lat,
                      lon: stop.lon,
                      type: 'stop'
                    })
                  }
                  activeOpacity={0.75}
                >
                  <View style={[styles.iconCircle, styles.stopIconCircle]}>
                    <Bus size={18} color="#24C795" />
                  </View>

                  <View style={styles.cardInfoCol}>
                    <Text style={styles.cardTitle}>{stop.name}</Text>
                    <Text style={styles.cardSubtitle} numberOfLines={1}>
                      {stop.direction}
                    </Text>

                    {/* Passing Lines Badges */}
                    <View style={styles.linesBadgeRow}>
                      {stop.lines.map((code) => (
                        <View key={code} style={styles.lineCodeBadge}>
                          <Text style={styles.lineCodeBadgeText}>{code}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <ChevronRight size={18} color="#475569" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* SECTION C: FAVORİ ETUS HATLARI */}
        {(filterTab === 'all' || filterTab === 'lines') && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>FAVORİ HATLAR</Text>
            </View>

            <View style={styles.cardList}>
              {FAVORITE_LINES.map((code) => {
                const lineData = etusLines[code];
                if (!lineData) return null;

                return (
                  <TouchableOpacity
                    key={code}
                    style={styles.savedCard}
                    onPress={() => onSelectLine(lineData, 0)}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.lineCodeCircle,
                        { backgroundColor: lineData.color || '#3B82F6' }
                      ]}
                    >
                      <Text style={styles.lineCodeCircleText}>{lineData.code}</Text>
                    </View>

                    <View style={styles.cardInfoCol}>
                      <Text style={styles.cardTitle}>
                        {lineData.directions?.[0]?.headSign || `Hat ${code}`}
                      </Text>
                      <Text style={styles.cardSubtitle} numberOfLines={1}>
                        {lineData.directions?.[0]?.stopIds?.length || 0} Durak · Seferde
                      </Text>
                    </View>

                    <View style={styles.inspectLineBtn}>
                      <Text style={styles.inspectLineBtnText}>Haritada Gör</Text>
                      <ChevronRight size={13} color="#94A3B8" />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090B0F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitleGroup: {
    flex: 1,
    paddingRight: 16,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  headerBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#3B82F6',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 17,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(22, 27, 34, 0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#12161E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#94A3B8',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 20,
  },
  sectionBlock: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  addLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  addLocationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },
  cardList: {
    gap: 8,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12161E',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#181E29',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
  },
  stopIconCircle: {
    backgroundColor: 'rgba(36, 199, 149, 0.12)',
  },
  lineCodeCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineCodeCircleText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  cardInfoCol: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  tagBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  routeActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  routeActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },
  linesBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 6,
  },
  lineCodeBadge: {
    backgroundColor: '#181E29',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  lineCodeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#24C795',
  },
  inspectLineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#181E29',
  },
  inspectLineBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
});
