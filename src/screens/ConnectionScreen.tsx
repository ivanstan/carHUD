import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Device } from 'react-native-ble-plx';
import { useOBD } from '../hooks';
import { colors } from '../theme/colors';

export const ConnectionScreen: React.FC = () => {
  const { 
    data, 
    isScanning, 
    devices, 
    scanForDevices, 
    stopScan,
    connect, 
    disconnect,
    error,
    isBleAvailable,
  } = useOBD();
  
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleScan = async () => {
    if (isScanning) {
      stopScan();
    } else {
      await scanForDevices();
    }
  };

  const handleConnect = async (device: Device) => {
    try {
      setConnecting(device.id);
      await connect(device);
    } catch (err) {
      console.error('Connection failed:', err);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const renderDevice = ({ item }: { item: Device }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => handleConnect(item)}
      disabled={connecting !== null || data.isConnected}
    >
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name || 'Unknown'}</Text>
        <Text style={styles.deviceId}>{item.id}</Text>
      </View>
      {connecting === item.id && (
        <ActivityIndicator color={colors.primary} size="small" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.title}>OBD CONNECTION</Text>
        <View style={styles.statusRow}>
          <View style={[
            styles.statusDot,
            { backgroundColor: data.isConnected ? colors.primary : colors.danger }
          ]} />
          <Text style={styles.statusText}>
            {data.isConnected ? `Connected: ${data.deviceName}` : 'Disconnected'}
          </Text>
        </View>
      </View>

      {!isBleAvailable ? (
        <View style={styles.unavailableContainer}>
          <View style={styles.unavailableBox}>
            <Text style={styles.unavailableTitle}>BLUETOOTH NOT AVAILABLE</Text>
            <Text style={styles.unavailableText}>
              OBD-II connectivity requires a development build.
              {'\n\n'}
              Expo Go does not support Bluetooth Low Energy.
              {'\n\n'}
              To enable OBD features, create a development build:
            </Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>npx expo run:android</Text>
            </View>
            <Text style={styles.unavailableNote}>
              The HUD will still work with GPS and sensors in Expo Go.
            </Text>
          </View>
        </View>
      ) : data.isConnected ? (
        <View style={styles.connectedContainer}>
          <View style={styles.connectedBox}>
            <Text style={styles.connectedDevice}>{data.deviceName}</Text>
            <Text style={styles.connectedLabel}>ACTIVE CONNECTION</Text>
          </View>
          
          <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
            <Text style={styles.disconnectText}>DISCONNECT</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.scanSection}>
            <TouchableOpacity 
              style={[styles.scanButton, isScanning && styles.scanButtonActive]}
              onPress={handleScan}
            >
              {isScanning ? (
                <ActivityIndicator color={colors.background} size="small" />
              ) : (
                <Text style={styles.scanButtonText}>SCAN FOR DEVICES</Text>
              )}
            </TouchableOpacity>
            
            {isScanning && (
              <Text style={styles.scanningText}>Scanning for OBD adapters...</Text>
            )}
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={renderDevice}
            style={styles.deviceList}
            contentContainerStyle={styles.deviceListContent}
            ListEmptyComponent={
              !isScanning ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>No devices found</Text>
                  <Text style={styles.emptySubtext}>
                    Make sure your OBD-II adapter is powered on and in pairing mode
                  </Text>
                </View>
              ) : null
            }
          />
        </>
      )}

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>SETUP INSTRUCTIONS</Text>
        <Text style={styles.instructionText}>
          1. Plug your ELM327/OBD-II Bluetooth adapter into your car's OBD port
        </Text>
        <Text style={styles.instructionText}>
          2. Turn on your car's ignition (engine can be off)
        </Text>
        <Text style={styles.instructionText}>
          3. Tap "Scan for Devices" to find your adapter
        </Text>
        <Text style={styles.instructionText}>
          4. Select your adapter from the list to connect
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    color: colors.primary,
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  connectedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectedBox: {
    backgroundColor: colors.gaugeBackground,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  connectedDevice: {
    color: colors.primary,
    fontSize: 24,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  connectedLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  disconnectButton: {
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  disconnectText: {
    color: colors.danger,
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  scanSection: {
    marginBottom: 16,
    alignItems: 'center',
  },
  scanButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    minWidth: 200,
    alignItems: 'center',
  },
  scanButtonActive: {
    backgroundColor: colors.primaryDim,
  },
  scanButtonText: {
    color: colors.background,
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  scanningText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 8,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
    borderWidth: 1,
    borderColor: colors.danger,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: colors.danger,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  deviceList: {
    flex: 1,
    maxHeight: 200,
  },
  deviceListContent: {
    paddingBottom: 16,
  },
  deviceItem: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.gaugeBorder,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  deviceId: {
    color: colors.textDim,
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  emptySubtext: {
    color: colors.textDim,
    fontSize: 11,
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 18,
  },
  instructions: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.gaugeBorder,
    padding: 16,
    marginTop: 16,
  },
  instructionTitle: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginBottom: 12,
  },
  instructionText: {
    color: colors.textDim,
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  unavailableContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unavailableBox: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.warning,
    padding: 24,
    maxWidth: 400,
  },
  unavailableTitle: {
    color: colors.warning,
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  unavailableText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  codeBox: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.gaugeBorder,
    padding: 12,
    marginBottom: 16,
  },
  codeText: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  unavailableNote: {
    color: colors.textDim,
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default ConnectionScreen;

