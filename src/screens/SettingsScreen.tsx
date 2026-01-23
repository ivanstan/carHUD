import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useCalibratedSensors, useVehicleSettings } from '../hooks';
import { colors } from '../theme/colors';

export const SettingsScreen: React.FC = () => {
  const sensors = useCalibratedSensors();
  const { settings, updateSettings } = useVehicleSettings();
  
  const [tankCapacity, setTankCapacity] = useState(settings.fuelTankCapacity.toString());
  const [vehicleName, setVehicleName] = useState(settings.vehicleName);

  // Handle TARE
  const handleTare = async () => {
    Alert.alert(
      'Calibrate Sensors',
      'Position your phone in its normal driving mount position, then press OK to set this as the zero reference.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'OK', 
          onPress: async () => {
            await sensors.tare();
            Alert.alert('Calibrated', 'Sensors have been calibrated to current position.');
          }
        },
      ]
    );
  };

  // Handle reset calibration
  const handleResetCalibration = async () => {
    Alert.alert(
      'Reset Calibration',
      'This will clear the sensor calibration. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            await sensors.resetCalibration();
            Alert.alert('Reset', 'Calibration has been reset to defaults.');
          }
        },
      ]
    );
  };

  // Save fuel settings
  const saveFuelSettings = () => {
    const capacity = parseFloat(tankCapacity);
    if (isNaN(capacity) || capacity <= 0) {
      Alert.alert('Invalid', 'Please enter a valid tank capacity.');
      return;
    }
    updateSettings({ 
      fuelTankCapacity: capacity,
      vehicleName: vehicleName.trim() || settings.vehicleName,
    });
    Alert.alert('Saved', 'Vehicle settings have been saved.');
  };

  // Format calibration age
  const formatAge = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView contentContainerStyle={styles.content}>
        {/* Sensor Calibration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SENSOR CALIBRATION</Text>
          
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mount Position Calibration (TARE)</Text>
            <Text style={styles.cardDescription}>
              Calibrate the sensors to match your phone's mounting position in the car. 
              This ensures the artificial horizon, G-forces, and inclinometer read correctly.
            </Text>
            
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={[
                styles.statusValue,
                { color: sensors.isCalibrated ? colors.primary : colors.warning }
              ]}>
                {sensors.isCalibrated ? 'CALIBRATED' : 'NOT CALIBRATED'}
              </Text>
            </View>
            
            {sensors.isCalibrated && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Calibrated:</Text>
                <Text style={styles.statusValue}>{formatAge(sensors.calibrationAge)}</Text>
              </View>
            )}
            
            {/* Sensor Status */}
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Sensors:</Text>
              <Text style={[
                styles.statusValue,
                { color: sensors.isAvailable ? colors.primary : colors.danger }
              ]}>
                {sensors.isAvailable ? 'AVAILABLE' : 'NOT AVAILABLE'}
              </Text>
            </View>
            
            {sensors.debugInfo && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Debug:</Text>
                <Text style={[styles.statusValue, { color: colors.textDim }]}>
                  {sensors.debugInfo}
                </Text>
              </View>
            )}

            {/* Live sensor preview */}
            <View style={styles.previewBox}>
              <Text style={styles.previewTitle}>CURRENT READINGS</Text>
              <View style={styles.previewRow}>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>PITCH</Text>
                  <Text style={styles.previewValue}>{sensors.pitch.toFixed(1)}°</Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>ROLL</Text>
                  <Text style={styles.previewValue}>{sensors.roll.toFixed(1)}°</Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>HEADING</Text>
                  <Text style={styles.previewValue}>{sensors.heading}°</Text>
                </View>
              </View>
              <View style={styles.previewRow}>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>LAT G</Text>
                  <Text style={styles.previewValue}>{sensors.lateralG.toFixed(2)}</Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>LON G</Text>
                  <Text style={styles.previewValue}>{sensors.longitudinalG.toFixed(2)}</Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>TOTAL G</Text>
                  <Text style={styles.previewValue}>{sensors.totalG.toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.previewRow}>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>RAW X</Text>
                  <Text style={styles.previewValue}>{sensors.rawAccel.x.toFixed(3)}</Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>RAW Y</Text>
                  <Text style={styles.previewValue}>{sensors.rawAccel.y.toFixed(3)}</Text>
                </View>
                <View style={styles.previewItem}>
                  <Text style={styles.previewLabel}>RAW Z</Text>
                  <Text style={styles.previewValue}>{sensors.rawAccel.z.toFixed(3)}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.tareButton} onPress={handleTare}>
                <Text style={styles.tareButtonText}>TARE / CALIBRATE</Text>
              </TouchableOpacity>
              
              {sensors.isCalibrated && (
                <TouchableOpacity style={styles.resetButton} onPress={handleResetCalibration}>
                  <Text style={styles.resetButtonText}>RESET</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Vehicle Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VEHICLE SETTINGS</Text>
          
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Vehicle Name</Text>
              <TextInput
                style={styles.textInput}
                value={vehicleName}
                onChangeText={setVehicleName}
                placeholder="e.g. Toyota RAV4 2005"
                placeholderTextColor={colors.textDim}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fuel Tank Capacity (Liters)</Text>
              <TextInput
                style={styles.textInput}
                value={tankCapacity}
                onChangeText={setTankCapacity}
                keyboardType="numeric"
                placeholder="60"
                placeholderTextColor={colors.textDim}
              />
              <Text style={styles.inputHint}>
                RAV4 2005 Diesel: ~60L tank
              </Text>
            </View>
            
            <TouchableOpacity style={styles.saveButton} onPress={saveFuelSettings}>
              <Text style={styles.saveButtonText}>SAVE SETTINGS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Display Units Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DISPLAY UNITS</Text>
          
          <View style={styles.card}>
            <View style={styles.unitRow}>
              <Text style={styles.unitLabel}>Speed</Text>
              <View style={styles.unitButtons}>
                <TouchableOpacity 
                  style={[styles.unitButton, settings.speedUnit === 'kmh' && styles.unitButtonActive]}
                  onPress={() => updateSettings({ speedUnit: 'kmh' })}
                >
                  <Text style={[styles.unitButtonText, settings.speedUnit === 'kmh' && styles.unitButtonTextActive]}>
                    KM/H
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.unitButton, settings.speedUnit === 'mph' && styles.unitButtonActive]}
                  onPress={() => updateSettings({ speedUnit: 'mph' })}
                >
                  <Text style={[styles.unitButtonText, settings.speedUnit === 'mph' && styles.unitButtonTextActive]}>
                    MPH
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.unitRow}>
              <Text style={styles.unitLabel}>Altitude</Text>
              <View style={styles.unitButtons}>
                <TouchableOpacity 
                  style={[styles.unitButton, settings.altitudeUnit === 'm' && styles.unitButtonActive]}
                  onPress={() => updateSettings({ altitudeUnit: 'm' })}
                >
                  <Text style={[styles.unitButtonText, settings.altitudeUnit === 'm' && styles.unitButtonTextActive]}>
                    METERS
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.unitButton, settings.altitudeUnit === 'ft' && styles.unitButtonActive]}
                  onPress={() => updateSettings({ altitudeUnit: 'ft' })}
                >
                  <Text style={[styles.unitButtonText, settings.altitudeUnit === 'ft' && styles.unitButtonTextActive]}>
                    FEET
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.unitRow}>
              <Text style={styles.unitLabel}>Temperature</Text>
              <View style={styles.unitButtons}>
                <TouchableOpacity 
                  style={[styles.unitButton, settings.temperatureUnit === 'c' && styles.unitButtonActive]}
                  onPress={() => updateSettings({ temperatureUnit: 'c' })}
                >
                  <Text style={[styles.unitButtonText, settings.temperatureUnit === 'c' && styles.unitButtonTextActive]}>
                    °C
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.unitButton, settings.temperatureUnit === 'f' && styles.unitButtonActive]}
                  onPress={() => updateSettings({ temperatureUnit: 'f' })}
                >
                  <Text style={[styles.unitButtonText, settings.temperatureUnit === 'f' && styles.unitButtonTextActive]}>
                    °F
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CALIBRATION INSTRUCTIONS</Text>
          <View style={styles.instructionBox}>
            <Text style={styles.instructionText}>
              1. Mount your phone in its normal driving position
            </Text>
            <Text style={styles.instructionText}>
              2. Park on a flat, level surface
            </Text>
            <Text style={styles.instructionText}>
              3. Make sure the car is not moving
            </Text>
            <Text style={styles.instructionText}>
              4. Press "TARE / CALIBRATE" to set zero reference
            </Text>
            <Text style={styles.instructionText}>
              5. The sensors will now read relative to this position
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: colors.textDim,
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.gaugeBorder,
    padding: 16,
  },
  cardTitle: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 18,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusLabel: {
    color: colors.textDim,
    fontSize: 11,
    fontFamily: 'monospace',
  },
  statusValue: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  previewBox: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.gaugeBorder,
    padding: 12,
    marginVertical: 12,
  },
  previewTitle: {
    color: colors.textDim,
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginBottom: 8,
    textAlign: 'center',
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  previewItem: {
    alignItems: 'center',
  },
  previewLabel: {
    color: colors.textDim,
    fontSize: 8,
    fontFamily: 'monospace',
  },
  previewValue: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tareButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tareButtonText: {
    color: colors.background,
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  resetButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  resetButtonText: {
    color: colors.danger,
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.gaugeBorder,
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: 'monospace',
    padding: 12,
  },
  inputHint: {
    color: colors.textDim,
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: colors.secondary,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.background,
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  unitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  unitLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  unitButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  unitButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.gaugeBorder,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  unitButtonActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
  },
  unitButtonText: {
    color: colors.textDim,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  unitButtonTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  instructionBox: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.gaugeBorder,
    padding: 16,
  },
  instructionText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 22,
  },
});

export default SettingsScreen;

