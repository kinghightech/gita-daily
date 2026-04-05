import { GitaColors } from '@/constants/theme';
import { Festival, getFestivalSymbol } from '@/lib/festivals';
import { LinearGradient } from 'expo-linear-gradient';
import { Calendar, Check, Heart, Info, Map, Share2, Sparkles, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, Share, ScrollView, StyleSheet, Text, View, DeviceEventEmitter } from 'react-native';
import { fetchUserFestivalFavorites, toggleFavoriteFestival, FESTIVALS_UPDATED_EVENT } from '@/lib/favorites';
import { supabase } from '@/lib/supabase';

interface FestivalModalProps {
  festival: Festival | null;
  onClose: () => void;
}

export default function FestivalModal({ festival, onClose }: FestivalModalProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!festival) return;
    
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const favs = await fetchUserFestivalFavorites(user.id);
        setIsFavorite(favs.includes(festival.id));
      }
    })();
  }, [festival]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(FESTIVALS_UPDATED_EVENT, (data: { festivalId: string, liked: boolean }) => {
      if (festival && data.festivalId === festival.id) {
        setIsFavorite(data.liked);
      }
    });
    return () => sub.remove();
  }, [festival]);

  const toggleFavorite = async () => {
    if (!userId || !festival) return;
    const nextState = !isFavorite;
    setIsFavorite(nextState); // Optimistic UI
    const success = await toggleFavoriteFestival(userId, festival.id, isFavorite);
    if (!success) setIsFavorite(isFavorite); // Revert on failure
  };

  const closeModal = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleShare = async () => {
    if (!festival) return;
    try {
      const message = `🪷 *${festival.name.toUpperCase()}* 🪷\n\n` +
        `🪔 *Deity:* ${festival.deity}\n` +
        `📅 *Date:* ${festival.display_date}\n\n` +
        `✨ *What is it?*\n${festival.what_is_it}\n\n` +
        `🙏 *How to celebrate:*\n${festival.how_to_celebrate}\n\n` +
        `✅ *Dos:*\n${festival.dos.join('\n')}\n` +
        `❌ *Don'ts:*\n${festival.donts.join('\n')}\n\n` +
        `Shared via Gita Daily App 🦚`;

      await Share.share({
        message,
        title: festival.name,
      });
    } catch (error) {
      console.error('Error sharing festival:', error);
    }
  };

  if (!festival) return null;

  return (
    <Modal visible={!!festival} transparent animationType="slide" onRequestClose={closeModal} statusBarTranslucent>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <LinearGradient
            colors={['#090e1a', '#0f172a']}
            style={styles.sheetGradient}
          >
            <View style={styles.header}>
              <View style={styles.headerLeftActions}>
                <Pressable style={styles.shareBtn} onPress={handleShare}>
                  <Share2 size={20} color={GitaColors.gold} />
                </Pressable>
                <Pressable 
                  style={[styles.favoriteBtn, isFavorite && styles.favoriteBtnActive]} 
                  onPress={toggleFavorite}
                >
                  <Heart size={20} color={isFavorite ? '#FE2C55' : 'rgba(255,255,255,0.4)'} fill={isFavorite ? '#FE2C55' : 'transparent'} />
                </Pressable>
              </View>

              <View style={styles.headerTitleRow}>
                <Text style={styles.iconEmoji}>{getFestivalSymbol(festival.name, festival.icon_emoji)}</Text>
                <View style={styles.titleInfo}>
                  <Text style={styles.festivalName}>{festival.name.toUpperCase()}</Text>
                  <Text style={styles.deityName}>{festival.deity}</Text>
                </View>
              </View>
              
              <View style={styles.dateBadge}>
                <Text style={styles.dateBadgeMonth}>{festival.month}</Text>
                <Text style={styles.dateBadgeMain}>{festival.main_day_info}</Text>
              </View>
              
              <Pressable style={styles.closeBtn} onPress={closeModal}>
                <X size={20} color="rgba(255,255,255,0.4)" />
              </Pressable>
            </View>

            <ScrollView 
              style={styles.scroll} 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Calendar size={18} color={GitaColors.gold} />
                  <Text style={styles.sectionTitle}>DATES</Text>
                </View>
                <Text style={styles.dateTextPrimary}>{festival.display_date}</Text>
                <Text style={styles.dateTextSecondary}>{festival.main_day_info.replace('Main:', 'Main celebration:')}</Text>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Info size={18} color={GitaColors.gold} />
                  <Text style={styles.sectionTitle}>WHAT IS IT</Text>
                </View>
                <Text style={styles.bodyText}>{festival.what_is_it}</Text>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Map size={18} color={GitaColors.gold} />
                  <Text style={styles.sectionTitle}>ORIGIN</Text>
                </View>
                <Text style={styles.bodyText}>{festival.origin}</Text>
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Sparkles size={18} color={GitaColors.gold} />
                  <Text style={styles.sectionTitle}>HOW TO CELEBRATE</Text>
                </View>
                <Text style={styles.bodyText}>{festival.how_to_celebrate}</Text>
              </View>

              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <View style={styles.sectionHeader}>
                    <Check size={18} color="#22c55e" />
                    <Text style={[styles.sectionTitle, { color: '#22c55e' }]}>DOS</Text>
                  </View>
                  {festival.dos.map((item, idx) => (
                    <View key={idx} style={[styles.itemCard, styles.doCard]}>
                      <Check size={14} color="#22c55e" style={styles.labelIcon} />
                      <Text style={styles.itemText}>{item}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.gridCol}>
                  <View style={styles.sectionHeader}>
                    <X size={18} color="#ef4444" />
                    <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>DON'TS</Text>
                  </View>
                  {festival.donts.map((item, idx) => (
                    <View key={idx} style={[styles.itemCard, styles.dontCard]}>
                      <X size={14} color="#ef4444" style={styles.labelIcon} />
                      <Text style={styles.itemText}>{item}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              <View style={styles.footerSpace} />
            </ScrollView>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(9,15,28,0.9)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(212,163,115,0.2)',
    height: '90%',
    overflow: 'hidden',
  },
  sheetGradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconEmoji: {
    fontSize: 32,
  },
  titleInfo: {
    flex: 1,
  },
  festivalName: {
    color: GitaColors.gold,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
    fontFamily: 'serif',
  },
  deityName: {
    color: 'rgba(251,191,36,0.7)',
    fontSize: 15,
    fontStyle: 'italic',
    marginTop: 2,
  },
  dateBadge: {
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: 'rgba(251,191,36,0.05)',
    marginRight: 10,
  },
  dateBadgeMonth: {
    color: GitaColors.gold,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  dateBadgeMain: {
    color: GitaColors.gold,
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.6,
    marginTop: 2,
  },
  shareBtn: {
    padding: 8,
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderRadius: 12,
  },
  headerLeftActions: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 12,
  },
  favoriteBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  favoriteBtnActive: {
    backgroundColor: 'rgba(254,44,85,0.1)',
    borderColor: 'rgba(254,44,85,0.2)',
    borderWidth: 1,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    marginLeft: 10,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: 'rgba(251,191,36,0.6)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
  },
  bodyText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'serif',
  },
  dateTextPrimary: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  dateTextSecondary: {
    color: 'rgba(251,191,36,0.5)',
    fontSize: 14,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 16,
  },
  gridCol: {
    flex: 1,
  },
  itemCard: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: 'row',
    gap: 8,
  },
  doCard: {
    backgroundColor: 'rgba(34,197,94,0.05)',
    borderColor: 'rgba(34,197,94,0.3)',
  },
  dontCard: {
    backgroundColor: 'rgba(239,68,68,0.05)',
    borderColor: 'rgba(239,68,68,0.3)',
  },
  labelIcon: {
    marginTop: 2,
  },
  itemText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  footerSpace: {
    height: 20,
  },
});
