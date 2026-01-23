# 🚗 CarHUD - Aviation-Style Onboard Computer

A React Native Expo app that transforms your Android device into an aviation-style heads-up display for your car, featuring OBD-II data reading and compass/orientation sensors.

![CarHUD](https://img.shields.io/badge/Platform-Android-green) ![Expo](https://img.shields.io/badge/Expo-SDK%2054-blue)

## ✨ Features

### 🧭 Aviation HUD Display
- **Compass Tape** - Scrolling heading indicator like fighter jet HUDs
- **Artificial Horizon** - Pitch and roll visualization with aircraft symbol
- **Cardinal Direction** - Real-time heading with compass points

### 📊 OBD-II Data Reading
- **Engine RPM** - Live tachometer with redline warning
- **Vehicle Speed** - From both GPS and OBD
- **Coolant Temperature** - With overheat warnings
- **Throttle Position** - Real-time throttle %
- **Fuel Level** - Low fuel warnings
- **Engine Load** - Current engine load percentage
- **Battery Voltage** - With low voltage alert

### 📍 Location & Sensors
- **GPS Speed** - When OBD not connected
- **Altitude** - Current elevation
- **Magnetometer Compass** - Device heading
- **Device Orientation** - Pitch and roll from accelerometer

## 🛠️ Installation

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android device or emulator
- ELM327-compatible Bluetooth OBD-II adapter (for vehicle data)

### Setup

```bash
# Install dependencies
npm install

# Start the development server
npx expo start

# Run on Android device/emulator
npx expo start --android
```

### Building for Android

Since this app uses Bluetooth (react-native-ble-plx), you'll need to create a development build:

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build development APK
eas build --platform android --profile development

# Or build production APK
eas build --platform android --profile production
```

## 📱 Usage

### Connecting to OBD-II Adapter

1. Plug your ELM327/OBD-II Bluetooth adapter into your car's OBD-II port
2. Turn on your car's ignition (engine can be off)
3. Open the **Connect** tab in the app
4. Tap **Scan for Devices**
5. Select your OBD adapter from the list
6. Wait for connection confirmation

### Screens

- **HUD** - Main heads-up display with compass, artificial horizon, and key gauges
- **GAUGES** - Full dashboard view of all OBD parameters
- **CONNECT** - Bluetooth device scanning and connection management

## 🔧 Supported OBD Adapters

The app supports ELM327-compatible Bluetooth adapters, including:
- Veepeak OBD-II adapters
- BAFX Products OBD-II adapters  
- Vgate iCar Pro
- Generic ELM327 Bluetooth adapters

## ⚠️ Permissions Required

- **Bluetooth** - For OBD-II adapter communication
- **Location** - For GPS speed, heading, and Bluetooth scanning
- **Motion Sensors** - For compass and orientation data

## 🎨 Design Philosophy

Inspired by military aviation HUDs, featuring:
- Phosphor green primary color (classic avionics)
- High contrast for outdoor/dashboard visibility
- Monospace typography for readability
- Minimal, functional design

## 📁 Project Structure

```
├── App.tsx                 # Main app with navigation
├── src/
│   ├── components/         # UI components
│   │   ├── CompassHUD.tsx      # Heading tape indicator
│   │   ├── ArtificialHorizon.tsx  # Pitch/roll display
│   │   ├── SpeedIndicator.tsx  # Speed tape
│   │   ├── GaugeArc.tsx        # Arc gauge component
│   │   └── DataBox.tsx         # Data readout box
│   ├── screens/            # App screens
│   │   ├── HUDScreen.tsx       # Main HUD view
│   │   ├── OBDScreen.tsx       # Full gauges view
│   │   └── ConnectionScreen.tsx # BT connection
│   ├── hooks/              # Custom React hooks
│   │   ├── useCompass.ts       # Magnetometer
│   │   ├── useLocation.ts      # GPS location
│   │   ├── useOrientation.ts   # Device motion
│   │   └── useOBD.ts           # OBD data hook
│   ├── services/           # Business logic
│   │   └── OBDService.ts       # BLE & OBD protocol
│   └── theme/              # Styling
│       ├── colors.ts           # Color palette
│       └── fonts.ts            # Typography
```

## 🚨 Safety Notice

**Never interact with this app while driving.** This app is designed for:
- Passengers monitoring vehicle data
- Mounted dashboard display (with phone holder)
- Parked vehicle diagnostics

Always keep your eyes on the road!

## 📄 License

MIT License - feel free to modify and use for your projects!

