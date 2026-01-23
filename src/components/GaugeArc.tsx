import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  G,
  Path,
  Circle,
  Line,
  Text as SvgText,
} from 'react-native-svg';
import { colors } from '../theme/colors';

interface GaugeArcProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  size?: number;
  warningThreshold?: number;
  dangerThreshold?: number;
  color?: string;
}

export const GaugeArc: React.FC<GaugeArcProps> = ({
  value,
  min,
  max,
  label,
  unit,
  size = 120,
  warningThreshold,
  dangerThreshold,
  color = colors.primary,
}) => {
  const center = size / 2;
  const radius = size * 0.38;
  const strokeWidth = size * 0.06;
  
  // Arc spans from -135 to 135 degrees (270 degree sweep)
  const startAngle = -225;
  const endAngle = 45;
  const sweepAngle = endAngle - startAngle;
  
  // Calculate current angle based on value
  const valuePercent = Math.min(1, Math.max(0, (value - min) / (max - min)));
  const currentAngle = startAngle + valuePercent * sweepAngle;
  
  // Determine color based on thresholds
  let activeColor = color;
  if (dangerThreshold !== undefined && value >= dangerThreshold) {
    activeColor = colors.danger;
  } else if (warningThreshold !== undefined && value >= warningThreshold) {
    activeColor = colors.warning;
  }

  // Convert angle to radians
  const toRadians = (angle: number) => (angle * Math.PI) / 180;

  // Calculate arc path
  const createArcPath = (startAng: number, endAng: number, r: number) => {
    const startRad = toRadians(startAng);
    const endRad = toRadians(endAng);
    
    const x1 = center + r * Math.cos(startRad);
    const y1 = center + r * Math.sin(startRad);
    const x2 = center + r * Math.cos(endRad);
    const y2 = center + r * Math.sin(endRad);
    
    const largeArc = endAng - startAng > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Render tick marks - simplified for cleaner look
  const renderTicks = () => {
    const ticks = [];
    // Only 5 major ticks (0%, 25%, 50%, 75%, 100% of range)
    const numMajorTicks = 4;
    
    for (let i = 0; i <= numMajorTicks; i++) {
      const angle = startAngle + (i / numMajorTicks) * sweepAngle;
      const rad = toRadians(angle);
      const innerR = radius - strokeWidth / 2 - 4;
      const outerR = radius - strokeWidth / 2 - 14;
      
      const x1 = center + innerR * Math.cos(rad);
      const y1 = center + innerR * Math.sin(rad);
      const x2 = center + outerR * Math.cos(rad);
      const y2 = center + outerR * Math.sin(rad);
      
      // Major tick marks
      ticks.push(
        <Line
          key={i}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={colors.primaryDim}
          strokeWidth={1.5}
        />
      );
      
      // Labels only at start, middle, and end (less clutter)
      if (i === 0 || i === numMajorTicks / 2 || i === numMajorTicks) {
        const labelR = outerR - 8;
        const labelX = center + labelR * Math.cos(rad);
        const labelY = center + labelR * Math.sin(rad);
        const tickValue = min + (i / numMajorTicks) * (max - min);
        
        ticks.push(
          <SvgText
            key={`label-${i}`}
            x={labelX}
            y={labelY + 3}
            fill={colors.textDim}
            fontSize={9}
            fontFamily="monospace"
            textAnchor="middle"
          >
            {Math.round(tickValue)}
          </SvgText>
        );
      }
    }
    
    return ticks;
  };

  // Needle endpoint
  const needleAngle = toRadians(currentAngle);
  const needleLength = radius - strokeWidth / 2 - 15;
  const needleX = center + needleLength * Math.cos(needleAngle);
  const needleY = center + needleLength * Math.sin(needleAngle);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Background arc */}
        <Path
          d={createArcPath(startAngle, endAngle, radius)}
          stroke={colors.gaugeBorder}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        
        {/* Active arc */}
        {valuePercent > 0 && (
          <Path
            d={createArcPath(startAngle, currentAngle, radius)}
            stroke={activeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        )}
        
        {/* Tick marks */}
        <G>{renderTicks()}</G>
        
        {/* Needle */}
        <Line
          x1={center}
          y1={center}
          x2={needleX}
          y2={needleY}
          stroke={activeColor}
          strokeWidth={2}
        />
        
        {/* Center dot */}
        <Circle cx={center} cy={center} r={4} fill={activeColor} />
      </Svg>
      
      {/* Value display */}
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: activeColor }]}>
          {typeof value === 'number' ? Math.round(value) : value}
        </Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      
      {/* Label */}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContainer: {
    position: 'absolute',
    bottom: '25%',
    alignItems: 'center',
  },
  value: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  unit: {
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textDim,
    marginTop: 1,
  },
  label: {
    position: 'absolute',
    bottom: 4,
    fontSize: 9,
    fontFamily: 'monospace',
    color: colors.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});

export default GaugeArc;

