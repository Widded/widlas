import React, { useState, useEffect, useRef } from 'react';
import {
  BusFront,
  MapPin,
  Search,
  Navigation,
  Map as MapIcon,
  ArrowRight,
  Footprints,
  Clock,
  LocateFixed,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ArrowUpDown
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const createCustomIcon = (svgString, color) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        background-color: ${color}; 
        width: 32px; 
        height: 32px; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        border-radius: 50%; 
        border: 3px solid white;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -1px rgba(0, 0, 0, 0.1);
        color: white;
      ">
        ${svgString}
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 10px solid ${color};
        margin: -2px auto 0 auto;
        filter: drop-shadow(0px 3px 2px rgba(0,0,0,0.2));
      "></div>
    `,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42]
  });
};

const userLocationSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;
const destinationSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>`;
const busStopSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><circle cx="15" cy="18" r="2"/></svg>`;
const transferSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 14 4-4-4-4"/><path d="M2 10h20"/><path d="m6 10-4 4 4 4"/><path d="M22 14H2"/></svg>`;

const customIcons = {
  start: createCustomIcon(userLocationSvg, '#10b981'), // Emerald
  end: createCustomIcon(destinationSvg, '#ef4444'), // Red
  busStart: createCustomIcon(busStopSvg, '#3b82f6'), // Blue
  transfer: createCustomIcon(transferSvg, '#f59e0b') // Amber
};
import { calculateSmartRoute } from './data/routes';
import RouteItinerary, { buildItinerary, terminalOf } from './components/RouteItinerary';
import './index.css';

// Yol çizgisinin (polyline) toplam uzunluğu, metre
const pathLengthM = (path) => {
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const [a, b] = path[i - 1];
    const [c, d] = path[i];
    const r = Math.PI / 180;
    const x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2;
    total += 2 * 6371000 * Math.asin(Math.sqrt(x));
  }
  return total;
};

