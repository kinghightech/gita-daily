import { PRAYERS, type Prayer } from '@/Data/prayers';
import { useTheme } from '@/hooks/useTheme';
import { GitaColors } from '@/constants/theme';
import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function ThumbnailWithLoader({ source, style }: { source: Prayer['thumbnail']; style: object }) {
  const [loaded, setLoaded] = useState(false);
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (loaded) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.9, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [loaded, pulse]);

  return (
    <View>
      <Image
        source={source}
        style={style}
        resizeMode="cover"
        onLoad={() => setLoaded(true)}
      />
      {!loaded && (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.thumbSkeleton, { opacity: pulse }]}
        />
      )}
    </View>
  );
}

export default function PrayerListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const onSelectPrayer = (prayer: Prayer) => {
    router.push(`/prayer-detail?id=${prayer.id}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Prayers</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn} activeOpacity={0.7}>
          <X size={20} color={theme.subtext} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {PRAYERS.map((prayer) => (
          <TouchableOpacity
            key={prayer.id}
            style={[styles.item, { borderBottomColor: theme.border }]}
            activeOpacity={0.65}
            onPress={() => onSelectPrayer(prayer)}
          >
            <ThumbnailWithLoader source={prayer.thumbnail} style={styles.thumbnail} />
            <View style={styles.meta}>
              <Text style={[styles.prayerName, { color: theme.text }]} numberOfLines={1}>
                {prayer.name}
              </Text>
              <Text style={[styles.prayerSub, { color: theme.subtext }]} numberOfLines={1}>
                {prayer.duration} · {prayer.deity}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.comingSoon}>
          <Text style={[styles.comingSoonText, { color: theme.subtextMuted }]}>
            More prayers coming soon
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: 24,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  thumbSkeleton: {
    backgroundColor: GitaColors.gold,
    borderRadius: 10,
  },
  meta: {
    flex: 1,
    gap: 5,
  },
  prayerName: {
    fontSize: 17,
    fontWeight: '700',
  },
  prayerSub: {
    fontSize: 14,
  },
  comingSoon: {
    paddingTop: 32,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
