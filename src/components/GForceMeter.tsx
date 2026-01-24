import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  G,
  Circle,
  Line,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import { colors } from '../theme/colors';

interface GForceMeterProps {
  lateralG: number;      // Left/right (positive = right)
  longitudinalG: number; // Accel/brake (positive = accel)
  size?: number;
  maxG?: number;
}

export const GForceMeter: React.FC<GForceMeterProps> = ({
  lateralG,
  longitudinalG,
  size = 180,
  maxG = 1.5,
}) => {
  const center = size / 2;
  const radius = size * 0.42;
  const innerRadius = size * 0.35;
  
  // Calculate dot position (clamp to maxG)
  const clampedLateral = Math.max(-maxG, Math.min(maxG, lateralG));
  const clampedLongitudinal = Math.max(-maxG, Math.min(maxG, longitudinalG));
  
  // Convert G to pixel position
  const dotX = center + (clampedLateral / maxG) * innerRadius;
  const dotY = center - (clampedLongitudinal / maxG) * innerRadius; // Negative because Y is inverted
  
  // Calculate total G for color
  const totalG = Math.sqrt(lateralG ** 2 + longitudinalG ** 2);
  
  // Color based on G-force intensity
  const getDotColor = () => {
    if (totalG > 1.0) return colors.danger;
    if (totalG > 0.6) return colors.warning;
    return colors.primary;
  };

  // Render G-force rings
  const renderRings = (): React.ReactElement[] => {
    const rings: React.ReactElement[] = [];
    const gValues = [0.25, 0.5, 0.75, 1.0, maxG];
    
    gValues.forEach((g, index) => {
      const ringRadius = (g / maxG) * innerRadius;
      rings.push(
        <Circle
          key={`ring-${g}`}
          cx={center}
          cy={center}
          r={ringRadius}
          stroke={g === 1.0 ? colors.warning : colors.gaugeBorder}
          strokeWidth={g === 1.0 ? 1.5 : 0.5}
          strokeDasharray={g === 1.0 ? undefined : "2,2"}
          fill="none"
        />
      );
    });
    
    return rings;
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          fill={colors.gaugeBackground}
          stroke={colors.gaugeBorder}
          strokeWidth={1}
        />
        
        {/* G-force rings */}
        {renderRings()}
        
        {/* Cross axes */}
        <Line
          x1={center - innerRadius}
          y1={center}
          x2={center + innerRadius}
          y2={center}
          stroke={colors.primaryDim}
          strokeWidth={1}
        />
        <Line
          x1={center}
          y1={center - innerRadius}
          x2={center}
          y2={center + innerRadius}
          stroke={colors.primaryDim}
          strokeWidth={1}
        />
        
        {/* Axis labels */}
        <SvgText
          x={center}
          y={center - innerRadius - 6}
          fill={colors.textDim}
          fontSize={9}
          fontFamily="monospace"
          textAnchor="middle"
        >
          ACCEL
        </SvgText>
        <SvgText
          x={center}
          y={center + innerRadius + 12}
          fill={colors.textDim}
          fontSize={9}
          fontFamily="monospace"
          textAnchor="middle"
        >
          BRAKE
        </SvgText>
        <SvgText
          x={center - innerRadius - 4}
          y={center + 3}
          fill={colors.textDim}
          fontSize={9}
          fontFamily="monospace"
          textAnchor="end"
        >
          L
        </SvgText>
        <SvgText
          x={center + innerRadius + 4}
          y={center + 3}
          fill={colors.textDim}
          fontSize={9}
          fontFamily="monospace"
          textAnchor="start"
        >
          R
        </SvgText>
        
        {/* Center reference dot */}
        <Circle
          cx={center}
          cy={center}
          r={3}
          fill={colors.primaryDim}
        />
        
        {/* Current G-force dot with glow effect */}
        <Circle
          cx={dotX}
          cy={dotY}
          r={12}
          fill={`${getDotColor()}33`}
        />
        <Circle
          cx={dotX}
          cy={dotY}
          r={8}
          fill={getDotColor()}
        />
        
        {/* Trail dots for visual effect */}
        <Circle
          cx={dotX}
          cy={dotY}
          r={4}
          fill="#ffffff"
          opacity={0.8}
        />
      </Svg>
      
      {/* Digital readouts */}
      <View style={styles.readouts}>
        <View style={styles.readoutRow}>
          <Text style={styles.readoutLabel}>LAT</Text>
          <Text style={[styles.readoutValue, { color: getDotColor() }]}>
            {lateralG >= 0 ? '+' : ''}{lateralG.toFixed(2)}
          </Text>
          <Text style={styles.readoutUnit}>G</Text>
        </View>
        <View style={styles.readoutRow}>
          <Text style={styles.readoutLabel}>LON</Text>
          <Text style={[styles.readoutValue, { color: getDotColor() }]}>
            {longitudinalG >= 0 ? '+' : ''}{longitudinalG.toFixed(2)}
          </Text>
          <Text style={styles.readoutUnit}>G</Text>
        </View>
      </View>
      
      {/* Total G at bottom */}
      <View style={styles.totalG}>
        <Text style={[styles.totalGValue, { color: getDotColor() }]}>
          {totalG.toFixed(2)}G
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  readouts: {
    position: 'absolute',
    top: 8,
    left: 8,
  },
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  readoutLabel: {
    color: colors.textDim,
    fontSize: 8,
    fontFamily: 'monospace',
    width: 24,
  },
  readoutValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    width: 45,
    textAlign: 'right',
  },
  readoutUnit: {
    color: colors.textDim,
    fontSize: 8,
    fontFamily: 'monospace',
    marginLeft: 2,
  },
  totalG: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  totalGValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
});

export default GForceMeter;



