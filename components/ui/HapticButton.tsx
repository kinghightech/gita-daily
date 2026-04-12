import * as Haptics from 'expo-haptics';
import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface HapticButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * A premium button component providing reactive scaling, dimming, and haptic feedback.
 */
export const HapticButton = ({
  children,
  onPress,
  style,
  disabled,
}: HapticButtonProps) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (disabled) return;
    
    // Scale down subtly
    scale.value = withSpring(0.97, { 
      damping: 15, 
      stiffness: 300,
      mass: 0.5
    });
    
    // Dim the button ("gray out" effect)
    opacity.value = withTiming(0.85, { duration: 100 });
    
    // Trigger subtle haptic feedback
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    if (disabled) return;
    
    // Scale back to normal
    scale.value = withSpring(1, { 
      damping: 15, 
      stiffness: 300,
      mass: 0.5
    });
    
    // Reset opacity
    opacity.value = withTiming(1, { duration: 100 });
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
};
