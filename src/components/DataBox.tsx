import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/colors';

interface DataBoxProps {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const DataBox: React.FC<DataBoxProps> = ({
  label,
  value,
  unit,
  color = colors.primary,
  size = 'medium',
  style,
}) => {
  const getFontSize = () => {
    switch (size) {
      case 'small': return 16;
      case 'large': return 36;
      default: return 24;
    }
  };

  return (
    <View style={[styles.container, { borderColor: color }, style]}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueRow}>
        <Text style={[styles.value, { color, fontSize: getFontSize() }]}>
          {value}
        </Text>
        {unit && (
          <Text style={[styles.unit, { color: `${color}88` }]}>{unit}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 255, 136, 0.05)',
    borderWidth: 1,
    padding: 8,
    minWidth: 80,
  },
  label: {
    color: colors.textDim,
    fontSize: 9,
    fontFamily: 'monospace',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  unit: {
    fontSize: 10,
    fontFamily: 'monospace',
    marginLeft: 4,
  },
});

export default DataBox;


