import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import type { VideoPlayer } from 'expo-video';
import { VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BackgroundLayoutProps {
  children: React.ReactNode;
  backgroundPlayer?: VideoPlayer | null;
}

export default function BackgroundLayout({ children, backgroundPlayer = null }: BackgroundLayoutProps) {
  const theme = useTheme();
  const isDark = theme.blurTint === 'dark';
  const [videoViewKey, setVideoViewKey] = useState(0);

  const bgColors = isDark
    ? (['#0f172a', '#172554', '#0f172a'] as const)
    : (['#FFFBF0', '#FEF3C7', '#FFFBF0'] as const);

  useEffect(() => {
    if (!backgroundPlayer) return;

    const syncPlayerWithAppState = (nextState: string) => {
      if (nextState === 'active') {
        setVideoViewKey((current) => current + 1);
        backgroundPlayer.play();
        return;
      }

      backgroundPlayer.pause();
    };

    const subscription = AppState.addEventListener('change', syncPlayerWithAppState);

    if (AppState.currentState === 'active') {
      setVideoViewKey((current) => current + 1);
      backgroundPlayer.play();
    }

    return () => {
      subscription.remove();
    };
  }, [backgroundPlayer]);

  return (
    <LinearGradient
      colors={bgColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      {backgroundPlayer ? (
        <View style={styles.videoLayer} pointerEvents="none">
          <VideoView
            key={videoViewKey}
            player={backgroundPlayer}
            style={styles.video}
            contentFit="cover"
            nativeControls={false}
            fullscreenOptions={{ enable: false }}
            surfaceType="textureView"
            useExoShutter={false}
          />
          <LinearGradient
            colors={['rgba(2, 6, 23, 0.3)', 'rgba(2, 6, 23, 0.72)', 'rgba(2, 6, 23, 0.84)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.videoOverlay}
          />
        </View>
      ) : null}

      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Decorative Ambient Glows */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <LinearGradient
            colors={['rgba(245, 158, 11, 0.08)', 'rgba(245, 158, 11, 0.03)', 'transparent']}
            start={{ x: 1, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.glowTopRight}
          />
          <LinearGradient
            colors={['rgba(147, 197, 253, 0.05)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.glowTopLeft}
          />
        </View>

        {children}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safeArea: { flex: 1 },
  videoLayer: { ...StyleSheet.absoluteFillObject },
  video: { flex: 1 },
  videoOverlay: { ...StyleSheet.absoluteFillObject },
  glowTopRight: { position: 'absolute', top: -200, right: -200, width: 600, height: 600, borderRadius: 300 },
  glowTopLeft: { position: 'absolute', top: -150, left: -150, width: 500, height: 500, borderRadius: 250 },
});
