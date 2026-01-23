import { useState, useEffect, useRef, useCallback } from 'react';
import { Accelerometer, Magnetometer } from 'expo-sensors';

// Storage key for calibration
const CALIBRATION_KEY = '@CarHUD:sensorCalibration';

// Simple in-memory storage (persists during app session)
const memoryStorage: { [key: string]: string } = {};
const storage = {
  getItem: async (key: string) => memoryStorage[key] || null,
  setItem: async (key: string, value: string) => { memoryStorage[key] = value; },
  removeItem: async (key: string) => { delete memoryStorage[key]; },
};

export interface CalibrationData {
  refPitch: number;
  refRoll: number;
  refYaw: number;
  calibratedAt: number;
}

export interface CalibratedSensorData {
  pitch: number;
  roll: number;
  heading: number;
  lateralG: number;
  longitudinalG: number;
  totalG: number;
  rawAccel: { x: number; y: number; z: number };
  isCalibrated: boolean;
  isAvailable: boolean;
  debugInfo: string;
}

const DEFAULT_CALIBRATION: CalibrationData = {
  refPitch: 0,
  refRoll: 0,
  refYaw: 0,
  calibratedAt: 0,
};

// Normalize angle to -180 to 180
const normalizeAngle = (angle: number): number => {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
};

// Smooth angle interpolation
const lerpAngle = (current: number, target: number, factor: number): number => {
  let diff = target - current;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return ((current + diff * factor) % 360 + 360) % 360;
};

/**
 * MOUNTING POSITION - LEFT LANDSCAPE, VERTICAL MOUNT
 * 
 * Phone orientation in car:
 * - Phone is in LEFT LANDSCAPE (rotated 90° counter-clockwise from portrait)
 * - Physical TOP of phone (cameras) → LEFT side of car
 * - Physical BOTTOM of phone → RIGHT side of car
 * - Physical RIGHT of phone → DOWN (toward floor)
 * - Physical LEFT of phone → UP (toward ceiling)
 * - Screen faces DRIVER (backward)
 * - Back of phone faces WINDSHIELD (forward)
 * 
 * SENSOR AXES (physical, fixed to device):
 * - X axis: toward physical RIGHT of phone → DOWN (toward floor)
 * - Y axis: toward physical TOP of phone → LEFT (toward driver's window)
 * - Z axis: OUT of screen → BACKWARD (toward driver)
 * 
 * CAR COORDINATES:
 * - FORWARD = toward windshield = -Z direction
 * - BACKWARD = toward driver = +Z direction
 * - RIGHT = toward passenger = -Y direction  
 * - LEFT = toward driver window = +Y direction
 * - UP = toward ceiling = -X direction
 * - DOWN = toward floor = +X direction
 * 
 * When phone is vertical on level ground:
 * - Accelerometer reads: X ≈ -1 (up force in -X), Y ≈ 0, Z ≈ 0
 */

