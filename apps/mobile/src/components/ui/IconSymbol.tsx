import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolScale } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, Platform, StyleProp, TextStyle } from 'react-native';

const MAPPING = {
  // Navigation
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  
  // Agriculture specific
  'map.fill': 'map',
  'plus.circle.fill': 'add-circle',
  'list.bullet': 'list',
  'person.crop.circle.fill': 'account-circle',
  'leaf.fill': 'eco',
  'drop.fill': 'water-drop',
  'sun.max.fill': 'wb-sunny',
  'thermometer': 'thermostat',
  'wind': 'air',
  'camera.fill': 'camera-alt',
  'location.fill': 'location-on',
  'calendar': 'calendar-today',
  'chart.bar.fill': 'bar-chart',
  'gear': 'settings',
  'arrow.up.right': 'trending-up',
  'arrow.down.right': 'trending-down',
  'checkmark.circle.fill': 'check-circle',
  'exclamationmark.triangle.fill': 'warning',
  'info.circle.fill': 'info',
  'xmark.circle.fill': 'cancel',
} as Partial<
  Record<
    import('expo-symbols').SymbolViewProps['name'],
    React.ComponentProps<typeof MaterialIcons>['name']
  >
>;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web. This ensures a consistent look across platforms, and optimal resource usage.
 *
 * Icon `name`s are based on SFSymbols naming conventions and require manual mapping to MaterialIcons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
  scale = 'default',
}: {
  name: IconSymbolName;
  size?: number;
  color?: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
  scale?: SymbolScale;
}) {
  if (Platform.OS === 'ios') {
    // For iOS, we might use SF Symbols in the future
    // For now, we'll use MaterialIcons on all platforms
  }

  const materialIconName = MAPPING[name];
  if (!materialIconName) {
    console.warn(`No MaterialIcons mapping found for symbol name: ${name}`);
    return null;
  }

  return (
    <MaterialIcons
      color={color}
      size={size}
      name={materialIconName}
      style={style}
    />
  );
}