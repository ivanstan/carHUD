import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line, G } from 'react-native-svg';

import { HUDScreen, OBDScreen, ConnectionScreen, PerformanceScreen, OffroadScreen, SettingsScreen } from './src/screens';
import { colors } from './src/theme/colors';

const Tab = createBottomTabNavigator();

// Custom dark theme for navigation
const DarkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.backgroundSecondary,
    text: colors.textPrimary,
    border: colors.gaugeBorder,
    primary: colors.primary,
  },
};

// Simple icon components
const HUDIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="8" stroke={color} strokeWidth="1.5" fill="none" />
    <Line x1="12" y1="4" x2="12" y2="8" stroke={color} strokeWidth="1.5" />
    <Line x1="4" y1="12" x2="8" y2="12" stroke={color} strokeWidth="1.5" />
    <Line x1="16" y1="12" x2="20" y2="12" stroke={color} strokeWidth="1.5" />
    <Circle cx="12" cy="12" r="2" fill={color} />
  </Svg>
);

const GaugeIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8z"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
    <Line x1="12" y1="12" x2="16" y2="8" stroke={color} strokeWidth="2" />
    <Circle cx="12" cy="12" r="2" fill={color} />
  </Svg>
);

const BluetoothIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M12 2L17 7L12 12L17 17L12 22V12L7 17M12 12L7 7"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const GForceIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" fill="none" />
    <Line x1="12" y1="3" x2="12" y2="21" stroke={color} strokeWidth="1" opacity={0.5} />
    <Line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1" opacity={0.5} />
    <Circle cx="15" cy="9" r="3" fill={color} />
  </Svg>
);

const OffroadIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    {/* Mountain shape */}
    <Path
      d="M4 18L8 10L12 14L16 8L20 18"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
      strokeLinejoin="round"
    />
    {/* Ground line */}
    <Line x1="2" y1="18" x2="22" y2="18" stroke={color} strokeWidth="1.5" />
    {/* Level indicator */}
    <Circle cx="12" cy="18" r="3" stroke={color} strokeWidth="1.5" fill="none" />
    <Circle cx="12" cy="17" r="1" fill={color} />
  </Svg>
);

const SettingsIcon = ({ color, size }: { color: string; size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" fill="none" />
    <Path
      d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer theme={DarkTheme}>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textDim,
            tabBarLabelStyle: styles.tabBarLabel,
          }}
        >
          <Tab.Screen
            name="HUD"
            component={HUDScreen}
            options={{
              tabBarIcon: ({ color }) => <HUDIcon color={color} size={22} />,
              tabBarLabel: 'HUD',
            }}
          />
          <Tab.Screen
            name="Performance"
            component={PerformanceScreen}
            options={{
              tabBarIcon: ({ color }) => <GForceIcon color={color} size={22} />,
              tabBarLabel: 'G-FORCE',
            }}
          />
          <Tab.Screen
            name="Offroad"
            component={OffroadScreen}
            options={{
              tabBarIcon: ({ color }) => <OffroadIcon color={color} size={22} />,
              tabBarLabel: 'OFFROAD',
            }}
          />
          <Tab.Screen
            name="Gauges"
            component={OBDScreen}
            options={{
              tabBarIcon: ({ color }) => <GaugeIcon color={color} size={22} />,
              tabBarLabel: 'GAUGES',
            }}
          />
          <Tab.Screen
            name="Connect"
            component={ConnectionScreen}
            options={{
              tabBarIcon: ({ color }) => <BluetoothIcon color={color} size={22} />,
              tabBarLabel: 'OBD',
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarIcon: ({ color }) => <SettingsIcon color={color} size={22} />,
              tabBarLabel: 'SETUP',
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.backgroundSecondary,
    borderTopWidth: 1,
    borderTopColor: colors.gaugeBorder,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontFamily: 'monospace',
    fontSize: 9,
    letterSpacing: 1,
    fontWeight: '600',
  },
});

