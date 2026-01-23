import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  G,
  Line,
  Text as SvgText,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { colors } from '../theme/colors';

interface AltitudeIndicatorProps {
  altitude: number;      // Current altitude
  unit?: 'm' | 'ft';     // Meters or feet
  height?: number;
  width?: number;
  verticalSpeed?: number; // Optional: m/s or ft/min climb rate
}

export const AltitudeIndicator: React.FC<AltitudeIndicatorProps> = ({
  altitude,
  unit = 'm',
  height = 300,
  width = 80,
  verticalSpeed = 0,
}) => {
  const centerY = height / 2;
  
  // Scale: pixels per unit (adjusted for altitude range)
  const pixelsPerUnit = unit === 'm' ? 0.8 : 0.3; // meters are bigger steps
  const stepSize = unit === 'm' ? 50 : 100; // Mark every 50m or 100ft
  const labelStep = unit === 'm' ? 100 : 500; // Label every 100m or 500ft
  
  const renderTapeMarks = () => {
    const marks = [];
    const visibleUnits = height / pixelsPerUnit;
    const startAlt = altitude - visibleUnits / 2 - stepSize * 2;
    const endAlt = altitude + visibleUnits / 2 + stepSize * 2;

    // Round to nearest step
    for (let alt = Math.floor(startAlt / stepSize) * stepSize; alt <= endAlt; alt += stepSize) {
      const y = centerY - (alt - altitude) * pixelsPerUnit;
      const isMajor = alt % labelStep === 0;
      const isZero = alt === 0;
      
      // Tick marks (on the left side, opposite to speed)
      marks.push(
        <Line
          key={`mark-${alt}`}
          x1={0}
          y1={y}
          x2={isMajor ? 25 : 12}
          y2={y}
          stroke={isZero ? colors.warning : isMajor ? colors.primary : colors.gaugeBorder}
          strokeWidth={isZero ? 2 : isMajor ? 2 : 1}
        />
      );

      // Labels every major step
      if (isMajor) {
        marks.push(
          <SvgText
            key={`label-${alt}`}
            x={30}
            y={y + 4}
            fill={isZero ? colors.warning : colors.primary}
            fontSize={12}
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="start"
          >
            {alt}
          </SvgText>
        );
      }
    }

    return marks;
  };

  // Climb/descend indicator
  const getVSIColor = () => {
    if (Math.abs(verticalSpeed) < 0.5) return colors.textDim;
    return verticalSpeed > 0 ? colors.primary : colors.secondary;
  };

  const getVSISymbol = () => {
    if (verticalSpeed > 0.5) return '▲';
    if (verticalSpeed < -0.5) return '▼';
    return '—';
  };

  return (
    <View style={[styles.container, { height, width: width + 80 }]}>
      {/* Digital readout box */}
      <View style={styles.readoutContainer}>
        <View style={styles.readoutBox}>
          <Text style={styles.altitudeValue}>{Math.round(altitude)}</Text>
          <Text style={styles.unitLabel}>{unit.toUpperCase()}</Text>
        </View>
        <Text style={styles.label}>ALT</Text>
        
        {/* Vertical speed indicator */}
        {verticalSpeed !== 0 && (
          <View style={styles.vsiBox}>
            <Text style={[styles.vsiSymbol, { color: getVSIColor() }]}>
              {getVSISymbol()}
            </Text>
            <Text style={[styles.vsiValue, { color: getVSIColor() }]}>
              {Math.abs(verticalSpeed).toFixed(1)}
            </Text>
            <Text style={styles.vsiUnit}>{unit}/s</Text>
          </View>
        )}
      </View>

      {/* Altitude tape */}
      <View style={[styles.tapeContainer, { width, height }]}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="fadeTopBottomAlt" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={colors.background} stopOpacity={1} />
              <Stop offset="20%" stopColor={colors.background} stopOpacity={0} />
              <Stop offset="80%" stopColor={colors.background} stopOpacity={0} />
              <Stop offset="100%" stopColor={colors.background} stopOpacity={1} />
            </LinearGradient>
          </Defs>

          <G>{renderTapeMarks()}</G>

          {/* Ground warning zone (below 0) */}
          {altitude < 100 && (
            <Rect
              x={0}
              y={centerY + altitude * pixelsPerUnit}
              width={width}
              height={height}
              fill="rgba(255, 51, 102, 0.1)"
            />
          )}

          {/* Fade overlay */}
          <Rect x={0} y={0} width={width} height={height} fill="url(#fadeTopBottomAlt)" />
        </Svg>

        {/* Center pointer (on right side, pointing left) */}
        <View style={[styles.pointer, { top: centerY - 15 }]}>
          <Svg width={20} height={30}>
            <G>
              <Line x1={20} y1={15} x2={5} y2={0} stroke={colors.primary} strokeWidth={2} />
              <Line x1={20} y1={15} x2={5} y2={30} stroke={colors.primary} strokeWidth={2} />
              <Line x1={20} y1={15} x2={0} y2={15} stroke={colors.primary} strokeWidth={2} />
            </G>
          </Svg>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readoutContainer: {
    marginRight: 8,
    alignItems: 'center',
  },
  readoutBox: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderWidth: 2,
    borderColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minWidth: 65,
    alignItems: 'center',
  },
  altitudeValue: {
    color: colors.primary,
    fontSize: 28,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  unitLabel: {
    color: colors.primaryDim,
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginTop: 2,
  },
  label: {
    color: colors.primaryDim,
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginTop: 8,
  },
  vsiBox: {
    marginTop: 12,
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  vsiSymbol: {
    fontSize: 12,
  },
  vsiValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  vsiUnit: {
    color: colors.textDim,
    fontSize: 8,
    fontFamily: 'monospace',
  },
  tapeContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  pointer: {
    position: 'absolute',
    left: -5,
  },
});

export default AltitudeIndicator;


