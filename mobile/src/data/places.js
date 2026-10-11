export const LOCAL_PLACES = [
  { name: 'Edirne Şehir Merkezi (Heykel)', lat: 41.6771, lon: 26.5550 },
  { name: 'Saraçlar Caddesi', lat: 41.6735, lon: 26.5537 },
  { name: 'Edirne Otogar', lat: 41.6320, lon: 26.6184 },
  { name: 'Erasta AVM', lat: 41.6663, lon: 26.5710 },
  { name: 'Margi Outlet', lat: 41.6620, lon: 26.5813 },
  { name: 'Edirne Devlet Hastanesi (1. Murat)', lat: 41.6545, lon: 26.6060 },
  { name: 'Trakya Üni. Tıp Fakültesi Hastanesi', lat: 41.6389, lon: 26.6150 },
  { name: 'Trakya Üni. Ayşekadın Yerleşkesi', lat: 41.6697, lon: 26.5751 },
  { name: 'Sultan Çelebi Mehmet KYK Yurdu', lat: 41.6965, lon: 26.5819 },
  { name: 'Selimiye KYK Öğrenci Yurdu', lat: 41.6443, lon: 26.6146 },
  { name: 'Şükrüpaşa (Gölet / Marketler)', lat: 41.6670, lon: 26.5911 },
  { name: 'Tunca Köprüsü', lat: 41.6682, lon: 26.5544 },
  { name: 'Meriç Köprüsü (Karaağaç Yolu)', lat: 41.6634, lon: 26.5521 }
];

export const QUICK_PLACES = [
  { icon: '🚌', shortName: 'Otogar', name: 'Edirne Otogar', lat: 41.6320, lon: 26.6184 },
  { icon: '🛍️', shortName: 'Erasta AVM', name: 'Erasta AVM', lat: 41.6663, lon: 26.5710 },
  { icon: '🛒', shortName: 'Margi', name: 'Margi Outlet', lat: 41.6620, lon: 26.5813 },
  { icon: '🎓', shortName: 'Trakya Üni.', name: 'Trakya Üni. Tıp Fakültesi Hastanesi', lat: 41.6389, lon: 26.6150 },
  { icon: '🕌', shortName: 'Selimiye', name: 'Edirne Şehir Merkezi (Heykel)', lat: 41.6771, lon: 26.5550 },
  { icon: '🏛️', shortName: 'Saraçlar', name: 'Saraçlar Caddesi', lat: 41.6735, lon: 26.5537 },
  { icon: '🌳', shortName: 'Karaağaç', name: 'Meriç Köprüsü (Karaağaç Yolu)', lat: 41.6634, lon: 26.5521 }
];

export const normalizeTr = (s) => (s || '')
  .toLocaleLowerCase('tr')
  .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
  .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/g, '');
