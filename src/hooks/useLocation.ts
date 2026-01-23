import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';

export interface LocationData {
  speed: number; // km/h
  speedMph: number; // mph
  altitude: number; // meters
  altitudeFt: number; // feet
  verticalSpeed: number; // m/s (climb/descent rate)
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number; // GPS heading
  isAvailable: boolean;
  hasPermission: boolean;
}

export const useLocation = (updateInterval: number = 500): LocationData => {
  const [locationData, setLocationData] = useState<LocationData>({
    speed: 0,
    speedMph: 0,
    altitude: 0,
    altitudeFt: 0,
    verticalSpeed: 0,
    latitude: 0,
    longitude: 0,
    accuracy: 0,
    heading: 0,
    isAvailable: false,
    hasPermission: false,
  });

  // Track previous altitude for vertical speed calculation
  const prevAltitudeRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number | null>(null);
  const smoothedVSpeedRef = useRef(0);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          setLocationData(prev => ({ ...prev, hasPermission: false }));
          return;
        }

        setLocationData(prev => ({ ...prev, hasPermission: true }));

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: updateInterval,
            distanceInterval: 0,
          },
          (location) => {
            const speedMs = location.coords.speed ?? 0;
            const speedKmh = Math.max(0, speedMs * 3.6); // m/s to km/h
            const speedMph = speedKmh * 0.621371;
            const altitude = location.coords.altitude ?? 0;
            const altitudeFt = altitude * 3.28084; // meters to feet
            const now = Date.now();

            // Calculate vertical speed (m/s)
            let verticalSpeed = 0;
            if (prevAltitudeRef.current !== null && prevTimeRef.current !== null) {
              const deltaAlt = altitude - prevAltitudeRef.current;
              const deltaTime = (now - prevTimeRef.current) / 1000; // seconds
              if (deltaTime > 0) {
                const rawVSpeed = deltaAlt / deltaTime;
                // Smooth the vertical speed
                smoothedVSpeedRef.current = smoothedVSpeedRef.current * 0.7 + rawVSpeed * 0.3;
                verticalSpeed = Math.round(smoothedVSpeedRef.current * 10) / 10;
              }
            }
            prevAltitudeRef.current = altitude;
            prevTimeRef.current = now;

            setLocationData({
              speed: Math.round(speedKmh),
              speedMph: Math.round(speedMph),
              altitude: Math.round(altitude),
              altitudeFt: Math.round(altitudeFt),
              verticalSpeed,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              accuracy: Math.round(location.coords.accuracy ?? 0),
              heading: Math.round(location.coords.heading ?? 0),
              isAvailable: true,
              hasPermission: true,
            });
          }
        );
      } catch (error) {
        console.error('Location error:', error);
        setLocationData(prev => ({ ...prev, isAvailable: false }));
      }
    };

    startLocation();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [updateInterval]);

  return locationData;
};

