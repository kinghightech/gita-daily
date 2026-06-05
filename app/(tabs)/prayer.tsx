import { showAppToast } from '@/lib/appToast';
import PrayerVerseSheet from '@/components/gita/PrayerVerseSheet';
import LotusLoader from '@/components/ui/LotusLoader';
import { Fonts, GitaColors } from '@/constants/theme';
import { PRAYERS } from '@/Data/prayers';
import { awardDharmaCoins } from '@/lib/dharmaCoins';
import {
    PRAYER_VERSES_UPDATED_EVENT,
    fetchUserPrayerVerses,
    togglePrayerVerseSaved,
} from '@/lib/prayerFavorites';
import { getPrayerVerseByIndex, type PrayerVerse } from '@/lib/prayerVerses';
import {
    loadPreferredLanguageForCurrentUser,
    PREFERRED_LANGUAGE_CHANGED_EVENT,
    type PreferredLanguage,
} from '@/lib/preferredLanguage';
import { getCurrentAuthUserWithRetry } from '@/lib/profile';
import { useFocusEffect } from '@react-navigation/native';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { BookmarkCheck, BookmarkPlus, Menu, Pause, Play, RotateCcw } from 'lucide-react-native';
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

const FORWARD_SEEK_TOLERANCE_MS = 1200;

