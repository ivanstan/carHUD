# Building CarHUD with OBD Support

## Why You Need a Development Build

**Expo Go does not support Bluetooth Low Energy (BLE)**, which is required for OBD-II connectivity. To use the OBD features of this app, you need to create a **development build**.

## What You're Currently Seeing

The error "BLUETOOTH NOT AVAILABLE" appears because:
- The app is running in **Expo Go**
- Expo Go is a sandbox environment that doesn't include native Bluetooth modules
- The `react-native-ble-plx` library requires native code that only works in development or production builds

## Two Bluetooth Devices Issue

If you see two devices when you plug in your OBD adapter (e.g., "OBDII" and "OBDBLE"):

- **OBDII** = Classic Bluetooth (SPP - Serial Port Profile)
- **OBDBLE** = Bluetooth Low Energy (BLE)

**Always choose the BLE version** - the app is designed for BLE and it offers:
- ✅ Better battery efficiency
- ✅ More reliable connection
- ✅ Lower latency
- ✅ Modern Android/iOS support

The app will now automatically highlight BLE devices and recommend them in the device list.

---

## How to Build for Android

### Prerequisites

1. **Android Studio** installed
2. **JDK 17** (comes with Android Studio)
3. **Android SDK** configured
4. **Physical Android device** or emulator

### Step 1: Install EAS CLI (if not already installed)

```bash
npm install -g eas-cli
```

### Step 2: Build Development APK

Choose one of these methods:

#### Option A: Local Build (Recommended for Testing)

```bash
# Install dependencies
npm install

# Build and run on connected Android device
npx expo run:android
```

This will:
- Build the app with native modules
- Install it on your connected Android device
- Start the development server

#### Option B: EAS Build (Cloud Build)

```bash
# Login to Expo (create account at expo.dev if needed)
eas login

# Create a development build
eas build --profile development --platform android

# After build completes, download and install the APK
# Then run:
npx expo start --dev-client
```

### Step 3: Connect to Your Car

1. **Plug your OBD adapter** into your car's OBD-II port (usually under the dashboard)
2. **Turn on the ignition** (engine can be off)
3. **Open the app** on your phone
4. **Tap the OBD icon** (Setup screen)
5. **Tap "Scan for Devices"**
6. **Select the BLE device** (will be marked as "Recommended")
7. **Wait for connection** - you should see "Connected"
8. **Navigate to gauges** to see live data!

---

## How to Build for iOS

### Prerequisites

1. **Mac computer** (required for iOS builds)
2. **Xcode** installed
3. **iOS device** or simulator
4. **Apple Developer account** (free or paid)

### Step 1: Install Dependencies

```bash
npm install
npx pod-install  # Install iOS native dependencies
```

### Step 2: Build and Run

```bash
npx expo run:ios
```

This will:
- Build the app with native modules
- Install it on your connected iOS device or simulator
- Start the development server

---

## Troubleshooting

### "Bluetooth permissions not granted"

**Android:**
- Go to Settings → Apps → CarHUD → Permissions
- Enable "Location" (required for Bluetooth scanning on Android)
- Enable "Bluetooth" or "Nearby devices" (Android 12+)

**iOS:**
- Go to Settings → CarHUD → Bluetooth
- Enable Bluetooth access

### "No devices found"

1. Make sure your OBD adapter is plugged in and powered on
2. Check that your car's ignition is on
3. Try removing and re-inserting the OBD adapter
4. Some adapters have a pairing button - press it to make it discoverable
5. Check if the adapter is already paired in your phone's Bluetooth settings - unpair it first

### "Connection failed"

1. If you selected "OBDII" instead of "OBDBLE", try the BLE version
2. Restart the OBD adapter by unplugging and replugging it
3. Clear the app's cache and restart
4. Some adapters need to be unpaired from phone's Bluetooth settings before connecting through the app

### Build Errors

**"Could not find or load main class org.gradle.wrapper.GradleWrapperMain"**
```bash
cd android
./gradlew clean
cd ..
npx expo run:android
```

**iOS build fails with "No bundle URL present"**
```bash
npm start -- --reset-cache
```

---

## Testing Without a Car

The app will work without OBD connection using:
- **GPS** for speed and heading
- **Sensors** for G-forces and compass
- **Mock data** for gauges (when in demo mode)

Only the OBD screen requires actual connection to show real engine data.

---

## Supported OBD Adapters

The app works with most **ELM327-compatible Bluetooth adapters**, including:

- ✅ Veepeak OBDCheck BLE/BLE+
- ✅ VGATE iCar series
- ✅ BAFX Products Bluetooth adapters
- ✅ Generic ELM327 v1.5+ BLE adapters
- ✅ OBDLink MX+ / LX

**Not compatible with:**
- ❌ WiFi-only OBD adapters
- ❌ Classic Bluetooth-only adapters (must support BLE)

---

## Next Steps

After building and installing:

1. ✅ Test in your driveway first (engine on, parked)
2. ✅ Verify all gauges show live data
3. ✅ Set up your preferred layout in Settings
4. ✅ Mount your phone on dashboard
5. ✅ Enjoy real-time vehicle data while driving!

---

## Production Build

When ready to create a production APK/IPA:

```bash
# Android
eas build --profile production --platform android

# iOS (requires Apple Developer account)
eas build --profile production --platform ios
```

---

## Need Help?

- Check that you're running the **development build**, not Expo Go
- Review the Bluetooth permissions in your phone's settings
- Make sure your OBD adapter supports **BLE** (not just Classic Bluetooth)
- Try the adapter with another OBD app to verify it's working

**Compatible with 2005 Toyota RAV4 Diesel (1CD-FTV) and most OBD-II vehicles from 2001+**

