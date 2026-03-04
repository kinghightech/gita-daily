// @ts-nocheck
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const Menubar = React.forwardRef(({ children, style }, ref) => (
  <View ref={ref} style={[styles.menubar, style]}>{children}</View>
));
Menubar.displayName = 'Menubar';

const MenubarMenu = ({ children }) => <View>{children}</View>;

const MenubarTrigger = ({ children, onPress, style }) => (
  <Pressable style={[styles.trigger, style]} onPress={onPress}>
    {typeof children === 'string' ? <Text style={styles.triggerText}>{children}</Text> : children}
  </Pressable>
);

const MenubarContent = ({ children, style }) => (
  <View style={[styles.content, style]}>{children}</View>
);

const MenubarItem = ({ children, onPress, style }) => (
  <Pressable style={[styles.item, style]} onPress={onPress}>
    {typeof children === 'string' ? <Text style={styles.itemText}>{children}</Text> : children}
  </Pressable>
);

const MenubarGroup = ({ children }) => <View>{children}</View>;
const MenubarPortal = ({ children }) => <>{children}</>;
const MenubarRadioGroup = ({ children }) => <View>{children}</View>;
const MenubarSub = ({ children }) => <View>{children}</View>;
const MenubarSubContent = ({ children, style }) => <View style={[styles.subContent, style]}>{children}</View>;
const MenubarSubTrigger = ({ children, style }) => <Pressable style={[styles.subTrigger, style]}>{children}</Pressable>;
const MenubarCheckboxItem = ({ children, checked, onPress, style }) => <Pressable style={[styles.item, style]} onPress={onPress}>{children}</Pressable>;
const MenubarRadioItem = ({ children, checked, onPress, style }) => <Pressable style={[styles.item, style]} onPress={onPress}>{children}</Pressable>;
const MenubarLabel = ({ children, style }) => <Text style={[styles.label, style]}>{children}</Text>;
const MenubarSeparator = ({ style }) => <View style={[styles.separator, style]} />;
const MenubarShortcut = ({ children, style }) => <Text style={[styles.shortcut, style]}>{children}</Text>;

const styles = StyleSheet.create({
  menubar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 45,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    backgroundColor: '#0f172a',
  },
  trigger: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  triggerText: {
    fontSize: 14,
    color: '#e6e7e9',
  },
  content: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginTop: 4,
    minWidth: 160,
  },
  item: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemText: {
    fontSize: 14,
    color: '#e6e7e9',
  },
  subContent: {
    marginLeft: 12,
  },
  subTrigger: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
  shortcut: {
    fontSize: 12,
    color: '#64748b',
  },
});

export {
    Menubar, MenubarCheckboxItem, MenubarContent, MenubarGroup, MenubarItem, MenubarLabel, MenubarMenu, MenubarPortal,
    MenubarRadioGroup, MenubarRadioItem, MenubarSeparator,
    MenubarShortcut, MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger, MenubarTrigger
};



