import LotusLoader from '@/components/ui/LotusLoader';
import { Fonts, GitaColors } from '@/constants/theme';
import { PRAYERS } from '@/Data/prayers';
import { awardDharmaCoins } from '@/lib/dharmaCoins';
import {
    loadPreferredLanguageForCurrentUser,
    PREFERRED_LANGUAGE_CHANGED_EVENT,
    type PreferredLanguage,
} from '@/lib/preferredLanguage';
import { useFocusEffect } from '@react-navigation/native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { Menu, Pause, Play, RotateCcw } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    DeviceEventEmitter,
    ImageBackground,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

// Set before any player is created so audio plays through the ringer/silent switch
void setAudioModeAsync({ playsInSilentMode: true });

const formatTime = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const getActiveIndex = (lyrics: { timeMs: number; text: string }[], posMs: number): number => {
  let idx = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].timeMs <= posMs) idx = i;
    else break;
  }
  return idx;
};

export default function PrayerScreen() {
  const { id: prayerId = 'hanuman-chalisa' } = useLocalSearchParams<{ id: string }>();
  const prayer = PRAYERS.find((p) => p.id === prayerId) ?? PRAYERS[0];

  const [language, setLanguage] = useState<PreferredLanguage>('english');
  const [trackWidth, setTrackWidth] = useState(1);

  const scrollRef = useRef<ScrollView>(null);
  const itemYs = useRef<number[]>([]);
  const loadedPrayerIdRef = useRef<string>(prayer.id);
  const awardedThisSessionRef = useRef<string | null>(null);

  // expo-audio hooks — lifecycle managed automatically
  const player = useAudioPlayer(prayer.audioFile);
  const status = useAudioPlayerStatus(player);

  const positionMs = (status.currentTime ?? 0) * 1000;
  const durationMs = (status.duration ?? 0) * 1000;
  const isPlaying = status.playing;
  const isLoaded = status.isLoaded;

  const lyrics = language === 'hindi' ? prayer.hindiLyrics : prayer.englishLyrics;
  const activeIndex = useMemo(() => getActiveIndex(lyrics, positionMs), [lyrics, positionMs]);
  const progress = durationMs > 0 ? positionMs / durationMs : 0;

  // Replace audio when prayer changes (tab persists across navigations)
  useEffect(() => {
    if (loadedPrayerIdRef.current !== prayer.id) {
      loadedPrayerIdRef.current = prayer.id;
      itemYs.current = [];
      awardedThisSessionRef.current = null;
      try { player.replace(prayer.audioFile); } catch {}
    }
  }, [prayer.id, prayer.audioFile, player]);

  // Award Dharma Coins when the prayer audio reaches the end.
  // The RPC enforces once-per-day; awardedThisSessionRef just avoids a redundant
  // network call per play within the same prayer session.
  useEffect(() => {
    if (!isLoaded || durationMs <= 0) return;
    const finished =
      (status as { didJustFinish?: boolean }).didJustFinish === true ||
      (positionMs > 0 && positionMs >= durationMs - 250 && !isPlaying);
    if (!finished) return;
    if (awardedThisSessionRef.current === prayer.id) return;
    awardedThisSessionRef.current = prayer.id;
    void awardDharmaCoins('prayer', prayer.id).catch((error) => {
      console.warn('Prayer coin award failed', error);
    });
  }, [isLoaded, durationMs, positionMs, isPlaying, status, prayer.id]);

  // Language preference
  useEffect(() => {
    loadPreferredLanguageForCurrentUser().then(setLanguage);
    const sub = DeviceEventEmitter.addListener(
      PREFERRED_LANGUAGE_CHANGED_EVENT,
      (lang: PreferredLanguage) => setLanguage(lang),
    );
    return () => sub.remove();
  }, []);

  // Re-assert silent mode override on every focus — iOS can reset the audio
  // session when navigating away, so we set it again when the screen returns
  useFocusEffect(
    useCallback(() => {
      void setAudioModeAsync({ playsInSilentMode: true });
      return () => { try { player.pause(); } catch {} };
    }, [player]),
  );

  // Auto-scroll lyrics to active block
  useEffect(() => {
    const y = itemYs.current[activeIndex];
    if (y !== undefined && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, y - 120), animated: true });
    }
  }, [activeIndex]);

  const togglePlay = useCallback(() => {
    if (isPlaying) player.pause();
    else player.play();
  }, [isPlaying, player]);

  const restart = useCallback(() => {
    player.seekTo(0);
    player.play();
  }, [player]);

  const onProgressPress = useCallback(
    (locationX: number) => {
      const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
      player.seekTo(ratio * (durationMs / 1000));
    },
    [trackWidth, durationMs, player],
  );

  return (
    <ImageBackground source={prayer.thumbnail} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />

      <View style={styles.container}>
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.titleHindi}>{prayer.nameHindi}</Text>
          <Text style={styles.titleEn}>{prayer.name.toUpperCase()}</Text>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => router.push('/prayer-list')}
            activeOpacity={0.7}
          >
            <Menu size={22} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Lyrics */}
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {lyrics.map((block, index) => {
            const isActive = index === activeIndex;
            const isPast = index < activeIndex;
            return (
              <Pressable
                key={index}
                onLayout={(e) => {
                  itemYs.current[index] = e.nativeEvent.layout.y;
                }}
                onPress={() => { try { player.seekTo(block.timeMs / 1000); } catch {} }}
                style={styles.lyricBlock}
              >
                <Text
                  style={[
                    styles.lyricText,
                    isPast && styles.lyricPast,
                    isActive && styles.lyricActive,
                  ]}
                >
                  {block.text}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Player controls */}
        <View style={styles.player}>
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{isLoaded ? formatTime(positionMs) : '–:––'}</Text>
            <Text style={styles.timeText}>{isLoaded ? formatTime(durationMs) : 'Loading…'}</Text>
          </View>

          {/* Progress bar — tap to seek */}
          <View
            style={styles.progressTrack}
            onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
            onStartShouldSetResponder={() => isLoaded}
            onResponderGrant={(e) => onProgressPress(e.nativeEvent.locationX)}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${(progress * 100).toFixed(1)}%` as `${number}%` },
              ]}
            />
          </View>

          <View style={styles.controls}>
            <TouchableOpacity
              onPress={restart}
              activeOpacity={0.7}
              style={[styles.sideBtn, !isLoaded && { opacity: 0.3 }]}
              disabled={!isLoaded}
            >
              <RotateCcw size={22} color="rgba(255,255,255,0.6)" />
            </TouchableOpacity>

            {isLoaded ? (
              <TouchableOpacity
                onPress={togglePlay}
                activeOpacity={0.85}
                style={styles.playBtn}
              >
                {isPlaying ? (
                  <Pause size={28} color="#0F172A" fill="#0F172A" />
                ) : (
                  <Play size={28} color="#0F172A" fill="#0F172A" />
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.loaderBtn}>
                <LotusLoader size={48} color={GitaColors.gold} strokeWidth={2.5} duration={1400} />
              </View>
            )}

            {/* Spacer mirrors restart btn for centering */}
            <View style={styles.sideBtn} />
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,14,33,0.72)',
  },
  container: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  menuBtn: {
    position: 'absolute',
    top: 0,
    right: 24,
    padding: 8,
  },
  titleHindi: {
    fontSize: 28,
    color: GitaColors.gold,
    fontFamily: Fonts.serif,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  titleEn: {
    fontSize: 11,
    color: 'rgba(251,191,36,0.5)',
    marginTop: 5,
    letterSpacing: 4,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  lyricBlock: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  lyricText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: Fonts.serif,
  },
  lyricActive: {
    fontSize: 18,
    color: GitaColors.gold,
    fontWeight: '700',
    lineHeight: 30,
    textShadowColor: 'rgba(251,191,36,0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  lyricPast: {
    color: 'rgba(255,255,255,0.2)',
  },
  player: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: 'rgba(15,23,42,0.88)',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.18)',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    fontWeight: '600',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: GitaColors.gold,
    borderRadius: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  sideBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: GitaColors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: GitaColors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  loaderBtn: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
