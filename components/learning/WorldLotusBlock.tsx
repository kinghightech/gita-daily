import { Fonts, GitaColors } from '@/constants/theme';
import { getWorldLotusImageUrl } from '@/lib/storageAssets';
import {
  fillBlankIsCorrect,
  shuffle,
  type AudioReciteBlock,
  type BuildSentenceBlock,
  type ComparisonTableBlock,
  type ConceptMapBlock,
  type DialogueBlock,
  type DragToOrderBlock,
  type EmojiPollBlock,
  type FactCardBlock,
  type FillBlankBlock,
  type InteractiveDiagramBlock,
  type MatchingCardsBlock,
  type MiniStoryBlock,
  type MiniStoryDosDontsBlock,
  type MultipleChoiceBlock,
  type OddOneOutBlock,
  type ParagraphBlock,
  type QuoteCardBlock,
  type ScenarioChoiceBlock,
  type StepListBlock,
  type StoryPanelsBlock,
  type TapCorrectImageBlock,
  type TapRevealBlock,
  type TimelineBlock,
  type TrueFalseSwipeBlock,
  type WordSortBlock,
  type WorldLotusBlock,
} from '@/lib/worldLotus';
import type { Theme } from '@/theme/colors';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  ChevronRight,
  X,
  XCircle,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// ── Renderer props ───────────────────────────────────────────────────────────

export type WorldLotusBlockProps = {
  block: WorldLotusBlock;
  revealed: boolean;
  substep: number; // for multi-step reveal blocks (e.g. dialogue). Default 0.
  onAnswerChange?: (correct: boolean | null) => void;
  onInputFocus?: () => void; // called when a text input gains focus (e.g. fill_blank)
  theme: Theme;
};

export default function WorldLotusBlockView(props: WorldLotusBlockProps) {
  const { block } = props;
  switch (block.type) {
    case 'paragraph':
      return <ParagraphView {...props} block={block} />;
    case 'fact_card':
      return <FactCardView {...props} block={block} />;
    case 'mini_story':
      return <MiniStoryView {...props} block={block} />;
    case 'mini_story_dos_donts':
      return <MiniStoryDosDontsView {...props} block={block} />;
    case 'timeline':
      return <TimelineView {...props} block={block} />;
    case 'dialogue':
      return <DialogueView {...props} block={block} />;
    case 'concept_map':
      return <ConceptMapView {...props} block={block} />;
    case 'tap_reveal':
      return <TapRevealView {...props} block={block} />;
    case 'audio_recite':
      return <AudioReciteView {...props} block={block} />;
    case 'story_panels':
      return <StoryPanelsView {...props} block={block} />;
    case 'interactive_diagram':
      return <InteractiveDiagramView {...props} block={block} />;
    case 'multiple_choice':
      return <MultipleChoiceView {...props} block={block} />;
    case 'true_false_swipe':
      return <TrueFalseView {...props} block={block} />;
    case 'odd_one_out':
      return <OddOneOutView {...props} block={block} />;
    case 'fill_blank':
      return <FillBlankView {...props} block={block} />;
    case 'build_sentence':
      return <BuildSentenceView {...props} block={block} />;
    case 'drag_to_order':
      return <DragToOrderView {...props} block={block} />;
    case 'matching_cards':
      return <MatchingCardsView {...props} block={block} />;
    case 'word_sort':
      return <WordSortView {...props} block={block} />;
    case 'tap_correct_image':
      return <TapCorrectImageView {...props} block={block} />;
    case 'quote_card':
      return <QuoteCardView {...props} block={block} />;
    case 'comparison_table':
      return <ComparisonTableView {...props} block={block} />;
    case 'step_list':
      return <StepListView {...props} block={block} />;
    case 'emoji_poll':
      return <EmojiPollView {...props} block={block} />;
    case 'scenario_choice':
      return <ScenarioChoiceView {...props} block={block} />;
    default:
      return <UnsupportedView blockType={(block as { type: string }).type} />;
  }
}

// ── Rich-text helper (handles \n\n paragraph breaks + **bold** spans) ────────

function RichBody({ text, theme }: { text: string; theme: Theme }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const normalized = text.replace(/\\n/g, '\n');
  const paragraphs = normalized.split('\n').filter((p) => p.trim().length > 0);
  return (
    <View>
      {paragraphs.map((para, pIdx) => {
        const parts = para.split(/(\*\*[^*]+\*\*)/g);
        return (
          <Text key={pIdx} style={styles.bodyText}>
            {parts.map((part, i) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <Text key={i} style={styles.bodyBold}>
                  {part.slice(2, -2)}
                </Text>
              ) : (
                part
              ),
            )}
          </Text>
        );
      })}
    </View>
  );
}

// ── Reading blocks ───────────────────────────────────────────────────────────

function ParagraphView({ block, theme }: WorldLotusBlockProps & { block: ParagraphBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.paragraphContainer}>
      <View style={styles.paragraphAccent} />
      <View style={styles.paragraphContent}>
        <RichBody text={block.content.text} theme={theme} />
      </View>
    </View>
  );
}

function FactCardView({ block, theme }: WorldLotusBlockProps & { block: FactCardBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.factCard}>
      <Text style={styles.factCardLabel}>DID YOU KNOW</Text>
      <Text style={styles.factCardText}>{block.content.text}</Text>
    </View>
  );
}

function MiniStoryView({ block, theme }: WorldLotusBlockProps & { block: MiniStoryBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.storyCard}>
      <Text style={styles.storyCardLabel}>A SHORT STORY</Text>
      <Text style={styles.storyCardTitle}>{block.content.title}</Text>
      <View style={{ marginTop: 6 }}>
        <RichBody text={block.content.story} theme={theme} />
      </View>
    </View>
  );
}

function MiniStoryDosDontsView({
  block,
  theme,
}: WorldLotusBlockProps & { block: MiniStoryDosDontsBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={{ gap: 16 }}>
      <View style={[styles.dosDontsCard, styles.doCard]}>
        <View style={styles.dosDontsHeader}>
          <Check size={18} color="#22C55E" />
          <Text style={[styles.dosDontsTitle, { color: '#22C55E' }]}>{block.content.do.title}</Text>
        </View>
        <Text style={styles.dosDontsBody}>{block.content.do.story}</Text>
      </View>
      <View style={[styles.dosDontsCard, styles.dontCard]}>
        <View style={styles.dosDontsHeader}>
          <X size={18} color="#EF4444" />
          <Text style={[styles.dosDontsTitle, { color: '#EF4444' }]}>{block.content.dont.title}</Text>
        </View>
        <Text style={styles.dosDontsBody}>{block.content.dont.story}</Text>
      </View>
    </View>
  );
}

