import BackgroundLayout from '@/components/BackgroundLayout';
import LotusLoader from '@/components/ui/LotusLoader';
import { Fonts, GitaColors } from '@/constants/theme';
import * as Clipboard from 'expo-clipboard';
import { fetchChapter, fetchVersesByChapter, type GitaChapter, type GitaVerse } from '@/lib/verses';
import { saveNote } from '@/lib/notes';
import { FAVORITES_UPDATED_EVENT, toggleFavoriteVerse, fetchUserFavorites } from '@/lib/favorites';
import { fetchCurrentUserAndProfile, incrementSharesCount, updateBookmark } from '@/lib/profile';
import { useFocusEffect } from '@react-navigation/native';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Heart,
  Lightbulb,
  Play,
  Share2,
  StickyNote,
  X,
} from 'lucide-react-native';
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type PopupTab = 'actions' | 'insight' | 'note';

export default function ReadScreen() {
  const [chapter, setChapter] = useState<GitaChapter | null>(null);
  const [verses, setVerses] = useState<GitaVerse[]>([]);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVerse, setSelectedVerse] = useState<GitaVerse | null>(null);
  const [popupTab, setPopupTab] = useState<PopupTab>('actions');
  const [noteText, setNoteText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [favoriteVerseIds, setFavoriteVerseIds] = useState<string[]>([]);

  const [userBookmark, setUserBookmark] = useState<{ chapter: number; verse: number } | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [hasScrolledToBookmark, setHasScrolledToBookmark] = useState(false);
  const verseRefs = useRef<Record<number, View | null>>({});
  const verseOffsets = useRef<Record<number, number>>({});
  const popupAnim = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView>(null);
  const contentRef = useRef<View>(null);

  // Load user
  useEffect(() => {
    (async () => {
      const { user, profile } = await fetchCurrentUserAndProfile();
      if (user) {
        setUser({ id: user.id });
        const favs = await fetchUserFavorites(user.id);
        setFavoriteVerseIds(favs);
        
        if (profile?.bookmark_chapter && profile?.bookmark_verse) {
          const bookmark = { chapter: profile.bookmark_chapter, verse: profile.bookmark_verse };
          setUserBookmark(bookmark);
          if (currentChapter !== bookmark.chapter) {
            setCurrentChapter(bookmark.chapter);
          }
        }
      }
    })();
  }, []);

  // Listen for favorites changes
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      FAVORITES_UPDATED_EVENT,
      (data: { verseId: string; liked: boolean }) => {
        setFavoriteVerseIds(prev => {
          if (data.liked) return prev.includes(data.verseId) ? prev : [...prev, data.verseId];
          return prev.filter(id => id !== data.verseId);
        });
      }
    );
    return () => sub.remove();
  }, []);

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
  }, []);

  useEffect(() => {
    loadChapter(currentChapter);
  }, [currentChapter, loadChapter]);

  // On tab focus: navigate to bookmark if we haven't already in this focus session
  useFocusEffect(
    useCallback(() => {
      // Reset scroll state on focus so it can re-trigger if bookmark is seen
      setHasScrolledToBookmark(false);
      
      if (userBookmark) {
        // Just update currentChapter; the main useEffect will handle loading
        setCurrentChapter(userBookmark.chapter);
      }
      
      // We don't call loadChapter here anymore to prevent double-loading
      // or loading with stale closure values.
    }, [userBookmark])
  );

  // Scroll to bookmarked verse after content loads
  useEffect(() => {
    // ONLY proceed if we have a bookmark and haven't scrolled yet
    if (isLoading || verses.length === 0 || hasScrolledToBookmark) return;

    const isCurrentChapterBookmarked = userBookmark && userBookmark.chapter === currentChapter;

    if (isCurrentChapterBookmarked) {
      const timer = setTimeout(() => {
        const verseView = verseRefs.current[userBookmark.verse];
        const contentNode = contentRef.current;
        
        if (verseView && contentNode) {
          // measureLayout relative to our own content container is the ONLY stable way
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
    // REMOVED: else scroll to top. Tab switching should NOT reset your position.
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
      showPopup();
    },
    [selectedVerse, showPopup, hidePopup, userBookmark]
  );

  // Actions
  const handleSave = useCallback(async () => {
    if (!selectedVerse || !user?.id) return;
    const isCurrentlyFav = favoriteVerseIds.includes(selectedVerse.id);
    await toggleFavoriteVerse(user.id, selectedVerse.id, isCurrentlyFav);
  }, [selectedVerse, user, favoriteVerseIds]);

  const handleCopy = useCallback(async () => {
    if (!selectedVerse) return;
    const text = `"${selectedVerse.english}"\n— Bhagavad Gita ${selectedVerse.chapter_number}.${selectedVerse.verse_number}${selectedVerse.speaker ? ` (${selectedVerse.speaker})` : ''}`;
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'Verse copied to clipboard');
  }, [selectedVerse]);

  const handleShare = useCallback(async () => {
    if (!selectedVerse) return;
    const text = `"${selectedVerse.english}"\n\n— Bhagavad Gita, Chapter ${selectedVerse.chapter_number}, Verse ${selectedVerse.verse_number}${selectedVerse.speaker ? ` (${selectedVerse.speaker})` : ''}\n\nShared via Gita Daily`;
    try {
      await Share.share({ title: 'Gita Daily', message: text });
      if (user?.id) {
        await incrementSharesCount(user.id);
      }
    } catch {}
  }, [selectedVerse, user]);

  const handleSaveNote = useCallback(async () => {
    if (!selectedVerse || !user?.id || !noteText.trim()) return;
    setIsSaving(true);
    const success = await saveNote(user.id, selectedVerse.id, noteText);
    setIsSaving(false);
    if (success) {
      DeviceEventEmitter.emit('gitaDaily.notesUpdated.v1');
      Alert.alert('Saved', 'Your note has been saved.');
      setPopupTab('actions');
      setNoteText('');
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

  const goToChapter = (delta: number) => {
    const next = currentChapter + delta;
    if (next >= 1 && next <= 18) {
      setHasScrolledToBookmark(false);
      setCurrentChapter(next);
    }
  };

  const getContextForVerse = (ch: number, v: number): string | null => {
    // Only keeping Chapter 1 hardcoded for now; Chapter 2 is now database-driven
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
    <BackgroundLayout>
      {/* Chapter Header */}
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

        {/* Static Play Button */}
        <View style={styles.playBtnWrap}>
          <Pressable style={styles.playBtn}>
            <Play size={20} color="white" fill="white" />
          </Pressable>
        </View>
      </View>

      {/* Reading Area */}
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
          contentContainerStyle={styles.readScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.scriptCard} ref={contentRef}>
            {groupedVerses.map((group, groupIdx) => {
              return (
                <View key={groupIdx} style={styles.speakerBlock}>
                    <Text style={styles.speakerName}>{group.speaker}:</Text>
                    <View style={styles.dialogueBlock}>
                      {group.verses.map((verse) => {
                        const isSelected = selectedVerse?.id === verse.id;
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
                                ]}
                              >
                                &quot;{verse.english}&quot;
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

          {/* Bottom padding to not overlap with popup */}
          <View style={{ height: selectedVerse ? 280 : 40 }} />
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
              <X size={20} color="rgba(255,255,255,0.5)" />
            </Pressable>
          </View>

          {/* Tab content */}
          {popupTab === 'actions' && (
            <View style={styles.popupActions}>
              <Pressable
                style={[styles.popupActionBtn]}
                onPress={handleSave}
              >
                <Heart 
                  size={22} 
                  color={isVerseSaved ? '#ef4444' : 'rgba(255,255,255,0.7)'} 
                  fill={isVerseSaved ? '#ef4444' : 'transparent'}
                />
                <Text style={[styles.popupActionLabel, isVerseSaved && styles.popupActionLabelActive]}>
                  {isVerseSaved ? 'Saved' : 'Save'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.popupActionBtn}
                onPress={() => setPopupTab('note')}
              >
                <StickyNote size={22} color="rgba(255,255,255,0.7)" />
                <Text style={styles.popupActionLabel}>Note</Text>
              </Pressable>

              <Pressable style={styles.popupActionBtn} onPress={handleCopy}>
                <Copy size={22} color="rgba(255,255,255,0.7)" />
                <Text style={styles.popupActionLabel}>Copy</Text>
              </Pressable>

              <Pressable
                style={styles.popupActionBtn}
                onPress={handleShare}
              >
                <Share2 size={22} color="rgba(255,255,255,0.7)" />
                <Text style={styles.popupActionLabel}>Share</Text>
              </Pressable>

              <Pressable
                style={styles.popupActionBtn}
                onPress={isBookmarked ? handleRemoveBookmark : handleBookmark}
              >
                <Bookmark 
                  size={22} 
                  color={isBookmarked ? GitaColors.gold : 'rgba(255,255,255,0.7)'} 
                  fill={isBookmarked ? GitaColors.gold : 'transparent'}
                />
                <Text style={[styles.popupActionLabel, isBookmarked && { color: GitaColors.gold }]}>
                  {isBookmarked ? 'Remove' : 'Mark'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.popupActionBtn}
                onPress={() => setPopupTab('insight')}
              >
                <Lightbulb size={22} color="rgba(255,255,255,0.7)" />
                <Text style={styles.popupActionLabel}>Insight</Text>
              </Pressable>
            </View>
          )}

          {popupTab === 'insight' && (
            <View style={styles.insightPane}>
              <Pressable style={styles.backBtn} onPress={() => setPopupTab('actions')}>
                <ChevronLeft size={18} color={GitaColors.gold} />
                <Text style={styles.backBtnText}>Back</Text>
              </Pressable>
              <View style={styles.insightContent}>
                <Lightbulb size={28} color="rgba(251,191,36,0.4)" />
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
                    placeholderTextColor="rgba(251,191,36,0.3)"
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
    </BackgroundLayout>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  chapterLabel: {
    color: 'rgba(251,191,36,0.6)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  chapterName: {
    color: '#fef3c7',
    fontSize: 23,
    fontWeight: '700',
    fontFamily: Fonts.serif,
    marginTop: 2,
    textAlign: 'center',
  },
  playBtnWrap: {
    alignItems: 'center',
    marginTop: 10,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(251,191,36,0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(251,191,36,0.4)',
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
    color: 'rgba(251,191,36,0.6)',
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
    color: 'rgba(251,191,36,0.5)',
    fontSize: 16,
    textAlign: 'center',
    fontFamily: Fonts.serif,
  },
  emptySubtext: {
    color: 'rgba(251,191,36,0.3)',
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
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 28,
  },

  /* ── Script Format ── */
  speakerBlock: {
    gap: 8,
  },
  speakerName: {
    color: '#fbbf24',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: Fonts.serif,
    letterSpacing: 0.3,
  },
  dialogueBlock: {
    gap: 16,
  },
  verseText: {
    color: '#fef3c7',
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
  verseWithContext: {
    gap: 12,
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
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  contextText: {
    color: 'rgba(254,243,199,0.7)',
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
    backgroundColor: 'rgba(15,23,42,0.97)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(251,191,36,0.15)',
    paddingBottom: 36,
    paddingHorizontal: 20,
    minHeight: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
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
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  popupHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  popupVerseRef: {
    color: '#fbbf24',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: Fonts.serif,
  },

  /* ── Popup Actions ── */
  popupActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
  },
  popupActionBtn: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    minWidth: 58,
  },
  popupActionBtnActive: {
    backgroundColor: 'rgba(251,191,36,0.1)',
  },
  popupActionLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
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
    color: GitaColors.gold,
    fontSize: 14,
    fontWeight: '600',
  },
  insightContent: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  insightTitle: {
    color: '#fef3c7',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: Fonts.serif,
  },
  insightPlaceholder: {
    color: 'rgba(255,255,255,0.4)',
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
    backgroundColor: 'rgba(15,23,42,0.98)',
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
    color: '#fef3c7',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.serif,
    marginBottom: 12,
  },
  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.15)',
    borderRadius: 14,
    padding: 16,
    color: '#fef3c7',
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
    color: '#fbbf24',
    fontSize: 15,
    fontWeight: '700',
  },
});
