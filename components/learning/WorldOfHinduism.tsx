import HinduismPlanet from '@/components/HinduismPlanet';
import { showAppToast } from '@/lib/appToast';
import { isPlayablePath } from '@/lib/pathProgress';
import { WORLD_PATHS, type WorldPath } from '@/lib/worldPaths';
import {
  PlayfairDisplay_500Medium,
  PlayfairDisplay_700Bold,
  useFonts,
} from '@expo-google-fonts/playfair-display';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Dimensions, type DimensionValue, StyleSheet, Text, View } from 'react-native';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, G, Path } from 'react-native-svg';

const SPACE_BACKGROUND = '#000000';
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Small deterministic PRNG so the star field is dense but stable across renders.
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const STAR_RAND = mulberry32(20260607);
const STARS = Array.from({ length: 60 }, () => {
  const tone = STAR_RAND();
  // A premium night sky: mostly white, a sprinkle of gold and warm cream.
  const color = tone < 0.24 ? '#FCD34D' : tone < 0.34 ? '#FEF3C7' : '#FFFFFF';
  return {
    top: `${(STAR_RAND() * 100).toFixed(2)}%` as DimensionValue,
    left: `${(STAR_RAND() * 100).toFixed(2)}%` as DimensionValue,
    size: 0.8 + STAR_RAND() * 2.6,
    opacity: 0.4 + STAR_RAND() * 0.5,
    color,
  };
});

type Star = (typeof STARS)[number];

// Three faint lotus mandalas drift behind the planet as ambient sacred geometry.
const MANDALAS = [
  { size: SCREEN_W * 1.2, top: -SCREEN_W * 0.52, left: SCREEN_W * 0.5 - SCREEN_W * 0.6, opacity: 0.07, color: '#FBBF24' },
  { size: SCREEN_W * 0.95, top: SCREEN_H * 0.64, left: -SCREEN_W * 0.42, opacity: 0.06, color: '#FBBF24' },
  { size: SCREEN_W * 0.72, top: SCREEN_H * 0.46, left: SCREEN_W * 0.58, opacity: 0.05, color: '#FDE68A' },
] as const;

const MANDALA_OUTER_PETALS = 16;
const MANDALA_INNER_PETALS = 12;

/**
 * A single lotus mandala rendered as thin gold line art — concentric rings of
 * petals around a small core. Kept very low-opacity so it reads as texture, not
 * decoration competing with the planet.
 */
function LotusMandala({
  size,
  color,
  opacity,
  style,
}: {
  size: number;
  color: string;
  opacity: number;
  style?: object;
}) {
  const c = size / 2;
  const petal = (len: number, width: number) =>
    `M ${c} ${c} C ${c - width} ${c - len * 0.45}, ${c - width} ${c - len * 0.82}, ${c} ${c - len} ` +
    `C ${c + width} ${c - len * 0.82}, ${c + width} ${c - len * 0.45}, ${c} ${c} Z`;

  const outer = petal(size * 0.46, size * 0.085);
  const inner = petal(size * 0.3, size * 0.06);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={style} pointerEvents="none">
      <G opacity={opacity} stroke={color} strokeWidth={Math.max(1, size * 0.0035)} fill="none">
        {Array.from({ length: MANDALA_OUTER_PETALS }).map((_, i) => (
          <Path key={`o${i}`} d={outer} transform={`rotate(${(360 / MANDALA_OUTER_PETALS) * i} ${c} ${c})`} />
        ))}
        {Array.from({ length: MANDALA_INNER_PETALS }).map((_, i) => (
          <Path
            key={`i${i}`}
            d={inner}
            transform={`rotate(${(360 / MANDALA_INNER_PETALS) * i + 180 / MANDALA_INNER_PETALS} ${c} ${c})`}
          />
        ))}
        <Circle cx={c} cy={c} r={size * 0.14} />
        <Circle cx={c} cy={c} r={size * 0.085} />
      </G>
    </Svg>
  );
}

/**
 * The "World of Hinduism" experience — the interactive earth/planet with all the
 * learning paths (Lotus, Mountain, Garden, Forest, …). Extracted from the former
 * World tab so it can be hosted inside the Learn screen. Planet logic unchanged.
 */
type WorldOfHinduismProps = {
  active?: boolean;
};

export default function WorldOfHinduism({ active = true }: WorldOfHinduismProps) {
  const [fontsLoaded] = useFonts({ PlayfairDisplay_500Medium, PlayfairDisplay_700Bold });

  const openPath = (path: Pick<WorldPath, 'slug' | 'title'>) => {
    // Only the fully-built paths open. The rest of the world is still being made.
    if (!isPlayablePath(path.slug)) {
      showAppToast({ title: `${path.title} — coming soon`, message: 'This path is still being built.' });
      return;
    }
    router.push({ pathname: '/world-path/[slug]', params: { slug: path.slug } });
  };

  return (
    <View style={styles.safe}>
      <View pointerEvents="none" style={styles.spaceField}>
        {MANDALAS.map((m, index) => (
          <LotusMandala
            key={`mandala-${index}`}
            size={m.size}
            color={m.color}
            opacity={m.opacity}
            style={{ position: 'absolute', top: m.top, left: m.left }}
          />
        ))}
        {STARS.map((star, index) => (
          <TwinkleStar key={`world-star-${index}`} star={star} index={index} />
        ))}
      </View>

      <SafeAreaView style={styles.content} edges={['top']}>
        <View pointerEvents="none" style={styles.titleBlock}>
          <Text style={[styles.titleKicker, fontsLoaded && styles.titleKickerFont]}>
            The World of
          </Text>
          <Text style={[styles.titleMain, fontsLoaded && styles.titleMainFont]}>Hinduism</Text>
        </View>

        <View style={styles.planetShell}>
          <HinduismPlanet active={active} markers={WORLD_PATHS} onMarkerPress={openPath} />
        </View>
      </SafeAreaView>
    </View>
  );
}

/**
 * A single star that gently breathes — scaling and fading in/out on a loop so the
 * black sky feels alive, echoing the slow motion of the planet. Each star is
 * staggered and varies its pace so they twinkle out of sync.
 */
function TwinkleStar({ star, index }: { star: Star; index: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const duration = 1500 + (index % 6) * 340;
    const delay = (index % 8) * 230;
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
  }, [index, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: star.opacity * (0.4 + progress.value * 0.6),
    transform: [{ scale: 0.7 + progress.value * 0.55 }],
  }));

  return (
    <Reanimated.View
      style={[
        styles.star,
        {
          top: star.top,
          left: star.left,
          width: star.size,
          height: star.size,
          borderRadius: star.size / 2,
          backgroundColor: star.color,
        },
        animatedStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SPACE_BACKGROUND,
  },
  content: {
    flex: 1,
  },
  spaceField: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  star: {
    position: 'absolute',
  },
  titleBlock: {
    position: 'absolute',
    top: 140,
    left: 18,
    right: 18,
    zIndex: 2,
    alignItems: 'center',
  },
  titleKicker: {
    color: 'rgba(251,191,36,0.82)',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 5,
    textAlign: 'center',
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  titleKickerFont: {
    fontFamily: 'PlayfairDisplay_500Medium',
    fontWeight: '400',
  },
  titleMain: {
    color: '#F4ECDA',
    fontSize: 56,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
    lineHeight: 64,
    textShadowColor: 'rgba(251,191,36,0.20)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  titleMainFont: {
    fontFamily: 'PlayfairDisplay_700Bold',
  },
  planetShell: {
    flex: 1,
    zIndex: 1,
    overflow: 'hidden',
  },
});
