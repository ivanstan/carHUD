import { useState, useEffect, useCallback } from 'react';

// Try to import AsyncStorage, fallback to in-memory storage if not available
let AsyncStorage: any = null;
try {
  AsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch (e) {
  console.warn('AsyncStorage not available, using in-memory storage');
  const memoryStorage: { [key: string]: string } = {};
  AsyncStorage = {
    getItem: async (key: string) => memoryStorage[key] || null,
    setItem: async (key: string, value: string) => { memoryStorage[key] = value; },
    removeItem: async (key: string) => { delete memoryStorage[key]; },
  };
}

const SETTINGS_KEY = '@CarHUD:vehicleSettings';

export interface VehicleSettings {
  // Fuel
  fuelTankCapacity: number;  // Liters
  
  // Vehicle info (for future use)
  vehicleName: string;
  
  // Display preferences
  speedUnit: 'kmh' | 'mph';
  altitudeUnit: 'm' | 'ft';
  temperatureUnit: 'c' | 'f';
}

export interface FuelData {
  fuelLevelPercent: number;
  fuelRemaining: number;     // Liters remaining
  fuelUsed: number;          // Liters used from full
  range: number;             // Estimated range in km (based on consumption)
}

const DEFAULT_SETTINGS: VehicleSettings = {
  fuelTankCapacity: 60,  // RAV4 2005 Diesel has ~60L tank
  vehicleName: 'Toyota RAV4 2005 D-4D',
  speedUnit: 'kmh',
  altitudeUnit: 'm',
  temperatureUnit: 'c',
};

export const useVehicleSettings = () => {
  const [settings, setSettings] = useState<VehicleSettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(SETTINGS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        }
      } catch (e) {
        console.warn('Failed to load vehicle settings:', e);
      }
      setIsLoaded(true);
    };
    loadSettings();
  }, []);

  // Save settings
  const updateSettings = useCallback(async (updates: Partial<VehicleSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.warn('Failed to save vehicle settings:', e);
    }
    
    return newSettings;
  }, [settings]);

  // Calculate fuel data from OBD fuel level percentage
  const calculateFuel = useCallback((fuelLevelPercent: number, fuelRateLH: number = 0): FuelData => {
    const fuelRemaining = (fuelLevelPercent / 100) * settings.fuelTankCapacity;
    const fuelUsed = settings.fuelTankCapacity - fuelRemaining;
    
    // Estimate range based on current consumption rate
    // Assuming average speed of 60 km/h when no speed data
    let range = 0;
    if (fuelRateLH > 0) {
      // range = (fuel remaining / consumption rate) * speed
      // Simplified: hours of driving left * assumed average speed
      const hoursRemaining = fuelRemaining / fuelRateLH;
      range = hoursRemaining * 60; // Assume 60 km/h average
    } else {
      // Fallback: assume 6L/100km consumption for diesel
      range = (fuelRemaining / 6) * 100;
    }
    
    return {
      fuelLevelPercent,
      fuelRemaining: Math.round(fuelRemaining * 10) / 10,
      fuelUsed: Math.round(fuelUsed * 10) / 10,
      range: Math.round(range),
    };
  }, [settings.fuelTankCapacity]);

  return {
    settings,
    updateSettings,
    calculateFuel,
    isLoaded,
  };
};

