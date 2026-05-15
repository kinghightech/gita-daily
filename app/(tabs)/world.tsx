import HinduismPlanet from '@/components/HinduismPlanet';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WorldScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient
        colors={['#020617', '#07162d', '#020617']}
        locations={[0, 0.48, 1]}
        style={styles.background}
      >
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Interactive Atlas</Text>
          <Text style={styles.title}>The World of Hinduism</Text>
          <Text style={styles.subtitle}>Drag the planet to explore its sections</Text>
        </View>

        <View style={styles.planetShell}>
          <HinduismPlanet />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#020617',
  },
  background: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 8,
    alignItems: 'center',
  },
  eyebrow: {
    color: 'rgba(251,191,36,0.68)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.2,
    marginBottom: 7,
    textTransform: 'uppercase',
  },
  title: {
    color: '#F8E7B0',
    fontSize: 27,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    color: 'rgba(191,219,254,0.68)',
    fontSize: 13,
    marginTop: 7,
    textAlign: 'center',
  },
  planetShell: {
    flex: 1,
    marginTop: 4,
    overflow: 'hidden',
  },
});
