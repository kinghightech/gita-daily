import HinduismPlanet from '@/components/HinduismPlanet';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HOME_DARK_BACKGROUND = '#121212';

const STARS = [
  { top: '6%', left: '12%', size: 1.4, opacity: 0.62 },
  { top: '9%', left: '78%', size: 1.8, opacity: 0.7 },
  { top: '15%', left: '33%', size: 1.1, opacity: 0.48 },
  { top: '18%', left: '91%', size: 1.3, opacity: 0.54 },
  { top: '25%', left: '8%', size: 1.7, opacity: 0.64 },
  { top: '31%', left: '68%', size: 1.2, opacity: 0.5 },
  { top: '38%', left: '22%', size: 1.0, opacity: 0.46 },
  { top: '43%', left: '86%', size: 1.6, opacity: 0.58 },
  { top: '52%', left: '14%', size: 1.2, opacity: 0.52 },
  { top: '58%', left: '74%', size: 1.0, opacity: 0.42 },
  { top: '66%', left: '31%', size: 1.5, opacity: 0.6 },
  { top: '72%', left: '94%', size: 1.1, opacity: 0.48 },
  { top: '80%', left: '18%', size: 1.0, opacity: 0.42 },
  { top: '86%', left: '61%', size: 1.7, opacity: 0.66 },
  { top: '91%', left: '39%', size: 1.2, opacity: 0.5 },
] as const;

export default function WorldScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.background}>
        <View pointerEvents="none" style={styles.starField}>
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
                },
              ]}
            />
          ))}
        </View>

        <View pointerEvents="none" style={styles.titleBlock}>
          <Text style={styles.title}>The World of Hinduism</Text>
        </View>

        <View style={styles.planetShell}>
          <HinduismPlanet />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: HOME_DARK_BACKGROUND,
  },
  background: {
    flex: 1,
    backgroundColor: HOME_DARK_BACKGROUND,
  },
  starField: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
  },
  titleBlock: {
    position: 'absolute',
    top: 28,
    left: 18,
    right: 18,
    zIndex: 2,
    alignItems: 'center',
  },
  title: {
    color: 'rgba(248,231,176,0.96)',
    fontSize: 54,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -1.5,
    lineHeight: 58,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
  },
  planetShell: {
    flex: 1,
    zIndex: 1,
    overflow: 'hidden',
  },
});
