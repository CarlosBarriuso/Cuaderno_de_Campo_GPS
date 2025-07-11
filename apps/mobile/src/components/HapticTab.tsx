import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { Pressable, PressableProps } from 'react-native';

export function HapticTab(props: PressableProps) {
  return (
    <Pressable
      {...props}
      onPressIn={(event) => {
        if (process.env.EXPO_OS === 'ios') {
          // Add a soft haptic feedback when pressing down on the tab bar
          impactAsync(ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(event);
      }}
    />
  );
}