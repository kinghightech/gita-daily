import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, StatusBar } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ChevronLeft, Lock, Star, Target, Trophy, X } from 'lucide-react-native';
import BackgroundLayout from '@/components/BackgroundLayout';
import { Fonts, GitaColors } from '@/constants/theme';
import { BADGE_DEFINITIONS, BADGE_ICONS, fetchUserBadges, type Badge } from '@/lib/badges';
import { fetchCurrentUserAndProfile } from '@/lib/profile';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const GRID_PADDING = 20;
const GAP = 16;
const ITEM_WIDTH = (width - (GRID_PADDING * 2) - (GAP * 2)) / 3;

export default function BadgesScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [earnedBadgeIds, setEarnedBadgeIds] = useState<string[]>([]);
    const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            const { user } = await fetchCurrentUserAndProfile();
            if (user) {
                const ids = await fetchUserBadges(user.id);
                setEarnedBadgeIds(ids);
            }
            setLoading(false);
        };
        load();
    }, []);

    const handleBadgePress = (badge: Badge) => {
        setSelectedBadge(badge);
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#020617' }}>
            <StatusBar barStyle="light-content" />
            <BackgroundLayout>
                <Stack.Screen 
                    options={{
                        headerShown: false,
                        animation: 'slide_from_right',
                    }} 
                />
                
                <View style={[styles.header, { paddingTop: 10 }]}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ChevronLeft color="white" size={28} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Achievements</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView 
                    contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]} 
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryMain}>
                            <Trophy color={GitaColors.gold} size={32} />
                            <View>
                                <Text style={styles.summaryCount}>{earnedBadgeIds.length} / {BADGE_DEFINITIONS.length}</Text>
                                <Text style={styles.summaryLabel}>Badges Collected</Text>
                            </View>
                        </View>
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${(earnedBadgeIds.length / BADGE_DEFINITIONS.length) * 100}%` }]} />
                        </View>
                    </View>

                    <View style={styles.grid}>
                        {BADGE_DEFINITIONS.map((badge) => {
                            const isEarned = earnedBadgeIds.includes(badge.id);
                            const BadgeIcon = BADGE_ICONS[badge.icon] || Star;
                            
                            return (
                                <TouchableOpacity 
                                    key={badge.id}
                                    style={[styles.badgeItem, { width: ITEM_WIDTH }]}
                                    activeOpacity={0.8}
                                    onPress={() => handleBadgePress(badge)}
                                >
                                    <View style={[styles.badgeCircle, !isEarned && styles.badgeCircleLocked]}>
                                        <BadgeIcon 
                                            size={30} 
                                            color={isEarned ? GitaColors.gold : 'rgba(255,255,255,0.1)'} 
                                            strokeWidth={isEarned ? 2 : 1.5}
                                        />
                                        {!isEarned && (
                                            <View style={styles.lockBadge}>
                                                <Lock size={10} color="white" />
                                            </View>
                                        )}
                                        {isEarned && <View style={styles.earnedGlow} />}
                                    </View>
                                    <Text style={[styles.badgeTitle, !isEarned && styles.lockedText]} numberOfLines={1}>
                                        {badge.title}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* Badge Detail Modal */}
                <Modal
                    visible={!!selectedBadge}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setSelectedBadge(null)}
                >
                    <View style={styles.modalOverlay}>
                        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                        <TouchableOpacity 
                            style={StyleSheet.absoluteFill} 
                            activeOpacity={1} 
                            onPress={() => setSelectedBadge(null)} 
                        />
                        
                        {selectedBadge && (
                            <View style={styles.modalContent}>
                                <TouchableOpacity 
                                    style={styles.modalClose} 
                                    onPress={() => setSelectedBadge(null)}
                                >
                                    <X color="white" size={24} />
                                </TouchableOpacity>

                                <View style={styles.modalIconContainer}>
                                    {(() => {
                                        const Icon = BADGE_ICONS[selectedBadge.icon] || Star;
                                        const isEarned = earnedBadgeIds.includes(selectedBadge.id);
                                        return (
                                            <>
                                                <Icon 
                                                    size={64} 
                                                    color={isEarned ? GitaColors.gold : 'rgba(255,255,255,0.2)'} 
                                                    strokeWidth={1.5}
                                                />
                                                {isEarned && <View style={styles.modalIconGlow} />}
                                            </>
                                        );
                                    })()}
                                </View>

                                <Text style={styles.modalTitle}>{selectedBadge.title}</Text>
                                <View style={styles.statusBadge}>
                                    <Text style={[styles.statusText, { color: earnedBadgeIds.includes(selectedBadge.id) ? '#4ade80' : 'rgba(255,255,255,0.4)' }]}>
                                        {earnedBadgeIds.includes(selectedBadge.id) ? 'UNLOCKED' : 'LOCKED'}
                                    </Text>
                                </View>

                                <Text style={styles.modalDescription}>{selectedBadge.description}</Text>
                                
                                {!earnedBadgeIds.includes(selectedBadge.id) && (
                                    <View style={styles.criteriaBox}>
                                        <Target size={16} color={GitaColors.gold} />
                                        <Text style={styles.criteriaText}>Continue your journey to unlock this achievement.</Text>
                                    </View>
                                )}

                                <TouchableOpacity 
                                    style={styles.modalButton} 
                                    onPress={() => setSelectedBadge(null)}
                                >
                                    <Text style={styles.modalButtonText}>Close</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </Modal>
            </BackgroundLayout>
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 20,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: '700',
        fontFamily: Fonts.serif,
    },
    scrollContent: {
        paddingHorizontal: GRID_PADDING,
    },
    summaryCard: {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 24,
        padding: 24,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    summaryMain: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        marginBottom: 20,
    },
    summaryCount: {
        color: 'white',
        fontSize: 28,
        fontWeight: '800',
        fontFamily: Fonts.serif,
        lineHeight: 32,
    },
    summaryLabel: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 14,
        fontWeight: '600',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: GitaColors.gold,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: GAP,
    },
    badgeItem: {
        alignItems: 'center',
        marginBottom: 24,
    },
    badgeCircle: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: 'rgba(251, 191, 36, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.15)',
        position: 'relative',
    },
    badgeCircleLocked: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.08)',
    },
    earnedGlow: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        borderRadius: 38,
        backgroundColor: 'rgba(251, 191, 36, 0.03)',
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.2)',
    },
    lockBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#0f172a',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    badgeTitle: {
        color: 'white',
        fontSize: 13,
        fontWeight: '700',
        fontFamily: Fonts.serif,
        textAlign: 'center',
    },
    lockedText: {
        color: 'rgba(255,255,255,0.3)',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        backgroundColor: '#0f172a',
        borderRadius: 32,
        padding: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.2)',
    },
    modalClose: {
        position: 'absolute',
        top: 20,
        right: 20,
        padding: 8,
    },
    modalIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(251, 191, 36, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        position: 'relative',
    },
    modalIconGlow: {
        position: 'absolute',
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 1,
        borderColor: 'rgba(251, 191, 36, 0.1)',
    },
    modalTitle: {
        color: 'white',
        fontSize: 28,
        fontWeight: '800',
        fontFamily: Fonts.serif,
        marginBottom: 8,
        textAlign: 'center',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 99,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginBottom: 20,
    },
    statusText: {
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 2,
    },
    modalDescription: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    criteriaBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(251, 191, 36, 0.05)',
        padding: 16,
        borderRadius: 16,
        marginBottom: 32,
        width: '100%',
    },
    criteriaText: {
        color: 'rgba(251, 191, 36, 0.8)',
        fontSize: 13,
        flex: 1,
        fontWeight: '500',
    },
    modalButton: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        height: 56,
        borderRadius: 18,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});
