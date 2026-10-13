import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search,
  Navigation,
  Layers,
  X,
  Compass,
  Bus,
  CreditCard,
  Bookmark,
  Home,
  Briefcase,
  GraduationCap,
  ShoppingBag,
  Landmark,
  ArrowRight,
  MapPin,
  Mic,
  SlidersHorizontal,
  RefreshCw,
  Clock
} from 'lucide-react';
import MapArea from './components/MapArea';
import SearchModal from './components/SearchModal';
import RouteResultSheet from './components/RouteResultSheet';
import LinesExplorerModal from './components/LinesExplorerModal';
import FaresModal from './components/FaresModal';
import { calculateSmartRoute } from './data/routes';
import { etusLines } from './data/db';
import {
  fetchWalkingPath,
  fetchRoadSnappedBusPath,
  reverseGeocodeCoord
} from './services/api';
import useLiveLocation from './hooks/useLiveLocation';
import './index.css';

// Quick home & work presets
const QUICK_SAVED_PRESETS = [
  { id: 'q_uni', label: 'Trakya Üni', icon: GraduationCap, lat: 41.6389, lon: 26.6150, name: 'Trakya Üniversitesi Balkan Kampüsü' },
  { id: 'q_erasta', label: 'Erasta AVM', icon: ShoppingBag, lat: 41.6663, lon: 26.5710, name: 'Erasta AVM' },
  { id: 'q_selimiye', label: 'Selimiye', icon: Landmark, lat: 41.6781, lon: 26.5594, name: 'Selimiye Camii' },
  { id: 'q_otogar', label: 'Otogar', icon: Bus, lat: 41.6320, lon: 26.6184, name: 'Edirne Otogar' },
  { id: 'q_ev', label: 'Ev', icon: Home, lat: 41.6771, lon: 26.5557, name: 'Evim (Edirne Merkez)' },
  { id: 'q_is', label: 'İş', icon: Briefcase, lat: 41.6735, lon: 26.5537, name: 'İş Yeri (Saraçlar)' }
];

