import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';

// OBD-II PIDs (Parameter IDs)
// Compatible with 2005 Toyota RAV4 Diesel (1CD-FTV D-4D)
export const OBD_PIDS = {
  // Engine basics
  ENGINE_RPM: '010C',
  VEHICLE_SPEED: '010D',
  COOLANT_TEMP: '0105',
  ENGINE_LOAD: '0104',
  THROTTLE_POSITION: '0111',
  
  // Fuel system
  FUEL_LEVEL: '012F',
  FUEL_PRESSURE: '010A',
  FUEL_RATE: '015E',           // Fuel consumption L/h - great for diesels!
  FUEL_TYPE: '0151',
  
  // Air intake
  INTAKE_AIR_TEMP: '010F',
  INTAKE_MANIFOLD_PRESSURE: '010B',  // MAP sensor (boost pressure for turbo!)
  MAF_RATE: '0110',
  BAROMETRIC_PRESSURE: '0133',
  
  // Timing & performance
  TIMING_ADVANCE: '010E',
  ABSOLUTE_LOAD: '0143',
  
  // Temperatures
  ENGINE_OIL_TEMP: '015C',     // Oil temperature
  AMBIENT_AIR_TEMP: '0146',    // Outside temperature
  
  // Torque (diesel-specific)
  DRIVER_DEMAND_TORQUE: '0161',
  ACTUAL_TORQUE: '0162',
  REFERENCE_TORQUE: '0163',
  
  // Pedal position
  ACCELERATOR_POS_D: '0149',
  ACCELERATOR_POS_E: '014A',
  
  // EGR (important for diesels)
  COMMANDED_EGR: '012C',
  EGR_ERROR: '012D',
  
  // System
  BATTERY_VOLTAGE: '0142',
  RUN_TIME: '011F',            // Engine runtime
  DISTANCE_WITH_MIL: '0121',   // Distance with check engine light
  DISTANCE_SINCE_CLEAR: '0131',
} as const;

export interface OBDData {
  // Engine basics
  rpm: number;
  speed: number;
  coolantTemp: number;
  engineLoad: number;
  throttlePosition: number;
  
  // Fuel
  fuelLevel: number;
  fuelRate: number;          // L/h consumption
  fuelPressure: number;      // kPa
  
  // Air/Boost
  intakeAirTemp: number;
  boostPressure: number;     // kPa (MAP - important for turbo diesel!)
  mafRate: number;           // g/s
  barometricPressure: number;
  
  // Temperatures
  oilTemp: number;
  ambientTemp: number;
  
  // Torque
  actualTorque: number;      // % of reference torque
  referenceTorque: number;   // Nm
  
  // Pedal
  acceleratorPosition: number;
  
  // EGR
  egrCommanded: number;      // %
  egrError: number;          // %
  
  // System
  batteryVoltage: number;
  runTime: number;           // seconds
  
  // Status
  isConnected: boolean;
  deviceName: string;
}

const INITIAL_OBD_DATA: OBDData = {
  rpm: 0,
  speed: 0,
  coolantTemp: 0,
  engineLoad: 0,
  throttlePosition: 0,
  fuelLevel: 0,
  fuelRate: 0,
  fuelPressure: 0,
  intakeAirTemp: 0,
  boostPressure: 0,
  mafRate: 0,
  barometricPressure: 0,
  oilTemp: 0,
  ambientTemp: 0,
  actualTorque: 0,
  referenceTorque: 0,
  acceleratorPosition: 0,
  egrCommanded: 0,
  egrError: 0,
  batteryVoltage: 0,
  runTime: 0,
  isConnected: false,
  deviceName: '',
};

// ELM327 Bluetooth Service/Characteristic UUIDs (common ones)
const ELM327_SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
const ELM327_WRITE_UUID = '0000fff2-0000-1000-8000-00805f9b34fb';
const ELM327_NOTIFY_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';

// Alternative UUIDs for SPP (Serial Port Profile)
const SPP_SERVICE_UUID = '00001101-0000-1000-8000-00805f9b34fb';

