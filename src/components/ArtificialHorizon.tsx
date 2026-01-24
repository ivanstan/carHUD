import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  G,
  Rect,
  Line,
  Text as SvgText,
  Circle,
  Path,
  Defs,
  ClipPath,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { colors } from '../theme/colors';

interface ArtificialHorizonProps {
  pitch: number;  // -90 to 90
  roll: number;   // -180 to 180
  size?: number;
}

export const ArtificialHorizon: React.FC<ArtificialHorizonProps> = ({
  pitch,
  roll,
  size = 200,
}) => {
  const center = size / 2;
  const horizonRadius = size * 0.45;
  
  // Clamp pitch for display
  const displayPitch = Math.max(-60, Math.min(60, pitch));
  const pitchOffset = displayPitch * 2; // Pixels per degree

  const renderPitchLadder = () => {
    const lines = [];
    const ladderRange = [-60, -50, -40, -30, -20, -10, 10, 20, 30, 40, 50, 60];
    
    for (const deg of ladderRange) {
      const y = center + (deg + displayPitch) * 2;
      const isPositive = deg > 0;
      const lineWidth = Math.abs(deg) % 20 === 0 ? 60 : 40;
      
      if (y > center - horizonRadius + 20 && y < center + horizonRadius - 20) {
        // Left side
        lines.push(
          <G key={`pitch-${deg}`}>
            <Line
              x1={center - lineWidth}
              y1={y}
              x2={center - 15}
              y2={y}
              stroke={colors.primary}
              strokeWidth={1.5}
            />
            <Line
              x1={center + 15}
              y1={y}
              x2={center + lineWidth}
              y2={y}
              stroke={colors.primary}
              strokeWidth={1.5}
            />
            {/* Pitch value labels */}
            <SvgText
              x={center - lineWidth - 8}
              y={y + 4}
              fill={colors.primary}
              fontSize={10}
              fontFamily="monospace"
              textAnchor="end"
            >
              {Math.abs(deg)}
            </SvgText>
            <SvgText
              x={center + lineWidth + 8}
              y={y + 4}
              fill={colors.primary}
              fontSize={10}
              fontFamily="monospace"
              textAnchor="start"
            >
              {Math.abs(deg)}
            </SvgText>
            {/* Downward ticks for negative pitch */}
            {!isPositive && (
              <>
                <Line
                  x1={center - lineWidth}
                  y1={y}
                  x2={center - lineWidth}
                  y2={y - 8}
                  stroke={colors.primary}
                  strokeWidth={1.5}
                />
                <Line
                  x1={center + lineWidth}
                  y1={y}
                  x2={center + lineWidth}
                  y2={y - 8}
                  stroke={colors.primary}
                  strokeWidth={1.5}
                />
              </>
            )}
          </G>
        );
      }
    }
    
    return lines;
  };

  const renderBankIndicator = () => {
    const bankMarks = [-60, -45, -30, -20, -10, 0, 10, 20, 30, 45, 60];
    const radius = horizonRadius + 12;
    
    return bankMarks.map((angle) => {
      const rad = ((angle - 90) * Math.PI) / 180;
      const x1 = center + Math.cos(rad) * radius;
      const y1 = center + Math.sin(rad) * radius;
      const length = angle % 30 === 0 ? 12 : 8;
      const x2 = center + Math.cos(rad) * (radius + length);
      const y2 = center + Math.sin(rad) * (radius + length);
      
      return (
        <Line
          key={`bank-${angle}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={colors.primaryDim}
          strokeWidth={angle === 0 ? 2 : 1}
        />
      );
    });
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <ClipPath id="horizonClip">
            <Circle cx={center} cy={center} r={horizonRadius} />
          </ClipPath>
          <LinearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#0a1628" />
            <Stop offset="100%" stopColor="#1a3a5c" />
          </LinearGradient>
          <LinearGradient id="groundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#3d2817" />
            <Stop offset="100%" stopColor="#1a0f08" />
          </LinearGradient>
        </Defs>

        {/* Bank angle indicator arc */}
        <G>{renderBankIndicator()}</G>

        {/* Bank pointer (top) */}
        <G transform={`rotate(${roll}, ${center}, ${center})`}>
          <Path
            d={`M ${center} ${center - horizonRadius - 8} 
                L ${center - 6} ${center - horizonRadius + 4} 
                L ${center + 6} ${center - horizonRadius + 4} Z`}
            fill={colors.primary}
          />
        </G>

        {/* Horizon ball - rotates OPPOSITE to roll (world moves opposite to aircraft), shifts with pitch */}
        <G 
          clipPath="url(#horizonClip)"
          transform={`rotate(${-roll}, ${center}, ${center})`}
        >
          {/* Sky */}
          <Rect
            x={0}
            y={-size + center + pitchOffset}
            width={size}
            height={size}
            fill="url(#skyGradient)"
          />
          
          {/* Ground */}
          <Rect
            x={0}
            y={center + pitchOffset}
            width={size}
            height={size}
            fill="url(#groundGradient)"
          />
          
          {/* Horizon line */}
          <Line
            x1={0}
            y1={center + pitchOffset}
            x2={size}
            y2={center + pitchOffset}
            stroke={colors.primary}
            strokeWidth={2}
          />

          {/* Pitch ladder */}
          <G transform={`translate(0, ${pitchOffset})`}>
            {renderPitchLadder()}
          </G>
        </G>

        {/* Fixed aircraft symbol (center reference) */}
        <G>
          {/* Center dot */}
          <Circle cx={center} cy={center} r={4} fill={colors.primary} />
          
          {/* Wings */}
          <Line
            x1={center - 50}
            y1={center}
            x2={center - 15}
            y2={center}
            stroke={colors.primary}
            strokeWidth={3}
          />
          <Line
            x1={center + 15}
            y1={center}
            x2={center + 50}
            y2={center}
            stroke={colors.primary}
            strokeWidth={3}
          />
          
          {/* Wing tips */}
          <Line
            x1={center - 50}
            y1={center}
            x2={center - 50}
            y2={center + 10}
            stroke={colors.primary}
            strokeWidth={3}
          />
          <Line
            x1={center + 50}
            y1={center}
            x2={center + 50}
            y2={center + 10}
            stroke={colors.primary}
            strokeWidth={3}
          />
        </G>

        {/* Outer ring */}
        <Circle
          cx={center}
          cy={center}
          r={horizonRadius}
          stroke={colors.primaryDim}
          strokeWidth={2}
          fill="none"
        />
      </Svg>

      {/* Pitch readout */}
      <View style={styles.pitchReadout}>
        <Text style={styles.readoutText}>
          P {pitch > 0 ? '+' : ''}{pitch}°
        </Text>
      </View>

      {/* Roll readout */}
      <View style={styles.rollReadout}>
        <Text style={styles.readoutText}>
          R {roll > 0 ? '+' : ''}{roll}°
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  pitchReadout: {
    position: 'absolute',
    bottom: 8,
    left: 8,
  },
  rollReadout: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  readoutText: {
    color: colors.primary,
    fontSize: 11,
    fontFamily: 'monospace',
  },
});

export default ArtificialHorizon;




