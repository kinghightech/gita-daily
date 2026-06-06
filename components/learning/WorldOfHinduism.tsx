import HinduismPlanet from '@/components/HinduismPlanet';
import { showAppToast } from '@/lib/appToast';
import { isPlayablePath } from '@/lib/pathProgress';
import { WORLD_PATHS, type WorldPath } from '@/lib/worldPaths';
import { Orbitron_900Black, useFonts } from '@expo-google-fonts/orbitron';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SPACE_BACKGROUND = '#050816';

const STARS = [
  { top: '5%', left: '9%', size: 1.2, opacity: 0.58, color: '#ffffff' },
  { top: '7%', left: '28%', size: 2.2, opacity: 0.78, color: '#FEF3C7' },
  { top: '9%', left: '78%', size: 1.8, opacity: 0.7, color: '#ffffff' },
  { top: '13%', left: '46%', size: 1.0, opacity: 0.46, color: '#BFDBFE' },
  { top: '15%', left: '33%', size: 1.1, opacity: 0.48, color: '#ffffff' },
  { top: '18%', left: '91%', size: 1.3, opacity: 0.54, color: '#FEF3C7' },
  { top: '22%', left: '62%', size: 2.8, opacity: 0.72, color: '#BFDBFE' },
  { top: '25%', left: '8%', size: 1.7, opacity: 0.64, color: '#ffffff' },
  { top: '29%', left: '39%', size: 1.5, opacity: 0.5, color: '#FDE68A' },
  { top: '31%', left: '68%', size: 1.2, opacity: 0.5, color: '#ffffff' },
  { top: '36%', left: '5%', size: 2.6, opacity: 0.66, color: '#BFDBFE' },
  { top: '38%', left: '22%', size: 1.0, opacity: 0.46, color: '#ffffff' },
  { top: '43%', left: '86%', size: 1.6, opacity: 0.58, color: '#ffffff' },
  { top: '48%', left: '57%', size: 1.1, opacity: 0.44, color: '#FEF3C7' },
  { top: '52%', left: '14%', size: 1.2, opacity: 0.52, color: '#ffffff' },
  { top: '58%', left: '74%', size: 1.0, opacity: 0.42, color: '#BFDBFE' },
  { top: '63%', left: '44%', size: 2.0, opacity: 0.62, color: '#ffffff' },
  { top: '66%', left: '31%', size: 1.5, opacity: 0.6, color: '#ffffff' },
  { top: '72%', left: '94%', size: 1.1, opacity: 0.48, color: '#FDE68A' },
  { top: '77%', left: '69%', size: 2.4, opacity: 0.52, color: '#BFDBFE' },
  { top: '80%', left: '18%', size: 1.0, opacity: 0.42, color: '#ffffff' },
  { top: '86%', left: '61%', size: 1.7, opacity: 0.66, color: '#FEF3C7' },
  { top: '91%', left: '39%', size: 1.2, opacity: 0.5, color: '#ffffff' },
  { top: '94%', left: '83%', size: 1.4, opacity: 0.44, color: '#ffffff' },
  { top: '12%', left: '17%', size: 2.4, opacity: 0.82, color: '#ffffff' },
  { top: '34%', left: '79%', size: 2.7, opacity: 0.76, color: '#E0F2FE' },
] as const;

const METEORS = [
  { top: '14%', left: '70%', length: 58, opacity: 0.34, angle: '-24deg' },
  { top: '76%', left: '78%', length: 52, opacity: 0.28, angle: '-22deg' },
] as const;

const DISTANT_PLANETS = [
  {
    top: '69%',
    left: '83%',
    size: 72,
    color: 'rgba(251,191,36,0.13)',
    border: 'rgba(253,230,138,0.18)',
    ring: 'rgba(147,197,253,0.15)',
  },
] as const;

/**
 * The "World of Hinduism" experience — the interactive earth/planet with all the
 * learning paths (Lotus, Mountain, Garden, Forest, …). Extracted from the former
 * World tab so it can be hosted inside the Learn screen. UI/logic unchanged.
 */
export default function WorldOfHinduism() {
  const [orbitronLoaded] = useFonts({ Orbitron_900Black });

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
      <LinearGradient colors={['#050816', '#071426', '#121212']} style={styles.background}>
        <View pointerEvents="none" style={styles.spaceField}>
          {DISTANT_PLANETS.map((planet, index) => (
            <View
              key={`world-planet-${index}`}
              style={[
                styles.distantPlanetWrap,
                {
                  top: planet.top,
                  left: planet.left,
                  width: planet.size,
                  height: planet.size,
                },
              ]}
            >
              <View
                style={[
                  styles.planetRing,
                  {
                    width: planet.size * 1.55,
                    height: planet.size * 0.44,
                    borderRadius: planet.size,
                    borderColor: planet.ring,
                    top: planet.size * 0.28,
                    left: -planet.size * 0.27,
                  },
                ]}
              />
              <View
                style={[
                  styles.distantPlanet,
                  {
                    width: planet.size,
                    height: planet.size,
                    borderRadius: planet.size / 2,
                    backgroundColor: planet.color,
                    borderColor: planet.border,
                  },
                ]}
              >
                <View style={styles.planetGlow} />
              </View>
            </View>
          ))}

          {METEORS.map((meteor, index) => (
            <View
              key={`world-meteor-${index}`}
              style={[
                styles.meteor,
                {
                  top: meteor.top,
                  left: meteor.left,
                  width: meteor.length,
                  opacity: meteor.opacity,
                  transform: [{ rotate: meteor.angle }],
                },
              ]}
            >
              <View style={styles.meteorHead} />
            </View>
          ))}

          {STARS.map((star, index) => (
            <View
              key={`world-star-${index}`}
              style={[
                styles.star,
                {
                  top: star.top,
                  left: star.left,
                  width: star.size,
                  height: star.size,
                  borderRadius: star.size / 2,
                  opacity: star.opacity,
                  backgroundColor: star.color,
                },
              ]}
            />
          ))}
        </View>
      </LinearGradient>

      <SafeAreaView style={styles.content} edges={['top']}>
        <View pointerEvents="none" style={styles.titleBlock}>
          <Text style={[styles.title, orbitronLoaded && styles.titleOrbitron]}>
            The World of Hinduism
          </Text>
        </View>

        <View style={styles.planetShell}>
          <HinduismPlanet markers={WORLD_PATHS} onMarkerPress={openPath} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SPACE_BACKGROUND,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
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
  distantPlanetWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  distantPlanet: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  planetGlow: {
    position: 'absolute',
    top: 14,
    left: 16,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  planetRing: {
    position: 'absolute',
    borderWidth: 1,
    transform: [{ rotate: '-18deg' }],
  },
  meteor: {
    position: 'absolute',
    height: 1.5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.74)',
  },
  meteorHead: {
    position: 'absolute',
    right: -2,
    top: -1.7,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FEF3C7',
  },
  titleBlock: {
    position: 'absolute',
    top: 142,
    left: 18,
    right: 18,
    zIndex: 2,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0,
    lineHeight: 56,
    textShadowColor: 'rgba(125,211,252,0.52)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  titleOrbitron: {
    fontFamily: 'Orbitron_900Black',
  },
  planetShell: {
    flex: 1,
    zIndex: 1,
    overflow: 'hidden',
  },
});
