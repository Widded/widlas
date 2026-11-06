import React, { useState, useRef, useCallback } from 'react';
import {
  Search,
  X,
  Bookmark,
  ArrowRight,
  ChevronDown,
  Menu
} from 'lucide-react';
import MapArea from './components/MapArea';
import SearchModal from './components/SearchModal';
import RouteResultSheet from './components/RouteResultSheet';
import LinesExplorerModal from './components/LinesExplorerModal';
import FaresModal from './components/FaresModal';
import SavedPlacesModal from './components/SavedPlacesModal';
import HomeMenuModal from './components/HomeMenuModal';
import { calculateSmartRoute } from './data/routes';
import { savePlace } from './lib/savedPlaces';
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

  // Locations State
  const [fromLocation, setFromLocation] = useState({ name: 'Mevcut Konum', lat: null, lon: null });
  const [toLocation, setToLocation] = useState({ name: '', lat: null, lon: null });

  // Live Location & GPS
  const { liveLocation, setLiveLocation, isFollowing, setIsFollowing } = useLiveLocation();

  // Routing State
  const [searchResults, setSearchResults] = useState(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fareType, setFareType] = useState('ogrenci'); // 'ogrenci' | 'tam'
  const [routeSheetMinimized, setRouteSheetMinimized] = useState(false);

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

    let fromLat = from?.lat || liveLocation?.lat || 41.6771;
    let fromLon = from?.lon || liveLocation?.lon || 26.5557;

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

    // 3. Road-snapped transit paths
    if (!route.isTransfer) {
      const stops = [route.startStop, ...(route.legs?.[0]?.stops || []), route.endStop].filter(Boolean);
      if (stops.length > 1) {
        fetchRoadSnappedBusPath(stops).then(snapped => setRoadSnappedBusPath(snapped));
      } else {
        setRoadSnappedBusPath(null);
      }
      setRoadSnappedBusPath1(null);
      setRoadSnappedBusPath2(null);
    } else {
      setRoadSnappedBusPath(null);
      const stops1 = [route.startStop, ...(route.legs?.[0]?.stops || []), route.transferStop].filter(Boolean);
      const stops2 = [route.transferStop, ...(route.legs?.[1]?.stops || []), route.endStop].filter(Boolean);
      if (stops1.length > 1) {
        fetchRoadSnappedBusPath(stops1).then(snapped => setRoadSnappedBusPath1(snapped));
      } else {
        setRoadSnappedBusPath1(null);
      }
      if (stops2.length > 1) {
        fetchRoadSnappedBusPath(stops2).then(snapped => setRoadSnappedBusPath2(snapped));
      } else {
        setRoadSnappedBusPath2(null);
      }
    }
  }, [liveLocation]);

  // Main Route Calculation
  const calculateRoute = useCallback(async (from, to) => {
    if (!to || !to.lat || !to.lon) return;

    setLoading(true);
    // Clear any previous line preview
    setActiveLineData(null);
    setRouteSheetMinimized(false);

    let fromLat = from?.lat;
    let fromLon = from?.lon;

    if (!fromLat || !fromLon) {
      if (liveLocation?.lat && liveLocation?.lon) {
        fromLat = liveLocation.lat;
        fromLon = liveLocation.lon;
      } else {
        fromLat = 41.6771;
        fromLon = 26.5557;
      }
    }

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
        const coords = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        setLiveLocation({
          ...coords,
          heading: null,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed
        });
        resolve(coords);
      },
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 }
    );
  }), [setLiveLocation]);

  // "Konumum" seçimi
  const handleUseMyLocation = useCallback(async (target) => {
    try {
      const coords = await getCurrentCoords();
      const place = { name: 'Mevcut Konumum', lat: coords.lat, lon: coords.lon };

      if (target === 'from') {
        setFromLocation(place);
        if (toLocation?.lat && toLocation?.lon) {
          await calculateRoute(place, toLocation);
        }
        showToast('Kalkış noktanız konumunuz olarak ayarlandı.', 'success');
      } else {
        setFromLocation(place);
        showToast('Konumunuz kalkış noktası olarak alındı.', 'success');
      }

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
      showToast('Konumunuz henüz alınamadı. Lütfen haritadan bir nokta seçin.', 'warning');
      return;
    }

    let origin = fromLocation;
    if (!origin?.lat || !origin?.lon) {
      showToast('Konumunuz alınıyor...', 'info', 4000);
      try {
        const coords = await getCurrentCoords();
        origin = { name: 'Mevcut Konumum', lat: coords.lat, lon: coords.lon };
        setFromLocation(origin);
      } catch (error) {
        if (!window.isSecureContext) {
          showToast('Konum yalnızca HTTPS veya localhost üzerinde alınabilir.', 'warning', 5000);
        } else if (error?.code === 1) {
          showToast('Konum izni verilmedi. Başlangıç Edirne merkezi kabul edildi.', 'warning', 5000);
        }
      }
    }

    setToLocation(resolved);
    await calculateRoute(origin, resolved);
  };

  // Clear active route & return to explore
  const handleClearRoute = () => {
    setSearchResults(null);
    setSelectedRouteIdx(0);
    setRouteSheetMinimized(false);
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

  // Map click handler (pick point from map)
  const handleMapClick = async (lat, lon) => {
    const placeName = await reverseGeocodeCoord(lat, lon);
    const picked = { name: placeName, lat, lon };

    let origin = fromLocation;
    if (!origin?.lat || !origin?.lon) {
      showToast('Konumunuz alınıyor...', 'info', 4000);
      try {
        const coords = await getCurrentCoords();
        origin = { name: 'Mevcut Konumum', lat: coords.lat, lon: coords.lon };
        setFromLocation(origin);
      } catch (error) {
        if (!window.isSecureContext) {
          showToast('Konum yalnızca HTTPS veya localhost üzerinde alınabilir.', 'warning', 5000);
        } else if (error?.code === 1) {
          showToast('Konum izni verilmedi. Başlangıç Edirne merkezi kabul edildi.', 'warning', 5000);
        }
      }
    }

    setToLocation(picked);
    showToast(`Hedef seçildi: ${placeName}`);
    await calculateRoute(origin, picked);
  };

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

      {/* 2. Floating Top Header */}
      <div className="floating-top-container">
        {!activeRoute ? (
          /* Home: minimal route planner */
          <div className="explore-header-wrapper">
            <div className="home-route-stack">
              <button
                className="home-input-pill origin"
                onClick={() => {
                  setSearchTargetType('from');
                  setSearchModalOpen(true);
                }}
              >
                <span className="home-route-dot origin" />
                <span className="home-input-text" title={fromLocation.name}>
                  {fromLocation.name || 'Konumum'}
                </span>
                <ChevronDown size={16} className="home-input-tail" />
              </button>

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
                  {fromLocation.name || 'Mevcut Konum'}
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
              style={{ backgroundColor: activeLineData.color || '#3B82F6' }}
            >
              {activeLineData.code}
            </span>
            <span className="line-preview-text">
              {activeLineData.name || `Hat ${activeLineData.code}`} inceleniyor
            </span>
          </div>
          <button className="line-preview-close" onClick={() => setActiveLineData(null)}>
            <X size={16} />
          </button>
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

      {/* 6. Minimal home menu */}
      {!searchResults && (
        <button
          className="home-menu-btn"
          onClick={() => setHomeMenuOpen(true)}
          aria-label="Menüyü aç"
          title="Menü"
        >
          <Menu size={17} />
          <span>Menü</span>
        </button>
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
