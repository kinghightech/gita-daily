import DailyQuoteSettings from '@/components/gita/DailyQuoteSettings';
import QuoteCard from '@/components/gita/QuoteCard';
import { MOCK_VERSES } from '@/Data/mockverses';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Home() {
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const startOfYear = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
    setCurrentVerseIndex(dayOfYear % MOCK_VERSES.length);
    
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  const currentVerse = MOCK_VERSES[currentVerseIndex];

  return (
    <LinearGradient
      colors={['#0f172a', '#172554', '#0f172a']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
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

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            {isLoading ? (
              <Animated.View entering={FadeIn} style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading divine wisdom...</Text>
              </Animated.View>
            ) : MOCK_VERSES.length === 0 ? (
              <Animated.View entering={FadeIn} style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No Verses Available</Text>
                <Text style={styles.emptySubtitle}>
                  Verses from the Bhagavad Gita will appear here soon.
                </Text>
              </Animated.View>
            ) : (
              <Animated.View entering={SlideInDown.delay(100)}>
                <QuoteCard
                  verse={currentVerse}
                  user={null}
                  preferences={null}
                  onFavoriteToggle={() => {}}
                  isToday={true}
                />
              </Animated.View>
            )}

            <Animated.View entering={FadeIn.delay(400)} style={styles.settingsContainer}>
              <DailyQuoteSettings user={null} />
            </Animated.View>

            <Animated.View entering={FadeIn.delay(600)} style={styles.footerContainer}>
              <Text style={styles.hindiQuote}>
                &quot;कर्मण्येवाधिकारस्ते मा फलेषु कदाचन&quot;
              </Text>
              <Text style={styles.englishQuote}>
                You have the right to work, but never to the fruit of work
              </Text>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  glowTopRight: {
    position: 'absolute',
    top: -200,
    right: -200,
    width: 600,
    height: 600,
    borderRadius: 300,
  },
  glowTopLeft: {
    position: 'absolute',
    top: -150,
    left: -150,
    width: 500,
    height: 500,
    borderRadius: 250,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 720,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    color: 'rgba(253,224,112,0.7)',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(254,243,199,1)',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: 'rgba(251,191,36,0.7)',
  },
  settingsContainer: {
    marginTop: 40,
  },
  footerContainer: {
    marginTop: 48,
    alignItems: 'center',
  },
  hindiQuote: {
    fontSize: 14,
    color: 'rgba(251,191,36,0.4)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  englishQuote: {
    marginTop: 4,
    fontSize: 14,
    color: 'rgba(251,191,36,0.4)',
    textAlign: 'center',
    fontWeight: '300',
  },
});
