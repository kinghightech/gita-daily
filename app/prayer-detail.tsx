import { getPrayerById } from '@/Data/prayers';
import { useTheme } from '@/hooks/useTheme';
import { Fonts, GitaColors } from '@/constants/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, CheckCircle, Clock, Play } from 'lucide-react-native';
import {
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PrayerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const prayer = getPrayerById(id ?? '');

  if (!prayer) {
    return (
      <View style={[styles.notFound, { backgroundColor: theme.background }]}>
        <Text style={{ color: theme.text }}>Prayer not found.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Nav bar */}
      <View style={[styles.navBar, { paddingTop: insets.top + 8, backgroundColor: theme.background }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: theme.text }]} numberOfLines={1}>
          {prayer.name}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
      >
        {/* Hero */}
        <ImageBackground source={prayer.thumbnail} style={styles.hero} resizeMode="cover">
          <View style={styles.heroOverlay}>
            <Text style={styles.heroNameHindi}>{prayer.nameHindi}</Text>
            <Text style={styles.heroNameEn}>{prayer.name.toUpperCase()}</Text>
            <TouchableOpacity
              style={styles.playBtn}
              onPress={() => router.navigate(`/(tabs)/prayer?id=${prayer.id}`)}
              activeOpacity={0.85}
            >
              <Play size={22} color="#0F172A" fill="#0F172A" />
              <Text style={styles.playBtnText}>Play Prayer</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* Details strip */}
        <View style={[styles.detailsStrip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <DetailChip label="Composer" value={prayer.composer} theme={theme} />
          <View style={[styles.chipDivider, { backgroundColor: theme.border }]} />
          <DetailChip label="Verses" value={String(prayer.verses)} theme={theme} />
          <View style={[styles.chipDivider, { backgroundColor: theme.border }]} />
          <DetailChip label="Era" value={prayer.era} theme={theme} />
        </View>

        <View style={styles.content}>
          <Section title="About" theme={theme}>
            <Text style={[styles.bodyText, { color: theme.subtext }]}>{prayer.about}</Text>
          </Section>

          <Section title="When to Chant" icon={<Clock size={16} color={GitaColors.gold} />} theme={theme}>
            {prayer.whenToChant.map((item, i) => (
              <BulletRow key={i} text={item} theme={theme} />
            ))}
          </Section>

          <Section title="Significance" theme={theme}>
            <Text style={[styles.bodyText, { color: theme.subtext }]}>{prayer.significance}</Text>
          </Section>

          <Section title="Benefits" icon={<CheckCircle size={16} color={GitaColors.gold} />} theme={theme}>
            {prayer.benefits.map((item, i) => (
              <BulletRow key={i} text={item} theme={theme} />
            ))}
          </Section>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  icon,
  theme,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  theme: ReturnType<typeof useTheme>;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.sectionHeader}>
        {icon}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function DetailChip({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <View style={styles.chip}>
      <Text style={[styles.chipLabel, { color: theme.subtextMuted }]}>{label}</Text>
      <Text style={[styles.chipValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

function BulletRow({ text, theme }: { text: string; theme: ReturnType<typeof useTheme> }) {
  return (
    <View style={styles.bulletRow}>
      <View style={[styles.bullet, { backgroundColor: GitaColors.gold }]} />
      <Text style={[styles.bulletText, { color: theme.subtext }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitle: {
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  scroll: { gap: 0 },
  hero: { width: '100%', height: 240 },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,14,33,0.68)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 24,
  },
  heroNameHindi: {
    fontSize: 26,
    color: GitaColors.gold,
    fontFamily: Fonts.serif,
    fontWeight: '700',
    textAlign: 'center',
  },
  heroNameEn: {
    fontSize: 11,
    color: 'rgba(251,191,36,0.55)',
    letterSpacing: 4,
    fontWeight: '700',
    marginBottom: 12,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: GitaColors.gold,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 50,
    shadowColor: GitaColors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 6,
  },
  playBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.3,
  },
  detailsStrip: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  chip: { flex: 1, alignItems: 'center', paddingVertical: 14, gap: 4 },
  chipDivider: { width: 1 },
  chipLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  chipValue: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  content: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  section: { borderRadius: 18, borderWidth: 1, padding: 20, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  bodyText: { fontSize: 14, lineHeight: 22 },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 8, flexShrink: 0 },
  bulletText: { fontSize: 14, lineHeight: 22, flex: 1 },
});
