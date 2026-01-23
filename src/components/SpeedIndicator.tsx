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

interface SpeedIndicatorProps {
  speed: number;
  unit?: 'kmh' | 'mph';
  height?: number;
  width?: number;
}

export const SpeedIndicator: React.FC<SpeedIndicatorProps> = ({
  speed,
  unit = 'kmh',
  height = 300,
  width = 80,
}) => {
  const centerY = height / 2;
  const tapeHeight = height * 2;
  const pixelsPerUnit = 4; // 4 pixels per km/h or mph
  
  const renderTapeMarks = () => {
    const marks = [];
    const visibleUnits = height / pixelsPerUnit;
    const startSpeed = Math.max(0, speed - visibleUnits / 2 - 20);
    const endSpeed = speed + visibleUnits / 2 + 20;

    // Show marks every 10 km/h, labels every 20 km/h (cleaner)
    for (let spd = Math.floor(startSpeed / 10) * 10; spd <= endSpeed; spd += 10) {
      if (spd < 0) continue;
      
      const y = centerY - (spd - speed) * pixelsPerUnit;
      const isMajor = spd % 20 === 0;
      
      marks.push(
        <Line
          key={`mark-${spd}`}
          x1={width - (isMajor ? 25 : 12)}
          y1={y}
          x2={width}
          y2={y}
          stroke={isMajor ? colors.secondary : colors.gaugeBorder}
          strokeWidth={isMajor ? 2 : 1}
        />
      );

      // Only show labels every 20 km/h
      if (isMajor) {
        marks.push(
          <SvgText
            key={`label-${spd}`}
            x={width - 30}
            y={y + 4}
            fill={colors.secondary}
            fontSize={12}
            fontFamily="monospace"
            fontWeight="bold"
            textAnchor="end"
          >
            {spd}
          </SvgText>
        );
      }
    }

    return marks;
  };

  return (
    <View style={[styles.container, { height, width: width + 80 }]}>
      {/* Speed tape */}
      <View style={[styles.tapeContainer, { width, height }]}>
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="fadeTopBottom" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={colors.background} stopOpacity={1} />
              <Stop offset="20%" stopColor={colors.background} stopOpacity={0} />
              <Stop offset="80%" stopColor={colors.background} stopOpacity={0} />
              <Stop offset="100%" stopColor={colors.background} stopOpacity={1} />
            </LinearGradient>
          </Defs>

          <G>{renderTapeMarks()}</G>

          {/* Fade overlay */}
          <Rect x={0} y={0} width={width} height={height} fill="url(#fadeTopBottom)" />
        </Svg>

        {/* Center pointer */}
        <View style={[styles.pointer, { top: centerY - 15 }]}>
          <Svg width={20} height={30}>
            <G>
              <Line x1={0} y1={15} x2={15} y2={0} stroke={colors.secondary} strokeWidth={2} />
              <Line x1={0} y1={15} x2={15} y2={30} stroke={colors.secondary} strokeWidth={2} />
              <Line x1={0} y1={15} x2={20} y2={15} stroke={colors.secondary} strokeWidth={2} />
            </G>
          </Svg>
        </View>
      </View>

      {/* Digital readout box */}
      <View style={styles.readoutContainer}>
        <View style={styles.readoutBox}>
          <Text style={styles.speedValue}>{Math.round(speed)}</Text>
          <Text style={styles.unitLabel}>{unit.toUpperCase()}</Text>
        </View>
        <Text style={styles.label}>SPEED</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tapeContainer: {
    overflow: 'hidden',
    position: 'relative',
  },
  pointer: {
    position: 'absolute',
    right: -5,
  },
  readoutContainer: {
    marginLeft: 8,
    alignItems: 'center',
  },
  readoutBox: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 2,
    borderColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  speedValue: {
    color: colors.secondary,
    fontSize: 32,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  unitLabel: {
    color: colors.secondaryDim,
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 1,
    marginTop: 2,
  },
  label: {
    color: colors.secondaryDim,
    fontSize: 10,
    fontFamily: 'monospace',
    letterSpacing: 2,
    marginTop: 8,
  },
});

export default SpeedIndicator;

