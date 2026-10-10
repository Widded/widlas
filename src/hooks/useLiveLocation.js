import { useState, useEffect, useRef } from 'react';

export default function useLiveLocation() {
  const [liveLocation, setLiveLocation] = useState(null);
  const [isWatching, setIsWatching] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false); // Should the map follow the user?
  const watchIdRef = useRef(null);

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
        setLiveLocation({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
          heading: position.coords.heading, // Can be null if device doesn't support compass/movement
          accuracy: position.coords.accuracy,
          speed: position.coords.speed
        });
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
  };

  const stopWatching = () => {
    setIsWatching(false);
    setIsFollowing(false);
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
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
