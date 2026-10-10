import { useState, useEffect, useRef } from 'react';

export default function useLiveLocation() {
  const [liveLocation, setLiveLocation] = useState(null);
  const [isWatching, setIsWatching] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false); // Should the map follow the user?
  const watchIdRef = useRef(null);

  const handleOrientation = (event) => {
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
  };

  const startWatching = () => {
    if (!navigator.geolocation) {
      alert("Tarayıcınız konum özelliğini desteklemiyor.");
      return;
    }

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
        setIsWatching(false);
        setIsFollowing(false);
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );

    // Compass watch (DeviceOrientation)
    if (window.DeviceOrientationEvent) {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission()
          .then(permissionState => {
            if (permissionState === 'granted') {
              window.addEventListener('deviceorientation', handleOrientation);
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener('deviceorientationabsolute', handleOrientation);
        window.addEventListener('deviceorientation', handleOrientation);
      }
    }
  };

  const stopWatching = () => {
    setIsWatching(false);
    setIsFollowing(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    window.removeEventListener('deviceorientationabsolute', handleOrientation);
    window.removeEventListener('deviceorientation', handleOrientation);
  };

  const toggleWatching = () => {
    if (isWatching) {
      stopWatching();
    } else {
      startWatching();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

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