export const useCalibratedSensors = (updateInterval: number = 50) => {
  const [data, setData] = useState<CalibratedSensorData>({
    pitch: 0,
    roll: 0,
    heading: 0,
    lateralG: 0,
    longitudinalG: 0,
    totalG: 0,
    rawAccel: { x: 0, y: 0, z: 0 },
    isCalibrated: false,
    isAvailable: false,
    debugInfo: 'Initializing...',
  });

  // Use REF for calibration so animation loop always has latest value
  const calibrationRef = useRef<CalibrationData>(DEFAULT_CALIBRATION);
  const [calibrationState, setCalibrationState] = useState<CalibrationData>(DEFAULT_CALIBRATION);
  
  // Raw sensor values
  const rawAccelRef = useRef({ x: 0, y: 0, z: 0 });
  const rawMagRef = useRef({ x: 0, y: 0, z: 0 });
  const rawPitchRef = useRef(0);
  const rawRollRef = useRef(0);
  const rawHeadingRef = useRef(0);
  
  // Smoothed values
  const smoothedPitchRef = useRef(0);
  const smoothedRollRef = useRef(0);
  const smoothedHeadingRef = useRef(0);
  const smoothedGRef = useRef({ lateral: 0, longitudinal: 0 });

  // Load calibration on mount
  useEffect(() => {
    const loadCalibration = async () => {
      try {
        const saved = await storage.getItem(CALIBRATION_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as CalibrationData;
          calibrationRef.current = parsed;
          setCalibrationState(parsed);
          console.log('Loaded calibration:', parsed);
        }
      } catch (e) {
        console.warn('Failed to load calibration:', e);
      }
    };
    loadCalibration();
  }, []);

  // TARE function - sets current position as zero reference
  const tare = useCallback(async () => {
    const newCalibration: CalibrationData = {
      refPitch: rawPitchRef.current,
      refRoll: rawRollRef.current,
      refYaw: rawHeadingRef.current,
      calibratedAt: Date.now(),
    };
    
    // Update both ref and state
    calibrationRef.current = newCalibration;
    setCalibrationState(newCalibration);
    
    // Reset smoothed values to zero (new reference point)
    smoothedPitchRef.current = 0;
    smoothedRollRef.current = 0;
    
    // Save to storage
    await storage.setItem(CALIBRATION_KEY, JSON.stringify(newCalibration));
    
    console.log('TARE calibration set:', newCalibration);
    console.log('Raw at TARE - Pitch:', rawPitchRef.current.toFixed(1), 'Roll:', rawRollRef.current.toFixed(1));
    return newCalibration;
  }, []);

  // Reset calibration
  const resetCalibration = useCallback(async () => {
    calibrationRef.current = DEFAULT_CALIBRATION;
    setCalibrationState(DEFAULT_CALIBRATION);
    await storage.removeItem(CALIBRATION_KEY);
    console.log('Calibration reset');
  }, []);

  useEffect(() => {
    let accelSub: { remove: () => void } | null = null;
    let magSub: { remove: () => void } | null = null;
    let animationId: number | null = null;
    let isRunning = true;

    const init = async () => {
      console.log('Starting sensor initialization...');
      
      // Check availability
      let accelAvailable = false;
      let magAvailable = false;
      
      try {
        accelAvailable = await Accelerometer.isAvailableAsync();
        console.log('Accelerometer available:', accelAvailable);
      } catch (e) {
        console.warn('Accelerometer check failed:', e);
      }
      
      try {
        magAvailable = await Magnetometer.isAvailableAsync();
        console.log('Magnetometer available:', magAvailable);
      } catch (e) {
        console.warn('Magnetometer check failed:', e);
      }

      if (!accelAvailable) {
        setData(prev => ({ 
          ...prev, 
          isAvailable: false,
          debugInfo: 'Accelerometer not available'
        }));
        return;
      }

      // Set update intervals
      try {
        Accelerometer.setUpdateInterval(updateInterval);
        if (magAvailable) Magnetometer.setUpdateInterval(updateInterval);
      } catch (e) {
        console.warn('Failed to set update interval:', e);
      }

      // Start accelerometer
      try {
        accelSub = Accelerometer.addListener(({ x, y, z }) => {
          rawAccelRef.current = { x, y, z };
          
          /**
           * VERTICAL MOUNT AXIS MAPPING (LEFT LANDSCAPE):
           * Based on actual accelerometer readings:
           * - X points UP (toward ceiling) - acc X ≈ +1 when level
           * - Y points RIGHT (toward passenger) - acc Y ≈ 0 when level
           * - Z points BACK (toward driver) - acc Z ≈ 0 when level
           * 
           * PITCH (nose up/down):
           * - Car nose UP → Z tilts up, X tilts forward
           * - acc Z increases, acc X decreases
           * - pitch = atan2(z, x) → positive when nose up
           * 
           * ROLL (tilt right/left):
           * - Car tilts RIGHT → Y tilts down
           * - acc Y becomes negative
           * - roll = atan2(-y, x) → positive when tilted right
           */
          
          // Pitch: positive when car nose goes UP
          const pitch = Math.atan2(z, x) * (180 / Math.PI);
          
          // Roll: positive when car tilts RIGHT
          const roll = Math.atan2(-y, x) * (180 / Math.PI);
          
          rawPitchRef.current = pitch;
          rawRollRef.current = roll;
        });
        console.log('Accelerometer listener started');
      } catch (e) {
        console.error('Failed to start accelerometer:', e);
        setData(prev => ({ ...prev, debugInfo: 'Accelerometer failed: ' + e }));
        return;
      }

      // Start magnetometer
      if (magAvailable) {
        try {
          magSub = Magnetometer.addListener(({ x, y, z }) => {
            rawMagRef.current = { x, y, z };
            /**
             * Heading for vertical mount (X up, Y right, Z back):
             * - Forward = -Z (toward windshield)
             * - Right = +Y (toward passenger)
             * - heading = atan2(right_component, forward_component)
             */
            let heading = Math.atan2(y, -z) * (180 / Math.PI);
            heading = (heading + 360) % 360;
            rawHeadingRef.current = heading;
          });
          console.log('Magnetometer listener started');
        } catch (e) {
          console.warn('Failed to start magnetometer:', e);
        }
      }

      // Animation loop
      const animate = () => {
        if (!isRunning) return;
        
        // Get calibration from REF (always current)
        const cal = calibrationRef.current;
        const smoothFactor = 0.15;
        
        // Apply calibration offset - subtract reference to get relative angle
        const calibratedPitch = normalizeAngle(rawPitchRef.current - cal.refPitch);
        const calibratedRoll = normalizeAngle(rawRollRef.current - cal.refRoll);
        const calibratedHeading = (rawHeadingRef.current - cal.refYaw + 360) % 360;
        
        // Smooth values
        smoothedPitchRef.current += (calibratedPitch - smoothedPitchRef.current) * smoothFactor;
        smoothedRollRef.current += (calibratedRoll - smoothedRollRef.current) * smoothFactor;
        smoothedHeadingRef.current = lerpAngle(smoothedHeadingRef.current, calibratedHeading, smoothFactor);
        
        /**
         * G-FORCES for vertical mount (X up, Y right, Z back):
         * - Lateral G: Y axis = right direction
         *   - Turning LEFT → pushed RIGHT → acc Y increases (positive)
         *   - lateralG = y → positive when pushed right (left turn)
         * 
         * - Longitudinal G: Z axis = backward direction
         *   - Accelerating → pushed BACK → acc Z increases (positive)
         *   - longitudinalG = z → positive when pushed back (accelerating)
         */
        const { y, z } = rawAccelRef.current;
        
        const lateralG = y;   // positive = pushed right (in a left turn)
        const longitudinalG = z; // positive = pushed back (accelerating)
        
        smoothedGRef.current.lateral += (lateralG - smoothedGRef.current.lateral) * 0.25;
        smoothedGRef.current.longitudinal += (longitudinalG - smoothedGRef.current.longitudinal) * 0.25;
        
        const totalG = Math.sqrt(lateralG * lateralG + longitudinalG * longitudinalG);
        
        // Check if calibrated
        const isCalibrated = cal.calibratedAt > 0;
        
        setData({
          pitch: Math.round(smoothedPitchRef.current * 10) / 10,
          roll: Math.round(smoothedRollRef.current * 10) / 10,
          heading: Math.round(smoothedHeadingRef.current),
          lateralG: Math.round(smoothedGRef.current.lateral * 100) / 100,
          longitudinalG: Math.round(smoothedGRef.current.longitudinal * 100) / 100,
          totalG: Math.round(totalG * 100) / 100,
          rawAccel: { ...rawAccelRef.current },
          isCalibrated,
          isAvailable: true,
          debugInfo: `Raw P:${rawPitchRef.current.toFixed(1)} R:${rawRollRef.current.toFixed(1)} | Ref P:${cal.refPitch.toFixed(1)} R:${cal.refRoll.toFixed(1)}`,
        });
        
        animationId = requestAnimationFrame(animate);
      };
      
      // Start animation loop
      animationId = requestAnimationFrame(animate);
      console.log('Animation loop started');
    };

    init();

    return () => {
      isRunning = false;
      console.log('Cleaning up sensors...');
      if (accelSub) accelSub.remove();
      if (magSub) magSub.remove();
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [updateInterval]);

  return {
    ...data,
    tare,
    resetCalibration,
    calibrationAge: calibrationState.calibratedAt > 0 
      ? Math.floor((Date.now() - calibrationState.calibratedAt) / 1000)
      : 0,
  };
};
