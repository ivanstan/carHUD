import { StyleSheet } from 'react-native';

// Typography for HUD display - monospace for that authentic avionics feel
export const typography = StyleSheet.create({
  // Large readouts (speed, RPM)
  readoutLarge: {
    fontFamily: 'monospace',
    fontSize: 72,
    fontWeight: '300',
    letterSpacing: 4,
  },
  
  // Medium readouts (heading, fuel)
  readoutMedium: {
    fontFamily: 'monospace',
    fontSize: 48,
    fontWeight: '400',
    letterSpacing: 2,
  },
  
  // Small readouts (temp, voltage)
  readoutSmall: {
    fontFamily: 'monospace',
    fontSize: 28,
    fontWeight: '400',
    letterSpacing: 1,
  },
  
  // Labels
  label: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  
  // Unit indicators
  unit: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: '400',
    letterSpacing: 1,
  },
  
  // Navigation/tab text
  nav: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});


