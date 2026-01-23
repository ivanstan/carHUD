import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { 
  G, 
  Line, 
  Text as SvgText, 
  Polygon,
  Rect,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { colors } from '../theme/colors';

interface CompassHUDProps {
  heading: number;
  width?: number;
  height?: number;
}

const CARDINAL_POINTS: { [key: number]: string } = {
  0: 'N',
  45: 'NE',
  90: 'E',
  135: 'SE',
  180: 'S',
  225: 'SW',
  270: 'W',
  315: 'NW',
};

export const CompassHUD: React.FC<CompassHUDProps> = ({ 
  heading, 
  width = 400,
  height = 80,
}) => {
  const centerX = width / 2;
  const tapeWidth = width * 2; // Extended tape for smooth scrolling
  
  // Calculate tape offset based on heading
  const degreesPerPixel = 0.5; // How many degrees per pixel
  const pixelsPerDegree = 1 / degreesPerPixel;
  const offset = heading * pixelsPerDegree;

  const renderTapeMarks = () => {
    const marks = [];
    const visibleDegrees = width * degreesPerPixel;
    const startDegree = heading - visibleDegrees / 2 - 30;
    const endDegree = heading + visibleDegrees / 2 + 30;

    // Show marks every 10 degrees (less crowded), labels every 30 degrees
    for (let deg = Math.floor(startDegree / 10) * 10; deg <= endDegree; deg += 10) {
      const normalizedDeg = ((deg % 360) + 360) % 360;
      const x = centerX + (deg - heading) * pixelsPerDegree;
      
      const isCardinal = normalizedDeg % 90 === 0; // N, E, S, W
      const isInterCardinal = normalizedDeg % 45 === 0 && !isCardinal; // NE, SE, SW, NW
      const isMajor = normalizedDeg % 30 === 0; // Show numbers every 30°
      
      // Tick marks
      marks.push(
        <Line
          key={`mark-${deg}`}
          x1={x}
          y1={0}
          x2={x}
          y2={isCardinal ? 28 : isInterCardinal ? 22 : isMajor ? 16 : 10}
          stroke={isCardinal ? colors.primary : isInterCardinal ? colors.primaryDim : colors.gaugeBorder}
          strokeWidth={isCardinal ? 2.5 : isInterCardinal ? 1.5 : 1}
        />
      );

      // Labels - only show every 30° to reduce clutter
      if (isMajor || isCardinal || isInterCardinal) {
        const label = CARDINAL_POINTS[normalizedDeg] || normalizedDeg.toString();
        marks.push(
          <SvgText
            key={`label-${deg}`}
            x={x}
            y={44}
            fill={isCardinal ? colors.primary : isInterCardinal ? colors.primaryDim : colors.textDim}
            fontSize={isCardinal ? 16 : isInterCardinal ? 14 : 11}
            fontFamily="monospace"
            fontWeight={isCardinal ? 'bold' : 'normal'}
            textAnchor="middle"
          >
            {label}
          </SvgText>
        );
      }
    }

    return marks;
  };

  return (
    <View style={[styles.container, { width, height }]}>
      {/* Heading digital readout */}
      <View style={styles.headingBox}>
        <Text style={styles.headingText}>
          {heading.toString().padStart(3, '0')}°
        </Text>
      </View>

      {/* Compass tape */}
      <Svg width={width} height={60} style={styles.tape}>
        <Defs>
          <LinearGradient id="fadeEdges" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={colors.background} stopOpacity={1} />
            <Stop offset="15%" stopColor={colors.background} stopOpacity={0} />
            <Stop offset="85%" stopColor={colors.background} stopOpacity={0} />
            <Stop offset="100%" stopColor={colors.background} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        
        <G>
          {renderTapeMarks()}
        </G>

        {/* Center marker (aircraft symbol) */}
        <Polygon
          points={`${centerX},55 ${centerX - 8},65 ${centerX + 8},65`}
          fill={colors.primary}
          stroke={colors.primary}
          strokeWidth={1}
        />

        {/* Fade edges overlay */}
        <Rect
          x={0}
          y={0}
          width={width}
          height={60}
          fill="url(#fadeEdges)"
        />
      </Svg>

      {/* Scanline effect */}
      <View style={styles.scanlines} pointerEvents="none" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  headingBox: {
    backgroundColor: 'rgba(0, 255, 136, 0.1)',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 4,
  },
  headingText: {
    color: colors.primary,
    fontSize: 24,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  tape: {
    overflow: 'hidden',
  },
  scanlines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.03,
    // Would need actual scanline pattern
  },
});

export default CompassHUD;