function TimelineView({ block, theme }: WorldLotusBlockProps & { block: TimelineBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View>
      <Text style={styles.sectionHint}>Scroll through Hinduism&apos;s key milestones</Text>
      <View style={styles.timelineWrap}>
        {block.content.events.map((event, idx) => (
          <View key={idx} style={styles.timelineRow}>
            <View style={styles.timelineDotWrap}>
              <View style={styles.timelineDot} />
              {idx < block.content.events.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineDate}>{event.date}</Text>
              <Text style={styles.timelineTitle}>{event.title}</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function DialogueView({
  block,
  substep,
  theme,
}: WorldLotusBlockProps & { block: DialogueBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const exchanges = block.content.exchanges;
  // substep = 0 → show 0 pairs; substep N → show N pairs (each pair = next user msg + next acharya msg)
  const visibleCount = Math.min(substep * 2, exchanges.length);
  const visible = exchanges.slice(0, visibleCount);

  return (
    <View>
      {/* Acharya intro header */}
      <View style={styles.dialogueAcharyaHeader}>
        <View style={styles.dialogueAvatar}>
          <Text style={styles.dialogueAvatarEmoji}>🧘</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.dialogueAcharyaName}>Acharya</Text>
          <Text style={styles.dialogueAcharyaSub}>Your teacher on this path</Text>
        </View>
      </View>

      {/* Hint when chat hasn't started */}
      {visible.length === 0 && (
        <View style={styles.dialogueHint}>
          <Text style={styles.dialogueHintText}>Tap Continue to start the conversation</Text>
        </View>
      )}

      {/* Messages */}
      <View style={{ gap: 10, marginTop: 18 }}>
        {visible.map((ex, idx) => {
          const isUser = ex.speaker === 'user';
          if (isUser) {
            return (
              <View key={idx} style={styles.dialogueRowUser}>
                <View style={[styles.dialogueBubble, styles.dialogueBubbleUser]}>
                  <Text style={styles.dialogueText}>{ex.text}</Text>
                </View>
              </View>
            );
          }
          return (
            <View key={idx} style={styles.dialogueRowAcharya}>
              <View style={styles.dialogueAvatarSmall}>
                <Text style={styles.dialogueAvatarEmojiSmall}>🧘</Text>
              </View>
              <View style={[styles.dialogueBubble, styles.dialogueBubbleAcharya]}>
                <Text style={styles.dialogueText}>{ex.text}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ConceptMapView({ block, theme }: WorldLotusBlockProps & { block: ConceptMapBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View>
      <Text style={styles.conceptHeading}>Examples of</Text>
      <View style={styles.conceptCenter}>
        <Text style={styles.conceptCenterText}>{block.content.center}</Text>
      </View>
      <Text style={styles.conceptSubHeading}>in daily life:</Text>
      <View style={styles.conceptBranches}>
        {block.content.branches.map((branch, idx) => (
          <View key={idx} style={styles.conceptChip}>
            <Text style={styles.conceptChipText}>{branch}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function TapRevealView({ block, theme }: WorldLotusBlockProps & { block: TapRevealBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [flipped, setFlipped] = useState<boolean[]>(() => block.content.cards.map(() => false));
  return (
    <View>
      <Text style={styles.sectionHint}>{block.content.prompt}</Text>
      <View style={{ gap: 12 }}>
        {block.content.cards.map((card, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.85}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFlipped((curr) => {
                const next = [...curr];
                next[idx] = !next[idx];
                return next;
              });
            }}
            style={[styles.tapRevealCard, flipped[idx] && styles.tapRevealCardFlipped]}
          >
            <Text style={[styles.tapRevealFront, flipped[idx] && styles.tapRevealMuted]}>
              {card.front}
            </Text>
            {flipped[idx] ? (
              <Text style={styles.tapRevealBack}>{card.back}</Text>
            ) : (
              <Text style={styles.tapRevealHint}>TAP TO REVEAL</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function AudioReciteView({ block, theme }: WorldLotusBlockProps & { block: AudioReciteBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { text, translation, source, long_form, syllables, words } = block.content;
  const [shownWordIdx, setShownWordIdx] = useState<number | null>(null);

  return (
    <View>
      {/* The Sanskrit / sacred phrase card */}
      <View style={styles.reciteCard}>
        <Text style={styles.reciteSanskrit}>{text}</Text>
        {long_form && <Text style={styles.reciteLongForm}>{long_form}</Text>}
        {translation && (
          <Text style={styles.reciteTranslation}>&ldquo;{translation}&rdquo;</Text>
        )}
        {source && <Text style={styles.reciteSource}>— {source}</Text>}
      </View>

      {/* Syllables variant: simple chip row, no meaning popup needed */}
      {syllables && syllables.length > 0 && (
        <View style={{ marginTop: 22 }}>
          <Text style={styles.sectionHint}>Pronounced in three parts</Text>
          <View style={styles.syllableRow}>
            {syllables.map((s, idx) => (
              <View key={idx} style={styles.syllableChip}>
                <Text style={styles.syllableText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Word-by-word variant: tap-for-meaning */}
      {words && words.length > 0 && (
        <View style={{ marginTop: 22 }}>
          <Text style={styles.sectionHint}>Tap each word to see its meaning</Text>
          <View style={styles.reciteWordRow}>
            {words.map((w, idx) => (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShownWordIdx(idx);
                }}
                style={[styles.reciteWordChip, shownWordIdx === idx && styles.reciteWordChipActive]}
              >
                <Text
                  style={[
                    styles.reciteWordText,
                    shownWordIdx === idx && styles.reciteWordTextActive,
                  ]}
                >
                  {w.word}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {shownWordIdx !== null && (
            <View style={styles.reciteMeaningBox}>
              <Text style={styles.reciteMeaningWord}>{words[shownWordIdx].word}</Text>
              <Text style={styles.reciteMeaningText}>{words[shownWordIdx].meaning}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ── Image blocks ─────────────────────────────────────────────────────────────

function StoryPanelsView({ block, theme }: WorldLotusBlockProps & { block: StoryPanelsBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const total = block.content.panels.length;
  return (
    <View style={{ gap: 20 }}>
      {block.content.title && (
        <View style={styles.storyTitleBlock}>
          <Text style={styles.storyTitleLabel}>STORY</Text>
          <Text style={styles.storyTitleText}>{block.content.title}</Text>
        </View>
      )}
      {block.content.panels.map((panel, idx) => {
        const url = getWorldLotusImageUrl(panel.image_filename);
        return (
          <View key={idx} style={styles.storyPanel}>
            {url && (
              <Image
                source={url}
                style={styles.storyPanelImage}
                contentFit="cover"
                transition={180}
              />
            )}
            <View style={styles.storyPanelTextBlock}>
              <Text style={styles.storyPanelNumber}>
                {idx + 1} of {total}
              </Text>
              <Text style={styles.storyPanelCaption}>{panel.caption}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function InteractiveDiagramView({
  block,
  theme,
}: WorldLotusBlockProps & { block: InteractiveDiagramBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const url = getWorldLotusImageUrl(block.content.image_filename);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <View>
      {url && (
        <View style={styles.diagramImageWrap}>
          <Image source={url} style={styles.diagramImage} contentFit="cover" transition={180} />
        </View>
      )}
      <Text style={[styles.sectionHint, { marginTop: url ? 14 : 0 }]}>
        Tap each part to learn more
      </Text>
      <View style={{ gap: 10 }}>
        {block.content.hotspots.map((h, idx) => {
          const open = openIdx === idx;
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={0.85}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setOpenIdx(open ? null : idx);
              }}
              style={[styles.hotspotCard, open && styles.hotspotCardOpen]}
            >
              <View style={styles.hotspotHeader}>
                <View style={styles.hotspotDot} />
                <Text style={styles.hotspotLabel}>{h.label}</Text>
                <ChevronRight
                  size={18}
                  color={theme.subtext}
                  style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}
                />
              </View>
              {open && <Text style={styles.hotspotBody}>{h.explanation}</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── Question blocks ──────────────────────────────────────────────────────────

function useReportAnswer(
  onAnswerChange: ((c: boolean | null) => void) | undefined,
  correct: boolean | null,
) {
  useEffect(() => {
    onAnswerChange?.(correct);
  }, [onAnswerChange, correct]);
}

function MultipleChoiceView({
  block,
  revealed,
  onAnswerChange,
  theme,
}: WorldLotusBlockProps & { block: MultipleChoiceBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [selected, setSelected] = useState<number | null>(null);
  useReportAnswer(
    onAnswerChange,
    selected === null ? null : selected === block.content.correct_index,
  );

  return (
    <View>
      <Text style={styles.questionText}>{block.content.question}</Text>
      <View style={{ gap: 12 }}>
        {block.content.options.map((opt, idx) => {
          const isCorrect = idx === block.content.correct_index;
          const isSelected = selected === idx;
          let borderColor = theme.border;
          let bgColor = theme.surface;
          if (revealed) {
            if (isCorrect) {
              borderColor = '#22C55E';
              bgColor = 'rgba(34,197,94,0.10)';
            } else if (isSelected) {
              borderColor = '#EF4444';
              bgColor = 'rgba(239,68,68,0.10)';
            }
          } else if (isSelected) {
            borderColor = GitaColors.gold;
            bgColor = 'rgba(251,191,36,0.08)';
          }
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={revealed ? 1 : 0.72}
              onPress={() => {
                if (revealed) return;
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelected(idx);
              }}
              style={[styles.optionCard, { borderColor, backgroundColor: bgColor }]}
            >
              <View
                style={[
                  styles.optionBadge,
                  !revealed && isSelected && styles.optionBadgeSelected,
                  revealed && isCorrect && styles.optionBadgeCorrect,
                  revealed && isSelected && !isCorrect && styles.optionBadgeWrong,
                ]}
              >
                <Text
                  style={[
                    styles.optionBadgeText,
                    !revealed && isSelected && styles.optionBadgeTextSelected,
                    revealed &&
                      (isCorrect || (isSelected && !isCorrect)) &&
                      styles.optionBadgeTextLight,
                  ]}
                >
                  {String.fromCharCode(65 + idx)}
                </Text>
              </View>
              <Text
                style={[
                  styles.optionText,
                  revealed && isCorrect && styles.optionTextCorrect,
                  revealed && isSelected && !isCorrect && styles.optionTextWrong,
                ]}
              >
                {opt}
              </Text>
              {revealed && isCorrect && <CheckCircle2 size={20} color="#22C55E" />}
              {revealed && isSelected && !isCorrect && <XCircle size={20} color="#EF4444" />}
            </TouchableOpacity>
          );
        })}
      </View>
      {revealed && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationText}>{block.content.explanation}</Text>
        </View>
      )}
    </View>
  );
}

function TrueFalseView({
  block,
  revealed,
  onAnswerChange,
  theme,
}: WorldLotusBlockProps & { block: TrueFalseSwipeBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [selected, setSelected] = useState<boolean | null>(null);
  useReportAnswer(
    onAnswerChange,
    selected === null ? null : selected === block.content.answer,
  );

  const renderBtn = (label: string, value: boolean) => {
    const isSelected = selected === value;
    const isCorrect = value === block.content.answer;
    let borderColor = theme.border;
    let bgColor = theme.surface;
    let textColor = theme.text;
    if (revealed) {
      if (isCorrect) {
        borderColor = '#22C55E';
        bgColor = 'rgba(34,197,94,0.10)';
        textColor = '#22C55E';
      } else if (isSelected) {
        borderColor = '#EF4444';
        bgColor = 'rgba(239,68,68,0.10)';
        textColor = '#EF4444';
      }
    } else if (isSelected) {
      borderColor = GitaColors.gold;
      bgColor = 'rgba(251,191,36,0.10)';
      textColor = GitaColors.gold;
    }
    return (
      <TouchableOpacity
        activeOpacity={revealed ? 1 : 0.75}
        onPress={() => {
          if (revealed) return;
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelected(value);
        }}
        style={[styles.tfBtn, { borderColor, backgroundColor: bgColor }]}
      >
        <Text style={[styles.tfBtnText, { color: textColor }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View>
      <Text style={styles.tfStatement}>{block.content.statement}</Text>
      <View style={styles.tfStack}>
        {renderBtn('True', true)}
        {renderBtn('False', false)}
      </View>
      {revealed && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationText}>{block.content.explanation}</Text>
        </View>
      )}
    </View>
  );
}

function OddOneOutView({
  block,
  revealed,
  onAnswerChange,
  substep,
  theme,
}: WorldLotusBlockProps & { block: OddOneOutBlock }) {
  return (
    <MultipleChoiceView
      block={{
        type: 'multiple_choice',
        order: block.order,
        content: block.content,
      }}
      revealed={revealed}
      onAnswerChange={onAnswerChange}
      substep={substep}
      theme={theme}
    />
  );
}

function FillBlankView({
  block,
  revealed,
  onAnswerChange,
  onInputFocus,
  theme,
}: WorldLotusBlockProps & { block: FillBlankBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [text, setText] = useState('');
  const trimmed = text.trim();
  const correct =
    trimmed.length === 0
      ? null
      : fillBlankIsCorrect(trimmed, block.content.answer, block.content.accept_variants);
  useReportAnswer(onAnswerChange, correct);

  const sentenceParts = block.content.sentence.split(/_+/);

  return (
    <View>
      <Text style={styles.questionText}>Fill in the blank</Text>
      <Text style={styles.fillSentence}>
        {sentenceParts.map((part, idx) => (
          <Text key={idx}>
            <Text style={styles.fillSentenceText}>{part}</Text>
            {idx < sentenceParts.length - 1 && (
              <Text style={styles.fillBlankSlot}> ______ </Text>
            )}
          </Text>
        ))}
      </Text>
      <TextInput
        editable={!revealed}
        value={text}
        onChangeText={setText}
        onFocus={() => onInputFocus?.()}
        placeholder="Type your answer"
        placeholderTextColor={theme.subtextMuted}
        style={[
          styles.fillInput,
          revealed && correct === true && styles.fillInputCorrect,
          revealed && correct === false && styles.fillInputWrong,
        ]}
        autoCorrect={false}
        autoCapitalize="none"
      />
      {revealed && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationLabel}>Answer</Text>
          <Text style={[styles.explanationText, { fontWeight: '700' }]}>{block.content.answer}</Text>
        </View>
      )}
    </View>
  );
}

function BuildSentenceView({
  block,
  revealed,
  onAnswerChange,
  theme,
}: WorldLotusBlockProps & { block: BuildSentenceBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const shuffledIdx = useMemo(
    () => shuffle(block.content.tiles.map((_, i) => i)),
    [block.content.tiles],
  );
  const [placed, setPlaced] = useState<number[]>([]); // indices into block.content.tiles

  const expectedOrder = block.content.correct_order;
  const allPlaced = placed.length === block.content.tiles.length;
  // Compare resulting TEXT, not indices. Duplicate tiles (e.g. two "in" tokens)
  // would otherwise mark a textually-correct answer wrong.
  const correctText = expectedOrder.map((i) => block.content.tiles[i]).join(' ');
  const userText = placed.map((i) => block.content.tiles[i]).join(' ');
  const correct = !allPlaced ? null : userText === correctText;
  useReportAnswer(onAnswerChange, correct);

  const place = (idx: number) => {
    if (revealed || placed.includes(idx)) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlaced((p) => [...p, idx]);
  };
  const unplace = (idx: number) => {
    if (revealed) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPlaced((p) => p.filter((x) => x !== idx));
  };

  return (
    <View>
      <Text style={styles.questionText}>{block.content.prompt}</Text>
      <View
        style={[
          styles.bsAnswer,
          revealed && correct === true && styles.bsAnswerCorrect,
          revealed && correct === false && styles.bsAnswerWrong,
        ]}
      >
        {placed.length === 0 ? (
          <Text style={styles.bsPlaceholder}>Tap tiles below to build your answer</Text>
        ) : (
          <View style={styles.bsTileRow}>
            {placed.map((idx, pos) => (
              <TouchableOpacity
                key={`p-${pos}`}
                activeOpacity={0.8}
                onPress={() => unplace(idx)}
                style={[styles.bsTile, styles.bsTilePlaced]}
              >
                <Text style={styles.bsTileText}>{block.content.tiles[idx]}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      <View style={styles.bsTileRow}>
        {shuffledIdx.map((idx) => {
          const used = placed.includes(idx);
          return (
            <TouchableOpacity
              key={`t-${idx}`}
              activeOpacity={used ? 1 : 0.8}
              onPress={() => place(idx)}
              style={[styles.bsTile, used && styles.bsTileUsed]}
              disabled={used || revealed}
            >
              <Text style={[styles.bsTileText, used && styles.bsTileTextUsed]}>
                {block.content.tiles[idx]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {revealed && correct === false && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationLabel}>Correct sentence</Text>
          <Text style={[styles.explanationText, { fontWeight: '700' }]}>
            {expectedOrder.map((i) => block.content.tiles[i]).join(' ')}
          </Text>
        </View>
      )}
    </View>
  );
}

function DragToOrderView({
  block,
  revealed,
  onAnswerChange,
  theme,
}: WorldLotusBlockProps & { block: DragToOrderBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const correctOrder = block.content.items;
  const [order, setOrder] = useState<string[]>(() => {
    let shuffled = shuffle(correctOrder);
    if (correctOrder.length > 1 && shuffled.every((v, i) => v === correctOrder[i])) {
      shuffled = shuffle(correctOrder);
    }
    return shuffled;
  });
  const hasInteractedRef = useRef(false);
  const correct = !hasInteractedRef.current ? null : order.every((v, i) => v === correctOrder[i]);
  useReportAnswer(onAnswerChange, correct);

  const move = (idx: number, dir: -1 | 1) => {
    if (revealed) return;
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    hasInteractedRef.current = true;
    setOrder((curr) => {
      const next = [...curr];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  return (
    <View>
      <Text style={styles.questionText}>{block.content.prompt}</Text>
      <View style={styles.dragDirLabelTop}>
        <Text style={styles.dragDirText}>OLDEST</Text>
        <ArrowUp size={14} color={GitaColors.gold} />
      </View>
      <View style={{ gap: 10 }}>
        {order.map((item, idx) => {
          const expected = correctOrder[idx];
          const isCorrectPos = item === expected;
          const colorOverride = revealed
            ? isCorrectPos
              ? { borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.10)' }
              : { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.10)' }
            : null;
          return (
            <View key={`${item}-${idx}`} style={[styles.dragRow, colorOverride]}>
              <View style={styles.dragOrderBadge}>
                <Text style={styles.dragOrderText}>{idx + 1}</Text>
              </View>
              <Text style={styles.dragItemText}>{item}</Text>
              <View style={styles.dragArrowGroup}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => move(idx, -1)}
                  disabled={idx === 0 || revealed}
                  style={[
                    styles.dragArrowBtn,
                    (idx === 0 || revealed) && styles.dragArrowBtnDisabled,
                  ]}
                >
                  <ArrowUp size={16} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => move(idx, 1)}
                  disabled={idx === order.length - 1 || revealed}
                  style={[
                    styles.dragArrowBtn,
                    (idx === order.length - 1 || revealed) && styles.dragArrowBtnDisabled,
                  ]}
                >
                  <ArrowDown size={16} color={theme.text} />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>
      <View style={styles.dragDirLabelBottom}>
        <Text style={styles.dragDirText}>NEWEST</Text>
        <ArrowDown size={14} color={GitaColors.gold} />
      </View>
      {revealed && correct === false && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationLabel}>Correct order</Text>
          {correctOrder.map((item, idx) => (
            <Text key={idx} style={[styles.explanationText, { fontWeight: '600' }]}>
              {idx + 1}. {item}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function MatchingCardsView({
  block,
  revealed,
  onAnswerChange,
  theme,
}: WorldLotusBlockProps & { block: MatchingCardsBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const pairs = block.content.pairs;
  const shuffledDefs = useMemo(() => shuffle(pairs.map((p) => p.definition)), [pairs]);

  const [matches, setMatches] = useState<(string | null)[]>(() => pairs.map(() => null));
  const [activeTermIdx, setActiveTermIdx] = useState<number | null>(null);

  const allMatched = matches.every((m) => m !== null);
  const correct = !allMatched
    ? null
    : pairs.every((p, idx) => matches[idx] === p.definition);
  useReportAnswer(onAnswerChange, correct);

  const tapTerm = (idx: number) => {
    if (revealed) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (matches[idx] !== null) {
      setMatches((m) => {
        const next = [...m];
        next[idx] = null;
        return next;
      });
      setActiveTermIdx(null);
      return;
    }
    setActiveTermIdx(idx === activeTermIdx ? null : idx);
  };

  const tapDef = (def: string) => {
    if (revealed || activeTermIdx === null) return;
    if (matches.includes(def)) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMatches((m) => {
      const next = [...m];
      next[activeTermIdx] = def;
      return next;
    });
    setActiveTermIdx(null);
  };

  return (
    <View>
      <Text style={styles.questionText}>{block.content.prompt}</Text>
      <Text style={styles.sectionHint}>
        Tap a term, then tap its meaning to pair them.
      </Text>
      <View style={styles.matchRow}>
        <View style={styles.matchCol}>
          {pairs.map((p, idx) => {
            const matched = matches[idx];
            const active = activeTermIdx === idx;
            const correctMatch = revealed && matched === p.definition;
            const wrongMatch = revealed && matched !== null && matched !== p.definition;
            return (
              <TouchableOpacity
                key={`term-${idx}`}
                activeOpacity={0.85}
                onPress={() => tapTerm(idx)}
                style={[
                  styles.matchCard,
                  active && styles.matchCardActive,
                  matched !== null && styles.matchCardMatched,
                  correctMatch && styles.matchCardCorrect,
                  wrongMatch && styles.matchCardWrong,
                ]}
              >
                <Text style={styles.matchCardText}>{p.term}</Text>
                {matched && <Text style={styles.matchCardSubText}>{matched}</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.matchCol}>
          {shuffledDefs.map((def) => {
            const used = matches.includes(def);
            return (
              <TouchableOpacity
                key={`def-${def}`}
                activeOpacity={used ? 1 : 0.85}
                onPress={() => tapDef(def)}
                disabled={used || revealed || activeTermIdx === null}
                style={[
                  styles.matchCard,
                  used && styles.matchCardUsed,
                  activeTermIdx === null && !used && styles.matchCardDisabled,
                ]}
              >
                <Text style={[styles.matchCardText, used && styles.matchCardTextMuted]}>{def}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      {revealed && correct === false && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationLabel}>Correct pairs</Text>
          {pairs.map((p, idx) => (
            <Text key={idx} style={[styles.explanationText, { fontWeight: '600' }]}>
              • {p.term} → {p.definition}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function WordSortView({
  block,
  revealed,
  onAnswerChange,
  theme,
}: WorldLotusBlockProps & { block: WordSortBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const allItems = block.content.items;
  const shuffledItems = useMemo(() => shuffle(allItems.map((i) => i.word)), [allItems]);

  const [assigned, setAssigned] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(shuffledItems.map((w) => [w, null])),
  );
  const [activeWord, setActiveWord] = useState<string | null>(null);

  const allAssigned = shuffledItems.every((w) => assigned[w] !== null);
  const correctMap = useMemo(() => {
    const m: Record<string, string> = {};
    allItems.forEach((i) => {
      m[i.word] = i.category;
    });
    return m;
  }, [allItems]);
  const correct = !allAssigned
    ? null
    : shuffledItems.every((w) => assigned[w] === correctMap[w]);
  useReportAnswer(onAnswerChange, correct);

  const tapWord = (w: string) => {
    if (revealed) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (assigned[w]) {
      setAssigned((curr) => ({ ...curr, [w]: null }));
      setActiveWord(null);
      return;
    }
    setActiveWord(activeWord === w ? null : w);
  };
  const tapCategory = (cat: string) => {
    if (revealed || !activeWord) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAssigned((curr) => ({ ...curr, [activeWord]: cat }));
    setActiveWord(null);
  };

  const unassignedWords = shuffledItems.filter((w) => assigned[w] === null);

  return (
    <View>
      <Text style={styles.questionText}>{block.content.prompt}</Text>
      <Text style={styles.sectionHint}>Tap a word, then tap a category.</Text>
      <View style={styles.wsWordRow}>
        {unassignedWords.length === 0 ? (
          <Text style={styles.wsAllSorted}>All sorted!</Text>
        ) : (
          unassignedWords.map((w) => (
            <TouchableOpacity
              key={w}
              activeOpacity={0.8}
              onPress={() => tapWord(w)}
              style={[styles.wsWord, activeWord === w && styles.wsWordActive]}
            >
              <Text style={[styles.wsWordText, activeWord === w && styles.wsWordTextActive]}>
                {w}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
      <View style={{ gap: 12 }}>
        {block.content.categories.map((cat) => {
          const inCat = shuffledItems.filter((w) => assigned[w] === cat);
          return (
            <TouchableOpacity
              key={cat}
              activeOpacity={0.9}
              onPress={() => tapCategory(cat)}
              disabled={!activeWord || revealed}
              style={[styles.wsBucket, !!activeWord && !revealed && styles.wsBucketActive]}
            >
              <Text style={styles.wsBucketTitle}>{cat}</Text>
              <View style={styles.wsBucketItems}>
                {inCat.length === 0 ? (
                  <Text style={styles.wsBucketEmpty}>—</Text>
                ) : (
                  inCat.map((w) => {
                    const correctPlacement = correctMap[w] === cat;
                    return (
                      <TouchableOpacity
                        key={w}
                        activeOpacity={0.8}
                        onPress={() => tapWord(w)}
                        disabled={revealed}
                        style={[
                          styles.wsAssignedChip,
                          revealed &&
                            (correctPlacement
                              ? styles.wsAssignedChipCorrect
                              : styles.wsAssignedChipWrong),
                        ]}
                      >
                        <Text
                          style={[
                            styles.wsAssignedChipText,
                            revealed && correctPlacement && { color: '#22C55E' },
                            revealed && !correctPlacement && { color: '#EF4444' },
                          ]}
                        >
                          {w}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
      {revealed && correct === false && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationLabel}>Correct placements</Text>
          {allItems.map((i, idx) => (
            <Text key={idx} style={[styles.explanationText, { fontWeight: '600' }]}>
              • {i.word} → {i.category}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function TapCorrectImageView({
  block,
  revealed,
  onAnswerChange,
  theme,
}: WorldLotusBlockProps & { block: TapCorrectImageBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const shuffledOptions = useMemo(
    () => shuffle(block.content.options),
    [block.content.options],
  );
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const correct = selectedIdx === null ? null : shuffledOptions[selectedIdx].correct;
  useReportAnswer(onAnswerChange, correct);

  return (
    <View>
      <Text style={styles.questionText}>{block.content.question}</Text>
      <View style={styles.tciGrid}>
        {shuffledOptions.map((opt, idx) => {
          const isSelected = selectedIdx === idx;
          const isThisCorrect = opt.correct;
          let borderColor = theme.border;
          if (revealed) {
            if (isThisCorrect) borderColor = '#22C55E';
            else if (isSelected) borderColor = '#EF4444';
          } else if (isSelected) {
            borderColor = GitaColors.gold;
          }
          const url = getWorldLotusImageUrl(opt.image_filename);
          return (
            <TouchableOpacity
              key={`${opt.label}-${idx}`}
              activeOpacity={revealed ? 1 : 0.85}
              onPress={() => {
                if (revealed) return;
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedIdx(idx);
              }}
              style={[styles.tciCard, { borderColor }]}
            >
              {url ? (
                <Image source={url} style={styles.tciImage} contentFit="cover" transition={180} />
              ) : (
                <View style={[styles.tciImage, styles.tciImageFallback]}>
                  <Text style={styles.tciImageFallbackText}>{opt.label}</Text>
                </View>
              )}
              <View style={styles.tciLabelWrap}>
                <Text style={styles.tciLabel} numberOfLines={2}>
                  {opt.label}
                </Text>
                {revealed && isThisCorrect && <CheckCircle2 size={16} color="#22C55E" />}
                {revealed && isSelected && !isThisCorrect && <XCircle size={16} color="#EF4444" />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ── New reading block renderers ───────────────────────────────────────────────

function QuoteCardView({ block, theme }: WorldLotusBlockProps & { block: QuoteCardBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.quoteCard}>
      <Text style={styles.quoteCardMark}>&ldquo;</Text>
      <Text style={styles.quoteCardText}>{block.content.quote}</Text>
      <Text style={styles.quoteCardSource}>— {block.content.source}</Text>
    </View>
  );
}

function ComparisonTableView({
  block,
  theme,
}: WorldLotusBlockProps & { block: ComparisonTableBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View>
      <View style={styles.cmpHeaderRow}>
        <View style={styles.cmpHeaderCell}>
          <Text style={styles.cmpHeaderText}>{block.content.left_label}</Text>
        </View>
        <View style={styles.cmpHeaderCell}>
          <Text style={styles.cmpHeaderText}>{block.content.right_label}</Text>
        </View>
      </View>
      <View style={styles.cmpTable}>
        {block.content.rows.map((row, idx) => (
          <View key={idx} style={[styles.cmpRow, idx % 2 === 1 && styles.cmpRowAlt]}>
            <Text style={styles.cmpCell}>{row.left}</Text>
            <View style={styles.cmpDivider} />
            <Text style={styles.cmpCell}>{row.right}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function StepListView({ block, theme }: WorldLotusBlockProps & { block: StepListBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View>
      <Text style={styles.stepListTitle}>{block.content.title}</Text>
      {block.content.steps.map((step, idx) => (
        <View key={idx} style={styles.stepRow}>
          <View style={styles.stepNumWrap}>
            <Text style={styles.stepNum}>{idx + 1}</Text>
          </View>
          <Text style={styles.stepText}>{step}</Text>
        </View>
      ))}
    </View>
  );
}

// ── New question block renderers ──────────────────────────────────────────────

function EmojiPollView({
  block,
  revealed,
  onAnswerChange,
  theme,
}: WorldLotusBlockProps & { block: EmojiPollBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [selected, setSelected] = useState<number | null>(null);
  useReportAnswer(
    onAnswerChange,
    selected === null ? null : selected === block.content.best_index,
  );

  return (
    <View>
      <Text style={styles.questionText}>{block.content.prompt}</Text>
      <View style={styles.emojiPollRow}>
        {block.content.emojis.map((emoji, idx) => {
          const isBest = idx === block.content.best_index;
          const isSelected = selected === idx;
          let borderColor = theme.border;
          let bgColor = theme.surface;
          if (revealed) {
            if (isBest) { borderColor = '#22C55E'; bgColor = 'rgba(34,197,94,0.10)'; }
            else if (isSelected) { borderColor = '#EF4444'; bgColor = 'rgba(239,68,68,0.10)'; }
          } else if (isSelected) {
            borderColor = GitaColors.gold;
            bgColor = 'rgba(251,191,36,0.08)';
          }
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={revealed ? 1 : 0.8}
              onPress={() => {
                if (revealed) return;
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelected(idx);
              }}
              style={[styles.emojiPollBtn, { borderColor, backgroundColor: bgColor }]}
            >
              <Text style={styles.emojiPollEmoji}>{emoji}</Text>
              {revealed && isBest && <CheckCircle2 size={16} color="#22C55E" style={{ marginTop: 4 }} />}
            </TouchableOpacity>
          );
        })}
      </View>
      {revealed && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationText}>{block.content.explanation}</Text>
        </View>
      )}
    </View>
  );
}

function ScenarioChoiceView({
  block,
  revealed,
  onAnswerChange,
  theme,
}: WorldLotusBlockProps & { block: ScenarioChoiceBlock }) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [selected, setSelected] = useState<number | null>(null);
  useReportAnswer(
    onAnswerChange,
    selected === null ? null : selected === block.content.correct_index,
  );

  return (
    <View>
      <View style={styles.scenarioBox}>
        <Text style={styles.scenarioLabel}>SCENARIO</Text>
        <Text style={styles.scenarioText}>{block.content.scenario}</Text>
      </View>
      <Text style={styles.questionText}>{block.content.question}</Text>
      <View style={{ gap: 12 }}>
        {block.content.options.map((opt, idx) => {
          const isCorrect = idx === block.content.correct_index;
          const isSelected = selected === idx;
          let borderColor = theme.border;
          let bgColor = theme.surface;
          if (revealed) {
            if (isCorrect) { borderColor = '#22C55E'; bgColor = 'rgba(34,197,94,0.10)'; }
            else if (isSelected) { borderColor = '#EF4444'; bgColor = 'rgba(239,68,68,0.10)'; }
          } else if (isSelected) {
            borderColor = GitaColors.gold;
            bgColor = 'rgba(251,191,36,0.08)';
          }
          return (
            <TouchableOpacity
              key={idx}
              activeOpacity={revealed ? 1 : 0.72}
              onPress={() => {
                if (revealed) return;
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelected(idx);
              }}
              style={[styles.optionCard, { borderColor, backgroundColor: bgColor }]}
            >
              <View style={[
                styles.optionBadge,
                !revealed && isSelected && styles.optionBadgeSelected,
                revealed && isCorrect && styles.optionBadgeCorrect,
                revealed && isSelected && !isCorrect && styles.optionBadgeWrong,
              ]}>
                <Text style={[
                  styles.optionBadgeText,
                  !revealed && isSelected && styles.optionBadgeTextSelected,
                  revealed && (isCorrect || (isSelected && !isCorrect)) && styles.optionBadgeTextLight,
                ]}>
                  {String.fromCharCode(65 + idx)}
                </Text>
              </View>
              <Text style={[
                styles.optionText,
                revealed && isCorrect && styles.optionTextCorrect,
                revealed && isSelected && !isCorrect && styles.optionTextWrong,
              ]}>
                {opt}
              </Text>
              {revealed && isCorrect && <CheckCircle2 size={20} color="#22C55E" />}
              {revealed && isSelected && !isCorrect && <XCircle size={20} color="#EF4444" />}
            </TouchableOpacity>
          );
        })}
      </View>
      {revealed && (
        <View style={styles.explanationBox}>
          <Text style={styles.explanationText}>{block.content.explanation}</Text>
        </View>
      )}
    </View>
  );
}

// ── Fallback ─────────────────────────────────────────────────────────────────

function UnsupportedView({ blockType }: { blockType: string }) {
  return (
    <View style={{ padding: 24 }}>
      <Text style={{ color: 'rgba(255,255,255,0.5)' }}>
        Unsupported block type: {blockType}
      </Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    // ── Generic text ─────────────────────────────────────────────────────────
    bodyText: {
      color: theme.text,
      fontSize: 19,
      lineHeight: 31,
      fontWeight: '400',
      marginBottom: 18,
      fontFamily: Fonts.serif,
    },
    bodyBold: { color: GitaColors.gold, fontWeight: '700' },

    // ── Paragraph block ──────────────────────────────────────────────────────
    paragraphContainer: {
      flexDirection: 'row',
      gap: 18,
      paddingTop: 8,
      paddingBottom: 4,
    },
    paragraphAccent: {
      width: 3,
      borderRadius: 2,
      backgroundColor: GitaColors.gold,
      opacity: 0.55,
      alignSelf: 'stretch',
    },
    paragraphContent: { flex: 1 },

    // ── Story panels title ───────────────────────────────────────────────────
    storyTitleBlock: { paddingBottom: 4 },
    storyTitleLabel: {
      color: GitaColors.gold,
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 2.2,
      marginBottom: 8,
    },
    storyTitleText: {
      color: theme.text,
      fontSize: 22,
      fontWeight: '800',
      fontFamily: Fonts.serif,
      lineHeight: 28,
    },
    sectionHint: {
      color: theme.subtext,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.6,
      marginBottom: 14,
      textTransform: 'uppercase',
    },
    questionText: {
      color: theme.text,
      fontSize: 22,
      fontWeight: '800',
      lineHeight: 29,
      marginBottom: 24,
      fontFamily: Fonts.serif,
    },

    // ── Fact card ────────────────────────────────────────────────────────────
    factCard: {
      backgroundColor: 'rgba(251,191,36,0.10)',
      borderWidth: 1.5,
      borderColor: 'rgba(251,191,36,0.32)',
      borderRadius: 22,
      paddingVertical: 32,
      paddingHorizontal: 26,
    },
    factCardLabel: {
      color: GitaColors.gold,
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 2.4,
      marginBottom: 14,
    },
    factCardText: {
      color: theme.text,
      fontSize: 22,
      lineHeight: 32,
      fontFamily: Fonts.serif,
      fontWeight: '600',
    },

    // ── Mini story ───────────────────────────────────────────────────────────
    storyCard: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 20,
      paddingVertical: 26,
      paddingHorizontal: 24,
    },
    storyCardLabel: {
      color: GitaColors.gold,
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 2,
      marginBottom: 8,
    },
    storyCardTitle: {
      color: theme.text,
      fontSize: 22,
      fontWeight: '800',
      fontFamily: Fonts.serif,
      lineHeight: 28,
    },

    // ── Dos/Donts ────────────────────────────────────────────────────────────
    dosDontsCard: {
      borderWidth: 1.5,
      borderRadius: 18,
      paddingVertical: 20,
      paddingHorizontal: 20,
    },
    doCard: { borderColor: 'rgba(34,197,94,0.4)', backgroundColor: 'rgba(34,197,94,0.08)' },
    dontCard: { borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.08)' },
    dosDontsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
    dosDontsTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1.2 },
    dosDontsBody: { color: theme.text, fontSize: 16, lineHeight: 24 },

    // ── Timeline ─────────────────────────────────────────────────────────────
    timelineWrap: { gap: 0 },
    timelineRow: { flexDirection: 'row', gap: 16 },
    timelineDotWrap: { alignItems: 'center', width: 16 },
    timelineDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: GitaColors.gold,
      marginTop: 6,
    },
    timelineLine: {
      flex: 1,
      width: 2,
      backgroundColor: 'rgba(251,191,36,0.25)',
      marginTop: 2,
    },
    timelineContent: { flex: 1, paddingBottom: 24 },
    timelineDate: {
      color: GitaColors.gold,
      fontSize: 13,
      fontWeight: '900',
      letterSpacing: 0.8,
      marginBottom: 4,
    },
    timelineTitle: { color: theme.text, fontSize: 16, lineHeight: 23 },

    // ── Dialogue (chat redesign) ─────────────────────────────────────────────
    dialogueAcharyaHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    dialogueAvatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: 'rgba(251,191,36,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    dialogueAvatarEmoji: {
      fontSize: 26,
      lineHeight: 30,
      textAlign: 'center',
    },
    dialogueAcharyaName: { color: theme.text, fontSize: 17, fontWeight: '800' },
    dialogueAcharyaSub: { color: theme.subtext, fontSize: 12, marginTop: 1 },

    dialogueHint: {
      marginTop: 28,
      alignItems: 'center',
    },
    dialogueHintText: {
      color: theme.subtextMuted,
      fontSize: 13,
      fontStyle: 'italic',
      textAlign: 'center',
    },

    dialogueRowUser: { alignItems: 'flex-end' },
    dialogueRowAcharya: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    dialogueAvatarSmall: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(251,191,36,0.15)',
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.3)',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },
    dialogueAvatarEmojiSmall: {
      fontSize: 15,
      lineHeight: 18,
      textAlign: 'center',
    },
    dialogueBubble: {
      paddingVertical: 11,
      paddingHorizontal: 15,
      borderRadius: 18,
      maxWidth: '78%',
    },
    dialogueBubbleUser: {
      backgroundColor: GitaColors.gold,
      borderBottomRightRadius: 4,
    },
    dialogueBubbleAcharya: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderBottomLeftRadius: 4,
      flexShrink: 1,
    },
    dialogueText: { color: theme.text, fontSize: 15, lineHeight: 21 },

    // ── Concept map ──────────────────────────────────────────────────────────
    conceptHeading: {
      color: theme.subtext,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 12,
    },
    conceptCenter: {
      alignSelf: 'center',
      backgroundColor: 'rgba(251,191,36,0.12)',
      borderWidth: 1.5,
      borderColor: 'rgba(251,191,36,0.4)',
      paddingHorizontal: 22,
      paddingVertical: 14,
      borderRadius: 22,
      marginBottom: 10,
    },
    conceptCenterText: {
      color: GitaColors.gold,
      fontSize: 17,
      fontWeight: '800',
      fontFamily: Fonts.serif,
      textAlign: 'center',
    },
    conceptSubHeading: {
      color: theme.subtext,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 20,
    },
    conceptBranches: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'center',
    },
    conceptChip: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    conceptChipText: { color: theme.text, fontSize: 14, fontWeight: '600' },

    // ── Tap reveal ───────────────────────────────────────────────────────────
    tapRevealCard: {
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 16,
      paddingVertical: 22,
      paddingHorizontal: 20,
      alignItems: 'center',
    },
    tapRevealCardFlipped: {
      borderColor: 'rgba(251,191,36,0.4)',
      backgroundColor: 'rgba(251,191,36,0.08)',
    },
    tapRevealFront: {
      color: theme.text,
      fontSize: 22,
      fontWeight: '800',
      fontFamily: Fonts.serif,
    },
    tapRevealMuted: { color: GitaColors.gold },
    tapRevealBack: {
      color: theme.subtext,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 12,
      textAlign: 'center',
    },
    tapRevealHint: {
      color: theme.subtextMuted,
      fontSize: 11,
      marginTop: 10,
      letterSpacing: 1.4,
      fontWeight: '700',
    },

    // ── Recite ───────────────────────────────────────────────────────────────
    reciteCard: {
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: 'rgba(251,191,36,0.32)',
      borderRadius: 22,
      paddingVertical: 28,
      paddingHorizontal: 22,
      alignItems: 'center',
    },
    reciteSanskrit: {
      color: GitaColors.gold,
      fontSize: 24,
      fontWeight: '800',
      fontFamily: Fonts.serif,
      textAlign: 'center',
      marginBottom: 10,
    },
    reciteLongForm: {
      color: GitaColors.gold,
      fontSize: 18,
      fontStyle: 'italic',
      marginBottom: 12,
      textAlign: 'center',
      opacity: 0.85,
    },
    reciteTranslation: {
      color: theme.text,
      fontSize: 16,
      fontStyle: 'italic',
      textAlign: 'center',
      marginBottom: 8,
      lineHeight: 22,
    },
    reciteSource: { color: theme.subtext, fontSize: 12, letterSpacing: 0.5, marginTop: 6 },
    syllableRow: { flexDirection: 'row', gap: 10, justifyContent: 'center' },
    syllableChip: {
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: 'rgba(251,191,36,0.4)',
      borderRadius: 14,
      paddingHorizontal: 20,
      paddingVertical: 14,
      minWidth: 60,
      alignItems: 'center',
    },
    syllableText: {
      color: GitaColors.gold,
      fontSize: 22,
      fontWeight: '800',
      fontFamily: Fonts.serif,
    },
    reciteWordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    reciteWordChip: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    reciteWordChipActive: {
      backgroundColor: 'rgba(251,191,36,0.18)',
      borderColor: GitaColors.gold,
    },
    reciteWordText: { color: theme.text, fontSize: 15, fontWeight: '700' },
    reciteWordTextActive: { color: GitaColors.gold },
    reciteMeaningBox: {
      marginTop: 14,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 12,
      padding: 14,
    },
    reciteMeaningWord: {
      color: GitaColors.gold,
      fontSize: 17,
      fontWeight: '800',
      marginBottom: 4,
    },
    reciteMeaningText: { color: theme.text, fontSize: 15, lineHeight: 21 },

    // ── Story panels ─────────────────────────────────────────────────────────
    storyPanel: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 18,
      overflow: 'hidden',
    },
    storyPanelImage: {
      width: '100%',
      aspectRatio: 4 / 3,
      backgroundColor: theme.surface,
    },
    storyPanelTextBlock: { paddingVertical: 14, paddingHorizontal: 18 },
    storyPanelNumber: {
      color: GitaColors.gold,
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 1.5,
      marginBottom: 6,
    },
    storyPanelCaption: { color: theme.text, fontSize: 16, lineHeight: 23 },

    // ── Interactive diagram ──────────────────────────────────────────────────
    diagramImageWrap: {
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
    },
    diagramImage: { width: '100%', aspectRatio: 4 / 3, backgroundColor: theme.surface },
    hotspotCard: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      paddingVertical: 15,
      paddingHorizontal: 16,
    },
    hotspotCardOpen: {
      borderColor: 'rgba(251,191,36,0.4)',
      backgroundColor: 'rgba(251,191,36,0.06)',
    },
    hotspotHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    hotspotDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: GitaColors.gold,
    },
    hotspotLabel: { color: theme.text, fontSize: 16, fontWeight: '700', flex: 1 },
    hotspotBody: {
      color: theme.subtext,
      fontSize: 14,
      lineHeight: 21,
      marginTop: 12,
      paddingLeft: 20,
    },

    // ── MC / odd one out ─────────────────────────────────────────────────────
    optionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 16,
      borderRadius: 14,
      borderWidth: 2,
      minHeight: 60,
      gap: 12,
    },
    optionBadge: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: theme.surface,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    optionBadgeSelected: { backgroundColor: 'rgba(251,191,36,0.18)' },
    optionBadgeCorrect: { backgroundColor: '#22C55E' },
    optionBadgeWrong: { backgroundColor: '#EF4444' },
    optionBadgeText: { color: theme.subtext, fontSize: 13, fontWeight: '800' },
    optionBadgeTextSelected: { color: GitaColors.gold },
    optionBadgeTextLight: { color: '#FFFFFF' },
    optionText: {
      color: theme.text,
      fontSize: 15,
      fontWeight: '600',
      flex: 1,
      flexWrap: 'wrap',
      lineHeight: 21,
    },
    optionTextCorrect: { color: '#22C55E' },
    optionTextWrong: { color: '#EF4444' },

    // ── T/F (stacked, big) ───────────────────────────────────────────────────
    tfStatement: {
      color: theme.text,
      fontSize: 24,
      fontWeight: '800',
      lineHeight: 32,
      marginBottom: 32,
      fontFamily: Fonts.serif,
    },
    tfStack: { gap: 14 },
    tfBtn: {
      width: '100%',
      paddingVertical: 38,
      borderRadius: 20,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tfBtnText: { fontSize: 26, fontWeight: '900', letterSpacing: 0.6 },

    // ── Explanation ──────────────────────────────────────────────────────────
    explanationBox: {
      marginTop: 20,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 14,
      padding: 16,
    },
    explanationLabel: {
      color: GitaColors.gold,
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 1.6,
      marginBottom: 8,
    },
    explanationText: { color: theme.text, fontSize: 14, lineHeight: 21 },

    // ── Fill blank ───────────────────────────────────────────────────────────
    fillSentence: { marginBottom: 16 },
    fillSentenceText: { color: theme.text, fontSize: 17, lineHeight: 26 },
    fillBlankSlot: { color: GitaColors.gold, fontSize: 17, fontWeight: '700' },
    fillInput: {
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: theme.border,
      borderRadius: 14,
      paddingVertical: 16,
      paddingHorizontal: 16,
      color: theme.text,
      fontSize: 18,
      fontWeight: '600',
    },
    fillInputCorrect: {
      borderColor: '#22C55E',
      backgroundColor: 'rgba(34,197,94,0.08)',
    },
    fillInputWrong: {
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239,68,68,0.08)',
    },

    // ── Build sentence ───────────────────────────────────────────────────────
    bsAnswer: {
      minHeight: 76,
      borderWidth: 2,
      borderColor: theme.border,
      borderStyle: 'dashed',
      borderRadius: 14,
      padding: 14,
      marginBottom: 22,
      justifyContent: 'center',
    },
    bsAnswerCorrect: {
      borderColor: '#22C55E',
      backgroundColor: 'rgba(34,197,94,0.06)',
      borderStyle: 'solid',
    },
    bsAnswerWrong: {
      borderColor: '#EF4444',
      backgroundColor: 'rgba(239,68,68,0.06)',
      borderStyle: 'solid',
    },
    bsPlaceholder: { color: theme.subtextMuted, fontSize: 14, textAlign: 'center' },
    bsTileRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    bsTile: {
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },
    bsTilePlaced: { borderColor: GitaColors.gold, backgroundColor: 'rgba(251,191,36,0.1)' },
    bsTileUsed: { opacity: 0.25 },
    bsTileText: { color: theme.text, fontSize: 15, fontWeight: '600' },
    bsTileTextUsed: { color: theme.subtextMuted },

    // ── Drag to order ────────────────────────────────────────────────────────
    dragDirLabelTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 10,
      paddingHorizontal: 4,
    },
    dragDirLabelBottom: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
      paddingHorizontal: 4,
    },
    dragDirText: {
      color: GitaColors.gold,
      fontSize: 11,
      fontWeight: '900',
      letterSpacing: 1.6,
    },
    dragRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
    },
    dragOrderBadge: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: 'rgba(251,191,36,0.18)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dragOrderText: { color: GitaColors.gold, fontSize: 13, fontWeight: '800' },
    dragItemText: { color: theme.text, fontSize: 15, flex: 1, fontWeight: '600' },
    dragArrowGroup: { flexDirection: 'row', gap: 6 },
    dragArrowBtn: {
      width: 34,
      height: 34,
      borderRadius: 8,
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dragArrowBtnDisabled: { opacity: 0.3 },

    // ── Matching ─────────────────────────────────────────────────────────────
    matchRow: { flexDirection: 'row', gap: 10 },
    matchCol: { flex: 1, gap: 10 },
    matchCard: {
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
      minHeight: 60,
      justifyContent: 'center',
    },
    matchCardActive: {
      borderColor: GitaColors.gold,
      backgroundColor: 'rgba(251,191,36,0.1)',
    },
    matchCardMatched: { borderColor: 'rgba(251,191,36,0.4)' },
    matchCardUsed: { opacity: 0.25 },
    matchCardDisabled: { opacity: 0.7 },
    matchCardCorrect: { borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.08)' },
    matchCardWrong: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.08)' },
    matchCardText: { color: theme.text, fontSize: 14, fontWeight: '700' },
    matchCardSubText: { color: theme.subtext, fontSize: 12, marginTop: 4 },
    matchCardTextMuted: { color: theme.subtextMuted },

    // ── Word sort ────────────────────────────────────────────────────────────
    wsWordRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 16,
      minHeight: 44,
    },
    wsAllSorted: { color: GitaColors.gold, fontSize: 14, fontWeight: '700' },
    wsWord: {
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 9,
    },
    wsWordActive: {
      borderColor: GitaColors.gold,
      backgroundColor: 'rgba(251,191,36,0.14)',
    },
    wsWordText: { color: theme.text, fontSize: 14, fontWeight: '700' },
    wsWordTextActive: { color: GitaColors.gold },
    wsBucket: {
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: theme.border,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
    },
    wsBucketActive: { borderColor: 'rgba(251,191,36,0.5)' },
    wsBucketTitle: {
      color: theme.text,
      fontSize: 14,
      fontWeight: '800',
      marginBottom: 10,
    },
    wsBucketItems: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      minHeight: 28,
    },
    wsBucketEmpty: { color: theme.subtextMuted, fontSize: 13 },
    wsAssignedChip: {
      backgroundColor: 'rgba(251,191,36,0.12)',
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    wsAssignedChipCorrect: { backgroundColor: 'rgba(34,197,94,0.14)' },
    wsAssignedChipWrong: { backgroundColor: 'rgba(239,68,68,0.14)' },
    wsAssignedChipText: { color: GitaColors.gold, fontSize: 13, fontWeight: '700' },

    // ── Tap correct image ────────────────────────────────────────────────────
    tciGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'space-between',
    },
    tciCard: {
      width: '48%',
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: theme.border,
      borderRadius: 16,
      overflow: 'hidden',
    },
    tciImage: { width: '100%', aspectRatio: 1, backgroundColor: theme.surface },
    tciImageFallback: { alignItems: 'center', justifyContent: 'center' },
    tciImageFallbackText: { color: theme.subtextMuted, fontSize: 13, fontWeight: '700' },
    tciLabelWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 11,
      paddingHorizontal: 12,
      gap: 6,
    },
    tciLabel: { color: theme.text, fontSize: 14, fontWeight: '700', flex: 1 },

    // ── Quote card ───────────────────────────────────────────────────────────
    quoteCard: {
      backgroundColor: 'rgba(251,191,36,0.06)',
      borderWidth: 1.5,
      borderColor: 'rgba(251,191,36,0.3)',
      borderRadius: 22,
      paddingVertical: 28,
      paddingHorizontal: 28,
      alignItems: 'center',
    },
    quoteCardMark: {
      color: GitaColors.gold,
      fontSize: 52,
      lineHeight: 48,
      fontWeight: '900',
      alignSelf: 'flex-start',
      marginBottom: -4,
    },
    quoteCardText: {
      color: theme.text,
      fontSize: 19,
      lineHeight: 30,
      fontFamily: Fonts.serif,
      fontStyle: 'italic',
      textAlign: 'center',
      marginBottom: 16,
    },
    quoteCardSource: {
      color: GitaColors.gold,
      fontSize: 13,
      fontWeight: '700',
      letterSpacing: 0.4,
      textAlign: 'center',
    },

    // ── Comparison table ─────────────────────────────────────────────────────
    cmpHeaderRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 8,
    },
    cmpHeaderCell: {
      flex: 1,
      backgroundColor: 'rgba(251,191,36,0.12)',
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      alignItems: 'center',
    },
    cmpHeaderText: {
      color: GitaColors.gold,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 0.8,
      textAlign: 'center',
    },
    cmpTable: {
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.border,
    },
    cmpRow: {
      flexDirection: 'row',
      backgroundColor: theme.surface,
    },
    cmpRowAlt: {
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
    cmpCell: {
      flex: 1,
      color: theme.text,
      fontSize: 14,
      lineHeight: 20,
      paddingVertical: 12,
      paddingHorizontal: 12,
    },
    cmpDivider: {
      width: 1,
      backgroundColor: theme.border,
    },

    // ── Step list ────────────────────────────────────────────────────────────
    stepListTitle: {
      color: theme.text,
      fontSize: 18,
      fontWeight: '800',
      fontFamily: Fonts.serif,
      marginBottom: 18,
      lineHeight: 25,
    },
    stepRow: {
      flexDirection: 'row',
      gap: 14,
      marginBottom: 16,
      alignItems: 'flex-start',
    },
    stepNumWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(251,191,36,0.12)',
      borderWidth: 1.5,
      borderColor: 'rgba(251,191,36,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginTop: 2,
    },
    stepNum: {
      color: GitaColors.gold,
      fontSize: 13,
      fontWeight: '900',
    },
    stepText: {
      color: theme.text,
      fontSize: 16,
      lineHeight: 23,
      flex: 1,
    },

    // ── Emoji poll ───────────────────────────────────────────────────────────
    emojiPollRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginVertical: 20,
      flexWrap: 'wrap',
      gap: 12,
    },
    emojiPollBtn: {
      width: 72,
      height: 80,
      borderRadius: 20,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    emojiPollEmoji: {
      fontSize: 34,
      lineHeight: 40,
    },

    // ── Scenario choice ──────────────────────────────────────────────────────
    scenarioBox: {
      backgroundColor: theme.surface,
      borderWidth: 1.5,
      borderColor: 'rgba(251,191,36,0.25)',
      borderRadius: 20,
      paddingVertical: 26,
      paddingHorizontal: 24,
      marginBottom: 26,
    },
    scenarioLabel: {
      color: GitaColors.gold,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 2.2,
      marginBottom: 12,
    },
    scenarioText: {
      color: theme.text,
      fontSize: 19,
      lineHeight: 29,
      fontFamily: Fonts.serif,
    },
  });
