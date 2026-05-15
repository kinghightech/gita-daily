import HinduismPlanet from '@/components/HinduismPlanet';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WorldScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>The World of Hinduism</Text>
        <Text style={styles.subtitle}>Drag to explore</Text>
      </View>
      <HinduismPlanet />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: 'center',
  },
  title: {
    color: '#e2b94a',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: '#475569',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
