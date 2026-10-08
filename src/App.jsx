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
import MapArea from './components/MapArea';
import SearchBox from './components/SearchBox';
import RouteList from './components/RouteList';
import { calculateSmartRoute } from './data/routes';
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
  const [fareType, setFareType] = useState('tam');

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

  return (
    <div className={`app-container ${isSplitLayout ? 'layout-split' : 'layout-center'}`}>
      
      {/* Map Area - Always visible on desktop, conditionally styled on mobile */}
      <MapArea 
        mapCenter={mapCenter}
        mapZoom={mapZoom}
        hasSearched={hasSearched}
        mapSelectionMode={mapSelectionMode}
        onMapClick={handleMapClick}
        fromLocation={fromLocation}
        toLocation={toLocation}
        activeRoute={activeRoute}
        walkingPathStart={walkingPathStart}
        walkingPathEnd={walkingPathEnd}
      />

      {/* Sidebar / Main Content Area */}
      <div className="desktop-sidebar">
        <header className="app-header animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="icon-glow">
              <BusFront size={28} color="#fff" />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.4rem' }}>Edirne Ulaşım</h1>
          </div>
          
          <select 
            value={fareType}
            onChange={(e) => setFareType(e.target.value)}
            style={{
              padding: '6px 8px',
              borderRadius: '8px',
              background: 'var(--surface-hover)',
              color: 'var(--text-main)',
              border: '1px solid var(--border-color)',
              outline: 'none',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: '600'
            }}
          >
            <option value="tam">Tam Tarife</option>
            <option value="ogrenci">Öğrenci</option>
          </select>
        </header>

        <SearchBox
          fromLocation={fromLocation}
          toLocation={toLocation}
          activeInput={activeInput}
          setActiveInput={setActiveInput}
          mapSelectionMode={mapSelectionMode}
          setMapSelectionMode={setMapSelectionMode}
          fromSuggestions={fromSuggestions}
          toSuggestions={toSuggestions}
          handleInputChange={handleInputChange}
          selectSuggestion={selectSuggestion}
          getUserLocation={getUserLocation}
          handleSearch={handleSearch}
          hasSearched={hasSearched}
          localPlaces={localPlaces}
          isSplitLayout={isSplitLayout}
          swapLocations={swapLocations}
        />

      <RouteList
        searchResults={searchResults}
        selectedRouteIndex={selectedRouteIndex}
        setSelectedRouteIndex={setSelectedRouteIndex}
        expandedRouteId={expandedRouteId}
        setExpandedRouteId={setExpandedRouteId}
        activeSubRouteId={activeSubRouteId}
        setActiveSubRouteId={setActiveSubRouteId}
        hasSearched={hasSearched}
        setHasSearched={setHasSearched}
        fromLocation={fromLocation}
        toLocation={toLocation}
        focusOnMap={focusOnMap}
        getWalk={getWalk}
        fareType={fareType}
      />
      
      </div> {/* End of desktop-sidebar */}

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
