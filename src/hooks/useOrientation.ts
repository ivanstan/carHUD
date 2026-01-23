import { useState, useEffect } from 'react';
import { DeviceMotion, DeviceMotionMeasurement } from 'expo-sensors';

export interface OrientationData {
  pitch: number;  // nose up/down (-90 to 90)
  roll: number;   // bank left/right (-180 to 180)
  yaw: number;    // heading (0 to 360)
  isAvailable: boolean;
}

export const useOrientation = (updateInterval: number = 50): OrientationData => {
  const [orientation, setOrientation] = useState<OrientationData>({
    pitch: 0,
    roll: 0,
    yaw: 0,
    isAvailable: false,
  });

  useEffect(() => {
    let subscription: { remove: () => void } | null = null;

    const startOrientation = async () => {
      const available = await DeviceMotion.isAvailableAsync();
      setOrientation(prev => ({ ...prev, isAvailable: available }));

      if (available) {
        DeviceMotion.setUpdateInterval(updateInterval);

        subscription = DeviceMotion.addListener((data: DeviceMotionMeasurement) => {
          if (data.rotation) {
            // Convert radians to degrees
            const pitch = (data.rotation.beta ?? 0) * (180 / Math.PI);
            const roll = (data.rotation.gamma ?? 0) * (180 / Math.PI);
            const yaw = ((data.rotation.alpha ?? 0) * (180 / Math.PI) + 360) % 360;

            setOrientation({
              pitch: Math.round(pitch),
              roll: Math.round(roll),
              yaw: Math.round(yaw),
              isAvailable: true,
            });
          }
        });
      }
    };

    startOrientation();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [updateInterval]);

  return orientation;
};


