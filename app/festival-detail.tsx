import { useTheme } from '@/hooks/useTheme';
import { GitaColors } from '@/constants/theme';
import { refreshAndAwardUserBadges } from '@/lib/badges';
import { fetchFestivalById, getFestivalSymbol, type Festival } from '@/lib/festivals';
import { fetchUserFestivalFavorites, toggleFavoriteFestival, FESTIVALS_UPDATED_EVENT } from '@/lib/favorites';
import { getFestivalImageUrl } from '@/lib/storageAssets';
import { supabase } from '@/lib/supabase';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Bookmark, Calendar, Check, Info, Map, Share2, Sparkles, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  DeviceEventEmitter,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LotusLoader from '@/components/ui/LotusLoader';
import type { Theme } from '@/theme/colors';

export default function FestivalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [festival, setFestival] = useState<Festival | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [heroImageError, setHeroImageError] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const [fest, { data: { user } }] = await Promise.all([
        fetchFestivalById(id),
        supabase.auth.getUser(),
      ]);
      setFestival(fest);
      setLoading(false);
      if (user && fest) {
        setUserId(user.id);
        const favs = await fetchUserFestivalFavorites(user.id);
        setIsFavorite(favs.includes(fest.id));
      }
    })();
  }, [id]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      FESTIVALS_UPDATED_EVENT,
      (data: { festivalId: string; liked: boolean }) => {
        if (festival && data.festivalId === festival.id) setIsFavorite(data.liked);
      },
    );
    return () => sub.remove();
  }, [festival]);

  const toggleFavorite = useCallback(async () => {
    if (!userId || !festival) return;
    const next = !isFavorite;
    setIsFavorite(next);
    const ok = await toggleFavoriteFestival(userId, festival.id, isFavorite);
    if (!ok) setIsFavorite(isFavorite);
    if (ok && next) {
      void refreshAndAwardUserBadges(userId).catch((error) => {
        console.warn('Badge refresh after festival favorite failed:', error);
      });
    }
  }, [userId, festival, isFavorite]);

  const handleShare = useCallback(async () => {
    if (!festival) return;
    try {
      await Share.share({
        title: festival.name,
        message:
          `🪷 ${festival.name.toUpperCase()} 🪷\n\n` +
          `🪔 Deity: ${festival.deity}\n` +
          `📅 Date: ${festival.display_date}\n\n` +
          `✨ What is it?\n${festival.what_is_it}\n\n` +
          `🙏 How to celebrate:\n${festival.how_to_celebrate}\n\n` +
          `Shared via Om Daily 🦚`,
      });
    } catch {}
  }, [festival]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <LotusLoader size={80} color={GitaColors.gold} />
      </View>
    );
  }

  if (!festival) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background, paddingTop: insets.top }]}>
        <Text style={{ color: theme.text }}>Festival not found.</Text>
      </View>
    );
  }

  const symbol = getFestivalSymbol(festival.name, festival.icon_emoji);
  const dayLabel = festival.main_day_info.replace('Main:', '').trim();
  const heroImageUrl = getFestivalImageUrl(festival.name);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      {/* Nav bar */}
      <View style={[styles.navBar, { paddingTop: insets.top + 8, backgroundColor: theme.background }]}>
        <View style={styles.navSide}>
          <TouchableOpacity onPress={() => router.back()} style={styles.navBtn} activeOpacity={0.7}>
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.navTitle, { color: theme.text }]} numberOfLines={1}>
          {festival.name}
        </Text>
        <View style={styles.navActions}>
          <TouchableOpacity onPress={toggleFavorite} style={styles.navBtn} activeOpacity={0.7}>
            <Bookmark
              size={20}
              color={isFavorite ? GitaColors.gold : theme.subtext}
              fill={isFavorite ? GitaColors.gold : 'transparent'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.navBtn} activeOpacity={0.7}>
            <Share2 size={20} color={theme.subtext} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Hero */}
        <View style={styles.hero}>
          {!heroImageUrl || heroImageError ? (
            <View style={styles.emojiCircle}>
              <Text style={styles.heroEmoji}>{symbol}</Text>
            </View>
          ) : (
            <Image
              source={{ uri: heroImageUrl }}
              style={styles.heroImage}
              contentFit="cover"
              cachePolicy="disk"
              onError={() => setHeroImageError(true)}
            />
          )}
          <Text style={styles.heroName}>{festival.name.toUpperCase()}</Text>
          <Text style={styles.heroDeity}>{festival.deity}</Text>
          <View style={styles.dateBadge}>
            <Calendar size={13} color={GitaColors.gold} />
            <Text style={styles.dateBadgeText}>{festival.display_date}</Text>
          </View>
          <Text style={styles.dayLabel}>{dayLabel}</Text>
        </View>

        {/* Content sections */}
        <View style={styles.sections}>
          <Section icon={<Info size={16} color={GitaColors.gold} />} title="What Is It" theme={theme}>
            <Text style={[styles.bodyText, { color: theme.subtext }]}>{festival.what_is_it}</Text>
          </Section>

          <Section icon={<Map size={16} color={GitaColors.gold} />} title="Origin" theme={theme}>
            <Text style={[styles.bodyText, { color: theme.subtext }]}>{festival.origin}</Text>
          </Section>

          <Section icon={<Sparkles size={16} color={GitaColors.gold} />} title="How to Celebrate" theme={theme}>
            <Text style={[styles.bodyText, { color: theme.subtext }]}>{festival.how_to_celebrate}</Text>
          </Section>

          {/* Dos & Don'ts side by side */}
          <View style={styles.gridRow}>
            <View style={[styles.gridCard, styles.doCard, { flex: 1 }]}>
              <View style={styles.gridHeader}>
                <Check size={15} color="#22c55e" />
                <Text style={[styles.gridTitle, { color: '#22c55e' }]}>DOS</Text>
              </View>
              {festival.dos.map((item, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.doBullet} />
                  <Text style={[styles.bulletText, { color: theme.text }]}>{item}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.gridCard, styles.dontCard, { flex: 1 }]}>
              <View style={styles.gridHeader}>
                <X size={15} color="#ef4444" />
                <Text style={[styles.gridTitle, { color: '#ef4444' }]}>DON&apos;TS</Text>
              </View>
              {festival.donts.map((item, i) => (
                <View key={i} style={styles.bulletRow}>
                  <View style={styles.dontBullet} />
                  <Text style={[styles.bulletText, { color: theme.text }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({
  icon,
  title,
  theme,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  theme: Theme;
  children: React.ReactNode;
}) {
  return (
    <View style={[sectionStyles.wrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={sectionStyles.header}>
        {icon}
        <Text style={[sectionStyles.title, { color: theme.text }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  wrap: { borderRadius: 18, borderWidth: 1, padding: 20, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
});

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    root: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingBottom: 12,
    },
    navSide: {
      width: 76,
      alignItems: 'flex-start',
    },
    navBtn: {
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
      marginHorizontal: 4,
    },
    navActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    scroll: { gap: 0 },
    hero: {
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 8,
      paddingBottom: 32,
      gap: 8,
    },
    heroImage: {
      width: 120,
      height: 120,
      borderRadius: 20,
      marginBottom: 8,
    },
    emojiCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: 'rgba(251,191,36,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.25)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    heroEmoji: {
      fontSize: 52,
    },
    heroName: {
      fontSize: 22,
      fontWeight: '800',
      color: GitaColors.gold,
      letterSpacing: 1.5,
      textAlign: 'center',
    },
    heroDeity: {
      fontSize: 15,
      color: theme.subtext,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    dateBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: 'rgba(251,191,36,0.3)',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 6,
      backgroundColor: 'rgba(251,191,36,0.06)',
      marginTop: 4,
    },
    dateBadgeText: {
      color: GitaColors.gold,
      fontSize: 13,
      fontWeight: '700',
    },
    dayLabel: {
      color: theme.subtextMuted,
      fontSize: 12,
      fontWeight: '600',
    },
    sections: {
      paddingHorizontal: 16,
      gap: 12,
    },
    bodyText: {
      fontSize: 14,
      lineHeight: 22,
    },
    gridRow: {
      flexDirection: 'row',
      gap: 10,
    },
    gridCard: {
      borderRadius: 18,
      borderWidth: 1,
      padding: 16,
      gap: 10,
    },
    doCard: {
      backgroundColor: 'rgba(34,197,94,0.04)',
      borderColor: 'rgba(34,197,94,0.25)',
    },
    dontCard: {
      backgroundColor: 'rgba(239,68,68,0.04)',
      borderColor: 'rgba(239,68,68,0.25)',
    },
    gridHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4,
    },
    gridTitle: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 1.5,
    },
    bulletRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },
    doBullet: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: '#22c55e',
      marginTop: 7,
      flexShrink: 0,
    },
    dontBullet: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: '#ef4444',
      marginTop: 7,
      flexShrink: 0,
    },
    bulletText: {
      fontSize: 13,
      lineHeight: 19,
      flex: 1,
    },
  });
