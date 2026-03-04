// @ts-nocheck
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const badgeVariants = {
  default: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
  secondary: {
    backgroundColor: '#475569',
    borderColor: '#475569',
  },
  destructive: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: '#cbd5e1',
  },
};

const badgeTextVariants = {
  default: { color: '#111827' },
  secondary: { color: '#e6e7e9' },
  destructive: { color: '#fef2f2' },
  outline: { color: '#cbd5e1' },
};

function Badge({ variant = 'default', children, style, ...props }) {
  return (
    <View
      style={[
        styles.badge,
        badgeVariants[variant] || badgeVariants.default,
        style,
      ]}
      {...props}
    >
      <Text
        style={[
          styles.text,
          badgeTextVariants[variant] || badgeTextVariants.default,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export { Badge, badgeVariants };


