import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const SPLASH_IMAGE = require('@/assets/images/splashscreen.png');

// Sampled from the artwork's edges — they are essentially pure black, so the
// overlay's backdrop blends seamlessly into the image (and the native splash).
const SPLASH_BACKGROUND = '#000000';

type AnimatedSplashProps = {
  /** While true the splash stays fully opaque; flipping to false fades it away. */
  active: boolean;
  /** Fired once the fade-out finishes so the parent can unmount the overlay. */
  onHidden: () => void;
};

/**
 * Full-bleed branded splash that bridges the gap between the native (OS) splash
 * and the first app frame. Shows the same artwork the native splash uses, then
 * fades + gently zooms out to reveal the app underneath — giving a consistent,
 * professional launch on iOS, Android (incl. Android 12+) and web.
 */
export default function AnimatedSplash({ active, onHidden }: AnimatedSplashProps) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  // Hand off from the native splash to ours as soon as our image is on screen.
  // Both backdrops are black, so even if the bitmap decodes a frame late there
  // is no visible flash in between.
  const handleLayout = useCallback(async () => {
    try {
      await SplashScreen.hideAsync();
    } catch {
      // Native splash was already hidden — safe to ignore.
    }
  }, []);

  useEffect(() => {
    if (active) return;

    // Subtle "step into the app" reveal: ease the artwork up a touch as it fades.
    scale.value = withTiming(1.08, { duration: 700, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(
      0,
      { duration: 600, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(onHidden)();
        }
      }
    );
  }, [active, onHidden, opacity, scale]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const imageStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      pointerEvents="none"
      onLayout={handleLayout}
      style={[StyleSheet.absoluteFill, styles.container, containerStyle]}
    >
      {/* Light icons stay legible over the dark artwork while the splash shows. */}
      <StatusBar style="light" />
      <Animated.View style={[StyleSheet.absoluteFill, imageStyle]}>
        <Image
          source={SPLASH_IMAGE}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="center"
          priority="high"
          cachePolicy="memory-disk"
          accessibilityLabel="Dharma Daily"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: SPLASH_BACKGROUND,
    zIndex: 999,
  },
});
