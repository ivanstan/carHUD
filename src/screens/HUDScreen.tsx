import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { CompassHUD, ArtificialHorizon, SpeedIndicator, AltitudeIndicator, GaugeArc, DataBox, GForceMeter } from '../components';
import { useCompass, useLocation, useOBD, useCalibratedSensors, useVehicleSettings } from '../hooks';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const HUDScreen: React.FC = () => {
  // Keep screen awake while driving
  useKeepAwake();

  // Sensor data - using calibrated sensors for proper mount orientation
  const sensors = useCalibratedSensors();
  const compass = useCompass();
  const location = useLocation();
  const { data: obdData } = useOBD();
  const { settings, calculateFuel } = useVehicleSettings();

  // Use GPS heading if available and moving, otherwise calibrated sensor heading
  const heading = location.speed > 5 && location.heading > 0 ? location.heading : sensors.heading;
  
  // Calculate fuel remaining in liters
  const fuelData = calculateFuel(obdData.fuelLevel, obdData.fuelRate);

  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden />
      
      {/* Grid overlay for that authentic HUD feel */}
      <View style={styles.gridOverlay} pointerEvents="none" />
      
      {/* Top section - Compass tape */}
      <View style={styles.topSection}>
        <CompassHUD 
          heading={heading} 
          width={SCREEN_WIDTH * 0.7}
          height={80}
        />
      </View>

      {/* Main section - Aircraft-style layout */}
      <View style={styles.mainSection}>
        {/* Left - Speed tape */}
        <View style={styles.tapeColumn}>
          <SpeedIndicator 
            speed={obdData.isConnected ? obdData.speed : location.speed}
            unit="kmh"
            height={220}
            width={55}
          />
        </View>

        {/* Center - Instruments */}
        <View style={styles.centerColumn}>
          <View style={styles.centerInstruments}>
            {/* G-Force Meter - using calibrated sensors */}
            <GForceMeter
              lateralG={sensors.lateralG}
              longitudinalG={sensors.longitudinalG}
              size={Math.min(SCREEN_WIDTH * 0.22, 150)}
              maxG={1.5}
            />
            
            {/* Artificial Horizon - using calibrated sensors */}
            <ArtificialHorizon
              pitch={sensors.pitch}
              roll={sensors.roll}
              size={Math.min(SCREEN_WIDTH * 0.22, 150)}
            />
          </View>
          
          {/* Data row under instruments */}
          <View style={styles.peakReadings}>
            <View style={styles.peakItem}>
              <Text style={styles.peakLabel}>TOTAL G</Text>
              <Text style={styles.peakValue}>{sensors.totalG.toFixed(2)}G</Text>
            </View>
            <View style={styles.peakItem}>
              <Text style={styles.peakLabel}>HDG</Text>
              <Text style={[styles.peakValue, { color: colors.primary }]}>{compass.cardinalDirection}</Text>
            </View>
            <View style={styles.peakItem}>
              <Text style={styles.peakLabel}>FUEL</Text>
              <Text style={[styles.peakValue, { color: fuelData.fuelRemaining < 10 ? colors.danger : colors.secondary }]}>
                {fuelData.fuelRemaining.toFixed(0)}L
              </Text>
            </View>
          </View>
          
          {/* Calibration warning */}
          {!sensors.isCalibrated && (
            <View style={styles.calibrationWarning}>
              <Text style={styles.calibrationText}>⚠ SENSORS NOT CALIBRATED - Go to SETUP</Text>
            </View>
          )}
        </View>

        {/* Right - Altitude tape */}
        <View style={styles.tapeColumn}>
          <AltitudeIndicator
            altitude={location.altitude}
            unit="m"
            height={220}
            width={55}
            verticalSpeed={location.verticalSpeed}
          />
        </View>

        {/* Far right - Engine gauges */}
        <View style={styles.gaugeColumn}>
          <GaugeArc
            value={obdData.rpm}
            min={0}
            max={5000}
            label="RPM"
            unit=""
            size={85}
            warningThreshold={4000}
            dangerThreshold={4500}
          />
          
          <GaugeArc
            value={obdData.boostPressure}
            min={0}
            max={250}
            label="BOOST"
            unit="kPa"
            size={85}
            warningThreshold={200}
            color={colors.secondary}
          />
          
          <GaugeArc
            value={obdData.coolantTemp}
            min={0}
            max={130}
            label="TEMP"
            unit="°C"
            size={85}
            warningThreshold={100}
            dangerThreshold={110}
          />
        </View>
      </View>

      {/* Bottom section - Data readouts (diesel-optimized) */}
      <View style={styles.bottomSection}>
        <DataBox
          label="FUEL L/H"
          value={obdData.fuelRate.toFixed(1)}
          unit=""
          color={colors.secondary}
          size="small"
        />
        <DataBox
          label="LOAD"
          value={obdData.engineLoad}
          unit="%"
          color={colors.primary}
          size="small"
        />
        <DataBox
          label="OIL"
          value={obdData.oilTemp}
          unit="°C"
          color={obdData.oilTemp > 120 ? colors.warning : colors.primary}
          size="small"
        />
        <DataBox
          label="TANK"
          value={`${fuelData.fuelRemaining.toFixed(0)}L`}
          unit={`/${settings.fuelTankCapacity}L`}
          color={fuelData.fuelRemaining < 10 ? colors.danger : fuelData.fuelRemaining < 15 ? colors.warning : colors.primary}
          size="small"
        />
        <DataBox
          label="RANGE"
          value={fuelData.range}
          unit="km"
          color={fuelData.range < 50 ? colors.danger : fuelData.range < 100 ? colors.warning : colors.secondary}
          size="small"
        />
        <DataBox
          label="PITCH"
          value={`${sensors.pitch > 0 ? '+' : ''}${sensors.pitch.toFixed(0)}°`}
          color={Math.abs(sensors.pitch) > 15 ? colors.warning : colors.textSecondary}
          size="small"
        />
      </View>

      {/* Connection status indicator */}
      <View style={styles.statusIndicator}>
        <View style={[
          styles.statusDot,
          { backgroundColor: obdData.isConnected ? colors.primary : colors.danger }
        ]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.03,
    // Grid pattern would go here via background image
  },
  topSection: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  mainSection: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 4,
  },
  tapeColumn: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerColumn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerInstruments: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  peakReadings: {
    flexDirection: 'row',
    marginTop: 6,
    gap: 12,
  },
  peakItem: {
    alignItems: 'center',
  },
  peakLabel: {
    color: colors.textDim,
    fontSize: 8,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  peakValue: {
    color: colors.warning,
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  gaugeColumn: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  calibrationWarning: {
    backgroundColor: 'rgba(255, 170, 0, 0.2)',
    borderWidth: 1,
    borderColor: colors.warning,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  calibrationText: {
    color: colors.warning,
    fontSize: 9,
    fontFamily: 'monospace',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gaugeBorder,
  },
  statusIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default HUDScreen;

