import { GitaColors } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { displayMeaning, type PrayerVerse } from '@/lib/prayerVerses';
import type { Theme } from '@/theme/colors';
import { BookmarkCheck, BookmarkPlus, X } from 'lucide-react-native';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  visible: boolean;
  prayerTitle: string;
  verse: PrayerVerse | null;
  isSaved: boolean;
  saving?: boolean;
  onToggleSave: () => void;
  onClose: () => void;
};

/**
 * Minimal bottom-sheet popup shown when a prayer line is long-pressed.
 * Shows only the line's meaning plus a Save/Saved toggle and a close button.
 */
export default function PrayerVerseSheet({
  visible,
  verse,
  isSaved,
  saving = false,
  onToggleSave,
  onClose,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasMeaning = !!verse?.meaning && verse.meaning.trim().length > 0;

  return (
    <Modal
      visible={visible && !!verse}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />

          <View style={styles.topRow}>
            <Text style={styles.eyebrow}>MEANING</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
              style={styles.closeBtn}
            >
              <X size={20} color={theme.subtext} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={[styles.meaning, !hasMeaning && styles.meaningMuted]}>
              {verse ? displayMeaning(verse) : ''}
            </Text>
          </ScrollView>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onToggleSave}
            disabled={saving}
            style={[styles.saveBtn, isSaved && styles.saveBtnSaved]}
          >
            {saving ? (
              <ActivityIndicator size="small" color={isSaved ? theme.text : '#0F172A'} />
            ) : isSaved ? (
              <>
                <BookmarkCheck size={19} color={GitaColors.gold} strokeWidth={2.2} />
                <Text style={styles.saveBtnSavedText}>Saved</Text>
              </>
            ) : (
              <>
                <BookmarkPlus size={19} color="#0F172A" strokeWidth={2.2} />
                <Text style={styles.saveBtnText}>Save Verse</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdrop: { ...StyleSheet.absoluteFillObject },
    sheet: {
      backgroundColor: theme.background,
      borderTopLeftRadius: 26,
      borderTopRightRadius: 26,
      paddingHorizontal: 22,
      paddingTop: 10,
      borderWidth: 1,
      borderColor: theme.border,
      borderBottomWidth: 0,
    },
    handle: {
      alignSelf: 'center',
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.subtextMuted,
      opacity: 0.5,
      marginBottom: 14,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    eyebrow: {
      color: theme.subtextMuted,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.6,
    },
    closeBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scroll: { maxHeight: 280 },
    scrollContent: { paddingBottom: 4 },
    meaning: {
      color: theme.text,
      fontSize: 18,
      lineHeight: 28,
      fontWeight: '500',
    },
    meaningMuted: {
      color: theme.subtextMuted,
      fontStyle: 'italic',
      fontWeight: '400',
    },
    saveBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      marginTop: 22,
      height: 54,
      borderRadius: 16,
      backgroundColor: GitaColors.gold,
    },
    saveBtnSaved: {
      backgroundColor: 'rgba(251,191,36,0.12)',
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.5)',
    },
    saveBtnText: {
      color: '#0F172A',
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    saveBtnSavedText: {
      color: GitaColors.gold,
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
  });
