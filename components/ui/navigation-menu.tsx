// @ts-nocheck
import { ChevronDown } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const NavigationMenu = React.forwardRef(({ children, style }, ref) => (
  <ScrollView 
    ref={ref} 
    horizontal 
    showsHorizontalScrollIndicator={false}
    style={[styles.menu, style]}
  >
    {children}
  </ScrollView>
));
NavigationMenu.displayName = 'NavigationMenu';

const NavigationMenuList = React.forwardRef(({ children, style }, ref) => (
  <View ref={ref} style={[styles.list, style]}>
    {children}
  </View>
));
NavigationMenuList.displayName = 'NavigationMenuList';

const NavigationMenuItem = ({ children, style }) => (
  <View style={[styles.item, style]}>{children}</View>
);

const NavigationMenuTrigger = React.forwardRef(({ children, style, onPress }, ref) => (
  <Pressable ref={ref} style={[styles.trigger, style]} onPress={onPress}>
    <View style={styles.triggerContent}>
      {typeof children === 'string' ? <Text style={styles.triggerText}>{children}</Text> : children}
      <ChevronDown size={16} color="#cbd5e1" />
    </View>
  </Pressable>
));
NavigationMenuTrigger.displayName = 'NavigationMenuTrigger';

const NavigationMenuContent = ({ children, style }) => (
  <View style={[styles.content, style]}>{children}</View>
);

const NavigationMenuViewport = ({ style }) => (
  <View style={[styles.viewport, style]} />
);

const NavigationMenuLink = ({ children, onPress, style, active }) => (
  <Pressable style={[styles.link, active && styles.linkActive, style]} onPress={onPress}>
    {typeof children === 'string' ? <Text style={styles.linkText}>{children}</Text> : children}
  </Pressable>
);

const NavigationMenuIndicator = ({ style }) => (
  <View style={[styles.indicator, style]} />
);

const styles = StyleSheet.create({
  menu: {
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  list: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  item: {
    paddingHorizontal: 4,
  },
  trigger: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  triggerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  triggerText: {
    fontSize: 14,
    color: '#e6e7e9',
  },
  content: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 8,
  },
  viewport: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
  },
  link: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  linkActive: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  linkText: {
    fontSize: 14,
    color: '#e6e7e9',
  },
  indicator: {
    height: 2,
    backgroundColor: '#fbbf24',
    borderRadius: 1,
  },
});

export {
    NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, NavigationMenuViewport
};



