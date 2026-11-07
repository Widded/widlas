import { useState, useEffect, useRef, useCallback } from 'react';

export default function useLiveLocation() {
  const [liveLocation, setLiveLocation] = useState(null);
  const [isWatching, setIsWatching] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false); // Should the map follow the user?
  const watchIdRef = useRef(null);
  const isWatchingRef = useRef(false);
  const orientationAttachedRef = useRef(false);

  const handleOrientation = useCallback((event) => {
    let compassHeading = null;

    if (typeof event.webkitCompassHeading === 'number' && !isNaN(event.webkitCompassHeading)) {
      // iOS Safari: gerçek pusula yönü
      compassHeading = event.webkitCompassHeading;
    } else if (typeof event.alpha === 'number' && !isNaN(event.alpha)) {
      if (event.type === 'deviceorientationabsolute' || event.absolute === true) {
        // Android: mutlak pusula verisi (true north); ekran dönüşü ile düzelt
        const screenAngle = (window.screen?.orientation?.angle ?? window.orientation ?? 0) || 0;
        compassHeading = (((360 - event.alpha - screenAngle) % 360) + 360) % 360;
      }
      // absolute olmayan (göreli) veriler güvenilir değildir; yön gösterme.
    }

    if (compassHeading !== null) {
      setLiveLocation(prev => {
        if (!prev) return prev;
        if (prev.heading === compassHeading) return prev;
        return { ...prev, heading: compassHeading };
      });
    }
  }, []);

  const detachOrientation = useCallback(() => {
    if (orientationAttachedRef.current) {
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      window.removeEventListener('deviceorientation', handleOrientation);
      orientationAttachedRef.current = false;
    }
  }, [handleOrientation]);

  // Pusulayı dinlemeye başla. iOS'ta kullanıcı hareketi (tıklama) sırasında çağrılmalı.
  const attachCompass = useCallback(() => {
    if (!window.DeviceOrientationEvent || orientationAttachedRef.current) return false;

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      // iOS Safari: izin isteme kullanıcı hareketi içinde başlatılmalı.
      // İzin sonucu beklemeden dinleyiciler eklenir; izin gelince olaylar akmaya başlar.
      DeviceOrientationEvent.requestPermission().catch(() => {
        // Pusula izni verilmedi; yön gösterilmez.
      });
    }

    window.addEventListener('deviceorientationabsolute', handleOrientation);
    window.addEventListener('deviceorientation', handleOrientation);
    orientationAttachedRef.current = true;
    return true;
  }, [handleOrientation]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      alert("Tarayıcınız konum özelliğini desteklemiyor.");
      return;
    }

    isWatchingRef.current = true;
    setIsWatching(true);
    setIsFollowing(true); // Auto-follow when turned on

    // If already watching, don't start again
    if (watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        setLiveLocation(prev => ({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          heading: (prev && prev.heading !== null && position.coords.heading === null) ? prev.heading : position.coords.heading,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed
        }));
      },
      (error) => {
        console.error("GPS hatası:", error);
        isWatchingRef.current = false;
        setIsWatching(false);
        setIsFollowing(false);
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
        detachOrientation();
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );

    attachCompass();
  }, [attachCompass, detachOrientation]);

  const stopWatching = useCallback(() => {
    isWatchingRef.current = false;
    setIsWatching(false);
    setIsFollowing(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    detachOrientation();
  }, [detachOrientation]);

  const toggleWatching = useCallback(() => {
    if (isWatchingRef.current) {
      stopWatching();
    } else {
      startWatching();
    }
  }, [startWatching, stopWatching]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      isWatchingRef.current = false;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      detachOrientation();
    };
  }, [detachOrientation]);

  return {
    liveLocation,
    setLiveLocation,
    isWatching,
    isFollowing,
    setIsFollowing,
    attachCompass,
    startWatching,
    stopWatching,
    toggleWatching
  };
}
