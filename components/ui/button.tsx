// @ts-nocheck
import { ThemedText } from '@/components/themed-text';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';

// Minimal Button for React Native. Keep export shape similar to web version.
function buttonVariants() {
  // placeholder for compatibility; web code expecting this can still import it
  return '';
}

const Button: any = React.forwardRef(({ children, onPress, disabled, style, variant, size, ...props }, ref) => {
  return (
    <Pressable ref={ref} onPress={onPress} disabled={disabled} style={({ pressed }) => [styles.btn, disabled && styles.disabled, pressed && styles.pressed, style]} {...props}>
      <ThemedText style={styles.text}>{children}</ThemedText>
    </Pressable>
  );
});

Button.displayName = 'Button';

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#111827',
    fontWeight: '700',
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
});

export { Button, buttonVariants };



