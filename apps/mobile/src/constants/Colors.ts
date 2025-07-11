/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#22c55e';
const tintColorDark = '#4ade80';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Agriculture specific colors
    primary: '#22c55e',
    primaryDark: '#16a34a',
    secondary: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    // Activity colors
    siembra: '#22c55e',
    fertilizacion: '#3b82f6',
    tratamiento: '#f59e0b',
    cosecha: '#ef4444',
    riego: '#06b6d4',
    // UI colors
    card: '#ffffff',
    cardBorder: '#e2e8f0',
    muted: '#f1f5f9',
    mutedForeground: '#64748b',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Agriculture specific colors
    primary: '#4ade80',
    primaryDark: '#22c55e',
    secondary: '#fbbf24',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    // Activity colors
    siembra: '#4ade80',
    fertilizacion: '#60a5fa',
    tratamiento: '#fbbf24',
    cosecha: '#f87171',
    riego: '#22d3ee',
    // UI colors
    card: '#1e293b',
    cardBorder: '#334155',
    muted: '#0f172a',
    mutedForeground: '#94a3b8',
  },
};