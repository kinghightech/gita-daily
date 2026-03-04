// @ts-nocheck
import { ThemedText } from '@/components/themed-text';
import React from 'react';
import { StyleSheet } from 'react-native';

const Label = React.forwardRef(({ children, style, ...props }, ref) => (
  <ThemedText ref={ref} style={[styles.label, style]} {...props}>{children}</ThemedText>
));

Label.displayName = 'Label';

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: '600', color: 'rgba(254,243,199,0.85)' },
});

export { Label };



