import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Linking } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { Inclinometer, DataBox, GForceMeter } from '../components';
import { useCalibratedSensors, useLocation, useCompass } from '../hooks';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const OffroadScreen: React.FC = () => {
  useKeepAwake();
  
  const sensors = useCalibratedSensors();
  const location = useLocation();
  const compass = useCompass();
  
  // Calculate slope from pitch angle
  const slopePercent = Math.round(Math.tan(sensors.pitch * Math.PI / 180) * 100 * 10) / 10;
  const sideTiltPercent = Math.round(Math.tan(sensors.roll * Math.PI / 180) * 100 * 10) / 10;
  const isDangerous = Math.abs(sensors.pitch) > 35 || Math.abs(sensors.roll) > 30;

  // Format slope as road sign style (e.g., "12% GRADE")
  const formatGrade = (percent: number): string => {
    const abs = Math.abs(percent);
    if (abs < 1) return 'LEVEL';
    return `${abs.toFixed(0)}% GRADE`;
  };

  // Format coordinates for display
  const formatCoord = (value: number, isLat: boolean): string => {
    const direction = isLat 
      ? (value >= 0 ? 'N' : 'S')
      : (value >= 0 ? 'E' : 'W');
    return `${Math.abs(value).toFixed(6)}° ${direction}`;
  };

  // Open Google Maps at current location
  const openGoogleMaps = () => {
    const { latitude, longitude } = location;
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  // Open Google Maps for navigation (drop pin)
  const openGoogleMapsPin = () => {
    const { latitude, longitude } = location;
    const url = `geo:${latitude},${longitude}?q=${latitude},${longitude}`;
    Linking.openURL(url).catch(() => {
      // Fallback to web URL if geo: scheme fails
      Linking.openURL(`https://www.google.com/maps?q=${latitude},${longitude}`);
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>OFF-ROAD MODE</Text>
        <View style={styles.headerStatus}>
          <View style={[
            styles.statusDot,
            { backgroundColor: sensors.isCalibrated ? colors.primary : colors.warning }
          ]} />
          <Text style={styles.statusText}>
            {sensors.isCalibrated ? 'CALIBRATED' : 'NOT CALIBRATED'}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* Left: Inclinometer */}
        <View style={styles.leftSection}>
          <Inclinometer
            pitch={sensors.pitch}
            roll={sensors.roll}
            slopePercent={slopePercent}
            sideTiltPercent={sideTiltPercent}
            isDangerous={isDangerous}
            size={Math.min(SCREEN_WIDTH * 0.38, 240)}
          />
          
          {/* Grade sign */}
          <View style={[
            styles.gradeSign,
            isDangerous && styles.gradeSignDanger
          ]}>
            <Text style={styles.gradeIcon}>
              {sensors.pitch > 2 ? '⛰️' : sensors.pitch < -2 ? '⬇️' : '➡️'}
            </Text>
            <Text style={[
              styles.gradeText,
              isDangerous && styles.gradeTextDanger
            ]}>
              {formatGrade(slopePercent)}
            </Text>
          </View>
        </View>

        {/* Center: Key data */}
        <View style={styles.centerSection}>
          {/* Pitch/Roll numbers */}
          <View style={styles.angleDisplay}>
            <View style={styles.angleBox}>
              <Text style={styles.angleLabel}>FRONT/BACK</Text>
              <Text style={[
                styles.angleValue,
                { color: Math.abs(sensors.pitch) > 25
                  ? colors.danger 
                  : Math.abs(sensors.pitch) > 15
                    ? colors.warning
                    : colors.primary }
              ]}>
                {sensors.pitch > 0 ? '+' : ''}{sensors.pitch.toFixed(1)}°
              </Text>
              <View style={styles.slopeBar}>
                <View style={[
                  styles.slopeBarFill,
                  { 
                    width: `${Math.min(100, Math.abs(slopePercent) * 2)}%`,
                    backgroundColor: Math.abs(slopePercent) > 50 
                      ? colors.danger 
                      : colors.primary
                  }
                ]} />
              </View>
              <Text style={styles.slopePercent}>
                {Math.abs(slopePercent).toFixed(1)}%
              </Text>
            </View>
            
            <View style={styles.angleBox}>
              <Text style={styles.angleLabel}>SIDE TILT</Text>
              <Text style={[
                styles.angleValue,
                { color: Math.abs(sensors.roll) > 25 
                  ? colors.danger 
                  : Math.abs(sensors.roll) > 15
                    ? colors.warning
                    : colors.secondary }
              ]}>
                {sensors.roll > 0 ? '+' : ''}{sensors.roll.toFixed(1)}°
              </Text>
              <View style={styles.slopeBar}>
                <View style={[
                  styles.slopeBarFill,
                  { 
                    width: `${Math.min(100, Math.abs(sideTiltPercent) * 2)}%`,
                    backgroundColor: Math.abs(sideTiltPercent) > 50 
                      ? colors.danger 
                      : colors.secondary
                  }
                ]} />
              </View>
              <Text style={styles.slopePercent}>
                {Math.abs(sideTiltPercent).toFixed(1)}%
              </Text>
            </View>
          </View>

          {/* Direction indicators */}
          <View style={styles.directionRow}>
            <View style={styles.directionBox}>
              <Text style={styles.directionLabel}>
                {sensors.pitch > 2 ? '↗ CLIMBING' :
                 sensors.pitch < -2 ? '↘ DESCENDING' :
                 '→ LEVEL'}
              </Text>
            </View>
            <View style={styles.directionBox}>
              <Text style={styles.directionLabel}>
                {sensors.roll < -2 ? '← LEFT TILT' :
                 sensors.roll > 2 ? '→ RIGHT TILT' :
                 '— BALANCED'}
              </Text>
            </View>
          </View>
        </View>

        {/* Right: G-Force for bumps */}
        <View style={styles.rightSection}>
          <Text style={styles.sectionTitle}>G-FORCES</Text>
          <GForceMeter
            lateralG={sensors.lateralG}
            longitudinalG={sensors.longitudinalG}
            size={Math.min(SCREEN_WIDTH * 0.22, 140)}
            maxG={1.5}
          />
        </View>
      </View>

      {/* GPS Coordinates Section */}
      <View style={styles.coordSection}>
        <View style={styles.coordDisplay}>
          <View style={styles.coordRow}>
            <Text style={styles.coordLabel}>LAT</Text>
            <Text style={styles.coordValue}>{formatCoord(location.latitude, true)}</Text>
          </View>
          <View style={styles.coordRow}>
            <Text style={styles.coordLabel}>LON</Text>
            <Text style={styles.coordValue}>{formatCoord(location.longitude, false)}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.mapButton} onPress={openGoogleMaps}>
          <Text style={styles.mapButtonIcon}>📍</Text>
          <Text style={styles.mapButtonText}>OPEN IN MAPS</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom data row */}
      <View style={styles.bottomSection}>
        <DataBox
          label="ALTITUDE"
          value={location.altitude}
          unit="m"
          color={colors.secondary}
          size="small"
        />
        <DataBox
          label="HEADING"
          value={compass.cardinalDirection}
          color={colors.primary}
          size="small"
        />
        <DataBox
          label="SPEED"
          value={location.speed}
          unit="km/h"
          color={colors.secondary}
          size="small"
        />
        <DataBox
          label="GPS ACC"
          value={location.accuracy}
          unit="m"
          color={location.accuracy < 5 ? colors.primary : colors.warning}
          size="small"
        />
        <DataBox
          label="TOTAL G"
          value={sensors.totalG.toFixed(2)}
          unit="G"
          color={sensors.totalG > 0.5 ? colors.warning : colors.primary}
          size="small"
        />
      </View>

      {/* Danger overlay */}
      {isDangerous && (
        <View style={styles.dangerOverlay}>
          <Text style={styles.dangerText}>⚠️ EXTREME ANGLE - USE CAUTION ⚠️</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.gaugeBorder,
  },
  headerTitle: {
    color: colors.warning,
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    color: colors.textDim,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: 12,
  },
  leftSection: {
    flex: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradeSign: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: colors.warning,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
  },
  gradeSignDanger: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(255, 51, 102, 0.1)',
  },
  gradeIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  gradeText: {
    color: colors.warning,
    fontSize: 16,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  gradeTextDanger: {
    color: colors.danger,
  },
  centerSection: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  angleDisplay: {
    gap: 16,
  },
  angleBox: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.gaugeBorder,
    padding: 12,
  },
  angleLabel: {
    color: colors.textDim,
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginBottom: 4,
  },
  angleValue: {
    fontSize: 28,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  slopeBar: {
    height: 4,
    backgroundColor: colors.gaugeBorder,
    marginTop: 8,
    marginBottom: 4,
  },
  slopeBarFill: {
    height: '100%',
  },
  slopePercent: {
    color: colors.textDim,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  directionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  directionBox: {
    flex: 1,
    backgroundColor: colors.gaugeBackground,
    padding: 8,
    alignItems: 'center',
  },
  directionLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  rightSection: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: colors.textDim,
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginBottom: 8,
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gaugeBorder,
  },
  coordSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.gaugeBorder,
  },
  coordDisplay: {
    flex: 1,
  },
  coordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  coordLabel: {
    color: colors.textDim,
    fontSize: 10,
    fontFamily: 'monospace',
    width: 30,
  },
  coordValue: {
    color: colors.secondary,
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  mapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  mapButtonIcon: {
    fontSize: 16,
  },
  mapButtonText: {
    color: colors.background,
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  dangerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.danger,
    paddingVertical: 4,
    alignItems: 'center',
  },
  dangerText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
});

export default OffroadScreen;

