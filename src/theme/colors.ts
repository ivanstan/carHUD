// Aviation HUD Color Theme - Inspired by fighter jet displays
export const colors = {
  // Primary background - deep space black
  background: '#0a0a0f',
  backgroundSecondary: '#12121a',
  backgroundTertiary: '#1a1a24',
  
  // Primary HUD color - phosphor green (classic avionics)
  primary: '#00ff88',
  primaryDim: '#00cc6a',
  primaryGlow: 'rgba(0, 255, 136, 0.3)',
  
  // Secondary - cyan for speed/velocity data
  secondary: '#00d4ff',
  secondaryDim: '#00a8cc',
  secondaryGlow: 'rgba(0, 212, 255, 0.3)',
  
  // Accent - amber for warnings
  warning: '#ffaa00',
  warningDim: '#cc8800',
  warningGlow: 'rgba(255, 170, 0, 0.3)',
  
  // Critical - red for alerts
  danger: '#ff3366',
  dangerDim: '#cc2952',
  dangerGlow: 'rgba(255, 51, 102, 0.3)',
  
  // Text colors
  textPrimary: '#e0ffe8',
  textSecondary: '#88aa99',
  textDim: '#445544',
  
  // Gauge colors
  gaugeBackground: 'rgba(0, 255, 136, 0.05)',
  gaugeBorder: 'rgba(0, 255, 136, 0.2)',
  gaugeActive: '#00ff88',
  
  // Grid lines
  gridLine: 'rgba(0, 255, 136, 0.1)',
  gridLineBright: 'rgba(0, 255, 136, 0.2)',
};

export const shadows = {
  glow: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  glowCyan: {
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
};


