import { useTheme } from '@/hooks/useTheme';
import { LinearGradient } from 'expo-linear-gradient';
import type { VideoPlayer, VideoPlayerStatus } from 'expo-video';
import { VideoView } from 'expo-video';
import { useEffect } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BackgroundLayoutProps {
  children: React.ReactNode;
  backgroundPlayer?:VideoPlayer | null;
  /** Fired once the background video is ready (or a fallback timeout elapses). */
  onReady?: () => void;
}

export default function BackgroundLayout({ children, backgroundPlayer = null, onReady }: BackgroundLayoutProps) {
  const theme = useTheme();
  const isDark = theme.blurTint === 'dark';

  const bgColors = backgroundPlayer
    ? (['#04060f', '#0b1226', '#04060f'] as const)
    : isDark
    ? (['#0f172a', '#172554', '#0f172a'] as const)
    : (['#FFFBF0', '#FEF3C7', '#FFFBF0'] as const);

  useEffect(() => {
    if (!backgroundPlayer) return;

    let notified = false;
    // Let the screen know the video is up so the intro typewriter can begin.
    const notifyReady = () => {
      if (notified) return;
      notified = true;
      onReady?.();
    };

    const tryPlay = () => {
      if (AppState.currentState !== 'active') return;

      try {
        if (!backgroundPlayer.playing) {
          backgroundPlayer.play();
        }
      } catch {
        // ignore - player may not be ready yet, listeners + timers will retry
      }
    };

    // Source may already be ready by the time this effect runs — fire once synchronously.
    if (backgroundPlayer.status === 'readyToPlay') {
      tryPlay();
      notifyReady();
    }

    // Catch the transition to ready.
    const statusSub = backgroundPlayer.addListener(
      'statusChange',
      ({ status }: { status: VideoPlayerStatus }) => {
        if (status === 'readyToPlay') {
          tryPlay();
          notifyReady();
        }
      },
    );

    // Foreground/background.
    const appStateSub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        tryPlay();
      } else {
        backgroundPlayer.pause();
      }
    });

    // Fallback retries in case the status event was missed or play() was a no-op
    // because the source wasn't yet attached.
    const t1 = setTimeout(tryPlay, 250);
    const t2 = setTimeout(tryPlay, 1500);
    const retryInterval = setInterval(tryPlay, 500);
    // Safety net: start the typewriter even if the ready status event is missed.
    const readyFallback = setTimeout(notifyReady, 2200);
    tryPlay();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(readyFallback);
      clearInterval(retryInterval);
      statusSub.remove();
      appStateSub.remove();
    };
  }, [backgroundPlayer, onReady]);

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
