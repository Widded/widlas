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
    if (event.webkitCompassHeading) {
      // iOS
      compassHeading = event.webkitCompassHeading;
    } else if (event.absolute && event.alpha !== null) {
      // Android
      compassHeading = 360 - event.alpha;
    }
    
    if (compassHeading !== null) {
      setLiveLocation(prev => {
        if (!prev) return prev;
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

  const attachOrientation = useCallback(() => {
    if (orientationAttachedRef.current || !isWatchingRef.current) return;

    if (window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(permissionState => {
            if (permissionState === 'granted' && isWatchingRef.current) {
              window.addEventListener('deviceorientation', handleOrientation);
              orientationAttachedRef.current = true;
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener('deviceorientationabsolute', handleOrientation);
        window.addEventListener('deviceorientation', handleOrientation);
        orientationAttachedRef.current = true;
      }
    }
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

    attachOrientation();
  }, [attachOrientation, detachOrientation]);

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
    isWatching,
    isFollowing,
    setIsFollowing,
    startWatching,
    stopWatching,
    toggleWatching
  };
}
