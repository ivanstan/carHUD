import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GaugeArc, DataBox } from '../components';
import { useOBD } from '../hooks';
import { colors } from '../theme/colors';

export const OBDScreen: React.FC = () => {
  const { data: obd, isBleAvailable } = useOBD();

  // Format runtime as HH:MM:SS
  const formatRunTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate actual torque in Nm
  const actualTorqueNm = obd.referenceTorque > 0 
    ? Math.round((obd.actualTorque / 100) * obd.referenceTorque)
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Section: Engine */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ENGINE</Text>
          <View style={styles.gaugeRow}>
            <GaugeArc
              value={obd.rpm}
              min={0}
              max={5000}
              label="RPM"
              unit="×100"
              size={130}
              warningThreshold={4000}
              dangerThreshold={4500}
            />
            
            <GaugeArc
              value={obd.speed}
              min={0}
              max={200}
              label="SPEED"
              unit="KM/H"
              size={130}
              color={colors.secondary}
            />
            
            <GaugeArc
              value={obd.boostPressure}
              min={0}
              max={250}
              label="BOOST"
              unit="kPa"
              size={130}
              color={colors.secondary}
              warningThreshold={200}
            />
            
            <GaugeArc
              value={obd.engineLoad}
              min={0}
              max={100}
              label="LOAD"
              unit="%"
              size={130}
            />
          </View>
        </View>

        {/* Section: Temperatures */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TEMPERATURES</Text>
          <View style={styles.gaugeRow}>
            <GaugeArc
              value={obd.coolantTemp}
              min={0}
              max={130}
              label="COOLANT"
              unit="°C"
              size={110}
              warningThreshold={100}
              dangerThreshold={110}
            />
            
            <GaugeArc
              value={obd.oilTemp}
              min={0}
              max={150}
              label="OIL"
              unit="°C"
              size={110}
              warningThreshold={120}
              dangerThreshold={140}
            />
            
            <GaugeArc
              value={obd.intakeAirTemp}
              min={-20}
              max={80}
              label="INTAKE"
              unit="°C"
              size={110}
              color={colors.secondary}
            />
            
            <GaugeArc
              value={obd.ambientTemp}
              min={-20}
              max={50}
              label="AMBIENT"
              unit="°C"
              size={110}
              color={colors.secondary}
            />
          </View>
        </View>

        {/* Section: Fuel & Consumption */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FUEL SYSTEM</Text>
          <View style={styles.dataRow}>
            <DataBox
              label="FUEL LEVEL"
              value={obd.fuelLevel}
              unit="%"
              color={obd.fuelLevel < 15 ? colors.danger : obd.fuelLevel < 25 ? colors.warning : colors.primary}
              size="medium"
            />
            
            <DataBox
              label="FUEL RATE"
              value={obd.fuelRate.toFixed(1)}
              unit="L/h"
              color={colors.secondary}
              size="medium"
            />
            
            <DataBox
              label="FUEL PRESSURE"
              value={obd.fuelPressure}
              unit="kPa"
              color={colors.primary}
              size="medium"
            />
            
            <DataBox
              label="MAF RATE"
              value={obd.mafRate.toFixed(1)}
              unit="g/s"
              color={colors.secondary}
              size="medium"
            />
          </View>
        </View>

        {/* Section: Torque & Throttle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PERFORMANCE</Text>
          <View style={styles.gaugeRow}>
            <GaugeArc
              value={obd.throttlePosition}
              min={0}
              max={100}
              label="THROTTLE"
              unit="%"
              size={110}
              color={colors.secondary}
            />
            
            <GaugeArc
              value={obd.acceleratorPosition}
              min={0}
              max={100}
              label="PEDAL"
              unit="%"
              size={110}
              color={colors.secondary}
            />
            
            <GaugeArc
              value={Math.max(0, obd.actualTorque)}
              min={0}
              max={100}
              label="TORQUE"
              unit="%"
              size={110}
            />
          </View>
          
          {obd.referenceTorque > 0 && (
            <View style={styles.torqueInfo}>
              <Text style={styles.torqueText}>
                {actualTorqueNm} / {obd.referenceTorque} Nm
              </Text>
            </View>
          )}
        </View>

        {/* Section: EGR (Diesel-specific) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>EGR SYSTEM</Text>
          <View style={styles.dataRow}>
            <DataBox
              label="EGR COMMANDED"
              value={obd.egrCommanded}
              unit="%"
              color={colors.primary}
              size="medium"
            />
            
            <DataBox
              label="EGR ERROR"
              value={obd.egrError > 0 ? `+${obd.egrError}` : obd.egrError}
              unit="%"
              color={Math.abs(obd.egrError) > 10 ? colors.warning : colors.primary}
              size="medium"
            />
          </View>
        </View>

        {/* Section: System */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SYSTEM</Text>
          <View style={styles.dataRow}>
            <DataBox
              label="BATTERY"
              value={obd.batteryVoltage.toFixed(1)}
              unit="V"
              color={obd.batteryVoltage < 12 ? colors.danger : obd.batteryVoltage < 12.4 ? colors.warning : colors.primary}
              size="medium"
            />
            
            <DataBox
              label="BAROMETRIC"
              value={obd.barometricPressure}
              unit="kPa"
              color={colors.secondary}
              size="medium"
            />
            
            <DataBox
              label="RUN TIME"
              value={formatRunTime(obd.runTime)}
              color={colors.textSecondary}
              size="medium"
            />
            
            <DataBox
              label="CONNECTION"
              value={obd.isConnected ? 'ONLINE' : 'OFFLINE'}
              color={obd.isConnected ? colors.primary : colors.danger}
              size="medium"
            />
          </View>
        </View>

        {!isBleAvailable && (
          <View style={styles.demoNotice}>
            <Text style={styles.demoText}>
              ⚠ Demo mode - Connect OBD adapter for live data
            </Text>
          </View>
        )}
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
    padding: 12,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.textDim,
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginBottom: 8,
    paddingLeft: 4,
  },
  gaugeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    gap: 8,
  },
  torqueInfo: {
    alignItems: 'center',
    marginTop: 8,
  },
  torqueText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  demoNotice: {
    backgroundColor: 'rgba(255, 170, 0, 0.1)',
    borderWidth: 1,
    borderColor: colors.warning,
    padding: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  demoText: {
    color: colors.warning,
    fontSize: 11,
    fontFamily: 'monospace',
  },
});

export default OBDScreen;
