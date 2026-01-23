import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  G,
  Rect,
  Line,
  Circle,
  Path,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { colors } from '../theme/colors';

interface InclinometerProps {
  pitch: number;        // -90 to 90 degrees
  roll: number;         // -90 to 90 degrees
  slopePercent: number;
  sideTiltPercent: number;
  isDangerous?: boolean;
  size?: number;
}

export const Inclinometer: React.FC<InclinometerProps> = ({
  pitch,
  roll,
  slopePercent,
  sideTiltPercent,
  isDangerous = false,
  size = 200,
}) => {
  const center = size / 2;
  const vehicleWidth = size * 0.35;
  const vehicleHeight = size * 0.18;
  
  // Clamp angles for display
  const displayPitch = Math.max(-45, Math.min(45, pitch));
  const displayRoll = Math.max(-45, Math.min(45, roll));
  
  // Color based on danger level
  const getAngleColor = (angle: number, threshold: number = 25) => {
    const absAngle = Math.abs(angle);
    if (absAngle > threshold) return colors.danger;
    if (absAngle > threshold * 0.6) return colors.warning;
    return colors.primary;
  };

  // Render angle markers around the circle
  const renderAngleMarkers = () => {
    const markers = [];
    const angles = [-45, -30, -15, 0, 15, 30, 45];
    const radius = size * 0.42;
    
    angles.forEach((angle) => {
      // Bottom arc (for pitch display)
      const radBottom = ((angle + 90) * Math.PI) / 180;
      const x1 = center + Math.cos(radBottom) * (radius - 8);
      const y1 = center + Math.sin(radBottom) * (radius - 8);
      const x2 = center + Math.cos(radBottom) * radius;
      const y2 = center + Math.sin(radBottom) * radius;
      
      markers.push(
        <Line
          key={`pitch-${angle}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={angle === 0 ? colors.primary : colors.gaugeBorder}
          strokeWidth={angle === 0 ? 2 : 1}
        />
      );
      
      // Labels for key angles
      if (angle % 15 === 0) {
        const labelRadius = radius - 16;
        const labelX = center + Math.cos(radBottom) * labelRadius;
        const labelY = center + Math.sin(radBottom) * labelRadius;
        
        markers.push(
          <SvgText
            key={`pitch-label-${angle}`}
            x={labelX}
            y={labelY + 3}
            fill={colors.textDim}
            fontSize={8}
            fontFamily="monospace"
            textAnchor="middle"
          >
            {angle}°
          </SvgText>
        );
      }
    });
    
    return markers;
  };

  // Render the vehicle silhouette (top-down view)
  const renderVehicle = () => {
    const vw = vehicleWidth;
    const vh = vehicleHeight;
    
    return (
      <G transform={`rotate(${displayRoll}, ${center}, ${center})`}>
        {/* Vehicle body */}
        <Rect
          x={center - vw / 2}
          y={center - vh / 2}
          width={vw}
          height={vh}
          rx={4}
          fill={colors.backgroundSecondary}
          stroke={isDangerous ? colors.danger : colors.primary}
          strokeWidth={2}
        />
        
        {/* Front indicator */}
        <Rect
          x={center - vw / 4}
          y={center - vh / 2 - 4}
          width={vw / 2}
          height={6}
          rx={2}
          fill={isDangerous ? colors.danger : colors.primary}
        />
        
        {/* Wheels */}
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([xMult, yMult], i) => (
          <Rect
            key={`wheel-${i}`}
            x={center + xMult * (vw / 2 - 4) - 5}
            y={center + yMult * (vh / 2) - 3}
            width={10}
            height={6}
            rx={1}
            fill={colors.textDim}
          />
        ))}
        
        {/* Roll indicator line */}
        <Line
          x1={center - vw / 2 - 10}
          y1={center}
          x2={center + vw / 2 + 10}
          y2={center}
          stroke={colors.primaryDim}
          strokeWidth={1}
          strokeDasharray="4,2"
        />
      </G>
    );
  };

  // Render the horizon line (shows pitch)
  const renderHorizonLine = () => {
    const horizonOffset = (displayPitch / 45) * (size * 0.35);
    
    return (
      <G>
        {/* Horizon reference line */}
        <Line
          x1={0}
          y1={center + horizonOffset}
          x2={size}
          y2={center + horizonOffset}
          stroke={getAngleColor(pitch)}
          strokeWidth={2}
          opacity={0.6}
        />
        
        {/* Ground fill below horizon */}
        <Rect
          x={0}
          y={center + horizonOffset}
          width={size}
          height={size / 2 - horizonOffset}
          fill="rgba(139, 90, 43, 0.15)"
        />
      </G>
    );
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#1a3050" stopOpacity={0.3} />
            <Stop offset="100%" stopColor="#0a1520" stopOpacity={0.1} />
          </LinearGradient>
        </Defs>
        
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={size * 0.45}
          fill="url(#skyGrad)"
          stroke={isDangerous ? colors.danger : colors.gaugeBorder}
          strokeWidth={1.5}
        />
        
        {/* Reference cross */}
        <Line
          x1={center}
          y1={center - size * 0.4}
          x2={center}
          y2={center + size * 0.4}
          stroke={colors.gaugeBorder}
          strokeWidth={1}
          strokeDasharray="2,4"
        />
        <Line
          x1={center - size * 0.4}
          y1={center}
          x2={center + size * 0.4}
          y2={center}
          stroke={colors.gaugeBorder}
          strokeWidth={1}
          strokeDasharray="2,4"
        />
        
        {/* Angle markers */}
        {renderAngleMarkers()}
        
        {/* Horizon line (pitch visualization) */}
        {renderHorizonLine()}
        
        {/* Vehicle silhouette (roll visualization) */}
        {renderVehicle()}
        
        {/* Center level bubble */}
        <Circle
          cx={center}
          cy={center}
          r={4}
          fill={Math.abs(pitch) < 2 && Math.abs(roll) < 2 ? colors.primary : colors.textDim}
        />
      </Svg>
      
      {/* Pitch readout (top) */}
      <View style={[styles.readout, styles.pitchReadout]}>
        <Text style={styles.readoutLabel}>PITCH</Text>
        <Text style={[styles.readoutValue, { color: getAngleColor(pitch) }]}>
          {pitch > 0 ? '+' : ''}{pitch.toFixed(1)}°
        </Text>
        <Text style={[styles.slopeValue, { color: getAngleColor(pitch) }]}>
          {slopePercent > 0 ? '↑' : slopePercent < 0 ? '↓' : '—'} {Math.abs(slopePercent).toFixed(1)}%
        </Text>
      </View>
      
      {/* Roll readout (bottom) */}
      <View style={[styles.readout, styles.rollReadout]}>
        <Text style={styles.readoutLabel}>ROLL</Text>
        <Text style={[styles.readoutValue, { color: getAngleColor(roll) }]}>
          {roll > 0 ? '+' : ''}{roll.toFixed(1)}°
        </Text>
        <Text style={[styles.slopeValue, { color: getAngleColor(roll) }]}>
          {roll > 0 ? '→' : roll < 0 ? '←' : '—'} {Math.abs(sideTiltPercent).toFixed(1)}%
        </Text>
      </View>
      
      {/* Danger warning */}
      {isDangerous && (
        <View style={styles.dangerBadge}>
          <Text style={styles.dangerText}>⚠ DANGER</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  readout: {
    position: 'absolute',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 10, 15, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  pitchReadout: {
    top: 4,
    left: '50%',
    transform: [{ translateX: -35 }],
    width: 70,
  },
  rollReadout: {
    bottom: 4,
    left: '50%',
    transform: [{ translateX: -35 }],
    width: 70,
  },
  readoutLabel: {
    color: colors.textDim,
    fontSize: 8,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  readoutValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  slopeValue: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  dangerBadge: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -12 }],
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dangerText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
});

export default Inclinometer;