export default function App() {
  // Navigation & UI Modals
  const [activeTab, setActiveTab] = useState('explore'); // 'explore' | 'lines' | 'fares' | 'saved'
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchTargetType, setSearchTargetType] = useState('to'); // 'from' | 'to'
  const [linesModalOpen, setLinesModalOpen] = useState(false);
  const [faresModalOpen, setFaresModalOpen] = useState(false);

  // Map Controls
  const [mapType, setMapType] = useState('Standart'); // 'Standart' | 'Uydu'
  const [recenterTarget, setRecenterTarget] = useState(null);

  // Locations State
  const [fromLocation, setFromLocation] = useState({ name: 'Mevcut Konum', lat: null, lon: null });
  const [toLocation, setToLocation] = useState({ name: '', lat: null, lon: null });

  // Live Location & GPS
  const { liveLocation, isWatching, isFollowing, setIsFollowing, startWatching } = useLiveLocation();

  // Routing State
  const [searchResults, setSearchResults] = useState(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fareType, setFareType] = useState('ogrenci'); // 'ogrenci' | 'tam'

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
      const stops = route.directStops || [];
      if (stops.length > 1) {
        fetchRoadSnappedBusPath(stops).then(snapped => setRoadSnappedBusPath(snapped));
      } else {
        setRoadSnappedBusPath(null);
      }
      setRoadSnappedBusPath1(null);
      setRoadSnappedBusPath2(null);
    } else {
      setRoadSnappedBusPath(null);
      if (route.stops1?.length > 1) {
        fetchRoadSnappedBusPath(route.stops1).then(snapped => setRoadSnappedBusPath1(snapped));
      } else {
        setRoadSnappedBusPath1(null);
      }
      if (route.stops2?.length > 1) {
        fetchRoadSnappedBusPath(route.stops2).then(snapped => setRoadSnappedBusPath2(snapped));
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
      const routes = await calculateSmartRoute(fromLat, fromLon, to.lat, to.lon);
      if (!routes || routes.length === 0) {
        setSearchResults([]);
        showToast('Bu noktalar arasında doğrudan ETUS rotası bulunamadı.', 'warning');
      } else {
        setSearchResults(routes);
        setSelectedRouteIdx(0);
        updateRouteGeometry(routes[0], { lat: fromLat, lon: fromLon }, to);
      }
    } catch (err) {
      console.error('Calculate route error:', err);
      showToast('Rota hesaplanırken bir sorun oluştu.', 'error');
    } finally {
      setLoading(false);
    }
  }, [liveLocation, showToast, updateRouteGeometry]);

  // Handle selecting location from search modal
  const handleSelectLocation = (place, target) => {
    if (target === 'from') {
      setFromLocation(place);
      if (toLocation?.lat && toLocation?.lon) {
        calculateRoute(place, toLocation);
      }
    } else {
      setToLocation(place);
      calculateRoute(fromLocation, place);
    }
  };

  // Quick chips click
  const handleQuickChipSelect = (preset) => {
    const dest = { name: preset.name, lat: preset.lat, lon: preset.lon };
    setToLocation(dest);
    calculateRoute(fromLocation, dest);
  };

  // Clear active route & return to explore
  const handleClearRoute = () => {
    setSearchResults(null);
    setSelectedRouteIdx(0);
    setToLocation({ name: '', lat: null, lon: null });
    setWalkingPathStart([]);
    setWalkingPathEnd([]);
    setRoadSnappedBusPath(null);
    setRoadSnappedBusPath1(null);
    setRoadSnappedBusPath2(null);
    setActiveLineData(null);
  };

  // Map click handler (pick point from map)
  const handleMapClick = async (lat, lon) => {
    // If not in route mode, ask to route to this point
    const placeName = await reverseGeocodeCoord(lat, lon);
    const dest = { name: placeName, lat, lon };
    setToLocation(dest);
    showToast(`Hedef seçildi: ${placeName}`);
    calculateRoute(fromLocation, dest);
  };

  // Recenter GPS button
  const handleRecenter = () => {
    if (liveLocation && Number.isFinite(liveLocation.lat) && Number.isFinite(liveLocation.lon)) {
      setRecenterTarget({ lat: liveLocation.lat, lon: liveLocation.lon, zoom: 16 });
      setIsFollowing(true);
      showToast('Konumunuza odaklanıldı.');
    } else {
      startWatching();
      showToast('Konumunuz tespit ediliyor...');
    }
  };

  // Layer toggle button
  const handleToggleLayer = () => {
    setMapType(prev => (prev === 'Standart' ? 'Uydu' : 'Standart'));
    showToast(`Harita modu: ${mapType === 'Standart' ? 'Uydu (Google Hybrid)' : 'Standart'}`);
  };

  // Line Explorer selection
  const handleSelectLineOnMap = (lineData, dirIdx) => {
    handleClearRoute();
    setActiveLineData(lineData);
    setActiveLineDirIdx(dirIdx);
    showToast(`Hat ${lineData.code} güzergahı haritada gösteriliyor.`);
  };

  const activeRoute = searchResults?.[selectedRouteIdx] || null;

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
        mapType={mapType}
        recenterTarget={recenterTarget}
        onMapClick={handleMapClick}
      />

      {/* 2. Floating Top Header & Controls */}
      <div className="floating-top-container">
        {!activeRoute ? (
          /* Normal State: Floating Search Bar & Quick Chips */
          <div className="explore-header-wrapper">
            {/* Search Pill Trigger */}
            <div
              className="floating-search-bar"
              onClick={() => {
                setSearchTargetType('to');
                setSearchModalOpen(true);
              }}
            >
              <div className="search-bar-left">
                <Search size={18} className="search-icon-svg text-primary" />
                <span className="search-bar-placeholder">Varış noktası veya hat ara...</span>
              </div>
              <div className="search-bar-right">
                <div className="search-mic-badge">
                  <Mic size={15} />
                </div>
              </div>
            </div>

            {/* Quick Chips Carousel */}
            <div className="quick-chips-carousel">
              {QUICK_SAVED_PRESETS.map(preset => {
                const IconComp = preset.icon;
                return (
                  <button
                    key={preset.id}
                    className="quick-chip-button"
                    onClick={() => handleQuickChipSelect(preset)}
                  >
                    <IconComp size={13} className="quick-chip-icon" />
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Active Route State: Spec-Accurate Pill Header with Aligned Close Button */
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
              </div>
            </div>

            {/* Far Right: Circular 44x44 Close Button Aligned with Map Controls */}
            <button
              className="route-pill-close-btn"
              onClick={handleClearRoute}
              title="Rotayı Kapat"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Floating Map Controls (Top Right: Recenter & Layer) */}
        <div className="floating-map-controls">
          <button
            className={`map-ctrl-btn ${isFollowing ? 'active' : ''}`}
            onClick={handleRecenter}
            title="Konumuma Git"
          >
            <Navigation size={20} className={isFollowing ? 'text-primary' : ''} />
          </button>

          <button
            className={`map-ctrl-btn ${mapType === 'Uydu' ? 'active' : ''}`}
            onClick={handleToggleLayer}
            title={`Harita Tipi (${mapType})`}
          >
            <Layers size={20} />
          </button>
        </div>
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
          fareType={fareType}
          onFareTypeChange={setFareType}
          onClose={handleClearRoute}
        />
      )}

      {/* 6. Floating Bottom Navigation Bar (Hidden when active route sheet is open) */}
      {!searchResults && (
        <nav className="floating-bottom-nav">
          <button
            className={`bottom-nav-item ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            <Compass size={20} />
            <span>Keşfet</span>
          </button>

          <button
            className={`bottom-nav-item ${activeTab === 'lines' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('lines');
              setLinesModalOpen(true);
            }}
          >
            <Bus size={20} />
            <span>Hatlar</span>
          </button>

          <button
            className={`bottom-nav-item ${activeTab === 'fares' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('fares');
              setFaresModalOpen(true);
            }}
          >
            <CreditCard size={20} />
            <span>Tarife</span>
          </button>

          <button
            className={`bottom-nav-item ${activeTab === 'saved' ? 'active' : ''}`}
            onClick={() => {
              setSearchTargetType('to');
              setSearchModalOpen(true);
            }}
          >
            <Bookmark size={20} />
            <span>Kaydedilenler</span>
          </button>
        </nav>
      )}

      {/* 7. Search Modal */}
      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        targetType={searchTargetType}
        fromLocation={fromLocation}
        toLocation={toLocation}
        onSelectLocation={handleSelectLocation}
        onSelectFromMap={(target) => {
          setSearchTargetType(target);
          showToast('Haritada istediğiniz noktaya dokunun.');
        }}
        onOpenLines={() => {
          setSearchModalOpen(false);
          setLinesModalOpen(true);
        }}
      />

      {/* 8. Lines Explorer Modal */}
      <LinesExplorerModal
        isOpen={linesModalOpen}
        onClose={() => {
          setLinesModalOpen(false);
          setActiveTab('explore');
        }}
        onSelectLineOnMap={handleSelectLineOnMap}
      />

      {/* 9. Fares Modal */}
      <FaresModal
        isOpen={faresModalOpen}
        onClose={() => {
          setFaresModalOpen(false);
          setActiveTab('explore');
        }}
        fareType={fareType}
        onSelectFareType={setFareType}
      />

      {/* 10. Toast Notification */}
      {toast && (
        <div className={`floating-toast ${toast.type}`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
