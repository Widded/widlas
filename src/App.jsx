import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Search,
  X,
  Bookmark,
  ArrowRight,
  ArrowLeftRight,
  Crosshair,
  Navigation,
  Menu,
  MapPin
} from 'lucide-react';
import MapArea from './components/MapArea';
import SearchModal from './components/SearchModal';
import RouteResultSheet from './components/RouteResultSheet';
import LinesExplorerModal from './components/LinesExplorerModal';
import FaresModal from './components/FaresModal';
import SavedPlacesModal from './components/SavedPlacesModal';
import HomeMenuModal from './components/HomeMenuModal';
import BusLiveModal from './components/BusLiveModal';
import StopLiveModal from './components/StopLiveModal';
import { calculateSmartRoute } from './data/routes';
import { savePlace } from './lib/savedPlaces';
import { getLineColor } from './lib/lineColors';
import {
  fetchWalkingPath,
  fetchRoadSnappedBusPath,
  reverseGeocodeCoord
} from './services/api';
import useLiveLocation from './hooks/useLiveLocation';
import './index.css';

export default function App() {
  // Navigation & UI Modals
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchTargetType, setSearchTargetType] = useState('to'); // 'from' | 'to'
  const [linesModalOpen, setLinesModalOpen] = useState(false);
  const [selectedLineForModal, setSelectedLineForModal] = useState(null);
  const [faresModalOpen, setFaresModalOpen] = useState(false);
  const [savedModalOpen, setSavedModalOpen] = useState(false);
  const [homeMenuOpen, setHomeMenuOpen] = useState(false);
  const [busLiveOpen, setBusLiveOpen] = useState(false);
  const [stopLiveOpen, setStopLiveOpen] = useState(false);

  // Locations State
  const [fromLocation, setFromLocation] = useState({ name: '', lat: null, lon: null });
  const [toLocation, setToLocation] = useState({ name: '', lat: null, lon: null });

  // Live Location & GPS
  // Live Location & GPS
  const { liveLocation, setLiveLocation, isFollowing, setIsFollowing, isWatching, startWatching, stopWatching, attachCompass } = useLiveLocation();

  // Routing State
  const [searchResults, setSearchResults] = useState(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fareType, setFareType] = useState('ogrenci'); // 'ogrenci' | 'tam'
  const [routeSheetMinimized, setRouteSheetMinimized] = useState(false);
  const [mapSelectionMode, setMapSelectionMode] = useState(null); // null | 'from' | 'to'

  // Geometry: Walking & Bus Roads
  const [walkingPathStart, setWalkingPathStart] = useState([]);
  const [walkingPathEnd, setWalkingPathEnd] = useState([]);
  const [roadSnappedBusPath, setRoadSnappedBusPath] = useState(null);
  const [roadSnappedBusPath1, setRoadSnappedBusPath1] = useState(null);
  const [roadSnappedBusPath2, setRoadSnappedBusPath2] = useState(null);

  // Line Explorer Map Preview
  const [activeLineData, setActiveLineData] = useState(null);
  const [activeLineDirIdx, setActiveLineDirIdx] = useState(0);

  // Toast System
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = useCallback((message, type = 'info', duration = 3000) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, duration);
  }, []);

  // Update geometry when route index changes
  const updateRouteGeometry = useCallback(async (route, from, to) => {
    if (!route) return;

    let fromLat = from?.lat || liveLocation?.lat;
    let fromLon = from?.lon || liveLocation?.lon;

    // 1. Walking Start
    if (route.startStop && fromLat && fromLon) {
      fetchWalkingPath(fromLat, fromLon, route.startStop.lat, route.startStop.lon)
        .then(pts => setWalkingPathStart(pts))
        .catch(() => setWalkingPathStart([]));
    } else {
      setWalkingPathStart([]);
    }

    // 2. Walking End
    if (route.endStop && to?.lat && to?.lon) {
      fetchWalkingPath(route.endStop.lat, route.endStop.lon, to.lat, to.lon)
        .then(pts => setWalkingPathEnd(pts))
        .catch(() => setWalkingPathEnd([]));
    } else {
      setWalkingPathEnd([]);
    }

    // 3. Transit geometry
    // Artık güzergah geometrisi resmi Kentkart verisinden (gerçek otobüs yolu)
    // geliyor; Mapbox ile yeniden "snap"lemek kavşaklarda bozuyordu. Bu yüzden
    // resmi dilim doğrudan kullanılır. Yalnızca geometri yoksa durak dizisinden üretilir.

    if (!route.isTransfer) {
      const official = (route.routeGeometry && route.routeGeometry.length > 1) ? route.routeGeometry : null;
      if (official) {
        setRoadSnappedBusPath(official);
      } else {
        const stops = [route.startStop, ...(route.legs?.[0]?.stops || []), route.endStop].filter(Boolean);
        if (stops.length > 1) {
          fetchRoadSnappedBusPath(stops)
            .then(snapped => setRoadSnappedBusPath(snapped))
            .catch(() => setRoadSnappedBusPath(null));
        } else {
          setRoadSnappedBusPath(null);
        }
      }
      setRoadSnappedBusPath1(null);
      setRoadSnappedBusPath2(null);
    } else {
      setRoadSnappedBusPath(null);
      const official1 = (route.routeGeometry1 && route.routeGeometry1.length > 1) ? route.routeGeometry1 : null;
      const official2 = (route.routeGeometry2 && route.routeGeometry2.length > 1) ? route.routeGeometry2 : null;
      const stops1 = [route.startStop, ...(route.legs?.[0]?.stops || []), route.transferStop].filter(Boolean);
      const stops2 = [route.transferStop, ...(route.legs?.[1]?.stops || []), route.endStop].filter(Boolean);
      if (official1) {
        setRoadSnappedBusPath1(official1);
      } else if (stops1.length > 1) {
        fetchRoadSnappedBusPath(stops1)
          .then(snapped => setRoadSnappedBusPath1(snapped))
          .catch(() => setRoadSnappedBusPath1(null));
      } else {
        setRoadSnappedBusPath1(null);
      }
      if (official2) {
        setRoadSnappedBusPath2(official2);
      } else if (stops2.length > 1) {
        fetchRoadSnappedBusPath(stops2)
          .then(snapped => setRoadSnappedBusPath2(snapped))
          .catch(() => setRoadSnappedBusPath2(null));
      } else {
        setRoadSnappedBusPath2(null);
      }
    }
  }, [liveLocation]);

  // Main Route Calculation
  const calculateRoute = useCallback(async (from, to) => {
    if (!to || !to.lat || !to.lon) return;

    let fromLat = from?.lat;
    let fromLon = from?.lon;

    if (!fromLat || !fromLon) {
      if (liveLocation?.lat && liveLocation?.lon) {
        fromLat = liveLocation.lat;
        fromLon = liveLocation.lon;
      }
    }

    // Başlangıç yoksa şehir merkezine düşmüyoruz; kullanıcıdan kalkış noktası beklenir.
    if (!fromLat || !fromLon) {
      showToast('Başlangıç noktası seçilmedi. Lütfen kalkış noktası seçin.', 'warning');
      return;
    }

    setLoading(true);
    // Clear any previous line preview
    setActiveLineData(null);
    setRouteSheetMinimized(false);

    try {
      const result = await calculateSmartRoute(fromLat, fromLon, to.lat, to.lon);
      const routeList = result?.routes || (Array.isArray(result) ? result : []);
      if (!routeList || routeList.length === 0) {
        setSearchResults([]);
        showToast('Bu noktalar arasında doğrudan ETUS rotası bulunamadı.', 'warning');
      } else {
        setSearchResults(routeList);
        setSelectedRouteIdx(0);
        updateRouteGeometry(routeList[0], { lat: fromLat, lon: fromLon }, to);
      }
    } catch (err) {
      console.error('Calculate route error:', err);
      showToast('Rota hesaplanırken bir sorun oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [liveLocation, showToast, updateRouteGeometry]);

  // Browser geolocation (tek seferlik)
  const getCurrentCoords = useCallback(() => new Promise((resolve, reject) => {
    // iOS: pusula izni kullanıcı hareketi içinde istenmelidir
    attachCompass();

    if (!window.isSecureContext) {
      reject(new Error('insecure-context'));
      return;
    }
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLiveLocation(prev => ({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          // Pusula başlıksını koru; GPS başlığı yoksa adresin başlığını doğrulamak için kullanılır
          heading: prev?.heading ?? position.coords.heading ?? null,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed
        }));
        resolve({ lat: position.coords.latitude, lon: position.coords.longitude });
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }), [setLiveLocation, attachCompass]);

  // Başlangıç noktasını çözer. İzin yoksa boş bırakır (şehir merkezine düşmez).
  const resolveOrigin = useCallback(async () => {
    if (fromLocation?.lat && fromLocation?.lon) return fromLocation;

    if (liveLocation?.lat && liveLocation?.lon) {
      const place = { name: 'Mevcut Konumum', lat: liveLocation.lat, lon: liveLocation.lon };
      setFromLocation(place);
      return place;
    }

    showToast('Konumunuz alınıyor...', 'info', 4000);
    try {
      const coords = await getCurrentCoords();
      const place = { name: 'Mevcut Konumum', lat: coords.lat, lon: coords.lon };
      setFromLocation(place);
      return place;
    } catch (error) {
      if (!window.isSecureContext) {
        showToast('Konum yalnızca HTTPS veya localhost üzerinde alınabilir. Başlangıç noktasını seçin.', 'warning', 5000);
      } else if (error?.code === 1) {
        showToast('Konum izni verilmedi. Başlangıç noktasını seçin.', 'warning', 5000);
      } else {
        showToast('Konum alınamadı. Başlangıç noktasını seçin.', 'warning', 5000);
      }
      return null;
    }
  }, [fromLocation, liveLocation, getCurrentCoords, showToast]);

  // Handle selecting location from search modal
  const handleSelectLocation = async (place, target) => {
    const resolved = (!place?.lat || !place?.lon) && liveLocation?.lat
      ? { ...place, lat: liveLocation.lat, lon: liveLocation.lon }
      : place;

    if (target === 'from') {
      setFromLocation(resolved);
      if (toLocation?.lat && toLocation?.lon) {
        await calculateRoute(resolved, toLocation);
      }
      return;
    }

    if (!resolved?.lat || !resolved?.lon) {
      showToast('Hedefin konumu alınamadı. Lütfen haritadan bir nokta seçin.', 'warning');
      return;
    }

    // Hedefi kaydet, ardından başlangıç noktasını çöz.
    setToLocation(resolved);

    const origin = await resolveOrigin();
    if (!origin) {
      // Konum izni yok: başlangıç boş kalır, kullanıcı kalkış noktasını seçer.
      setSearchTargetType('from');
      setSearchModalOpen(true);
      return;
    }

    await calculateRoute(origin, resolved);
  };

  // "Konumum" seçimi — target: 'from' (kalkış) | 'to' (varış) | null (sadece kalkış)
  const handleSelectPlaceRef = useRef(null);
  useEffect(() => {
    handleSelectPlaceRef.current = handleSelectLocation;
  });
  const handleUseMyLocation = useCallback(async (target) => {
    try {
      const coords = await getCurrentCoords();
      const place = { name: 'Mevcut Konumum', lat: coords.lat, lon: coords.lon };

      if (target === 'to') {
        // Odaklı alan varışsa: varış noktası = mevcut konum (rota hesaplanır)
        await handleSelectPlaceRef.current(place, 'to');
        return place;
      }

      // Odak yok ya da kalkış odaklıysa: kalkış = mevcut konum
      setFromLocation(place);
      if (toLocation?.lat && toLocation?.lon) {
        await calculateRoute(place, toLocation);
      }
      showToast('Kalkış noktanız konumunuz olarak ayarlandı.', 'success');

      return place;
    } catch (error) {
      if (!window.isSecureContext) {
        showToast('Konum için HTTPS gerekli. Canlı site veya localhost kullanın.', 'error', 6000);
      } else if (error?.code === 1) {
        showToast('Konum izni verilmedi. Tarayıcı ayarlarından izin verin.', 'error', 5000);
      } else {
        showToast('Konum alınamadı. Lütfen tekrar deneyin.', 'error');
      }
      return null;
    }
  }, [getCurrentCoords, toLocation, calculateRoute, showToast]);

  // Clear active route & return to explore
  const handleClearRoute = () => {
    setSearchResults(null);
    setSelectedRouteIdx(0);
    setRouteSheetMinimized(false);
    setMapSelectionMode(null);
    setToLocation({ name: '', lat: null, lon: null });
    setWalkingPathStart([]);
    setWalkingPathEnd([]);
    setRoadSnappedBusPath(null);
    setRoadSnappedBusPath1(null);
    setRoadSnappedBusPath2(null);
    setActiveLineData(null);
  };

  // Save current destination to localStorage
  const handleSaveDestination = () => {
    if (!toLocation?.lat || !toLocation?.lon) {
      showToast('Kaydetmek için önce bir hedef seçin.', 'warning');
      return;
    }
    savePlace(toLocation);
    showToast(`"${toLocation.name || 'Hedef'}" kaydedildi.`, 'success');
  };

  // Map click handler: only active after "Haritadan Seç"
  const handleMapClick = async (lat, lon) => {
    if (!mapSelectionMode) return;

    const target = mapSelectionMode;
    setMapSelectionMode(null);

    const placeName = await reverseGeocodeCoord(lat, lon);
    const picked = { name: placeName, lat, lon };

    if (target === 'from') {
      setFromLocation(picked);
      showToast(`Kalkış noktası seçildi: ${placeName}`);
      if (toLocation?.lat && toLocation?.lon) {
        await calculateRoute(picked, toLocation);
      }
      return;
    }

    setToLocation(picked);
    showToast(`Hedef seçildi: ${placeName}`);

    const origin = await resolveOrigin();
    if (!origin) {
      // Konum izni yok: başlangıç boş kalır, kullanıcı kalkış noktasını seçer.
      setSearchTargetType('from');
      setSearchModalOpen(true);
      return;
    }

    await calculateRoute(origin, picked);
  };

  const handleSelectFromMap = (target) => {
    setMapSelectionMode(target);
  };

  // Kalkış ve varışı gerçek koordinatlarıyla değiştirip rotayı yeniden hesapla.
  const handleSwapLocations = useCallback(async () => {
    if (!fromLocation?.lat || !fromLocation?.lon || !toLocation?.lat || !toLocation?.lon) return;

    const nextFrom = { ...toLocation };
    const nextTo = { ...fromLocation };

    setFromLocation(nextFrom);
    setToLocation(nextTo);
    setSearchResults(null);
    setSelectedRouteIdx(0);

    await calculateRoute(nextFrom, nextTo);
  }, [fromLocation, toLocation, calculateRoute]);

  // Canlı konum + yön takip düğmesi (Menü'nün yanındaki konum işareti)
  const handleToggleLiveTrack = useCallback(async () => {
    if (isWatching) {
      stopWatching();
      showToast('Konum ve yön takibi kapatıldı.');
      return;
    }

    startWatching();
    showToast('Konum ve yön takibi açıldı. Telefonunuzu dik tutun.', 'success', 4000);

    // Başlangıç konumu boşsa mevcut konumu kalkış olarak kullan.
    try {
      const coords = await getCurrentCoords();
      const place = { name: 'Mevcut Konumum', lat: coords.lat, lon: coords.lon };
      if (!fromLocation?.lat || !fromLocation?.lon) {
        setFromLocation(place);
        if (toLocation?.lat && toLocation?.lon) {
          await calculateRoute(place, toLocation);
        }
      }
    } catch {
      // Canlı izleme zaten çalışıyor; tek seferlik konum alınamazsa sessiz geç.
    }
  }, [isWatching, startWatching, stopWatching, getCurrentCoords, fromLocation, toLocation, calculateRoute, showToast]);

  // Line Explorer selection
  const handleSelectLineOnMap = (lineData, dirIdx = 0) => {
    setSearchResults(null);
    setSelectedRouteIdx(0);
    setToLocation({ name: '', lat: null, lon: null });
    setWalkingPathStart([]);
    setWalkingPathEnd([]);
    setRoadSnappedBusPath(null);
    setRoadSnappedBusPath1(null);
    setRoadSnappedBusPath2(null);

    setActiveLineData(lineData);
    setActiveLineDirIdx(dirIdx);
    showToast(`Hat ${lineData.code} güzergahı haritada gösteriliyor.`);
  };

  const activeRoute = searchResults?.[selectedRouteIdx] || null;

  // Homepage: closest stops to the user (or city center as fallback)
  return (
    <div className="mobile-web-app">
      {/* 1. Full-Screen Fixed Leaflet Background Map */}
      <MapArea
        fromLocation={fromLocation}
        toLocation={toLocation}
        activeRoute={activeRoute}
        walkingPathStart={walkingPathStart}
        walkingPathEnd={walkingPathEnd}
        roadSnappedBusPath={roadSnappedBusPath}
        roadSnappedBusPath1={roadSnappedBusPath1}
        roadSnappedBusPath2={roadSnappedBusPath2}
        activeLineData={activeLineData}
        activeLineDirIdx={activeLineDirIdx}
        liveLocation={liveLocation}
        isFollowing={isFollowing}
        setIsFollowing={setIsFollowing}
        routeSheetMinimized={routeSheetMinimized}
        onMapClick={handleMapClick}
      />

      {mapSelectionMode && (
        <div className="map-select-banner">
          <MapPin size={15} />
          <span>
            {mapSelectionMode === 'from'
              ? 'Haritada kalkış noktasını seç'
              : 'Haritada varış noktasını seç'}
          </span>
          <button onClick={() => setMapSelectionMode(null)}>İptal</button>
        </div>
      )}

      {/* 2. Floating Top Header */}
      <div className="floating-top-container">
        {!activeRoute ? (
          /* Home: minimal route planner */
          <div className="explore-header-wrapper">
            <div className="home-route-stack">
              <button
                className="home-input-pill dest"
                onClick={() => {
                  setSearchTargetType('to');
                  setSearchModalOpen(true);
                }}
              >
                <span className="home-route-dot dest" />
                <span className={`home-input-text ${!toLocation.name ? 'is-placeholder' : ''}`} title={toLocation.name}>
                  {toLocation.name || 'Nereye gitmek istiyorsun?'}
                </span>
                <span className="home-input-search">
                  <Search size={16} />
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Route State: Pill Header with Close Button */
          <div className="route-header-wrapper">
            <div className="route-active-pill-bar">
              {/* Left: Origin Chip */}
              <div
                className="route-pill-chip origin-chip"
                onClick={() => {
                  setSearchTargetType('from');
                  setSearchModalOpen(true);
                }}
              >
                <div className="route-chip-dot green-dot" />
                <span className="route-chip-text" title={fromLocation.name}>
                  {fromLocation.name || 'Başlangıç noktası'}
                </span>
              </div>

              {/* Middle: Small Arrow */}
              <div className="route-pill-arrow">
                <ArrowRight size={14} />
              </div>

              {/* Right: Destination Chip */}
              <div
                className="route-pill-chip dest-chip"
                onClick={() => {
                  setSearchTargetType('to');
                  setSearchModalOpen(true);
                }}
              >
                <div className="route-chip-dot red-dot" />
                <span className="route-chip-text" title={toLocation.name}>
                  {toLocation.name || 'Varış Noktası'}
                </span>
                <button
                  className="route-chip-save-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSaveDestination();
                  }}
                  title="Hedefi Kaydet"
                  aria-label="Hedefi Kaydet"
                >
                  <Bookmark size={13} />
                </button>
              </div>
            </div>

            {/* Close route button */}
            <button
              className="route-pill-close-btn"
              onClick={handleClearRoute}
              title="Rotayı Kapat"
              aria-label="Rotayı kapat"
            >
              <X size={20} />
            </button>
          </div>
        )}
      </div>

      {/* 3. Loading Indicator */}
      {loading && (
        <div className="floating-loading-capsule">
          <div className="capsule-spinner" />
          <span>En hızlı ETUS güzergahı hesaplanıyor...</span>
        </div>
      )}

      {/* 4. Active Line Preview Clear Button */}
      {activeLineData && !activeRoute && (
        <div className="floating-line-preview-banner">
          <div className="line-preview-info">
            <span
              className="line-preview-badge"
              style={{ backgroundColor: getLineColor(activeLineData.code, activeLineData.color) }}
            >
              {activeLineData.code}
            </span>
            <span className="line-preview-text">
              {activeLineData.directions?.[activeLineDirIdx]?.headSign ||
                activeLineData.name ||
                `Hat ${activeLineData.code}`}
            </span>
          </div>
          <div className="line-preview-actions">
            {activeLineData.directions?.length > 1 && (
              <button
                type="button"
                className="line-preview-dir-btn"
                onClick={() =>
                  setActiveLineDirIdx((prev) => (prev + 1) % activeLineData.directions.length)
                }
                title="Yönü değiştir"
                aria-label="Yönü değiştir"
              >
                <ArrowLeftRight size={14} />
              </button>
            )}
            <button
              type="button"
              className="line-preview-close"
              onClick={() => setActiveLineData(null)}
              aria-label="Kapat"
              title="Kapat"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 5. Bottom Route Result Sheet */}
      {searchResults && (
        <RouteResultSheet
          routes={searchResults}
          selectedIdx={selectedRouteIdx}
          onSelectIdx={(idx) => {
            setSelectedRouteIdx(idx);
            updateRouteGeometry(searchResults[idx], fromLocation, toLocation);
          }}
          toLocation={toLocation}
          fromLocation={fromLocation}
          onMinimizedChange={setRouteSheetMinimized}
          onClose={handleClearRoute}
        />
      )}

      {/* 6. Minimal home menu: konum takibi + menü */}
      {!searchResults && !mapSelectionMode && (
        <div className="home-bottom-actions">
          <button
            className={`home-locate-btn ${isWatching ? 'is-active' : ''}`}
            onClick={handleToggleLiveTrack}
            aria-label={isWatching ? 'Konum takibini kapat' : 'Konumu ve yönümü takip et'}
            title={isWatching ? 'Konum takibini kapat' : 'Konumu ve yönümü takip et'}
          >
            {isWatching ? <Navigation size={16} /> : <Crosshair size={17} />}
            {isWatching && <span className="home-locate-dot" />}
          </button>
          <button
            className="home-menu-btn"
            onClick={() => setHomeMenuOpen(true)}
            aria-label="Menüyü aç"
            title="Menü"
          >
            <Menu size={17} />
            <span>Menü</span>
          </button>
        </div>
      )}

      {/* 7. Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        targetType={searchTargetType}
        fromLocation={fromLocation}
        toLocation={toLocation}
        userLocation={liveLocation}
        onSelectLocation={handleSelectLocation}
        onUseMyLocation={handleUseMyLocation}
        onSelectFromMap={handleSelectFromMap}
        onSwapLocations={handleSwapLocations}
      />

      {/* 8. Lines Explorer Modal */}
      <LinesExplorerModal
        isOpen={linesModalOpen}
        initialLineCode={selectedLineForModal}
        onClose={() => {
          setLinesModalOpen(false);
          setSelectedLineForModal(null);
        }}
        onSelectLineOnMap={handleSelectLineOnMap}
      />

      {/* 8b. Live Bus Modal */}
      <BusLiveModal
        isOpen={busLiveOpen}
        onClose={() => setBusLiveOpen(false)}
        userLocation={liveLocation}
      />

      {/* 8c. Stop Live Modal */}
      <StopLiveModal
        isOpen={stopLiveOpen}
        onClose={() => setStopLiveOpen(false)}
        userLocation={liveLocation}
      />

      {/* 9. Fares Modal */}
      <FaresModal
        isOpen={faresModalOpen}
        onClose={() => {
          setFaresModalOpen(false);
        }}
        fareType={fareType}
        onSelectFareType={setFareType}
      />

      {/* 10. Saved Places Modal */}
      <SavedPlacesModal
        isOpen={savedModalOpen}
        onClose={() => {
          setSavedModalOpen(false);
        }}
        onSelectPlace={(place) => {
          handleSelectLocation(place, 'to');
        }}
      />

      {/* 11. Home Menu Modal */}
      <HomeMenuModal
        isOpen={homeMenuOpen}
        onClose={() => setHomeMenuOpen(false)}
        onOpenBusLive={() => {
          setHomeMenuOpen(false);
          setBusLiveOpen(true);
        }}
        onOpenStopLive={() => {
          setHomeMenuOpen(false);
          setStopLiveOpen(true);
        }}
        onOpenLines={() => {
          setHomeMenuOpen(false);
          setSelectedLineForModal(null);
          setLinesModalOpen(true);
        }}
        onOpenFares={() => {
          setHomeMenuOpen(false);
          setFaresModalOpen(true);
        }}
        onOpenSaved={() => {
          setHomeMenuOpen(false);
          setSavedModalOpen(true);
        }}
      />

      {/* 12. Toast Notification */}
      {toast && (
        <div className={`floating-toast ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
