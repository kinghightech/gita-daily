import { useTheme } from '@/hooks/useTheme';
import {
  PRAYER_PLAYBACK_TAB_BAR_EVENT,
  type PrayerPlaybackTabBarPayload,
} from '@/lib/prayerPlaybackEvents';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { Tabs } from 'expo-router';
import { BookOpen, GraduationCap, Home, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { DeviceEventEmitter, Pressable, StyleSheet, Text, useColorScheme, useWindowDimensions, View } from 'react-native';
import Reanimated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const VISIBLE_TABS = ['index', 'read', 'learn', 'prayer', 'profile'];
const BAR_HORIZONTAL_MARGIN = 24;
const BAR_MAX_WIDTH = 382;
const BAR_PADDING = 8;
const TAB_GAP = 4;

export default function TabLayout() {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme !== 'light';
  const inactiveTint = isDark ? 'rgba(254,243,199,0.5)' : 'rgba(61,43,31,0.58)';

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: inactiveTint,
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: 'below-icon',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Home size={25} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen name="verses" options={{ href: null }} />
      <Tabs.Screen
        name="read"
        options={{
          title: 'Read',
          tabBarIcon: ({ color, focused }) => (
            <BookOpen size={25} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color, focused }) => (
            <GraduationCap size={27} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen
        name="prayer"
        options={{
          title: 'Prayer',
          tabBarIcon: ({ color, focused }) => (
            <MaterialCommunityIcons name="hands-pray" size={focused ? 28 : 27} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <User size={25} color={color} strokeWidth={focused ? 2.5 : 2} />
          ),
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDark = colorScheme !== 'light';
  const visibleRoutes = state.routes.filter((route) => VISIBLE_TABS.includes(route.name));
  const activeRouteKey = state.routes[state.index]?.key;
  const activeRouteName = state.routes[state.index]?.name;
  const activeIndex = Math.max(visibleRoutes.findIndex((route) => route.key === activeRouteKey), 0);
  const inactiveTint = isDark ? 'rgba(254,243,199,0.58)' : 'rgba(61,43,31,0.62)';
  const barWidth = Math.min(width - BAR_HORIZONTAL_MARGIN * 2, BAR_MAX_WIDTH);
  const tabWidth =
    (barWidth - BAR_PADDING * 2 - TAB_GAP * (visibleRoutes.length - 1)) / visibleRoutes.length;
  const styles = createTabBarStyles(
    isDark,
    Math.max(insets.bottom - 5, 12),
    barWidth,
    Math.max((width - barWidth) / 2, 16),
    tabWidth,
  );
  const reduceMotion = useReducedMotion();
  const [hideForPrayerPlayback, setHideForPrayerPlayback] = useState(false);
  const shouldHideTabBar = activeRouteName === 'prayer' && hideForPrayerPlayback;
  const highlightX = useSharedValue(activeIndex * (tabWidth + TAB_GAP));
  const tabBarOffset = useSharedValue(0);
  const tabBarOpacity = useSharedValue(1);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener(
      PRAYER_PLAYBACK_TAB_BAR_EVENT,
      (payload: PrayerPlaybackTabBarPayload) => {
        setHideForPrayerPlayback(payload.hidden === true);
      },
    );

    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (activeRouteName !== 'prayer' && hideForPrayerPlayback) {
      setHideForPrayerPlayback(false);
    }
  }, [activeRouteName, hideForPrayerPlayback]);

  useEffect(() => {
    const nextX = activeIndex * (tabWidth + TAB_GAP);

    if (reduceMotion) {
      highlightX.value = nextX;
      return;
    }

    highlightX.value = withSpring(nextX, {
      damping: 30,
      mass: 0.62,
      stiffness: 420,
    });
  }, [activeIndex, highlightX, reduceMotion, tabWidth]);

  useEffect(() => {
    const hiddenOffset = 96 + insets.bottom;

    if (reduceMotion) {
      tabBarOffset.value = shouldHideTabBar ? hiddenOffset : 0;
      tabBarOpacity.value = shouldHideTabBar ? 0 : 1;
      return;
    }

    tabBarOffset.value = withTiming(shouldHideTabBar ? hiddenOffset : 0, {
      duration: shouldHideTabBar ? 240 : 280,
      easing: Easing.out(Easing.cubic),
    });
    tabBarOpacity.value = withTiming(shouldHideTabBar ? 0 : 1, {
      duration: shouldHideTabBar ? 180 : 220,
      easing: Easing.out(Easing.cubic),
    });
  }, [insets.bottom, reduceMotion, shouldHideTabBar, tabBarOffset, tabBarOpacity]);

  const highlightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: highlightX.value }],
  }));

  const tabBarAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tabBarOpacity.value,
    transform: [{ translateY: tabBarOffset.value }],
  }));

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <Reanimated.View
        pointerEvents={shouldHideTabBar ? 'none' : 'auto'}
        style={[styles.tabBar, tabBarAnimatedStyle]}
      >
        <View style={styles.tabsTrack}>
          <Reanimated.View pointerEvents="none" style={[styles.activeHighlight, highlightStyle]} />
          {visibleRoutes.map((route) => {
            const options = descriptors[route.key]?.options ?? {};
            const isFocused = route.key === activeRouteKey;
            const label =
              typeof options.tabBarLabel === 'string'
                ? options.tabBarLabel
                : options.title ?? route.name;
            const color = isFocused ? theme.primary : inactiveTint;

            const onPress = () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarButtonTestID}
                onPress={onPress}
                style={styles.tabItem}
              >
                <View style={styles.iconSlot}>
                  {options.tabBarIcon?.({ focused: isFocused, color, size: isFocused ? 25 : 24 })}
                </View>
                <Text numberOfLines={1} style={[styles.tabLabel, { color }]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Reanimated.View>
    </View>
  );
}

const createTabBarStyles = (
  isDark: boolean,
  bottom: number,
  width: number,
  left: number,
  tabWidth: number,
) => StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left,
    bottom,
    width,
    height: 64,
    paddingHorizontal: BAR_PADDING,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderTopWidth: 1,
    borderColor: isDark ? 'rgba(251,191,36,0.18)' : 'rgba(217,119,6,0.24)',
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: isDark ? 'rgba(18,18,18,0.88)' : 'rgba(255,252,244,0.96)',
    shadowColor: isDark ? '#000000' : '#7C4A03',
    shadowOpacity: isDark ? 0.34 : 0.13,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  tabsTrack: {
    width: width - BAR_PADDING * 2,
    height: 52,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: TAB_GAP,
  },
  tabItem: {
    width: tabWidth,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  activeHighlight: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: tabWidth,
    height: 52,
    borderRadius: 26,
    backgroundColor: isDark ? 'rgba(251,191,36,0.08)' : 'rgba(251,191,36,0.14)',
  },
  iconSlot: {
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
  },
});
