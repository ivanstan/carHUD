import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';
import { GForceMeter, DataBox } from '../components';
import { useCalibratedSensors, useLocation } from '../hooks';
import { colors } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const PerformanceScreen: React.FC = () => {
  useKeepAwake();
  
  const sensors = useCalibratedSensors();
  const location = useLocation();
  
  // Local state for 0-100 timer
  const [timerState, setTimerState] = useState<'idle' | 'ready' | 'running' | 'finished'>('idle');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [finalTime, setFinalTime] = useState<number | null>(null);

  // Start 0-100 measurement
  const startTimer = () => {
    setTimerState('ready');
    setFinalTime(null);
    setElapsedTime(0);
  };

  // Reset everything
  const resetTimer = () => {
    setTimerState('idle');
    setStartTime(null);
    setElapsedTime(0);
    setFinalTime(null);
  };

  // Update timer based on speed
  React.useEffect(() => {
    if (timerState === 'ready' && location.speed > 5) {
      // Started moving
      setTimerState('running');
      setStartTime(Date.now());
    } else if (timerState === 'running') {
      if (location.speed >= 100) {
        // Reached 100 km/h!
        const time = (Date.now() - (startTime || 0)) / 1000;
        setFinalTime(time);
        setTimerState('finished');
      } else {
        // Update elapsed time
        setElapsedTime((Date.now() - (startTime || 0)) / 1000);
      }
    }
  }, [location.speed, timerState, startTime]);

  // Format time display
  const formatTime = (seconds: number): string => {
    return seconds.toFixed(2);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      <View style={styles.content}>
        {/* Left: G-Force Meter */}
        <View style={styles.leftSection}>
          <Text style={styles.sectionTitle}>G-FORCE</Text>
          <GForceMeter
            lateralG={sensors.lateralG}
            longitudinalG={sensors.longitudinalG}
            size={Math.min(SCREEN_WIDTH * 0.35, 220)}
            maxG={1.5}
          />
          
          {/* Current G readings */}
          <View style={styles.peakSection}>
            <Text style={styles.peakTitle}>CURRENT FORCES</Text>
            <View style={styles.peakRow}>
              <View style={styles.peakItem}>
                <Text style={styles.peakLabel}>LAT G</Text>
                <Text style={styles.peakValue}>{sensors.lateralG.toFixed(2)}G</Text>
              </View>
              <View style={styles.peakItem}>
                <Text style={styles.peakLabel}>LON G</Text>
                <Text style={styles.peakValue}>{sensors.longitudinalG.toFixed(2)}G</Text>
              </View>
              <View style={styles.peakItem}>
                <Text style={styles.peakLabel}>TOTAL</Text>
                <Text style={styles.peakValue}>{sensors.totalG.toFixed(2)}G</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Right: 0-100 Timer */}
        <View style={styles.rightSection}>
          <Text style={styles.sectionTitle}>0-100 KM/H</Text>
          
          <View style={styles.timerDisplay}>
            {timerState === 'idle' && (
              <Text style={styles.timerIdle}>--.-</Text>
            )}
            {timerState === 'ready' && (
              <>
                <Text style={styles.timerReady}>READY</Text>
                <Text style={styles.timerHint}>Start driving to begin</Text>
              </>
            )}
            {timerState === 'running' && (
              <>
                <Text style={styles.timerRunning}>{formatTime(elapsedTime)}</Text>
                <Text style={styles.timerSpeed}>{location.speed} km/h</Text>
              </>
            )}
            {timerState === 'finished' && finalTime && (
              <>
                <Text style={styles.timerFinished}>{formatTime(finalTime)}</Text>
                <Text style={styles.timerUnit}>seconds</Text>
              </>
            )}
          </View>

          <View style={styles.timerButtons}>
            {(timerState === 'idle' || timerState === 'finished') && (
              <TouchableOpacity style={styles.startButton} onPress={startTimer}>
                <Text style={styles.buttonText}>
                  {timerState === 'finished' ? 'TRY AGAIN' : 'START'}
                </Text>
              </TouchableOpacity>
            )}
            {(timerState === 'ready' || timerState === 'running') && (
              <TouchableOpacity style={styles.cancelButton} onPress={resetTimer}>
                <Text style={styles.cancelButtonText}>CANCEL</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Current speed display */}
          <View style={styles.speedDisplay}>
            <Text style={styles.speedLabel}>CURRENT SPEED</Text>
            <Text style={styles.speedValue}>{location.speed}</Text>
            <Text style={styles.speedUnit}>KM/H</Text>
          </View>
        </View>
      </View>

      {/* Bottom data row */}
      <View style={styles.bottomSection}>
        <DataBox
          label="LAT G"
          value={sensors.lateralG.toFixed(2)}
          unit="G"
          color={Math.abs(sensors.lateralG) > 0.5 ? colors.warning : colors.primary}
          size="small"
        />
        <DataBox
          label="LON G"
          value={sensors.longitudinalG.toFixed(2)}
          unit="G"
          color={Math.abs(sensors.longitudinalG) > 0.5 ? colors.warning : colors.secondary}
          size="small"
        />
        <DataBox
          label="TOTAL G"
          value={sensors.totalG.toFixed(2)}
          unit="G"
          color={sensors.totalG > 0.8 ? colors.danger : sensors.totalG > 0.5 ? colors.warning : colors.primary}
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
          label="ALTITUDE"
          value={location.altitude}
          unit="m"
          color={colors.secondary}
          size="small"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
  },
  leftSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    flex: 1,
    alignItems: 'center',
  },
  sectionTitle: {
    color: colors.textDim,
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginBottom: 12,
  },
  peakSection: {
    marginTop: 16,
    alignItems: 'center',
  },
  peakTitle: {
    color: colors.textDim,
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginBottom: 8,
  },
  peakRow: {
    flexDirection: 'row',
    gap: 16,
  },
  peakItem: {
    alignItems: 'center',
  },
  peakLabel: {
    color: colors.textDim,
    fontSize: 8,
    fontFamily: 'monospace',
  },
  peakValue: {
    color: colors.warning,
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  timerDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
  },
  timerIdle: {
    color: colors.textDim,
    fontSize: 64,
    fontFamily: 'monospace',
    fontWeight: '200',
  },
  timerReady: {
    color: colors.warning,
    fontSize: 32,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  timerHint: {
    color: colors.textDim,
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 8,
  },
  timerRunning: {
    color: colors.secondary,
    fontSize: 56,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  timerSpeed: {
    color: colors.secondaryDim,
    fontSize: 16,
    fontFamily: 'monospace',
  },
  timerFinished: {
    color: colors.primary,
    fontSize: 64,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  timerUnit: {
    color: colors.textDim,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  timerButtons: {
    marginTop: 16,
  },
  startButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  buttonText: {
    color: colors.background,
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.danger,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  speedDisplay: {
    marginTop: 24,
    alignItems: 'center',
    backgroundColor: colors.gaugeBackground,
    borderWidth: 1,
    borderColor: colors.gaugeBorder,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  speedLabel: {
    color: colors.textDim,
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  speedValue: {
    color: colors.secondary,
    fontSize: 36,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  speedUnit: {
    color: colors.textDim,
    fontSize: 10,
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
});

export default PerformanceScreen;

