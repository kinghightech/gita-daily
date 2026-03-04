// @ts-nocheck
import { Check, ChevronRight, Circle } from 'lucide-react-native';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const DropdownMenu = ({ children }) => {
  return <View>{children}</View>;
};

const DropdownMenuTrigger = ({ children, onPress }) => (
  <Pressable onPress={onPress}>{children}</Pressable>
);

const DropdownMenuGroup = ({ children }) => <View>{children}</View>;

const DropdownMenuPortal = ({ children }) => <>{children}</>;

const DropdownMenuSub = ({ children }) => <View>{children}</View>;

const DropdownMenuRadioGroup = ({ children }) => <View>{children}</View>;

const DropdownMenuSubTrigger = React.forwardRef(({ children, inset, style }, ref) => (
  <Pressable ref={ref} style={[styles.subTrigger, inset && styles.inset, style]}>
    <Text style={styles.itemText}>{children}</Text>
    <ChevronRight size={16} color="#cbd5e1" />
  </Pressable>
));
DropdownMenuSubTrigger.displayName = 'DropdownMenuSubTrigger';

const DropdownMenuSubContent = React.forwardRef(({ children, style }, ref) => (
  <View ref={ref} style={[styles.subContent, style]}>
    {children}
  </View>
));
DropdownMenuSubContent.displayName = 'DropdownMenuSubContent';

const DropdownMenuContent = React.forwardRef(({ children, style }, ref) => (
  <View ref={ref} style={[styles.content, style]}>
    {children}
  </View>
));
DropdownMenuContent.displayName = 'DropdownMenuContent';

const DropdownMenuItem = React.forwardRef(({ children, inset, onPress, style }, ref) => (
  <Pressable ref={ref} onPress={onPress} style={[styles.item, inset && styles.inset, style]}>
    <Text style={styles.itemText}>{children}</Text>
  </Pressable>
));
DropdownMenuItem.displayName = 'DropdownMenuItem';

const DropdownMenuCheckboxItem = React.forwardRef(({ children, checked, onPress, style }, ref) => (
  <Pressable ref={ref} onPress={onPress} style={[styles.checkboxItem, style]}>
    {checked && <Check size={16} color="#fbbf24" />}
    <Text style={styles.itemText}>{children}</Text>
  </Pressable>
));
DropdownMenuCheckboxItem.displayName = 'DropdownMenuCheckboxItem';

const DropdownMenuRadioItem = React.forwardRef(({ children, checked, onPress, style }, ref) => (
  <Pressable ref={ref} onPress={onPress} style={[styles.radioItem, style]}>
    {checked && <Circle size={8} fill="#fbbf24" color="#fbbf24" />}
    <Text style={styles.itemText}>{children}</Text>
  </Pressable>
));
DropdownMenuRadioItem.displayName = 'DropdownMenuRadioItem';

const DropdownMenuLabel = React.forwardRef(({ children, inset, style }, ref) => (
  <Text ref={ref} style={[styles.label, inset && styles.inset, style]}>
    {children}
  </Text>
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

const DropdownMenuSeparator = React.forwardRef(({ style }, ref) => (
  <View ref={ref} style={[styles.separator, style]} />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

const DropdownMenuShortcut = ({ children, style }) => (
  <Text style={[styles.shortcut, style]}>{children}</Text>
);
DropdownMenuShortcut.displayName = 'DropdownMenuShortcut';

const styles = StyleSheet.create({
  content: {
    backgroundColor: '#292e3e',
    borderRadius: 8,
    overflow: 'hidden',
    minWidth: 120,
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 14,
    color: '#e6e7e9',
  },
  inset: {
    paddingLeft: 28,
  },
  subTrigger: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subContent: {
    marginLeft: 12,
  },
  checkboxItem: {
    paddingVertical: 10,
    paddingLeft: 28,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioItem: {
    paddingVertical: 10,
    paddingLeft: 28,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  separator: {
    height: 1,
    backgroundColor: '#475569',
    marginVertical: 4,
  },
  shortcut: {
    fontSize: 12,
    opacity: 0.6,
    color: '#cbd5e1',
  },
});

export {
    DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator,
    DropdownMenuShortcut, DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger, DropdownMenuTrigger
};



