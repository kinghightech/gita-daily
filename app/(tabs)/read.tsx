import LotusLoader from '@/components/ui/LotusLoader';
import { Fonts, GitaColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { refreshAndAwardUserBadges } from '@/lib/badges';
import { FAVORITES_UPDATED_EVENT, fetchUserFavorites, toggleFavoriteVerse } from '@/lib/favorites';
import { saveNote } from '@/lib/notes';
import { loadPreferredLanguageForCurrentUser, PREFERRED_LANGUAGE_CHANGED_EVENT } from '@/lib/preferredLanguage';
import { fetchCurrentUserAndProfile, incrementSharesCount, updateBookmark } from '@/lib/profile';
import { fetchChapter, fetchVersesByChapter, getVerseDisplayText, stripHindiVerseRef, type GitaChapter, type GitaVerse } from '@/lib/verses';
import type { Theme } from '@/theme/colors';
import { useFocusEffect } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as Speech from 'expo-speech';
import {
    BookOpen,
    Bookmark,
    ChevronLeft,
    ChevronRight,
    Copy,
    FileText,
    Heart,
    Lightbulb,
    Map,
    Pause,
    Play,
    Share2,
    StickyNote,
    Volume2,
    VolumeX,
    X,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    Animated,
    DeviceEventEmitter,
    Dimensions,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PopupTab = 'actions' | 'insight' | 'note';

export default function ReadScreen() {
  const [chapter, setChapter] = useState<GitaChapter | null>(null);
  const [verses, setVerses] = useState<GitaVerse[]>([]);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<GitaVerse | null>(null);
  const [popupTab, setPopupTab] = useState<PopupTab>('actions');
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [favoriteVerseIds, setFavoriteVerseIds] = useState<string[]>([]);
  const [preferredLanguage, setPreferredLanguage] = useState<'english' | 'hindi'>('english');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isReadingChapter, setIsReadingChapter] = useState(false);
  const isReadingChapterRef = useRef(false);
  const [currentReadingIndex, setCurrentReadingIndex] = useState(-1);

  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [userBookmark, setUserBookmark] = useState<{ chapter: number; verse: number } | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [hasScrolledToBookmark, setHasScrolledToBookmark] = useState(false);
  const verseRefs = useRef<Record<number, View | null>>({});
  const popupAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);

  // Load user
  useEffect(() => {
    (async () => {
      const { user, profile } = await fetchCurrentUserAndProfile();
      if (user) {
        setUser({ id: user.id });
        const [favs, lang] = await Promise.all([
          fetchUserFavorites(user.id),
          loadPreferredLanguageForCurrentUser()
        ]);
        setFavoriteVerseIds(favs);
        setPreferredLanguage(lang as 'english' | 'hindi');
        
        if (profile?.bookmark_chapter && profile?.bookmark_verse) {
          const bookmark = { chapter: profile.bookmark_chapter, verse: profile.bookmark_verse };
          setUserBookmark(bookmark);
          setCurrentChapter((chapter) => chapter === bookmark.chapter ? chapter : bookmark.chapter);
        }
      }
      setIsProfileLoaded(true);
    })();
  }, []);

  // Listen for favorites/bookmarks/language changes
  useEffect(() => {
    const favSub = DeviceEventEmitter.addListener(
      FAVORITES_UPDATED_EVENT,
      (data: { verseId: string; liked: boolean }) => {
        setFavoriteVerseIds(prev => {
          if (data.liked) return prev.includes(data.verseId) ? prev : [...prev, data.verseId];
          return prev.filter(id => id !== data.verseId);
        });
      }
    );
    const langSub = DeviceEventEmitter.addListener(
      PREFERRED_LANGUAGE_CHANGED_EVENT,
      (newLang: string) => {
        setPreferredLanguage(newLang as 'english' | 'hindi');
      }
    );

    return () => {
      favSub.remove();
      langSub.remove();
    };
  }, []);

  // Popup animation
  const showPopup = useCallback(() => {
    Animated.spring(popupAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [popupAnim]);

  const hidePopup = useCallback(() => {
    Animated.timing(popupAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedVerse(null);
      setPopupTab('actions');
      setNoteText('');
    });
  }, [popupAnim]);

  // Load chapter data
  const loadChapter = useCallback(async (num: number) => {
    setIsLoading(true);
    setSelectedVerse(null);
    hidePopup();
    verseRefs.current = {};
    const [chapterData, versesData] = await Promise.all([
      fetchChapter(num),
      fetchVersesByChapter(num),
    ]);
    setChapter(chapterData);
    setVerses(versesData);
    setIsLoading(false);
  }, [hidePopup]);

  useEffect(() => {
    if (!isProfileLoaded) return;
    loadChapter(currentChapter);
  }, [currentChapter, loadChapter, isProfileLoaded]);

  const stopSpeech = useCallback((resetIndex = true) => {
    Speech.stop();
    setIsSpeaking(false);
    setIsReadingChapter(false);
    isReadingChapterRef.current = false;
    if (resetIndex) {
      setCurrentReadingIndex(-1);
    }
  }, []);

  const playVerseAtIndex = useCallback((index: number) => {
    if (!isReadingChapterRef.current || index >= verses.length) {
      stopSpeech();
      return;
    }

    const verse = verses[index];
    const text = preferredLanguage === 'hindi'
      ? (stripHindiVerseRef(verse.hindi) || verse.english)
      : verse.english;

    if (!text) {
      playVerseAtIndex(index + 1);
      return;
    }

    setCurrentReadingIndex(index);
    const language = preferredLanguage === 'hindi' ? 'hi-IN' : 'en-US';

    Speech.speak(text, {
      language,
      rate: 1.0,
      pitch: 0.6,
      onDone: () => {
        if (isReadingChapterRef.current) {
          playVerseAtIndex(index + 1);
        }
      },
      onStopped: () => {
        // Only reset isSpeaking if we are truly stopping
        if (!isReadingChapterRef.current) {
          setIsSpeaking(false);
        }
      },
      onError: () => {
        if (!isReadingChapterRef.current) {
          stopSpeech();
        }
      },
    });
  }, [verses, preferredLanguage, stopSpeech]);

  // On tab focus: navigate to bookmark if we haven't already in this focus session
  useFocusEffect(
    useCallback(() => {
      setHasScrolledToBookmark(false);
      
      if (userBookmark) {
        setCurrentChapter(userBookmark.chapter);
      }

      return () => {
        // Stop speech when the user leaves this screen
        stopSpeech();
      };
    }, [userBookmark, stopSpeech])
  );

  // Scroll to bookmarked verse after content loads
  useEffect(() => {
    if (isLoading || verses.length === 0 || hasScrolledToBookmark) return;

    const isCurrentChapterBookmarked = userBookmark && userBookmark.chapter === currentChapter;

    if (isCurrentChapterBookmarked) {
      const timer = setTimeout(() => {
        const verseView = verseRefs.current[userBookmark.verse];
        const contentNode = contentRef.current;
        
        if (verseView && contentNode) {
          (verseView as any).measureLayout(
            contentNode,
            (_x: number, y: number) => {
              if (y > 0) {
                scrollRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true });
                setHasScrolledToBookmark(true);
              }
            },
            () => {
              console.warn('measureLayout failed for verse', userBookmark.verse);
            }
          );
        }
      }, 600);
      return () => clearTimeout(timer);
    } 
  }, [isLoading, verses, userBookmark, currentChapter, hasScrolledToBookmark]);

  // Group verses by consecutive speaker for script format
  const groupedVerses = useMemo(() => {
    if (verses.length === 0) return [];

    const groups: { speaker: string; verses: GitaVerse[] }[] = [];
    let currentGroup: { speaker: string; verses: GitaVerse[] } | null = null;

    for (const verse of verses) {
      const speaker = verse.speaker || 'Narrator';
      if (currentGroup && currentGroup.speaker === speaker) {
        currentGroup.verses.push(verse);
      } else {
        currentGroup = { speaker, verses: [verse] };
        groups.push(currentGroup);
      }
    }

    return groups;
  }, [verses]);

  const handleVersePress = useCallback(
    (verse: GitaVerse) => {
      if (selectedVerse?.id === verse.id) {
        hidePopup();
        return;
      }
      setSelectedVerse(verse);
      setPopupTab('actions');
      setNoteText('');
      setIsBookmarked(userBookmark?.chapter === verse.chapter_number && userBookmark?.verse === verse.verse_number);
      
      // Update reading index so 'Chapter Play' starts or resumes from here
      const idx = verses.findIndex(v => v.id === verse.id);
      if (idx !== -1) {
        // If we are currently reading the chapter, stop and jump immediately
        if (isReadingChapterRef.current) {
          // Tell onStopped that we are intentionally jumping, not stopping fully
          isReadingChapterRef.current = false;
          Speech.stop();
          
          setCurrentReadingIndex(idx);
          
          setTimeout(() => {
            isReadingChapterRef.current = true;
            setIsReadingChapter(true);
            playVerseAtIndex(idx);
          }, 100); // Give the speech engine 100ms to fully clear its queues
        } else {
          setCurrentReadingIndex(idx);
        }
      }

      showPopup();

      // Automatically adjust scroll so the verse sits clearly above the 280px popup.
      setTimeout(() => {
        const verseView = verseRefs.current[verse.verse_number];
        const contentNode = contentRef.current;
        if (verseView && contentNode) {
          (verseView as any).measureLayout(
            contentNode,
            (_x: number, y: number) => {
              if (y > 0) {
                // y - 80 puts the quote beautifully below the header and miles above the popup
                scrollRef.current?.scrollTo({ y: Math.max(0, y - 80), animated: true });
              }
            },
            () => {}
          );
        }
      }, 100);
    },
    [selectedVerse, showPopup, hidePopup, userBookmark, verses, playVerseAtIndex]
  );

  // Actions
  const handleSave = useCallback(async () => {
    if (!selectedVerse || !user?.id) return;
    const isCurrentlyFav = favoriteVerseIds.includes(selectedVerse.id);
    const newState = await toggleFavoriteVerse(user.id, selectedVerse.id, isCurrentlyFav);
    if (newState && !isCurrentlyFav) {
      void refreshAndAwardUserBadges(user.id).catch((error) => {
        console.warn('Badge refresh after favorite failed:', error);
      });
    }
  }, [selectedVerse, user, favoriteVerseIds]);

  const handleCopy = useCallback(async () => {
    if (!selectedVerse) return;
    const verseText = getVerseDisplayText(selectedVerse, preferredLanguage);
    const text = `"${verseText}"\n— Bhagavad Gita ${selectedVerse.chapter_number}.${selectedVerse.verse_number}${selectedVerse.speaker ? ` (${selectedVerse.speaker})` : ''}`;
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Verse copied to clipboard');
  }, [selectedVerse, preferredLanguage]);

  const handleShare = useCallback(async () => {
    if (!selectedVerse) return;
    const verseText = getVerseDisplayText(selectedVerse, preferredLanguage);
    const text = `"${verseText}"\n\n— Bhagavad Gita, Chapter ${selectedVerse.chapter_number}, Verse ${selectedVerse.verse_number}${selectedVerse.speaker ? ` (${selectedVerse.speaker})` : ''}\n\nShared via Om Daily`;
    try {
      await Share.share({ title: 'Om Daily', message: text });
      if (user?.id) {
        await incrementSharesCount(user.id);
        void refreshAndAwardUserBadges(user.id).catch((error) => {
          console.warn('Badge refresh after share failed:', error);
        });
      }
    } catch {}
  }, [selectedVerse, user, preferredLanguage]);

  const handleSaveNote = useCallback(async () => {
    if (!selectedVerse || !user?.id || !noteText.trim()) return;
    setIsSaving(true);
    const success = await saveNote(user.id, selectedVerse.id, noteText);
    setIsSaving(false);
    if (success) {
      DeviceEventEmitter.emit('omDaily.notesUpdated.v1');
      Alert.alert('Saved', 'Your note has been saved.');
      setPopupTab('actions');
      setNoteText('');
      void refreshAndAwardUserBadges(user.id).catch((error) => {
        console.warn('Badge refresh after note failed:', error);
      });
    } else {
      Alert.alert('Error', 'Could not save note. Please try again.');
    }
  }, [selectedVerse, user, noteText]);

  const handleBookmark = useCallback(async () => {
    if (!selectedVerse || !user?.id) return;
    const success = await updateBookmark(user.id, selectedVerse.chapter_number, selectedVerse.verse_number);
    if (success) {
      const newBookmark = { chapter: selectedVerse.chapter_number, verse: selectedVerse.verse_number };
      setUserBookmark(newBookmark);
      setIsBookmarked(true);
      Alert.alert('Bookmarked', `You will pick up here at ${newBookmark.chapter}.${newBookmark.verse} next time.`);
    } else {
      Alert.alert('Error', 'Could not save bookmark.');
    }
  }, [selectedVerse, user]);

  const handleRemoveBookmark = useCallback(async () => {
    if (!user?.id) return;
    const success = await updateBookmark(user.id, null, null);
    if (success) {
      setUserBookmark(null);
      setIsBookmarked(false);
      Alert.alert('Bookmark Removed', 'Your reading position has been cleared.');
    } else {
      Alert.alert('Error', 'Could not remove bookmark.');
    }
  }, [user]);

  const handleSpeak = useCallback(() => {
    if (isSpeaking || isReadingChapter) {
      stopSpeech();
      return;
    }
    if (!selectedVerse) return;
    const text = preferredLanguage === 'hindi'
      ? (stripHindiVerseRef(selectedVerse.hindi) || selectedVerse.english)
      : selectedVerse.english;
    if (!text) return;
    const language = preferredLanguage === 'hindi' ? 'hi-IN' : 'en-US';
    setIsSpeaking(true);
    Speech.speak(text, {
      language,
      rate: 1.0,
      pitch: 0.6,
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  }, [isSpeaking, isReadingChapter, selectedVerse, preferredLanguage, stopSpeech]);

  const handleReadChapter = useCallback(() => {
    if (isReadingChapterRef.current) {
      stopSpeech(false); // Pause, but keep currentReadingIndex
      return;
    }
    
    if (verses.length === 0) return;
    
    // If speaking a single verse, stop it first
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
    }

    setIsReadingChapter(true);
    isReadingChapterRef.current = true;

    // Start from current index if valid
    let startIndex = 0;
    if (currentReadingIndex >= 0) {
      startIndex = currentReadingIndex;
    } else if (userBookmark && userBookmark.chapter === currentChapter) {
      // If no active index but we have a bookmark in this chapter, start from there
      const idx = verses.findIndex(v => v.verse_number === userBookmark.verse);
      if (idx !== -1) {
        startIndex = idx;
      }
    }
    
    playVerseAtIndex(startIndex);
  }, [verses, isSpeaking, playVerseAtIndex, stopSpeech, currentReadingIndex, userBookmark, currentChapter]);

  // Stop speech when popup hides or verse changes, or navigation happens
  useEffect(() => {
    if (!selectedVerse && isSpeaking) {
      stopSpeech();
    }
  }, [selectedVerse, isSpeaking, stopSpeech]);

  // Stop everything on chapter change or unmount
  useEffect(() => {
    return () => stopSpeech();
  }, [currentChapter, stopSpeech]);

  // Auto-scroll to verse being read
  useEffect(() => {
    if (isReadingChapter && currentReadingIndex >= 0) {
      const verse = verses[currentReadingIndex];
      const verseView = verseRefs.current[verse.verse_number];
      const contentNode = contentRef.current;
      
      if (verseView && contentNode) {
        (verseView as any).measureLayout(
          contentNode,
          (_x: number, y: number) => {
            if (y > 0) {
              scrollRef.current?.scrollTo({ y: Math.max(0, y - 120), animated: true });
            }
          },
          () => {}
        );
      }
    }
  }, [currentReadingIndex, isReadingChapter, verses]);

  const goToChapter = (delta: number) => {
    const next = currentChapter + delta;
    if (next >= 1 && next <= 18) {
      setHasScrolledToBookmark(false);
      setCurrentChapter(next);
    }
  };

  const getContextForVerse = (ch: number, v: number): string | null => {
    if (ch === 1) {
      switch(v) {
        case 11: return "Duryodhana finishes his speech, the war horns blow, and the narrator (Sanjaya) takes over to describe the intense atmosphere to King Dhritarashtra.";
        case 21: return "As the weapons are about to be fired, Arjuna raises his bow and asks his charioteer, Lord Krishna, to move them to the center of the battlefield.";
        case 24: return "Krishna drives the chariot between both armies and stops before the great warriors.";
        case 26: return "Arjuna now sees both armies filled with people he personally knows.";
        case 48: return "Arjuna surrenders emotionally and refuses to fight.";
        default: return null;
      }
    }
    return null;
  };

  const popupTranslateY = popupAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  const isVerseSaved = selectedVerse ? favoriteVerseIds.includes(selectedVerse.id) : false;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <View style={styles.chapterHeader}>
        <View style={styles.chapterHeaderInner}>
          <Pressable
            style={styles.navArrow}
            onPress={() => goToChapter(-1)}
            disabled={currentChapter <= 1}
          >
            <ChevronLeft
              size={28}
              color={currentChapter <= 1 ? 'rgba(251,191,36,0.2)' : GitaColors.gold}
            />
          </Pressable>

          <View style={styles.chapterCenter}>
            <Text style={styles.chapterLabel}>Chapter {currentChapter}</Text>
            {chapter && (
              <Text 
                style={styles.chapterName}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {chapter.chapter_name}
              </Text>
            )}
          </View>

          <Pressable 
            style={styles.navArrow} 
            onPress={() => goToChapter(1)}
            disabled={currentChapter >= 18}
          >
            <ChevronRight 
              size={28} 
              color={currentChapter >= 18 ? 'rgba(251,191,36,0.2)' : GitaColors.gold} 
            />
          </Pressable>
        </View>

        <View style={styles.actionBtnRow}>
          <Pressable
            style={[styles.playBtn, isReadingChapter && { borderColor: GitaColors.gold, backgroundColor: 'rgba(251,191,36,0.1)' }]}
            onPress={handleReadChapter}
          >
            {isReadingChapter ? (
              <Pause size={24} color={GitaColors.gold} fill={GitaColors.gold} />
            ) : (
              <Play size={24} color="white" fill="white" />
            )}
          </Pressable>

          <Pressable
            style={styles.guideBtn}
            onPress={() => router.push('/guide')}
          >
            <Map size={22} color={GitaColors.gold} />
          </Pressable>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <LotusLoader size={90} color={GitaColors.gold} strokeWidth={2.5} />
          <Text style={styles.loadingText}>Loading scripture...</Text>
        </View>
      ) : verses.length === 0 ? (
        <View style={styles.emptyWrap}>
          <FileText size={48} color="rgba(251,191,36,0.3)" />
          <Text style={styles.emptyText}>No verses available for this chapter yet.</Text>
          <Text style={styles.emptySubtext}>More chapters coming soon</Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          style={styles.readScroll}
          contentContainerStyle={[
            styles.readScrollContent,
            { paddingBottom: selectedVerse ? 300 : 132 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.scriptCard} ref={contentRef}>
            {currentChapter === 1 && (
              <Pressable
                style={styles.introBtn}
                onPress={() => router.push('/gita-intro')}
              >
                <View style={styles.introIconCircle}>
                  <BookOpen size={22} color={GitaColors.gold} />
                </View>
                <View style={styles.introTextWrap}>
                  <View style={styles.introLabelRow}>
                    <Text style={styles.introLabel}>CONTEXT</Text>
                  </View>
                  <Text style={styles.introTitle}>New to the Gita? Start here</Text>
                  <Text style={styles.introSubtitle}>
                    A simple guide to what the Bhagavad Gita is — before you begin reading.
                  </Text>
                </View>
                <ChevronRight size={22} color={GitaColors.gold} />
              </Pressable>
            )}
            {groupedVerses.map((group, groupIdx) => {
              return (
                <View key={groupIdx} style={styles.speakerBlock}>
                    <Text style={styles.speakerName}>{group.speaker}:</Text>
                    <View style={styles.dialogueBlock}>
                      {group.verses.map((verse) => {
                        const isSelected = selectedVerse?.id === verse.id;
                        const isReading = isReadingChapter && verses[currentReadingIndex]?.id === verse.id;
                        const context = verse.context || getContextForVerse(currentChapter, verse.verse_number);
                        const isThisBookmarked = userBookmark?.chapter === currentChapter && userBookmark?.verse === verse.verse_number;

                        return (
                          <View 
                            key={verse.id} 
                            ref={(ref) => { verseRefs.current[verse.verse_number] = ref; }}
                            style={[styles.verseWithContext, isThisBookmarked && styles.bookmarkedVerse]}
                          >
                            {isThisBookmarked && (
                              <View style={styles.bookmarkIndicator}>
                                <Bookmark size={16} color={GitaColors.gold} fill={GitaColors.gold} />
                              </View>
                            )}
                            <Pressable
                              onPress={() => handleVersePress(verse)}
                            >
                              <Text
                                style={[
                                  styles.verseText,
                                  isSelected && styles.verseTextSelected,
                                  isReading && styles.verseTextReading,
                                ]}
                              >
                                  &quot;{getVerseDisplayText(verse, preferredLanguage)}&quot;
                              </Text>

                              {context && (
                                <View style={styles.contextBoxInside}>
                                  <View style={styles.contextHeader}>
                                    <FileText size={14} color="#fbbf24" />
                                    <Text style={styles.contextLabel}>CONTEXT</Text>
                                  </View>
                                  <Text style={styles.contextText}>{context}</Text>
                                </View>
                              )}
                            </Pressable>
                          </View>
                        );
                      })}
                    </View>
                  </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      {/* Bottom Verse Selection Popup */}
      {selectedVerse && (
        <Animated.View
          style={[
            styles.popup,
            {
              transform: [{ translateY: popupTranslateY }],
            },
          ]}
        >
          {/* Popup Header */}
          <View style={styles.popupHeader}>
            <View style={styles.popupHandle} />
          </View>

          <View style={styles.popupHeaderRow}>
            <Text style={styles.popupVerseRef}>
              {selectedVerse.chapter_number}.{selectedVerse.verse_number}
              {selectedVerse.speaker ? ` — ${selectedVerse.speaker}` : ''}
            </Text>
            <Pressable onPress={hidePopup} hitSlop={16}>
              <X size={20} color={theme.subtext} />
            </Pressable>
          </View>

          {/* Tab content */}
          {popupTab === 'actions' && (
            <View style={styles.popupActions}>
              <View style={styles.popupActionRow}>
                <Pressable
                  style={[styles.popupActionBtn]}
                  onPress={handleSave}
                >
                  <View style={styles.popupActionIconCircle}>
                    <Heart
                      size={24}
                      color={isVerseSaved ? '#ef4444' : theme.primary}
                      fill={isVerseSaved ? '#ef4444' : 'transparent'}
                    />
                  </View>
                  <Text style={[styles.popupActionLabel, isVerseSaved && styles.popupActionLabelActive]}>
                    {isVerseSaved ? 'Saved' : 'Save'}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.popupActionBtn}
                  onPress={isBookmarked ? handleRemoveBookmark : handleBookmark}
                >
                  <View style={[styles.popupActionIconCircle, isBookmarked && { borderColor: GitaColors.gold }]}>
                    <Bookmark
                      size={24}
                      color={isBookmarked ? GitaColors.gold : theme.primary}
                      fill={isBookmarked ? GitaColors.gold : 'transparent'}
                    />
                  </View>
                  <Text style={[styles.popupActionLabel, isBookmarked && { color: GitaColors.gold }]}>
                    {isBookmarked ? 'Bookmarked' : 'Bookmark'}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.popupActionBtn}
                  onPress={() => setPopupTab('note')}
                >
                  <View style={styles.popupActionIconCircle}>
                    <StickyNote size={24} color={theme.primary} />
                  </View>
                  <Text style={styles.popupActionLabel}>Add Note</Text>
                </Pressable>
              </View>

              <View style={styles.popupActionRow}>
                <Pressable style={styles.popupActionBtn} onPress={handleCopy}>
                  <View style={styles.popupActionIconCircle}>
                    <Copy size={24} color={theme.primary} />
                  </View>
                  <Text style={styles.popupActionLabel}>Copy Text</Text>
                </Pressable>

                <Pressable
                  style={styles.popupActionBtn}
                  onPress={handleShare}
                >
                  <View style={styles.popupActionIconCircle}>
                    <Share2 size={24} color={theme.primary} />
                  </View>
                  <Text style={styles.popupActionLabel}>Share Verse</Text>
                </Pressable>

                <Pressable
                  style={[styles.popupActionBtn, isSpeaking && styles.popupActionBtnActive]}
                  onPress={handleSpeak}
                >
                  <View style={[styles.popupActionIconCircle, (isSpeaking || isReadingChapter) && { backgroundColor: 'rgba(251,191,36,0.15)', borderColor: GitaColors.gold }]}>
                    {isSpeaking || isReadingChapter
                      ? <VolumeX size={24} color={GitaColors.gold} />
                      : <Volume2 size={24} color={theme.primary} />
                    }
                  </View>
                  <Text style={[styles.popupActionLabel, (isSpeaking || isReadingChapter) && { color: '#fbbf24' }]}>
                    {isSpeaking || isReadingChapter ? 'Stop Verse' : 'Listen Now'}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {popupTab === 'insight' && (
            <View style={styles.insightPane}>
              <Pressable style={styles.backBtn} onPress={() => setPopupTab('actions')}>
                <ChevronLeft size={18} color={GitaColors.gold} />
                <Text style={styles.backBtnText}>Back</Text>
              </Pressable>
              <View style={styles.insightContent}>
                <Lightbulb size={28} color={theme.goldSubtle} />
                <Text style={styles.insightTitle}>Insight</Text>
                <Text style={styles.insightPlaceholder}>
                  Deeper commentary and analysis for this verse will appear here in a future update.
                </Text>
              </View>
            </View>
          )}

          {popupTab === 'note' && (
            <Modal
              transparent
              animationType="slide"
              visible={true}
              onRequestClose={() => setPopupTab('actions')}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.noteModal}
              >
                <View style={styles.noteModalCard}>
                  <View style={styles.noteModalHeader}>
                    <Pressable style={styles.backBtn} onPress={() => setPopupTab('actions')}>
                      <ChevronLeft size={18} color={GitaColors.gold} />
                      <Text style={styles.backBtnText}>Back</Text>
                    </Pressable>
                    <Pressable onPress={() => setPopupTab('actions')} hitSlop={16}>
                      <X size={20} color="rgba(255,255,255,0.5)" />
                    </Pressable>
                  </View>
                  <Text style={styles.noteTitle}>
                    Add Note for {selectedVerse.chapter_number}.{selectedVerse.verse_number}
                  </Text>
                  <TextInput
                    style={styles.noteInput}
                    multiline
                    placeholder="Write your reflection..."
                    placeholderTextColor={theme.goldSubtle}
                    value={noteText}
                    onChangeText={setNoteText}
                    selectionColor="#fbbf24"
                    autoFocus
                  />
                  <Pressable
                    style={[styles.noteSaveBtn, !noteText.trim() && styles.noteSaveBtnDisabled]}
                    onPress={handleSaveNote}
                    disabled={!noteText.trim() || isSaving}
                  >
                    <Text style={styles.noteSaveBtnText}>
                      {isSaving ? 'Saving...' : 'Save Note'}
                    </Text>
                  </Pressable>
                </View>
              </KeyboardAvoidingView>
            </Modal>
          )}
        </Animated.View>
      )}
      </SafeAreaView>
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: theme.background,
  },
  /* ── Chapter Header ── */
  chapterHeader: {
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(251,191,36,0.1)',
  },
  chapterHeaderInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  chapterLabel: {
    color: theme.goldText,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  chapterName: {
    color: theme.textWarm,
    fontSize: 23,
    fontWeight: '700',
    fontFamily: Fonts.serif,
    marginTop: 2,
    textAlign: 'center',
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 16,
  },
  playBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(251,191,36,0.2)',
    borderWidth: 1.8,
    borderColor: 'rgba(251,191,36,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderWidth: 1.8,
    borderColor: 'rgba(251,191,36,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Loading / Empty ── */
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    color: theme.goldText,
    fontSize: 16,
    fontFamily: Fonts.serif,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyText: {
    color: theme.goldSubtle,
    fontSize: 16,
    textAlign: 'center',
    fontFamily: Fonts.serif,
  },
  emptySubtext: {
    color: theme.goldSubtle,
    fontSize: 13,
    textAlign: 'center',
  },

  /* ── Reading Area ── */
  readScroll: {
    flex: 1,
  },
  readScrollContent: {
    paddingHorizontal: 4,
    paddingTop: 24,
  },
  scriptCard: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 28,
  },

  /* ── Chapter 1 Intro ("Context") Button ── */
  introBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(251,191,36,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.25)',
    borderRadius: 18,
    padding: 16,
  },
  introIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  introTextWrap: {
    flex: 1,
    gap: 3,
  },
  introLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  introLabel: {
    color: theme.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  introTitle: {
    color: theme.textWarm,
    fontSize: 17,
    fontWeight: '700',
    fontFamily: Fonts.serif,
  },
  introSubtitle: {
    color: theme.subtext,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: Fonts.serif,
  },

  /* ── Script Format ── */
  speakerBlock: {
    gap: 8,
  },
  speakerName: {
    color: theme.primary,
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Fonts.serif,
    letterSpacing: 0.3,
  },
  dialogueBlock: {
    gap: 16,
  },
  verseWithContext: {
    gap: 10,
  },
  verseText: {
    color: theme.textWarm,
    fontSize: 26,
    lineHeight: 42,
    fontFamily: Fonts.serif,
    fontStyle: 'italic',
  },
  verseTextSelected: {
    textDecorationLine: 'underline',
    textDecorationColor: '#fbbf24',
    textDecorationStyle: 'dotted',
  },

  /* ── Bookmark Indicator ── */
  bookmarkedVerse: {
    backgroundColor: 'rgba(251,191,36,0.07)',
    borderLeftWidth: 3,
    borderLeftColor: GitaColors.gold,
    borderRadius: 12,
    paddingLeft: 14,
    paddingVertical: 10,
    paddingRight: 8,
  },
  bookmarkIndicator: {
    position: 'absolute',
    top: 8,
    right: 10,
    zIndex: 1,
  },

  /* ── Context Box ── */
  verseTextReading: {
    color: GitaColors.gold,
    backgroundColor: 'rgba(251,191,36,0.1)',
  },
  contextBoxInside: {
    backgroundColor: 'rgba(251,191,36,0.06)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.12)',
    borderStyle: 'dashed',
    marginTop: 4,
    marginBottom: 4,
  },
  contextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  contextLabel: {
    color: theme.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  contextText: {
    color: theme.subtext,
    fontSize: 18,
    lineHeight: 28,
    fontFamily: Fonts.serif,
    fontStyle: 'italic',
  },

  /* ── Bottom Popup ── */
  popup: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.popup,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(251,191,36,0.15)',
    paddingBottom: 40,
    paddingHorizontal: 8,
    minHeight: 280,
    boxShadow: '0px -8px 16px rgba(0, 0, 0, 0.4)',
    elevation: 20,
  },
  popupHeader: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  popupHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.border,
  },
  popupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  popupVerseRef: {
    color: theme.primary,
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Fonts.serif,
  },

  /* ── Popup Actions ── */
  popupActions: {
    paddingVertical: 12,
    gap: 16,
  },
  popupActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  popupActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: (SCREEN_WIDTH - 60) / 3,
  },
  popupActionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.popup,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  popupActionBtnActive: {
    backgroundColor: 'rgba(251,191,36,0.08)',
    borderRadius: 16,
  },
  popupActionLabel: {
    color: theme.subtext,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  popupActionLabelActive: {
    color: '#ef4444',
  },

  /* ── Insight Pane ── */
  insightPane: {
    paddingVertical: 4,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  backBtnText: {
    color: theme.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  insightContent: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  insightTitle: {
    color: theme.textWarm,
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Fonts.serif,
  },
  insightPlaceholder: {
    color: theme.subtextMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },

  /* ── Note Modal ── */
  noteModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  noteModalCard: {
    backgroundColor: theme.popup,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(251,191,36,0.15)',
    padding: 24,
    paddingBottom: 40,
  },
  noteModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notePane: {
    paddingVertical: 4,
  },
  noteTitle: {
    color: theme.textWarm,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.serif,
    marginBottom: 12,
  },
  noteInput: {
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.15)',
    borderRadius: 14,
    padding: 16,
    color: theme.textWarm,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: Fonts.serif,
  },
  noteSaveBtn: {
    backgroundColor: 'rgba(251,191,36,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.4)',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  noteSaveBtnDisabled: {
    opacity: 0.4,
  },
  noteSaveBtnText: {
    color: theme.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});
