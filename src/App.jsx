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
import { calculateSmartRoute } from './data/routes';
import './index.css';

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
  const [showStopDetails, setShowStopDetails] = useState(false);
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
  // Koordinatlar OpenStreetMap/Nominatim'den doğrulanmıştır
  const localPlaces = [
    { name: 'Edirne Şehir Merkezi (Heykel)', lat: 41.6771, lon: 26.5557 },
    { name: 'Saraçlar Caddesi', lat: 41.6749, lon: 26.5568 },
    { name: 'Edirne Otogar', lat: 41.6323, lon: 26.6195 },
    { name: 'Erasta AVM', lat: 41.6667, lon: 26.5684 },
    { name: 'Margi Outlet', lat: 41.6631, lon: 26.5653 },
    { name: 'Edirne Devlet Hastanesi (1. Murat)', lat: 41.6575, lon: 26.5866 },
    { name: 'Trakya Üni. Tıp Fakültesi Hastanesi', lat: 41.6669, lon: 26.5772 },
    { name: 'Trakya Üni. Ayşekadın Yerleşkesi', lat: 41.6696, lon: 26.5750 },
    { name: 'Sultan Çelebi Mehmet KYK Yurdu', lat: 41.6965, lon: 26.5818 },
    { name: 'Selimiye KYK Öğrenci Yurdu', lat: 41.6443, lon: 26.6145 },
    { name: 'Şükrüpaşa (Gölet / Marketler)', lat: 41.6833, lon: 26.5731 },
    { name: 'Tunca Köprüsü', lat: 41.6738, lon: 26.5543 },
    { name: 'Meriç Köprüsü (Karaağaç Yolu)', lat: 41.6669, lon: 26.5492 }
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

    const result = await calculateSmartRoute(fromLocation.lat, fromLocation.lon, toLocation.lat, toLocation.lon);
    setSearchResults(result);
    setSelectedRouteIndex(0);
    setShowStopDetails(false);
    setHasSearched(true);
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
              <CircleMarker center={[fromLocation.lat, fromLocation.lon]} pathOptions={{ color: 'transparent', fillColor: '#3b82f6', fillOpacity: 1 }} radius={8}>
                <Popup>Başlangıç</Popup>
              </CircleMarker>
            )}

            {isValidCoord([toLocation.lat, toLocation.lon]) && (
              <CircleMarker center={[toLocation.lat, toLocation.lon]} pathOptions={{ color: 'transparent', fillColor: '#ef4444', fillOpacity: 1 }} radius={8}>
                <Popup>Hedef</Popup>
              </CircleMarker>
            )}

            {hasSearched && activeRoute && (
              <>
                {isValidCoord([activeRoute.startStop?.lat, activeRoute.startStop?.lon]) && (
                  <CircleMarker key={`sstop_${activeRoute.id}`} center={[activeRoute.startStop.lat, activeRoute.startStop.lon]} pathOptions={{ color: '#fff', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }} radius={6} />
                )}
                {isValidCoord([activeRoute.endStop?.lat, activeRoute.endStop?.lon]) && (
                  <CircleMarker key={`estop_${activeRoute.id}`} center={[activeRoute.endStop.lat, activeRoute.endStop.lon]} pathOptions={{ color: '#fff', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }} radius={6} />
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
                      <CircleMarker key={`tstop_${activeRoute.id}`} center={[activeRoute.transferStop.lat, activeRoute.transferStop.lon]} pathOptions={{ color: '#fff', fillColor: '#f59e0b', fillOpacity: 1, weight: 2 }} radius={7}>
                        <Popup>Aktarma: {activeRoute.transferStop.name}</Popup>
                      </CircleMarker>
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
                        {showStopDetails && <Popup>{coord[2]}</Popup>}
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
              {searchResults.routes.map((route, idx) => (
                <div
                  key={route.id}
                  className="route-card"
                  onClick={() => {
                    setSelectedRouteIndex(idx);
                    setShowStopDetails(false);
                  }}
                  style={{
                    borderColor: selectedRouteIndex === idx ? 'var(--primary)' : 'var(--border-color)',
                    backgroundColor: selectedRouteIndex === idx ? '#f0f9ff' : 'white',
                    borderWidth: selectedRouteIndex === idx ? '2px' : '1px',
                    padding: selectedRouteIndex === idx ? '15px' : '16px', // border-width offset
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    {route.isTransfer ? (
                       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="bus-badge" style={{ background: route.color }}>{route.line1}</span>
                          <ArrowRight size={16} color="var(--text-muted)" />
                          <span className="bus-badge" style={{ background: route.color2 }}>{route.line2}</span>
                       </div>
                    ) : (
                       <span className="bus-badge" style={{ background: route.color || 'var(--primary)' }}>{route.name}</span>
                    )}
                    <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                      {route.totalTime} dk
                    </span>
                  </div>

                  <div className="timeline-step">
                    <Footprints size={20} color="var(--primary)" />
                    <span><b>{route.startStop.name}</b> durağına yürü ({(route.walkDistanceStart * 1000).toFixed(0)}m)</span>
                  </div>
                  
                  {route.isTransfer && (
                    <div className="timeline-step">
                      <BusFront size={20} color="var(--text-muted)" />
                      <span><b>{route.transferStop.name}</b> durağında inip <b>{route.line2}</b> hattına aktarma yap</span>
                    </div>
                  )}

                  <div className="timeline-step">
                    <MapPin size={20} color="#ef4444" />
                    <span><b>{route.endStop.name}</b> durağında in ({(route.walkDistanceEnd * 1000).toFixed(0)}m yürü)</span>
                  </div>

                  {selectedRouteIndex === idx && route.passedStops && route.passedStops.length > 0 && (
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                      <button 
                        className="action-pill" 
                        style={{ width: '100%', justifyContent: 'center' }}
                        onClick={(e) => { e.stopPropagation(); setShowStopDetails(!showStopDetails); }}
                      >
                        {showStopDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {showStopDetails ? 'Detayları Gizle' : 'Durak Detaylarını Göster'}
                      </button>
                      
                      {showStopDetails && (
                        <div style={{ marginTop: '16px' }}>
                          <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '16px', color: 'var(--text-muted)' }}>GEÇİLECEK DURAKLAR ({route.passedStops.length})</p>
                          <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.95rem', paddingRight: '4px' }}>
                            {route.passedStops.map((s, i) => {
                              if (s === '>>>TRANSFER<<<') {
                                return (
                                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 6px', margin: '4px 0', backgroundColor: '#fef3c7', borderLeft: '4px solid #d97706', borderRadius: '4px' }}>
                                    <BusFront size={16} color="#d97706" />
                                    <span style={{ color: '#b45309', fontWeight: '700', fontSize: '0.9rem' }}>
                                      {route.transferStop.name} durağında inip {route.line2} hattına bin
                                    </span>
                                  </div>
                                );
                              }
                              return (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--border-focus)' }}></div>
                                  <span style={{ color: 'var(--text-main)' }}>{s}</span>
                                </div>
                              );
                            })}
                            {/* Son durak eklentisi */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderTop: '1px dashed var(--border-color)', marginTop: '4px' }}>
                              <MapPin size={14} color="#ef4444" />
                              <span style={{ color: '#ef4444', fontWeight: '700' }}>{route.endStop.name} (İniş Durağı)</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
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