// Haritayı dinamik olarak belirli bir konuma kaydırmak için yardımcı bileşen
function MapUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && Array.isArray(center) && center.length === 2 && Number.isFinite(center[0]) && Number.isFinite(center[1])) {
      map.flyTo(center, zoom || 14, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
}

// Harita boyutu değiştiğinde tiles'ları düzeltmek için bileşen
function MapResizeHandler({ isVisible }) {
  const map = useMap();
  useEffect(() => {
    if (isVisible) {
      setTimeout(() => map.invalidateSize(), 150);
      setTimeout(() => map.invalidateSize(), 400); // Garanti olsun diye tekrarla
    }
  }, [isVisible, map]);
  return null;
}

// Haritaya tıklandığında konum almak için bileşen
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

// LÜTFEN MAPBOX API ANAHTARINIZI BURAYA GİRİN:
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// TOMTOM API ANAHTARI (Ücretsiz ve Kart İstemez)
const TOMTOM_TOKEN = import.meta.env.VITE_TOMTOM_TOKEN;

function App() {
  const [fromLocation, setFromLocation] = useState({ name: 'Konumunuz', lat: null, lon: null });
  const [toLocation, setToLocation] = useState({ name: '', lat: null, lon: null });
  const [searchResults, setSearchResults] = useState(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [expandedRouteId, setExpandedRouteId] = useState(null);
  const [activeSubRouteId, setActiveSubRouteId] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [walkingPathStart, setWalkingPathStart] = useState([]);
  const [walkingPathEnd, setWalkingPathEnd] = useState([]);

  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [activeInput, setActiveInput] = useState(null);
  const [mapSelectionMode, setMapSelectionMode] = useState(null);
  const [mapCenter, setMapCenter] = useState([41.6771, 26.5557]); // Varsayılan Edirne Merkez
  const [mapZoom, setMapZoom] = useState(13);

  const wrapperRef = useRef(null);
  const typingTimeoutRef = useRef(null);



  useEffect(() => {
    // Uygulama ilk açıldığında konumu otomatik al
    if (navigator.geolocation && !fromLocation.lat && !hasSearched) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLon = position.coords.longitude;
          setFromLocation(prev => ({
            ...prev,
            name: 'Konumunuz',
            lat: newLat,
            lon: newLon
          }));
          setMapCenter([newLat, newLon]);
        },
        () => {
          console.log("Otomatik konum izni alınamadı.");
        }
      );
    }
  }, []); // Sadece bir kere çalışır

  // Aktif rota değiştiğinde yürüme rotalarını API'den (sokaklardan) çek
  useEffect(() => {
    const active = searchResults?.routes?.[selectedRouteIndex];
    if (!active || !fromLocation.lat || !toLocation.lat) {
       setWalkingPathStart([]);
       setWalkingPathEnd([]);
       return;
    }
    
    // Eğer Mapbox token varsa sokaklardan yürüme rotası çizdir
    if (MAPBOX_TOKEN && MAPBOX_TOKEN.includes("XXXXX") === false) {
       const fetchWalk = async (lat1, lon1, lat2, lon2, setter) => {
         try {
           const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${lon1},${lat1};${lon2},${lat2}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
           const res = await fetch(url);
           const data = await res.json();
           if (data.routes && data.routes[0]) {
              const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
              setter(coords);
           } else {
              setter([[lat1, lon1], [lat2, lon2]]); // API bulamazsa düz çizgi (kuş uçuşu)
           }
         } catch (e) {
           setter([[lat1, lon1], [lat2, lon2]]);
         }
       };

       fetchWalk(fromLocation.lat, fromLocation.lon, active.startStop.lat, active.startStop.lon, setWalkingPathStart);
       fetchWalk(active.endStop.lat, active.endStop.lon, toLocation.lat, toLocation.lon, setWalkingPathEnd);
    } else {
       // Token yoksa düz çizgi
       setWalkingPathStart([[fromLocation.lat, fromLocation.lon], [active.startStop.lat, active.startStop.lon]]);
       setWalkingPathEnd([[active.endStop.lat, active.endStop.lon], [toLocation.lat, toLocation.lon]]);
    }
  }, [searchResults, selectedRouteIndex, fromLocation, toLocation]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLon = position.coords.longitude;
          setFromLocation({
            name: 'Konumunuz (GPS)',
            lat: newLat,
            lon: newLon
          });
          setMapCenter([newLat, newLon]);
          setMapZoom(16);
          setActiveInput(null);
        },
        (error) => {
          console.error("GPS hatası:", error);
          alert("Konum alınamadı, lütfen tarayıcınızın konum izni verdiğinden emin olun.");
        }
      );
    } else {
      alert("Tarayıcınız konum özelliğini desteklemiyor.");
    }
  };

  // Yerel veritabanı (Özel Noktalar / Yurtlar)
  // Koordinatlar OpenStreetMap/Nominatim'den doğrulanmıştır (Ekim 2026)
  const localPlaces = [
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

  // Türkçe karakter duyarsız arama anahtarı (build_stops.mjs'teki ile aynı)
  const normalizeTr = (s) => s
    .toLocaleLowerCase('tr')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

  const fetchPlaces = async (query, setSuggestions) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const normQuery = normalizeTr(query);

      // 1. Önce kendi özel yerel veritabanımızda ara
      const localMatches = localPlaces.filter(p =>
        normalizeTr(p.name).includes(normQuery)
      ).map(p => ({ ...p, type: 'local' }));

      // 2. Ardından Tüm Duraklar veritabanında (db.js) ara (Dinamik import)
      //    Koordinatı bilinmeyen duraklar listelenmez
      const { allStopsDB } = await import('./data/db.js');
      const dbMatches = Object.values(allStopsDB)
        .filter(stop => stop.lat && stop.lon && stop.searchIndex.includes(normQuery))
        .map(stop => ({
          name: stop.name,
          lat: stop.lat,
          lon: stop.lon,
          type: 'stop'
        }));

      // 3. Haritadan ve İşletmelerden Ara (Hibrit: TomTom/Mapbox + Nominatim)
      let externalMatches = [];
      const fetchPromises = [];

      // A) Nominatim (Tamamen ücretsiz, köprü/park gibi noktalar için çok güçlü)
      const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + ' Edirne')}&format=json&limit=3`;
      fetchPromises.push(
        fetch(nomUrl)
          .then(r => r.json())
          .then(data => {
            return data.map(item => {
              const name = item.display_name.split(',')[0];
              const detail = item.display_name.replace(name + ', ', '').replace(', Türkiye', '');
              return { name: name, detail: detail, lat: parseFloat(item.lat), lon: parseFloat(item.lon), type: 'nominatim' };
            });
          }).catch(e => { console.error("Nominatim hatası", e); return []; })
      );

      // B) TomTom veya Mapbox (İşletmeler ve kafeler için güçlü)
      if (TOMTOM_TOKEN && TOMTOM_TOKEN.includes("XXXXX") === false) {
        const tomtomUrl = `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${TOMTOM_TOKEN}&lat=41.6771&lon=26.5557&radius=15000&language=tr-TR&limit=4`;
        fetchPromises.push(
          fetch(tomtomUrl)
            .then(r => r.json())
            .then(data => {
              if (!data.results) return [];
              return data.results.map(item => {
                let detail = item.address?.freeformAddress || "";
                detail = detail.replace(', Türkiye', '').replace(' Edirne', '');
                return { name: item.poi?.name || item.address?.streetName || query, detail: detail, lat: item.position?.lat, lon: item.position?.lon, type: 'tomtom' };
              });
            }).catch(e => { console.error("TomTom hatası", e); return []; })
        );
      } else if (MAPBOX_TOKEN && MAPBOX_TOKEN.includes("XXXXX") === false) {
        const bbox = "26.45,41.58,26.65,41.72"; 
        const prox = "26.5557,41.6771"; 
        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&bbox=${bbox}&proximity=${prox}&country=tr&language=tr&limit=4`;
        fetchPromises.push(
          fetch(mapboxUrl)
            .then(r => r.json())
            .then(data => {
              if (!data.features) return [];
              return data.features.map(item => {
                const name = item.text || item.place_name.split(',')[0];
                const detail = item.place_name.replace(name + ', ', '').replace(', Türkiye', '');
                return { name: name, detail: detail, lat: item.geometry.coordinates[1], lon: item.geometry.coordinates[0], type: 'map' };
              });
            }).catch(e => { console.error("Mapbox hatası", e); return []; })
        );
      }

      // Tüm API'lerden gelen sonuçları birleştir
      const results = await Promise.all(fetchPromises);
      const allExt = results.flat();
      
      // Aynı isimli yerleri filtrele (Örn: Hem TomTom hem Nominatim aynı yeri bulursa 1 tane göster)
      const seenNames = new Set();
      externalMatches = allExt.filter(item => {
        const n = normalizeTr(item.name);
        if (seenNames.has(n)) return false;
        seenNames.add(n);
        return true;
      });

      // Üçünü birleştirip ekrana basıyoruz
      setSuggestions([...localMatches, ...dbMatches, ...externalMatches].slice(0, 10));
    } catch (error) {
      console.error("Geocoding failed", error);
    }
  };

  const handleInputChange = (e, type) => {
    const val = e.target.value;
    if (type === 'from') {
      setFromLocation({ ...fromLocation, name: val, lat: null, lon: null });
    } else {
      setToLocation({ ...toLocation, name: val, lat: null, lon: null });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      if (type === 'from') fetchPlaces(val, setFromSuggestions);
      else fetchPlaces(val, setToSuggestions);
    }, 500);
  };

  const selectSuggestion = (type, place) => {
    if (type === 'from') {
      setFromLocation(place);
      setFromSuggestions([]);
    } else {
      setToLocation(place);
      setToSuggestions([]);
    }
    setActiveInput(null);
  };

  const handleMapClick = async (lat, lng) => {
    // Haritadan tıklanan noktanın adresini tersine bul (Mapbox Reverse Geocoding)
    let placeName = "Haritadan Seçilen Konum";
    if (MAPBOX_TOKEN && MAPBOX_TOKEN.includes("XXXXX") === false) {
      try {
        const mapboxUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&language=tr&limit=1`;
        const res = await fetch(mapboxUrl);
        const data = await res.json();
        if (data && data.features && data.features.length > 0) {
          placeName = data.features[0].text || data.features[0].place_name.split(',')[0];
        }
      } catch (e) {
        console.error("Reverse geocoding failed", e);
      }
    }

    const newLoc = { name: placeName, lat, lon: lng };

    if (mapSelectionMode === 'from') {
      setFromLocation(newLoc);
      setMapSelectionMode(null);
    } else if (mapSelectionMode === 'to') {
      setToLocation(newLoc);
      setMapSelectionMode(null);
    } else if (activeInput === 'from') {
      setFromLocation(newLoc);
      setActiveInput(null);
    } else if (activeInput === 'to') {
      setToLocation(newLoc);
      setActiveInput(null);
    } else {
      // Herhangi bir kutu seçili değilse akıllı atama yap
      if (!fromLocation.lat) {
        setFromLocation(newLoc);
      } else if (!toLocation.lat) {
        setToLocation(newLoc);
      } else {
        // İkisi de doluysa hedefi değiştir
        setToLocation(newLoc);
      }
    }
    // Seçilen yeri merkeze al
    setMapCenter([lat, lng]);
  };

  const handleSearch = async () => {
    if (!fromLocation.lat || !toLocation.lat) {
      alert("Lütfen listeden geçerli bir adres seçin veya Konumunuzu kullanın.");
      return;
    }

    const currentHour = new Date().getHours();
    const isNightTime = currentHour >= 0 && currentHour < 6;

    let result = await calculateSmartRoute(fromLocation.lat, fromLocation.lon, toLocation.lat, toLocation.lon);
    
    if (isNightTime && result && result.routes) {
      alert("Dikkat: Saat 00:00 ile 06:00 arasında Edirne'de otobüs seferleri aktif değildir. Gösterilen rotalar bilgi ve test amaçlıdır.");
      // TEST İÇİN GEÇİCİ OLARAK FİLTRE KALDIRILDI:
      // result.routes = result.routes.filter(r => r.isWalkOnly);
      // if (result.routes.length === 0) { ... }
    }

    setSearchResults(result);
    setSelectedRouteIndex(0);
    setHasSearched(true);
  };

  // Tarifteki bir adıma tıklanınca haritayı oraya yakınlaştır
  const focusOnMap = (lat, lon) => {
    setMapCenter([lat, lon]);
    setMapZoom(17);
    if (window.innerWidth < 1024) window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Yürüme mesafeleri: Mapbox yaya rotası geldiyse gerçek sokak mesafesi, yoksa kuş uçuşu
  const getWalk = (route, isSelected) => {
    const startExact = isSelected && walkingPathStart.length > 2;
    const endExact = isSelected && walkingPathEnd.length > 2;
    return {
      startM: startExact ? pathLengthM(walkingPathStart) : (route.walkDistanceStart || 0) * 1000,
      endM: endExact ? pathLengthM(walkingPathEnd) : (route.walkDistanceEnd || 0) * 1000,
      startExact,
      endExact
    };
  };

  const swapLocations = () => {
    const temp = fromLocation;
    setFromLocation(toLocation);
    setToLocation(temp);
  };

  const activeRoute = searchResults?.routes?.[selectedRouteIndex] || searchResults;

  const isSplitLayout = hasSearched || mapSelectionMode;

  const safeMapCenter = (Array.isArray(mapCenter) && mapCenter.length === 2 && Number.isFinite(mapCenter[0]) && Number.isFinite(mapCenter[1])) 
    ? mapCenter 
    : [41.6771, 26.5557];

  const isValidCoord = (coord) => Array.isArray(coord) && coord.length >= 2 && Number.isFinite(coord[0]) && Number.isFinite(coord[1]);

  // HMR (Hot Reload) kaynaklı eski state'ler için fallback
  const geom1 = activeRoute?.routeGeometry1 || activeRoute?.routeGeometry;
  const geom2 = activeRoute?.routeGeometry2 || [];

  return (
    <div className={`app-container ${isSplitLayout ? 'layout-split' : 'layout-center'}`}>
      
      {/* Map Area - Always visible on desktop, conditionally styled on mobile */}
      <div className="desktop-map-area">
        <div className={`map-container-wrapper animate-in ${!hasSearched && !mapSelectionMode ? 'mobile-hidden' : ''}`} style={{ animationDelay: '100ms' }}>
          <MapContainer
            center={safeMapCenter}
            zoom={mapZoom}
            style={{ width: '100%', height: '100%' }}
            scrollWheelZoom={true}
          >
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              attribution='&copy; Google Maps'
            />

            <MapUpdater center={safeMapCenter} zoom={mapZoom} />
            <MapResizeHandler isVisible={isSplitLayout} />
            <MapClickHandler onMapClick={handleMapClick} />

            {isValidCoord([fromLocation.lat, fromLocation.lon]) && (
              <Marker position={[fromLocation.lat, fromLocation.lon]} icon={customIcons.start}>
                <Popup><b>Başlangıç:</b><br/>{fromLocation.name}</Popup>
              </Marker>
            )}

            {isValidCoord([toLocation.lat, toLocation.lon]) && (
              <Marker position={[toLocation.lat, toLocation.lon]} icon={customIcons.end}>
                <Popup><b>Hedef:</b><br/>{toLocation.name}</Popup>
              </Marker>
            )}

            {hasSearched && activeRoute && (
              <>
                {isValidCoord([activeRoute.startStop?.lat, activeRoute.startStop?.lon]) && (
                  <Marker key={`sstop_${activeRoute.id}`} position={[activeRoute.startStop.lat, activeRoute.startStop.lon]} icon={customIcons.busStart}>
                    <Popup><b>Biniş Durağı:</b><br/>{activeRoute.startStop.name}</Popup>
                  </Marker>
                )}
                {isValidCoord([activeRoute.endStop?.lat, activeRoute.endStop?.lon]) && (
                  <Marker key={`estop_${activeRoute.id}`} position={[activeRoute.endStop.lat, activeRoute.endStop.lon]} icon={customIcons.busStart}>
                    <Popup><b>İniş Durağı:</b><br/>{activeRoute.endStop.name}</Popup>
                  </Marker>
                )}

                {walkingPathStart.length > 0 && (
                  <Polyline key={`walk_start_${activeRoute.id}`} positions={walkingPathStart} pathOptions={{ color: '#64748b', dashArray: '5, 8', weight: 4 }} />
                )}
                {walkingPathEnd.length > 0 && (
                  <Polyline key={`walk_end_${activeRoute.id}`} positions={walkingPathEnd} pathOptions={{ color: '#64748b', dashArray: '5, 8', weight: 4 }} />
                )}
                {activeRoute.isTransfer ? (
                  <>
                    {geom1 && geom1.filter(isValidCoord).length > 0 && (
                      <Polyline key={`geom1_${activeRoute.id}`} positions={geom1.filter(isValidCoord)} pathOptions={{ color: activeRoute.color || '#3b82f6', weight: 5, opacity: 0.9 }} />
                    )}
                    {isValidCoord([activeRoute.transferStop?.lat, activeRoute.transferStop?.lon]) && (
                      <Marker key={`tstop_${activeRoute.id}`} position={[activeRoute.transferStop.lat, activeRoute.transferStop.lon]} icon={customIcons.transfer}>
                        <Popup><b>Aktarma Durağı:</b><br/>{activeRoute.transferStop.name}</Popup>
                      </Marker>
                    )}
                    {geom2 && geom2.filter(isValidCoord).length > 0 && (
                      <Polyline key={`geom2_${activeRoute.id}`} positions={geom2.filter(isValidCoord)} pathOptions={{ color: activeRoute.color2 || '#10b981', weight: 5, opacity: 0.9 }} />
                    )}
                  </>
                ) : (
                  <>
                    {activeRoute.routeGeometry && activeRoute.routeGeometry.filter(isValidCoord).length > 0 && (
                      <Polyline key={`geom_${activeRoute.id}`} positions={activeRoute.routeGeometry.filter(isValidCoord)} pathOptions={{ color: activeRoute.color || activeRoute.routes?.[0]?.color || '#3b82f6', weight: 5, opacity: 0.9 }} />
                    )}
                  </>
                )}

                {/* Ara Durak Noktaları */}
                {activeRoute.passedStopCoords && activeRoute.passedStopCoords.length > 0 && activeRoute.passedStopCoords.map((coord, i) => {
                  if (isValidCoord([coord[0], coord[1]])) {
                    return (
                      <CircleMarker key={`passed_${activeRoute.id}_${i}`} center={[coord[0], coord[1]]} radius={4} pathOptions={{ color: '#fff', fillColor: '#94a3b8', fillOpacity: 1, weight: 1 }}>
                        <Popup>{coord[2]}</Popup>
                      </CircleMarker>
                    );
                  }
                  return null;
                })}
              </>
            )}
          </MapContainer>
        </div>
      </div>

      {/* Sidebar / Main Content Area */}
      <div className="desktop-sidebar">
        <header className="app-header animate-in">
          <div className="icon-glow">
            <BusFront size={28} color="#fff" />
          </div>
          <h1>Edirne Ulaşım</h1>
        </header>

        {(!hasSearched || window.innerWidth >= 1024) && (
          <div className="premium-card animate-in" style={{ animationDelay: '50ms' }}>
            {!isSplitLayout && <h2 className="search-title">Nereye gidiyoruz?</h2>}

            <div className="search-widget">
              <div className="search-timeline">
                <div className="dot-start"></div>
                <div className="timeline-line"></div>
                <div className="dot-end"></div>
              </div>

              <div className="search-inputs">
                <div className="input-row" onClick={() => setActiveInput('from')}>
                  <input className="modern-input" readOnly placeholder="Başlangıç noktası..." value={fromLocation.name} />
                </div>
                <div className="input-divider"></div>
                <div className="input-row" onClick={() => setActiveInput('to')}>
                  <input className="modern-input" readOnly placeholder="Varış noktası..." value={toLocation.name} />
                </div>
              </div>

              <button className="swap-btn" onClick={(e) => { e.stopPropagation(); swapLocations(); }}>
                <ArrowUpDown size={16} />
              </button>
            </div>

            <div className="quick-actions">
              <button className="action-pill" onClick={getUserLocation}>
                <LocateFixed size={14} /> Konumum
              </button>
              <button className="action-pill" onClick={() => { setMapSelectionMode('to'); setActiveInput(null); }}>
                <MapIcon size={14} /> Haritadan Seç
              </button>
            </div>

            {!isSplitLayout && <button className="btn-primary" onClick={handleSearch}>Rotayı Bul</button>}
            {isSplitLayout && (
              <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.95rem', marginTop: '8px' }} onClick={handleSearch}>Rotayı Güncelle</button>
            )}
          </div>
        )}

      {hasSearched && searchResults && (
        <div className="animate-in" style={{ animationDelay: '150ms', marginTop: '16px' }}>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '800' }}>Önerilen Rotalar</h2>
            <button className="action-pill" onClick={() => setHasSearched(false)}>Yeni Arama</button>
          </div>

          {searchResults.routes && searchResults.routes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {(() => {
                const groupedRoutes = [];
                const groupMap = new Map();
                searchResults.routes.forEach((route, idx) => {
                  const key = route.isTransfer 
                    ? `transfer_${route.startStop.name}_${route.transferStop.name}_${route.endStop.name}`
                    : `direct_${route.startStop.name}_${route.endStop.name}`;
                  if (!groupMap.has(key)) {
                    groupMap.set(key, {
                      ...route,
                      groupId: key,
                      originalIdx: idx,
                      groupedLines: [route]
                    });
                  } else {
                    groupMap.get(key).groupedLines.push(route);
                  }
                });
                groupedRoutes.push(...groupMap.values());
                
                return groupedRoutes.map((routeGroup) => {
                  const idx = routeGroup.originalIdx;
                  const isSelected = selectedRouteIndex === idx;
                  const isExpanded = expandedRouteId === routeGroup.groupId;
                  
                  const activeSubIndex = activeSubRouteId?.startsWith(routeGroup.groupId) ? parseInt(activeSubRouteId.split('_').pop()) : 0;
                  const activeRouteObj = (isExpanded && routeGroup.groupedLines[activeSubIndex]) ? routeGroup.groupedLines[activeSubIndex] : routeGroup;
                  
                  const itin = buildItinerary(activeRouteObj, getWalk(activeRouteObj, isSelected), searchTime);
                  const fmt = (d) => d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                  <div
                    key={routeGroup.groupId}
                    className="route-card"
                    onClick={() => { setSelectedRouteIndex(idx); if (!isSelected) setExpandedRouteId(null); }}
                    style={{
                      borderColor: isSelected ? 'var(--primary)' : 'var(--border-color)',
                      backgroundColor: isSelected ? '#fbfdff' : 'white',
                      borderWidth: isSelected ? '2px' : '1px',
                      padding: isSelected ? '15px' : '16px',
                      cursor: isSelected ? 'default' : 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isSelected && isExpanded ? '14px' : '10px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {routeGroup.groupedLines.map((r, i) => (
                           r.isTransfer ? (
                             <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="bus-badge" style={{ background: r.color }}>{r.line1}</span>
                                <ArrowRight size={14} color="var(--text-muted)" />
                                <span className="bus-badge" style={{ background: r.color2 }}>{r.line2}</span>
                             </div>
                           ) : (
                             <span key={i} className="bus-badge" style={{ background: r.color || 'var(--primary)' }}>{r.name}</span>
                           )
                        ))}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', marginLeft: '12px' }}>
                        <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                          {itin ? itin.totalMin : routeGroup.totalTime} dk
                        </span>
                        {itin && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', whiteSpace: 'nowrap' }}>
                            <Clock size={12} /> {fmt(itin.departAt)} → {fmt(itin.arriveAt)}
                          </span>
                        )}
                      </div>
                    </div>

                    {!isExpanded && (
                      <div className="route-compact">
                        <span><Footprints size={13} style={{ verticalAlign: '-2px' }} /> <b>{routeGroup.walkStartMins} dk</b> yürü (Biniş: <b>{routeGroup.startStop.name}</b>)</span>
                        {routeGroup.isTransfer && <span>Aktarma: <b>{routeGroup.transferStop.name}</b></span>}
                        <span>İniş: <b>{routeGroup.endStop.name}</b> (<Footprints size={13} style={{ verticalAlign: '-2px' }} /> <b>{routeGroup.walkEndMins} dk</b> yürü)</span>
                        {routeGroup.legs?.[0] && <span>Yön: <b>{terminalOf(routeGroup.legs[0].headSign)}</b></span>}
                        {isSelected && (
                           <button 
                             className="btn-primary" 
                             style={{ padding: '6px 12px', fontSize: '0.85rem', marginTop: '8px', alignSelf: 'flex-start', borderRadius: '6px' }}
                             onClick={(e) => { e.stopPropagation(); setExpandedRouteId(routeGroup.groupId); }}
                           >
                             Detayları Göster
                           </button>
                        )}
                        {!isSelected && <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Seçmek için dokun</span>}
                      </div>
                    )}
                    
                    {isSelected && isExpanded && itin && (
                      <>
                        {routeGroup.groupedLines.length > 1 && (
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                            {routeGroup.groupedLines.map((r, subIdx) => {
                               const isActive = activeSubIndex === subIdx;
                               return (
                                 <button 
                                   key={subIdx} 
                                   onClick={(e) => { e.stopPropagation(); setActiveSubRouteId(`${routeGroup.groupId}_${subIdx}`); }}
                                   style={{ 
                                     padding: '6px 10px', borderRadius: '6px', border: isActive ? `2px solid ${r.color || 'var(--primary)'}` : '1px solid var(--border-color)', 
                                     background: isActive ? '#f0f9ff' : 'transparent',
                                     color: 'var(--text-main)', fontWeight: isActive ? '700' : '500',
                                     fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap',
                                     display: 'flex', alignItems: 'center', gap: '4px'
                                   }}
                                 >
                                   <BusFront size={14} color={r.color || 'var(--primary)'} />
                                   {r.isTransfer ? `${r.line1}➔${r.line2}` : r.name} Detayı
                                 </button>
                               );
                            })}
                          </div>
                        )}
                        <RouteItinerary
                          itin={itin}
                          fromName={fromLocation.name}
                          toName={toLocation.name}
                          fromCoord={{ lat: fromLocation.lat, lon: fromLocation.lon }}
                          toCoord={{ lat: toLocation.lat, lon: toLocation.lon }}
                          onFocus={focusOnMap}
                        />
                        <button 
                           className="action-pill" 
                           style={{ marginTop: '12px', width: '100%', justifyContent: 'center' }}
                           onClick={(e) => { e.stopPropagation(); setExpandedRouteId(null); }}
                         >
                           Detayları Gizle
                        </button>
                      </>
                    )}
                  </div>
                  );
                });
              })()}
            </div>
          ) : (
            <div className="premium-card" style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '12px' }}>Sonuç Bulunamadı</h3>
              <p style={{ color: 'var(--text-muted)' }}>Seçtiğiniz konumlar arasında doğrudan bir otobüs hattı bulunmamaktadır.</p>
            </div>
          )}
        </div>
      )}
      
      </div> {/* End of desktop-sidebar */}

      {/* Modal Overlay */}
      {activeInput && (
        <div className="modal-overlay">
          <div className="modal-header">
            <button className="action-pill" style={{ padding: '8px', border: 'none', background: 'transparent' }} onClick={() => setActiveInput(null)}>
              <ArrowLeft size={24} color="var(--text-main)" />
            </button>
            <input
              autoFocus
              className="search-input-modal"
              placeholder={activeInput === 'from' ? 'Başlangıç noktası ara...' : 'Varış noktası ara...'}
              value={activeInput === 'from' ? fromLocation.name : toLocation.name}
              onChange={(e) => handleInputChange(e, activeInput)}
            />
          </div>

          <div className="modal-body">

            <div className="quick-actions" style={{ marginBottom: '24px', marginTop: 0 }}>
              <button className="action-pill" onClick={() => getUserLocation()}>
                <LocateFixed size={16} color="var(--primary)" /> Konumum
              </button>
              <button className="action-pill" onClick={() => { setMapSelectionMode(activeInput); setActiveInput(null); }}>
                <MapIcon size={16} color="var(--primary)" /> Harita
              </button>
            </div>

            <div>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                {(activeInput === 'from' ? fromSuggestions : toSuggestions).length === 0 ? 'Popüler Noktalar' : 'Arama Sonuçları'}
              </h4>

              {(activeInput === 'from' ? fromSuggestions : toSuggestions).length === 0 ? (
                localPlaces.map((place, idx) => (
                  <div key={'pop_' + idx} className="search-result-item" onClick={() => selectSuggestion(activeInput, place)}>
                    <div className="icon-wrapper"><MapPin size={20} color="var(--text-dim)" /></div>
                    <span style={{ fontWeight: '600', fontSize: '1.05rem' }}>{place.name}</span>
                  </div>
                ))
              ) : (
                (activeInput === 'from' ? fromSuggestions : toSuggestions).map((place, idx) => (
                  <div key={idx} className="search-result-item" onClick={() => selectSuggestion(activeInput, place)}>
                    <div className="icon-wrapper">
                      {place.type === 'stop' ? <BusFront size={20} color="var(--primary)" /> : <MapPin size={20} color="var(--text-dim)" />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: '600', fontSize: '1.05rem', color: 'var(--text-main)' }}>{place.name}</span>
                      {place.detail && <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)', marginTop: '-2px' }}>{place.detail}</span>}
                      {place.type === 'stop' && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase' }}>Otobüs Durağı</span>}
                      {place.type === 'tomtom' && <span style={{ fontSize: '0.75rem', color: '#DF1B12', fontWeight: '700', textTransform: 'uppercase' }}>İşletme (TomTom)</span>}
                      {place.type === 'map' && <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase' }}>Haritadan Sonuç</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {mapSelectionMode && (
        <div className="toast-msg" onClick={() => setMapSelectionMode(null)}>
          Haritadan {mapSelectionMode === 'from' ? 'başlangıç' : 'varış'} noktası seç (İptal)
        </div>
      )}

    </div>
  );
}


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', background: 'red', color: 'white', height: '100vh' }}>
          <h2>React Çöktü (Beyaz Ekran Hatası)!</h2>
          <p>Lütfen bu hatayı bana kopyala:</p>
          <pre style={{ background: 'black', padding: '10px', overflowX: 'auto' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
