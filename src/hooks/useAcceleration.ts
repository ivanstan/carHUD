import { useState, useEffect, useRef } from 'react';
import { Accelerometer, AccelerometerMeasurement } from 'expo-sensors';

export interface AccelerationData {
  // Raw G-forces
  x: number;  // Lateral (left/right) - positive = right turn
  y: number;  // Longitudinal (front/back) - positive = acceleration, negative = braking
  z: number;  // Vertical - normally ~1G (gravity)
  
  // Processed values
  lateralG: number;      // Cornering G-force (absolute)
  longitudinalG: number; // Accel/brake G-force (signed: + = accel, - = brake)
  totalG: number;        // Combined horizontal G
  
  // Peak values (for the session)
  peakAccelG: number;
  peakBrakeG: number;
  peakLateralG: number;
  
  // 0-100 km/h time estimation
  zeroToHundredTime: number | null;  // seconds, null if not measured
  isAccelerating: boolean;
  
  isAvailable: boolean;
}

const GRAVITY = 9.81; // m/s²

export const useAcceleration = (updateInterval: number = 50): AccelerationData => {
  const [data, setData] = useState<AccelerationData>({
    x: 0,
    y: 0,
    z: 1,
    lateralG: 0,
    longitudinalG: 0,
    totalG: 0,
    peakAccelG: 0,
    peakBrakeG: 0,
    peakLateralG: 0,
    zeroToHundredTime: null,
    isAccelerating: false,
    isAvailable: false,
  });

  // For smoothing (low-pass filter)
  const smoothedRef = useRef({ x: 0, y: 0, z: 1 });
  
  // For 0-100 measurement
  const accelStartRef = useRef<number | null>(null);
  const estimatedSpeedRef = useRef(0);

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const startAccelerometer = async () => {
      const available = await Accelerometer.isAvailableAsync();
      
      if (available) {
        Accelerometer.setUpdateInterval(updateInterval);
        
        subscription = Accelerometer.addListener((measurement: AccelerometerMeasurement) => {
          // Apply low-pass filter for smoothing (reduce noise)
          const alpha = 0.3; // Smoothing factor (0-1, lower = smoother)
          const smoothed = {
            x: alpha * measurement.x + (1 - alpha) * smoothedRef.current.x,
            y: alpha * measurement.y + (1 - alpha) * smoothedRef.current.y,
            z: alpha * measurement.z + (1 - alpha) * smoothedRef.current.z,
          };
          smoothedRef.current = smoothed;

          // Device orientation: assuming phone is mounted in landscape
          // with screen facing driver (typical dash mount)
          // X = lateral (side to side)
          // Y = longitudinal (forward/back acceleration)
          // Z = vertical (gravity, should be ~1G when level)
          
          // Remove gravity component from Z and get pure acceleration
          // Note: When phone is level, Z ≈ 1G, X and Y ≈ 0G
          const lateralG = Math.abs(smoothed.x);
          const longitudinalG = -smoothed.y; // Negative because phone Y is opposite to car direction
          const totalG = Math.sqrt(smoothed.x ** 2 + smoothed.y ** 2);
          
          // Detect significant acceleration (threshold to avoid noise)
          const isAccelerating = longitudinalG > 0.1;
          
          // Update 0-100 estimation
          // Integrate acceleration to estimate speed
          if (isAccelerating && longitudinalG > 0.15) {
            if (accelStartRef.current === null) {
              accelStartRef.current = Date.now();
              estimatedSpeedRef.current = 0;
            }
            
            // v = v0 + a*t (convert G to m/s², then to km/h)
            const deltaT = updateInterval / 1000; // seconds
            const accelMs2 = longitudinalG * GRAVITY;
            estimatedSpeedRef.current += accelMs2 * deltaT * 3.6; // to km/h
          } else if (longitudinalG < 0.05) {
            // Reset when not accelerating
            accelStartRef.current = null;
            estimatedSpeedRef.current = 0;
          }
          
          setData(prev => ({
            x: smoothed.x,
            y: smoothed.y,
            z: smoothed.z,
            lateralG: Math.round(lateralG * 100) / 100,
            longitudinalG: Math.round(longitudinalG * 100) / 100,
            totalG: Math.round(totalG * 100) / 100,
            // Update peaks
            peakAccelG: longitudinalG > prev.peakAccelG ? Math.round(longitudinalG * 100) / 100 : prev.peakAccelG,
            peakBrakeG: longitudinalG < -prev.peakBrakeG ? Math.round(Math.abs(longitudinalG) * 100) / 100 : prev.peakBrakeG,
            peakLateralG: lateralG > prev.peakLateralG ? Math.round(lateralG * 100) / 100 : prev.peakLateralG,
            // 0-100 time (rough estimate based on accelerometer)
            zeroToHundredTime: estimatedSpeedRef.current >= 100 && accelStartRef.current 
              ? Math.round((Date.now() - accelStartRef.current) / 100) / 10 
              : prev.zeroToHundredTime,
            isAccelerating,
            isAvailable: true,
          }));
        });
      }
    };

    startAccelerometer();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [updateInterval]);

  // Method to reset peaks
  const resetPeaks = () => {
    setData(prev => ({
      ...prev,
      peakAccelG: 0,
      peakBrakeG: 0,
      peakLateralG: 0,
      zeroToHundredTime: null,
    }));
    accelStartRef.current = null;
    estimatedSpeedRef.current = 0;
  };

  return data;
};


