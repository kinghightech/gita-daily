import { Fonts } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { FAVORITES_UPDATED_EVENT, toggleFavoriteVerse } from '@/lib/favorites';
import { incrementSharesCount } from '@/lib/profile';
import { VERSE_BACKGROUND_URLS } from '@/lib/storageAssets';
import { stripHindiVerseRef } from '@/lib/verses';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as Speech from 'expo-speech';
import {
  Heart,
  Share2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  DeviceEventEmitter,
  Modal,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';

function getTodaysBgIndex(): number {
  const epoch = new Date(2024, 0, 1);
  const now = new Date();
  const daysSinceEpoch = Math.floor((now.getTime() - epoch.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceEpoch % VERSE_BACKGROUND_URLS.length;
}

interface QuoteCardProps {
  verse: {
    id: string;
    chapter: number;
    verse: number;
    english?: string;
    hindi?: string;
    speaker?: string;
    meaning?: string;
  } | null;
  user: { id: string; full_name: string | null; email: string | null } | null;
  preferences: { preferred_language?: string; favorite_verses?: string[] } | null;
  onFavoriteToggle?: (verseId: string, isLiked: boolean) => void;
  isToday?: boolean;
}

export default function QuoteCard({
  verse,
  user,
  preferences,
  onFavoriteToggle,
  isToday = false,
}: QuoteCardProps) {
  const activeLanguage = preferences?.preferred_language || 'english';
  const [optimisticFavorite, setOptimisticFavorite] = useState<boolean | null>(null);
  const [tapHeartPoint, setTapHeartPoint] = useState<{ x: number; y: number; nonce: number } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const lastTapRef = useRef(0);
  const cardRef = useRef<View>(null);
  const fullscreenCardRef = useRef<View>(null);
  const captureViewRef = useRef<View>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const tapHeartScale = useRef(new Animated.Value(0.35)).current;
  const tapHeartOpacity = useRef(new Animated.Value(0)).current;

  const isFavorite =
    optimisticFavorite !== null
      ? optimisticFavorite
      : (preferences?.favorite_verses?.includes(verse?.id ?? '') ?? false);

  useEffect(() => {
    if (!verse?.id) return;

    const subscription = DeviceEventEmitter.addListener(
      FAVORITES_UPDATED_EVENT,
      (data: { verseId: string; liked: boolean }) => {
        if (data.verseId === verse.id) {
          setOptimisticFavorite(data.liked);
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, [verse?.id]);

  const getQuoteText = useCallback(() => {
    const raw =
      activeLanguage === 'hindi'
        ? (stripHindiVerseRef(verse?.hindi) || verse?.english)
        : (verse?.english ?? verse?.hindi);
    if (!raw) return '';
    // Strip all apostrophes / quote-like chars so only the outer wrapping
    // pair is visible — exactly 2 marks total.
    return raw.replace(/['"‘’“”«»`]/g, '');
  }, [activeLanguage, verse?.english, verse?.hindi]);

  const handleFavorite = useCallback(async () => {
    if (!verse || !user?.id) return;

    const currentlyLiked = isFavorite;
    const nextFavorite = !currentlyLiked;

    setOptimisticFavorite(nextFavorite);

    try {
      const successStatus = await toggleFavoriteVerse(user.id, verse.id, currentlyLiked);
      if (onFavoriteToggle) {
        onFavoriteToggle(verse.id, successStatus);
      }
    } catch (error) {
      setOptimisticFavorite(currentlyLiked);
      console.error('Favorite toggle failed:', error);
    }
  }, [onFavoriteToggle, verse, isFavorite, user?.id]);

  const buildShareText = useCallback(() => {
    if (!verse) return '';
    return (
      `"${verse.english ?? verse.hindi ?? ''}"\n\n` +
      `— Bhagavad Gita, Chapter ${verse.chapter}, Verse ${verse.verse}` +
      `${verse.speaker ? ` (${verse.speaker})` : ''}` +
      (activeLanguage === 'hindi' && verse.hindi ? `\n\n${verse.hindi}` : '') +
      '\n\nShared via Gita Daily'
    );
  }, [verse, activeLanguage]);

  const shareAsText = useCallback(async () => {
    if (!verse) return;
    try {
      await Share.share({ title: 'Gita Daily Wisdom', message: buildShareText() });
      if (user?.id) await incrementSharesCount(user.id);
    } catch {}
  }, [verse, user, buildShareText]);

  const shareAsImage = useCallback(async () => {
    if (!verse) return;
    try {
      setIsCapturing(true);
      await new Promise(r => setTimeout(r, 80));
      const uri = await captureRef(captureViewRef, { format: 'jpg', quality: 0.93 });
      setIsCapturing(false);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'Share Verse' });
        if (user?.id) await incrementSharesCount(user.id);
      }
    } catch {
      setIsCapturing(false);
      await shareAsText();
    }
  }, [verse, user, shareAsText]);

  const handleShare = useCallback(() => {
    if (!verse) return;
    Alert.alert('Share Verse', 'How would you like to share?', [
      { text: 'Share as Image', onPress: shareAsImage },
      { text: 'Share as Text', onPress: shareAsText },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [verse, shareAsText, shareAsImage]);

  const showTapHeart = useCallback((x: number, y: number) => {
    setTapHeartPoint({ x, y, nonce: Date.now() });
    tapHeartScale.setValue(0.35);
    tapHeartOpacity.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.timing(tapHeartScale, {
          toValue: 1.15,
          duration: 170,
          useNativeDriver: true,
        }),
        Animated.timing(tapHeartOpacity, {
          toValue: 1,
          duration: 140,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(tapHeartScale, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(tapHeartOpacity, {
          toValue: 0,
          duration: 260,
          delay: 220,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setTapHeartPoint(null);
    });
  }, [tapHeartOpacity, tapHeartScale]);

  const handleDoubleTap = useCallback((event: GestureResponderEvent) => {
    const now = Date.now();
    const diff = now - lastTapRef.current;
    const { pageX, pageY } = event.nativeEvent;

    if (diff < 300 && diff > 0) {
      const ref = expanded ? fullscreenCardRef : cardRef;
      ref.current?.measure((_fx, _fy, _w, _h, containerPageX, containerPageY) => {
        showTapHeart(pageX - containerPageX, pageY - containerPageY);
      });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (verse && !isFavorite && user?.id) {
        void handleFavorite();
      }

      lastTapRef.current = 0;
      return true;
    }

    lastTapRef.current = now;
    return false;
  }, [expanded, isFavorite, handleFavorite, showTapHeart, verse, user?.id]);

  const handleCardPress = useCallback((event: GestureResponderEvent) => {
    const wasDoubleTap = handleDoubleTap(event);
    if (!wasDoubleTap) {
      setTimeout(() => {
        if (lastTapRef.current !== 0) {
          setExpanded(true);
          Animated.spring(expandAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 200,
            friction: 18,
          }).start();
        }
      }, 310);
    }
  }, [handleDoubleTap, expandAnim]);

  const handleCollapse = useCallback(() => {
    Animated.spring(expandAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 200,
      friction: 18,
    }).start(() => {
      setExpanded(false);
    });
  }, [expandAnim]);

  const bgIndex = getTodaysBgIndex();
  const [isSpeaking, setIsSpeaking] = useState(false);

  const speakQuote = useCallback(async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    const text = getQuoteText();
    if (!text) return;
    const language = activeLanguage === 'hindi' ? 'hi-IN' : 'en-US';
    setIsSpeaking(true);
    Speech.speak(text, {
      language,
      rate: 1,
      pitch: 0.6,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [isSpeaking, activeLanguage, getQuoteText]);

  useEffect(() => {
    return () => { Speech.stop(); };
  }, [verse?.id]);

  if (!verse) return null;

  const cardContent = (isFullscreen: boolean) => (
    <View style={isFullscreen ? styles.fullscreenCard : styles.cardOuter}>
      <View
        ref={!isFullscreen ? captureViewRef : undefined}
        collapsable={false}
        style={isFullscreen ? styles.fullscreenCardInner : styles.cardInner}
      >
        <Image
          source={VERSE_BACKGROUND_URLS[bgIndex]}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
        />

        {/* Readability overlay */}
        <LinearGradient
          colors={
            isFullscreen
              ? ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.15)', 'rgba(0,0,0,0.55)']
              : ['rgba(15,23,42,0.35)', 'rgba(15,23,42,0.15)', 'rgba(15,23,42,0.25)', 'rgba(15,23,42,0.6)']
          }
          locations={isFullscreen ? [0, 0.25, 0.65, 1] : [0, 0.3, 0.6, 1]}
          style={StyleSheet.absoluteFill}
        />

      <Pressable
        ref={isFullscreen ? fullscreenCardRef : cardRef}
        style={isFullscreen ? styles.fullscreenContent : styles.content}
        onPress={isFullscreen ? handleDoubleTap : handleCardPress}
      >
        {/* Close button — fullscreen only, sits at the very top */}
        {isFullscreen && (
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.closeBtn}
            onPress={handleCollapse}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X color="#fff" size={24} strokeWidth={2} />
          </TouchableOpacity>
        )}

        {/* Header + verse grouped so they stay together and center as one unit */}
        <View style={isFullscreen ? styles.fullscreenBodyGroup : styles.bodyGroup}>
          <View style={isFullscreen ? styles.fullscreenTopSection : styles.topSection}>
            {isToday && (
              <Text style={styles.vodLabel}>Verse of the Day</Text>
            )}
            <Text style={isFullscreen ? styles.fullscreenReference : styles.reference}>
              Chapter {verse.chapter}, Verse {verse.verse}
            </Text>
            {verse.speaker && (
              <Text style={styles.speaker}>Spoken by {verse.speaker}</Text>
            )}
          </View>

          {/* Verse text */}
          <View style={isFullscreen ? styles.fullscreenQuoteSection : styles.quoteSection}>
            <Text style={[
              isFullscreen ? styles.fullscreenQuoteText : styles.quoteText,
              activeLanguage === 'hindi' && styles.quoteHindi,
            ]}>
              {`“${getQuoteText()}”`}
            </Text>
          </View>
        </View>

        {/* Double-tap heart animation */}
        {tapHeartPoint && (
          <Animated.View
            key={`tap-heart-${tapHeartPoint.nonce}`}
            pointerEvents="none"
            style={[
              styles.tapHeart,
              {
                left: tapHeartPoint.x - 22,
                top: tapHeartPoint.y - 22,
                opacity: tapHeartOpacity,
                transform: [{ scale: tapHeartScale }],
              },
            ]}
          >
            <Heart size={44} color="#FE2C55" fill="#FE2C55" />
          </Animated.View>
        )}

        {/* Actions — spread evenly */}
        <View style={[styles.actionBar, isCapturing && { opacity: 0 }]}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.actionBtn}
            onPress={handleFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart
              color="#fff"
              size={24}
              fill={isFavorite ? '#FE2C55' : 'transparent'}
              strokeWidth={isFavorite ? 0 : 1.6}
            />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.actionBtn}
            onPress={speakQuote}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isSpeaking
              ? <VolumeX color="#fbbf24" size={24} />
              : <Volume2 color="#fff" size={24} strokeWidth={1.6} />
            }
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.actionBtn}
            onPress={handleShare}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Share2 color="#fff" size={24} strokeWidth={1.6} />
          </TouchableOpacity>
        </View>
      </Pressable>
      </View>
    </View>
  );

  return (
    <>
      <View style={styles.wrapper}>
        {cardContent(false)}

      </View>

      <Modal
        visible={expanded}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleCollapse}
      >
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <Animated.View
          style={[
            styles.fullscreenOverlay,
            {
              opacity: expandAnim,
              transform: [{
                scale: expandAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.92, 1],
                }),
              }],
            },
          ]}
        >
          {cardContent(true)}
        </Animated.View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },

  cardOuter: {
    borderRadius: 22,
    minHeight: 420,
  },

  cardInner: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.18)',
  },

  fullscreenCard: {
    flex: 1,
  },

  fullscreenCardInner: {
    flex: 1,
  },

  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 28,
    paddingHorizontal: 24,
    paddingBottom: 20,
    minHeight: 360,
    position: 'relative',
    zIndex: 2,
  },

  fullscreenContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingHorizontal: 28,
    paddingBottom: 40,
    position: 'relative',
  },

  fullscreenOverlay: {
    flex: 1,
    backgroundColor: '#000',
  },

  closeBtn: {
    alignSelf: 'flex-start',
    marginBottom: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Non-fullscreen: fills space so quoteSection (flex:1) can push to center
  bodyGroup: {
    flex: 1,
  },

  // Fullscreen: centers header + verse together vertically as one unit
  fullscreenBodyGroup: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
  },

  topSection: {
    gap: 2,
  },

  fullscreenTopSection: {
    gap: 4,
  },

  vodLabel: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.5,
    marginBottom: 2,
  },

  reference: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    fontFamily: Fonts.serif,
  },

  fullscreenReference: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    fontFamily: Fonts.serif,
  },

  speaker: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    fontWeight: '400',
    fontStyle: 'italic',
    marginTop: 4,
  },

  quoteSection: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 28,
  },

  fullscreenQuoteSection: {
    paddingTop: 4,
  },

  quoteText: {
    color: '#fff',
    fontSize: 24,
    lineHeight: 36,
    fontFamily: Fonts.serif,
    fontWeight: '400',
  },

  fullscreenQuoteText: {
    color: '#fff',
    fontSize: 28,
    lineHeight: 42,
    fontFamily: Fonts.serif,
    fontWeight: '400',
  },

  quoteHindi: {
    fontStyle: 'normal',
    fontWeight: '500',
    fontFamily: undefined,
  },

  tapHeart: {
    position: 'absolute',
  },

  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },

  actionBtn: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },

});
