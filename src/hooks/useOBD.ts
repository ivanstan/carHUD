import { useState, useCallback, useEffect } from 'react';
import { OBDService } from '../services/OBDService';
import type { OBDData as ServiceOBDData } from '../services/OBDService';
import type { Device } from 'react-native-ble-plx';

export interface OBDData {
  speed: number;
  rpm: number;
  coolantTemp: number;
  fuelLevel: number;
  fuelRate: number;
  throttlePosition: number;
  engineLoad: number;
  intakeTemp: number;
  intakeAirTemp: number;
  intakeManifoldPressure: number;
  engineOilTemp: number;
  oilTemp: number;
  actualTorque: number;
  referenceTorque: number;
  commandedEGR: number;
  egrCommanded: number;
  egrError: number;
  boostPressure: number;
  fuelPressure: number;
  mafRate: number;
  acceleratorPosition: number;
  batteryVoltage: number;
  barometricPressure: number;
  ambientTemp: number;
  runTime: number;
  deviceName: string;
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
  intakeAirTemp: 0,
  intakeManifoldPressure: 0,
  engineOilTemp: 0,
  oilTemp: 0,
  actualTorque: 0,
  referenceTorque: 0,
  commandedEGR: 0,
  egrCommanded: 0,
  egrError: 0,
  boostPressure: 0,
  fuelPressure: 0,
  mafRate: 0,
  acceleratorPosition: 0,
  batteryVoltage: 0,
  barometricPressure: 0,
  ambientTemp: 0,
  runTime: 0,
  deviceName: '',
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
  showAllDevices: boolean;
  setShowAllDevices: (show: boolean) => void;
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
  const [data, setData] = useState<OBDData>(DEFAULT_OBD_DATA);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAllDevices, setShowAllDevices] = useState(false);
  const [obdService] = useState(() => OBDService.getInstance());

  // Check if BLE is available
  const isBleAvailable = obdService.isBleAvailable();

  // Subscribe to OBD data updates
  useEffect(() => {
    if (!isBleAvailable) {
      return;
    }

    const unsubscribe = obdService.subscribe((newData: ServiceOBDData) => {
      // Map service data to hook data (with aliases)
      const mappedData: OBDData = {
        ...newData,
        intakeTemp: newData.intakeAirTemp,
        intakeManifoldPressure: newData.boostPressure,
        engineOilTemp: newData.oilTemp,
        commandedEGR: newData.egrCommanded,
      };
      setData(mappedData);
      if (newData.isConnected && newData.deviceName) {
        setConnectedDevice(newData.deviceName);
        setIsConnecting(false);
      } else if (!newData.isConnected) {
        setConnectedDevice(null);
        setIsConnecting(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isBleAvailable, obdService]);

  const startScan = useCallback(async () => {
    if (!isBleAvailable) {
      setError('Bluetooth not available. Please use a development build.');
      return;
    }

    try {
      setIsScanning(true);
      setError(null);
      setAvailableDevices([]);

      await obdService.scanForDevices((device: Device) => {
        setAvailableDevices((prev) => {
          // Avoid duplicates
          if (prev.some((d) => d.id === device.id)) {
            return prev;
          }
          return [...prev, { id: device.id, name: device.name || 'Unknown Device' }];
        });
      }, { showAllDevices });

      setIsScanning(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
      setIsScanning(false);
    }
  }, [isBleAvailable, obdService, showAllDevices]);

  const stopScan = useCallback(() => {
    obdService.stopScan();
    setIsScanning(false);
  }, [obdService]);

  const connect = useCallback(async (deviceId: string) => {
    if (!isBleAvailable) {
      setError('Bluetooth not available. Please use a development build.');
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      stopScan();

      const device = availableDevices.find((d) => d.id === deviceId);
      if (!device) {
        throw new Error('Device not found');
      }

      await obdService.connect(deviceId);
      setConnectedDevice(device.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
      setIsConnecting(false);
    }
  }, [isBleAvailable, obdService, availableDevices, stopScan]);

  const disconnect = useCallback(async () => {
    try {
      await obdService.disconnect();
      setConnectedDevice(null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Disconnect failed');
    }
  }, [obdService]);

  return {
    data,
    isScanning,
    isConnecting,
    connectedDevice,
    availableDevices,
    error,
    isBleAvailable,
    showAllDevices,
    setShowAllDevices,
    startScan,
    stopScan,
    connect,
    disconnect,
  };
};

