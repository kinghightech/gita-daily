// @ts-nocheck
import React, { useState } from 'react';
import { View, Pressable, Text, StyleSheet, FlatList } from 'react-native';

const Tabs = ({ children, defaultValue, onValueChange }) => {
  const [activeTab, setActiveTab] = useState(defaultValue);

  const handleTabChange = (value) => {
    setActiveTab(value);
    onValueChange?.(value);
  };

  return (
    <View>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { activeTab, onTabChange: handleTabChange })
      )}
    </View>
  );
};

const TabsList = React.forwardRef(({ children, style, activeTab, onTabChange }, ref) => (
  <View ref={ref} style={[styles.list, style]}>
    {React.Children.map(children, (child) =>
      React.cloneElement(child, { activeTab, onTabChange })
    )}
  </View>
));
TabsList.displayName = 'TabsList';

const TabsTrigger = ({ value, children, activeTab, onTabChange, style }) => (
  <Pressable
    style={[
      styles.trigger,
      activeTab === value ? styles.triggerActive : styles.triggerInactive,
      style,
    ]}
    onPress={() => onTabChange?.(value)}
  >
    <Text
      style={[
        styles.triggerText,
        activeTab === value ? styles.triggerTextActive : styles.triggerTextInactive,
      ]}
    >
      {children}
    </Text>
    {activeTab === value && <View style={styles.triggerIndicator} />}
  </Pressable>
);

const TabsContent = React.forwardRef(({ value, children, activeTab, style }, ref) => (
  activeTab === value ? (
    <View ref={ref} style={[styles.content, style]}>
      {children}
    </View>
  ) : null
));
TabsContent.displayName = 'TabsContent';

const styles = StyleSheet.create({
  list: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  trigger: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerActive: {
    borderBottomColor: '#fbbf24',
  },
  triggerInactive: {
    borderBottomColor: 'transparent',
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  triggerTextActive: {
    color: '#fbbf24',
  },
  triggerTextInactive: {
    color: '#cbd5e1',
  },
  triggerIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: '#fbbf24',
  },
  content: {
    paddingVertical: 12,
  },
});

export { Tabs, TabsList, TabsTrigger, TabsContent };