export default function PrayerScreen() {
  const { id: prayerId = 'hanuman-chalisa', verse: verseParam } =
    useLocalSearchParams<{ id: string; verse?: string }>();
  const prayer = PRAYERS.find((p) => p.id === prayerId) ?? PRAYERS[0];

  const [language, setLanguage] = useState<PreferredLanguage>('english');
  const [trackWidth, setTrackWidth] = useState(1);

  // Saved prayer-verse state
  const [userId, setUserId] = useState<string | null>(null);
  const [savedVerseIds, setSavedVerseIds] = useState<Set<string>>(new Set());
  const [selectedVerse, setSelectedVerse] = useState<PrayerVerse | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [savingVerse, setSavingVerse] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);

  const scrollRef = useRef<ScrollView>(null);
  const itemYs = useRef<number[]>([]);
  const loadedPrayerIdRef = useRef<string>(prayer.id);
  const completionHandledThisSessionRef = useRef<string | null>(null);
  const skippedAheadThisSessionRef = useRef(false);
  const skipAlertShownThisSessionRef = useRef(false);

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
      completionHandledThisSessionRef.current = null;
      skippedAheadThisSessionRef.current = false;
      skipAlertShownThisSessionRef.current = false;
      try { player.replace(prayer.audioFile); } catch {}
    }
  }, [prayer.id, prayer.audioFile, player]);

  // Award Dharma Coins when the prayer audio reaches the end.
  // The RPC enforces once-per-day; local refs prevent redundant network calls and
  // block rewards if the user manually skips ahead during this run.
  useEffect(() => {
    if (!isLoaded || durationMs <= 0) return;
    const finished =
      (status as { didJustFinish?: boolean }).didJustFinish === true ||
      (positionMs > 0 && positionMs >= durationMs - 250 && !isPlaying);
    if (!finished) return;
    if (completionHandledThisSessionRef.current === prayer.id) return;
    completionHandledThisSessionRef.current = prayer.id;

    if (skippedAheadThisSessionRef.current) {
      return;
    }

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

  // Load which verses of THIS prayer the user has already saved
  const loadSavedVerses = useCallback(
    async (uid: string | null) => {
      if (!uid) {
        setSavedVerseIds(new Set());
        return;
      }
      try {
        const saved = await fetchUserPrayerVerses(uid);
        setSavedVerseIds(
          new Set(saved.filter((v) => v.prayerId === prayer.id).map((v) => v.verseId)),
        );
      } catch (error) {
        console.warn('Failed to load saved prayer verses', error);
      }
    },
    [prayer.id],
  );

  useEffect(() => {
    let active = true;
    getCurrentAuthUserWithRetry().then((user) => {
      if (!active) return;
      const uid = user?.id ?? null;
      setUserId(uid);
      void loadSavedVerses(uid);
    });
    return () => {
      active = false;
    };
  }, [loadSavedVerses]);

  // Keep the saved set fresh if the same verse is toggled elsewhere (e.g. Saved screen)
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(PRAYER_VERSES_UPDATED_EVENT, () => {
      void loadSavedVerses(userId);
    });
    return () => sub.remove();
  }, [loadSavedVerses, userId]);

  // When opened from a saved verse (?verse=index), scroll to and briefly highlight it
  useEffect(() => {
    if (verseParam == null) return;
    const idx = Number(verseParam);
    if (!Number.isFinite(idx) || idx < 0) return;

    setHighlightIndex(idx);
    const scrollTimer = setTimeout(() => {
      const y = itemYs.current[idx];
      if (y !== undefined && scrollRef.current) {
        scrollRef.current.scrollTo({ y: Math.max(0, y - 140), animated: true });
      }
    }, 450);
    const clearTimer = setTimeout(() => setHighlightIndex(null), 3400);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [verseParam, prayer.id]);

  const openVerseSheet = useCallback(
    (index: number) => {
      const v = getPrayerVerseByIndex(prayer, index);
      if (!v) return;
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setSelectedVerse(v);
      setSheetVisible(true);
    },
    [prayer],
  );

  const handleToggleSave = useCallback(async () => {
    if (!selectedVerse) return;

    // Resolve the user id on demand so a fast long-press → Save never races the
    // initial auth lookup (which would otherwise look like "saving doesn't work").
    let uid = userId;
    if (!uid) {
      const user = await getCurrentAuthUserWithRetry();
      uid = user?.id ?? null;
      if (uid) setUserId(uid);
    }
    if (!uid) {
      showAppToast({
        title: 'Sign in to save verses',
        message: 'Saved verses sync to your account.',
      });
      return;
    }

    const verse = selectedVerse;
    const currentlySaved = savedVerseIds.has(verse.id);

    // Optimistic update
    setSavedVerseIds((cur) => {
      const next = new Set(cur);
      if (currentlySaved) next.delete(verse.id);
      else next.add(verse.id);
      return next;
    });
    setSavingVerse(true);

    try {
      const newState = await togglePrayerVerseSaved(
        uid,
        prayer.name,
        verse,
        currentlySaved,
      );
      // Reconcile with the authoritative result
      setSavedVerseIds((cur) => {
        const next = new Set(cur);
        if (newState) next.add(verse.id);
        else next.delete(verse.id);
        return next;
      });
      if (newState && !currentlySaved) {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.warn('Toggle prayer verse save failed', error);
      // Revert optimistic change
      setSavedVerseIds((cur) => {
        const next = new Set(cur);
        if (currentlySaved) next.add(verse.id);
        else next.delete(verse.id);
        return next;
      });
      showAppToast({ title: 'Could not save verse', message: 'Please try again.' });
    } finally {
      setSavingVerse(false);
    }
  }, [selectedVerse, userId, savedVerseIds, prayer.name]);

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
    completionHandledThisSessionRef.current = null;
    skippedAheadThisSessionRef.current = false;
    skipAlertShownThisSessionRef.current = false;
    player.seekTo(0);
    player.play();
  }, [player]);

  const markSkippedAhead = useCallback(() => {
    if (skippedAheadThisSessionRef.current) return;

    skippedAheadThisSessionRef.current = true;
    completionHandledThisSessionRef.current = null;

    if (!skipAlertShownThisSessionRef.current) {
      skipAlertShownThisSessionRef.current = true;
      showAppToast({
        title: "Can't grant coins because you skipped ahead.",
        message: 'Start from the beginning and listen through to earn coins.',
      });
    }
  }, []);

  const seekToPosition = useCallback((targetMs: number) => {
    if (targetMs > positionMs + FORWARD_SEEK_TOLERANCE_MS) {
      markSkippedAhead();
    }

    try {
      player.seekTo(targetMs / 1000);
    } catch {}
  }, [markSkippedAhead, player, positionMs]);

  const onProgressPress = useCallback(
    (locationX: number) => {
      const ratio = Math.max(0, Math.min(1, locationX / trackWidth));
      seekToPosition(ratio * durationMs);
    },
    [trackWidth, durationMs, seekToPosition],
  );

  return (
    <>
    <ImageBackground source={prayer.thumbnail} style={styles.bg} resizeMode="cover">
      <View style={styles.overlay} />

      <View style={styles.container}>
        {/* Title */}
        <View style={styles.header}>
          <Text style={styles.titleHindi}>{prayer.nameHindi}</Text>
          <Text style={styles.titleEn}>{prayer.name.toUpperCase()}</Text>
          <View style={styles.hintRow}>
            <BookmarkPlus size={11} color="rgba(251,191,36,0.6)" strokeWidth={2} />
            <Text style={styles.hint}>Long-press a line for its meaning</Text>
          </View>
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
            const lineText = block.text.trim();
            const isInstrumental = lineText === '♪' || lineText === '';
            const isHighlighted = index === highlightIndex;
            const isSavedLine = savedVerseIds.has(`${prayer.id}:${index}`);
            return (
              <Pressable
                key={index}
                onLayout={(e) => {
                  itemYs.current[index] = e.nativeEvent.layout.y;
                }}
                onPress={() => seekToPosition(block.timeMs)}
                onLongPress={isInstrumental ? undefined : () => openVerseSheet(index)}
                delayLongPress={280}
                style={[styles.lyricBlock, isHighlighted && styles.lyricBlockHighlight]}
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
                {isSavedLine && !isInstrumental && (
                  <View style={styles.savedDot}>
                    <BookmarkCheck size={12} color={GitaColors.gold} strokeWidth={2.4} />
                  </View>
                )}
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

    <PrayerVerseSheet
      visible={sheetVisible}
      prayerTitle={prayer.name}
      verse={selectedVerse}
      isSaved={selectedVerse ? savedVerseIds.has(selectedVerse.id) : false}
      saving={savingVerse}
      onToggleSave={handleToggleSave}
      onClose={() => setSheetVisible(false)}
    />
    </>
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
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 9,
  },
  hint: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '600',
    letterSpacing: 0.2,
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
  lyricBlockHighlight: {
    backgroundColor: 'rgba(251,191,36,0.14)',
    borderRadius: 14,
  },
  savedDot: {
    position: 'absolute',
    top: 9,
    right: 8,
    opacity: 0.9,
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