class OBDService {
  private bleManager: BleManager | null = null;
  private device: Device | null = null;
  private writeCharacteristic: Characteristic | null = null;
  private data: OBDData = { ...INITIAL_OBD_DATA };
  private listeners: ((data: OBDData) => void)[] = [];
  private pollingInterval: NodeJS.Timeout | null = null;
  private responseBuffer: string = '';
  private isAvailable: boolean = false;

  constructor() {
    try {
      this.bleManager = new BleManager();
      this.isAvailable = true;
    } catch (error) {
      console.warn('BLE not available (requires development build):', error);
      this.bleManager = null;
      this.isAvailable = false;
    }
  }

  isBleAvailable(): boolean {
    return this.isAvailable;
  }

  async requestPermissions(): Promise<boolean> {
    if (!this.bleManager) return false;
    
    if (Platform.OS === 'android') {
      const apiLevel = Platform.Version;
      
      if (apiLevel >= 31) {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ]);
        
        return (
          granted['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
          granted['android.permission.BLUETOOTH_CONNECT'] === 'granted' &&
          granted['android.permission.ACCESS_FINE_LOCATION'] === 'granted'
        );
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return granted === 'granted';
      }
    }
    return true;
  }

  async scanForDevices(onDeviceFound: (device: Device) => void): Promise<void> {
    if (!this.bleManager) {
      throw new Error('Bluetooth not available. Please use a development build.');
    }
    
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Bluetooth permissions not granted');
    }

    return new Promise((resolve, reject) => {
      this.bleManager!.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            reject(error);
            return;
          }

          if (device && device.name) {
            // Look for OBD adapters (usually named OBD, ELM, or OBDII)
            const name = device.name.toUpperCase();
            if (
              name.includes('OBD') ||
              name.includes('ELM') ||
              name.includes('VGATE') ||
              name.includes('VEEPEAK') ||
              name.includes('BAFX')
            ) {
              onDeviceFound(device);
            }
          }
        }
      );

      // Stop scanning after 10 seconds
      setTimeout(() => {
        this.bleManager.stopDeviceScan();
        resolve();
      }, 10000);
    });
  }

  stopScan(): void {
    this.bleManager?.stopDeviceScan();
  }

  async connectToDevice(device: Device): Promise<void> {
    try {
      this.device = await device.connect();
      await this.device.discoverAllServicesAndCharacteristics();
      
      const services = await this.device.services();
      
      for (const service of services) {
        const characteristics = await service.characteristics();
        
        for (const char of characteristics) {
          if (char.isWritableWithResponse || char.isWritableWithoutResponse) {
            this.writeCharacteristic = char;
          }
          
          if (char.isNotifiable) {
            char.monitor((error, characteristic) => {
              if (error) {
                console.error('Notification error:', error);
                return;
              }
              if (characteristic?.value) {
                this.handleResponse(characteristic.value);
              }
            });
          }
        }
      }

      // Initialize ELM327
      await this.initializeAdapter();
      
      this.data.isConnected = true;
      this.data.deviceName = device.name ?? 'Unknown Device';
      this.notifyListeners();
      
      // Start polling for data
      this.startPolling();
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  private async initializeAdapter(): Promise<void> {
    // ELM327 initialization sequence
    await this.sendCommand('ATZ');     // Reset
    await this.delay(1000);
    await this.sendCommand('ATE0');    // Echo off
    await this.sendCommand('ATL0');    // Linefeeds off
    await this.sendCommand('ATS0');    // Spaces off
    await this.sendCommand('ATH0');    // Headers off
    await this.sendCommand('ATSP0');   // Auto protocol
  }

  private async sendCommand(command: string): Promise<void> {
    if (!this.writeCharacteristic) return;
    
    const encoded = Buffer.from(command + '\r', 'utf-8').toString('base64');
    await this.writeCharacteristic.writeWithResponse(encoded);
  }

  private handleResponse(base64Value: string): void {
    const response = Buffer.from(base64Value, 'base64').toString('utf-8');
    this.responseBuffer += response;
    
    // Process complete responses (ending with >)
    if (this.responseBuffer.includes('>')) {
      const lines = this.responseBuffer.split('>');
      for (const line of lines) {
        this.parseOBDResponse(line.trim());
      }
      this.responseBuffer = '';
    }
  }

  private parseOBDResponse(response: string): void {
    // Remove spaces and newlines
    const clean = response.replace(/[\s\r\n]/g, '').toUpperCase();
    
    // Check for valid response (starts with 41 for mode 01 response)
    if (!clean.startsWith('41')) return;
    
    const pid = clean.substring(2, 4);
    const dataBytes = clean.substring(4);
    
    // Helper to parse single byte as percentage
    const parsePercent = (hex: string) => Math.round(parseInt(hex, 16) * 100 / 255);
    // Helper to parse single byte with offset (temp sensors)
    const parseTemp = (hex: string) => parseInt(hex, 16) - 40;
    // Helper to parse two bytes
    const parseTwoBytes = (hex: string) => {
      const A = parseInt(hex.substring(0, 2), 16);
      const B = parseInt(hex.substring(2, 4), 16);
      return 256 * A + B;
    };
    
    switch (pid) {
      // === ENGINE BASICS ===
      case '0C': // RPM: ((A*256)+B)/4
        if (dataBytes.length >= 4) {
          this.data.rpm = Math.round(parseTwoBytes(dataBytes) / 4);
        }
        break;
        
      case '0D': // Speed: A km/h
        if (dataBytes.length >= 2) {
          this.data.speed = parseInt(dataBytes.substring(0, 2), 16);
        }
        break;
        
      case '05': // Coolant temp: A-40 °C
        if (dataBytes.length >= 2) {
          this.data.coolantTemp = parseTemp(dataBytes.substring(0, 2));
        }
        break;
        
      case '04': // Engine load: A*100/255 %
        if (dataBytes.length >= 2) {
          this.data.engineLoad = parsePercent(dataBytes.substring(0, 2));
        }
        break;
        
      case '11': // Throttle position: A*100/255 %
        if (dataBytes.length >= 2) {
          this.data.throttlePosition = parsePercent(dataBytes.substring(0, 2));
        }
        break;
        
      // === FUEL SYSTEM ===
      case '2F': // Fuel level: A*100/255 %
        if (dataBytes.length >= 2) {
          this.data.fuelLevel = parsePercent(dataBytes.substring(0, 2));
        }
        break;
        
      case '5E': // Fuel rate: ((A*256)+B)/20 L/h
        if (dataBytes.length >= 4) {
          this.data.fuelRate = Math.round(parseTwoBytes(dataBytes) / 20 * 10) / 10;
        }
        break;
        
      case '0A': // Fuel pressure: A*3 kPa
        if (dataBytes.length >= 2) {
          this.data.fuelPressure = parseInt(dataBytes.substring(0, 2), 16) * 3;
        }
        break;
        
      // === AIR/BOOST (important for turbo diesel!) ===
      case '0B': // Intake manifold pressure (MAP/Boost): A kPa
        if (dataBytes.length >= 2) {
          this.data.boostPressure = parseInt(dataBytes.substring(0, 2), 16);
        }
        break;
        
      case '10': // MAF rate: ((A*256)+B)/100 g/s
        if (dataBytes.length >= 4) {
          this.data.mafRate = Math.round(parseTwoBytes(dataBytes) / 100 * 10) / 10;
        }
        break;
        
      case '0F': // Intake air temp: A-40 °C
        if (dataBytes.length >= 2) {
          this.data.intakeAirTemp = parseTemp(dataBytes.substring(0, 2));
        }
        break;
        
      case '33': // Barometric pressure: A kPa
        if (dataBytes.length >= 2) {
          this.data.barometricPressure = parseInt(dataBytes.substring(0, 2), 16);
        }
        break;
        
      // === TEMPERATURES ===
      case '5C': // Oil temperature: A-40 °C
        if (dataBytes.length >= 2) {
          this.data.oilTemp = parseTemp(dataBytes.substring(0, 2));
        }
        break;
        
      case '46': // Ambient air temp: A-40 °C
        if (dataBytes.length >= 2) {
          this.data.ambientTemp = parseTemp(dataBytes.substring(0, 2));
        }
        break;
        
      // === TORQUE (diesel-specific) ===
      case '62': // Actual engine torque: A-125 %
        if (dataBytes.length >= 2) {
          this.data.actualTorque = parseInt(dataBytes.substring(0, 2), 16) - 125;
        }
        break;
        
      case '63': // Reference torque: A*256+B Nm
        if (dataBytes.length >= 4) {
          this.data.referenceTorque = parseTwoBytes(dataBytes);
        }
        break;
        
      // === PEDAL POSITION ===
      case '49': // Accelerator pedal position D: A*100/255 %
        if (dataBytes.length >= 2) {
          this.data.acceleratorPosition = parsePercent(dataBytes.substring(0, 2));
        }
        break;
        
      // === EGR (Exhaust Gas Recirculation - important for diesel!) ===
      case '2C': // Commanded EGR: A*100/255 %
        if (dataBytes.length >= 2) {
          this.data.egrCommanded = parsePercent(dataBytes.substring(0, 2));
        }
        break;
        
      case '2D': // EGR Error: (A-128)*100/128 %
        if (dataBytes.length >= 2) {
          const A = parseInt(dataBytes.substring(0, 2), 16);
          this.data.egrError = Math.round((A - 128) * 100 / 128);
        }
        break;
        
      // === SYSTEM ===
      case '42': // Battery voltage: (A*256+B)/1000 V
        if (dataBytes.length >= 4) {
          this.data.batteryVoltage = Math.round(parseTwoBytes(dataBytes) / 100) / 10;
        }
        break;
        
      case '1F': // Run time since start: A*256+B seconds
        if (dataBytes.length >= 4) {
          this.data.runTime = parseTwoBytes(dataBytes);
        }
        break;
    }
    
    this.notifyListeners();
  }

  private startPolling(): void {
    // Priority PIDs - queried frequently
    const priorityPids = [
      OBD_PIDS.ENGINE_RPM,
      OBD_PIDS.VEHICLE_SPEED,
      OBD_PIDS.INTAKE_MANIFOLD_PRESSURE, // Boost!
      OBD_PIDS.THROTTLE_POSITION,
    ];
    
    // Secondary PIDs - queried less frequently
    const secondaryPids = [
      OBD_PIDS.COOLANT_TEMP,
      OBD_PIDS.ENGINE_OIL_TEMP,
      OBD_PIDS.FUEL_RATE,
      OBD_PIDS.FUEL_LEVEL,
      OBD_PIDS.INTAKE_AIR_TEMP,
      OBD_PIDS.AMBIENT_AIR_TEMP,
      OBD_PIDS.ACTUAL_TORQUE,
      OBD_PIDS.COMMANDED_EGR,
      OBD_PIDS.BATTERY_VOLTAGE,
    ];
    
    let priorityIndex = 0;
    let secondaryIndex = 0;
    let cycleCount = 0;
    
    this.pollingInterval = setInterval(async () => {
      if (this.data.isConnected) {
        // Every 5th query, get a secondary PID instead
        if (cycleCount % 5 === 4 && secondaryPids.length > 0) {
          await this.sendCommand(secondaryPids[secondaryIndex]);
          secondaryIndex = (secondaryIndex + 1) % secondaryPids.length;
        } else {
          await this.sendCommand(priorityPids[priorityIndex]);
          priorityIndex = (priorityIndex + 1) % priorityPids.length;
        }
        cycleCount++;
      }
    }, 150); // Query every 150ms for responsive display
  }

  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  async disconnect(): Promise<void> {
    this.stopPolling();
    
    if (this.device) {
      await this.device.cancelConnection();
      this.device = null;
    }
    
    this.writeCharacteristic = null;
    this.data = { ...INITIAL_OBD_DATA };
    this.notifyListeners();
  }

  subscribe(listener: (data: OBDData) => void): () => void {
    this.listeners.push(listener);
    listener(this.data);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener({ ...this.data }));
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getData(): OBDData {
    return { ...this.data };
  }

  isConnected(): boolean {
    return this.data.isConnected;
  }
}

export const obdService = new OBDService();
export default obdService;

