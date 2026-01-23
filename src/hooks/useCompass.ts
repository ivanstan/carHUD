import { useState, useEffect, useRef } from 'react';
import { Magnetometer, MagnetometerMeasurement } from 'expo-sensors';

export interface CompassData {
  heading: number; // 0-360 degrees (smoothed)
  rawHeading: number; // Raw unsmoothed value
  cardinalDirection: string;
  isAvailable: boolean;
}

const getCardinalDirection = (heading: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(heading / 22.5) % 16;
  return directions[index];
};

const calculateHeading = (magnetometer: MagnetometerMeasurement): number => {
  const { y, z } = magnetometer;
  
  /**
   * VERTICAL MOUNT in LEFT LANDSCAPE (X up, Y right, Z back):
   * - Phone mounted with X pointing UP (toward ceiling)
   * - Y pointing RIGHT (toward passenger)
   * - Z pointing BACK (toward driver)
   * 
   * Car axes:
   * - Forward = -Z (toward windshield)
   * - Right = +Y (toward passenger)
   * 
   * Heading = angle from magnetic north, clockwise positive
   * heading = atan2(right_component, forward_component)
   */
  let heading = Math.atan2(y, -z) * (180 / Math.PI);
  
  // Normalize to 0-360
  heading = (heading + 360) % 360;
  
  return heading;
};

// Smooth angle interpolation that handles 0/360 wraparound
const lerpAngle = (current: number, target: number, factor: number): number => {
  // Calculate the shortest path between angles
  let diff = target - current;
  
  // Handle wraparound (e.g., going from 350° to 10°)
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  
  // Apply smoothing
  let result = current + diff * factor;
  
  // Normalize to 0-360
  return ((result % 360) + 360) % 360;
};

export const useCompass = (updateInterval: number = 50): CompassData => {
  const [heading, setHeading] = useState(0);
  const [rawHeading, setRawHeading] = useState(0);
  const [isAvailable, setIsAvailable] = useState(false);
  
  // Use ref for smooth interpolation
  const smoothedHeadingRef = useRef(0);
  const targetHeadingRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const startCompass = async () => {
      const available = await Magnetometer.isAvailableAsync();
      setIsAvailable(available);

      if (available) {
        // Faster sensor updates for smoother animation
        Magnetometer.setUpdateInterval(updateInterval);
        
        subscription = Magnetometer.addListener((data) => {
          const newHeading = calculateHeading(data);
          targetHeadingRef.current = newHeading;
          setRawHeading(Math.round(newHeading));
        });
        
        // Animation loop for smooth interpolation
        const animate = () => {
          // Smooth factor: 0.15 = smooth, 0.3 = responsive, 0.5 = snappy
          const smoothFactor = 0.12;
          
          smoothedHeadingRef.current = lerpAngle(
            smoothedHeadingRef.current,
            targetHeadingRef.current,
            smoothFactor
          );
          
          setHeading(Math.round(smoothedHeadingRef.current));
          animationRef.current = requestAnimationFrame(animate);
        };
        
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    startCompass();

    return () => {
      if (subscription) {
        subscription.remove();
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [updateInterval]);

  return {
    heading,
    rawHeading,
    cardinalDirection: getCardinalDirection(heading),
    isAvailable,
  };
};

