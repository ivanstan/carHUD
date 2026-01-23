import { useState, useCallback } from 'react';

export interface OBDData {
  speed: number;
  rpm: number;
  coolantTemp: number;
  fuelLevel: number;
  fuelRate: number;
  throttlePosition: number;
  engineLoad: number;
  intakeTemp: number;
  intakeManifoldPressure: number;
  engineOilTemp: number;
  actualTorque: number;
  commandedEGR: number;
  isConnected: boolean;
}

const DEFAULT_OBD_DATA: OBDData = {
  speed: 0,
  rpm: 0,
  coolantTemp: 0,
  fuelLevel: 0,
  fuelRate: 0,
  throttlePosition: 0,
  engineLoad: 0,
  intakeTemp: 0,
  intakeManifoldPressure: 0,
  engineOilTemp: 0,
  actualTorque: 0,
  commandedEGR: 0,
  isConnected: false,
};

export interface UseOBDResult {
  data: OBDData;
  isScanning: boolean;
  isConnecting: boolean;
  connectedDevice: string | null;
  availableDevices: Array<{ id: string; name: string }>;
  error: string | null;
  isBleAvailable: boolean;
  startScan: () => Promise<void>;
  stopScan: () => void;
  connect: (deviceId: string) => Promise<void>;
  disconnect: () => Promise<void>;
}

/**
 * Hook for OBD-II data via Bluetooth
 * Note: Requires a development build for full functionality.
 * In Expo Go, BLE is not available.
 */
export const useOBD = (): UseOBDResult => {
  const [data] = useState<OBDData>(DEFAULT_OBD_DATA);
  const [isScanning] = useState(false);
  const [isConnecting] = useState(false);
  const [connectedDevice] = useState<string | null>(null);
  const [availableDevices] = useState<Array<{ id: string; name: string }>>([]);
  const [error] = useState<string | null>(null);

  // BLE is not available in Expo Go
  const isBleAvailable = false;

  const startScan = useCallback(async () => {
    console.log('OBD: BLE scanning requires a development build');
  }, []);

  const stopScan = useCallback(() => {
    console.log('OBD: Stopping scan');
  }, []);

  const connect = useCallback(async (_deviceId: string) => {
    console.log('OBD: BLE connection requires a development build');
  }, []);

  const disconnect = useCallback(async () => {
    console.log('OBD: Disconnecting');
  }, []);

  return {
    data,
    isScanning,
    isConnecting,
    connectedDevice,
    availableDevices,
    error,
    isBleAvailable,
    startScan,
    stopScan,
    connect,
    disconnect,
  };
};


