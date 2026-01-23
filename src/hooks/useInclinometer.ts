import { useState, useEffect, useRef } from 'react';
import { Accelerometer } from 'expo-sensors';

export interface InclinometerData {
  // Angles in degrees
  pitch: number;      // Front/back tilt (-90 to 90) - positive = nose up
  roll: number;       // Side tilt (-90 to 90) - positive = right side down
  
  // Slope as percentage (rise/run * 100)
  slopePercent: number;   // Road grade % (positive = uphill)
  sideTiltPercent: number; // Side tilt %
  
  // For display
  slopeDirection: 'uphill' | 'downhill' | 'level';
  tiltDirection: 'left' | 'right' | 'level';
  
  // Warnings
  isStableSurface: boolean; // Low vibration = parked/stable
  isDangerous: boolean;     // Extreme angle warning
  
  isAvailable: boolean;
}

// Convert angle to slope percentage
const angleToSlopePercent = (angleDeg: number): number => {
  const angleRad = (angleDeg * Math.PI) / 180;
  return Math.tan(angleRad) * 100;
};

export const useInclinometer = (updateInterval: number = 50): InclinometerData => {
  const [data, setData] = useState<InclinometerData>({
    pitch: 0,
    roll: 0,
    slopePercent: 0,
    sideTiltPercent: 0,
    slopeDirection: 'level',
    tiltDirection: 'level',
    isStableSurface: true,
    isDangerous: false,
    isAvailable: false,
  });

  // Smoothing refs
  const smoothedPitchRef = useRef(0);
  const smoothedRollRef = useRef(0);
  const varianceRef = useRef(0);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const start = async () => {
      const available = await Accelerometer.isAvailableAsync();
      
      if (available) {
        Accelerometer.setUpdateInterval(updateInterval);
        
        subscription = Accelerometer.addListener(({ x, y, z }) => {
          // Calculate pitch and roll from accelerometer
          // When device is flat: x≈0, y≈0, z≈1 (gravity pointing down)
          
          // Pitch: rotation around X axis (front/back tilt)
          // atan2(y, z) gives angle from vertical in Y-Z plane
          const rawPitch = Math.atan2(-y, Math.sqrt(x * x + z * z)) * (180 / Math.PI);
          
          // Roll: rotation around Y axis (side tilt)  
          // atan2(x, z) gives angle from vertical in X-Z plane
          const rawRoll = Math.atan2(x, Math.sqrt(y * y + z * z)) * (180 / Math.PI);
          
          // Apply heavy smoothing for stable readings
          const smoothFactor = 0.08; // Very smooth for inclinometer
          smoothedPitchRef.current = smoothedPitchRef.current + (rawPitch - smoothedPitchRef.current) * smoothFactor;
          smoothedRollRef.current = smoothedRollRef.current + (rawRoll - smoothedRollRef.current) * smoothFactor;
          
          // Calculate variance to detect if vehicle is moving/vibrating
          const pitchDiff = Math.abs(rawPitch - smoothedPitchRef.current);
          const rollDiff = Math.abs(rawRoll - smoothedRollRef.current);
          varianceRef.current = varianceRef.current * 0.95 + (pitchDiff + rollDiff) * 0.05;
          
          const pitch = Math.round(smoothedPitchRef.current * 10) / 10;
          const roll = Math.round(smoothedRollRef.current * 10) / 10;
          
          // Convert to slope percentage
          const slopePercent = Math.round(angleToSlopePercent(pitch) * 10) / 10;
          const sideTiltPercent = Math.round(angleToSlopePercent(roll) * 10) / 10;
          
          // Determine directions
          const slopeDirection = pitch > 2 ? 'uphill' : pitch < -2 ? 'downhill' : 'level';
          const tiltDirection = roll > 2 ? 'right' : roll < -2 ? 'left' : 'level';
          
          // Stability check (low variance = stable)
          const isStableSurface = varianceRef.current < 3;
          
          // Danger warning (extreme angles)
          const isDangerous = Math.abs(pitch) > 35 || Math.abs(roll) > 30;
          
          setData({
            pitch,
            roll,
            slopePercent,
            sideTiltPercent,
            slopeDirection,
            tiltDirection,
            isStableSurface,
            isDangerous,
            isAvailable: true,
          });
        });
      }
    };

    start();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [updateInterval]);

  return data;
};


