// @ts-nocheck
import { ThemedText } from '@/components/themed-text';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

const Checkbox = React.forwardRef(({ value, onValueChange, style, ...props }, ref) => {
  const checked = !!value;
  return (
    <Pressable ref={ref} onPress={() => onValueChange && onValueChange(!checked)} style={[styles.box, checked && styles.boxChecked, style]} {...props}>
      {checked && <ThemedText style={styles.check}>✓</ThemedText>}
    </Pressable>
  );
});

Checkbox.displayName = 'Checkbox';

const styles = StyleSheet.create({
  box: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(71,85,105,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  boxChecked: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  check: { color: '#111827', fontWeight: '700' },
});

export { Checkbox };



