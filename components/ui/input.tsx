// @ts-nocheck
import React from 'react';
import { StyleSheet, TextInput } from 'react-native';

const Input = React.forwardRef(({ style, ...props }, ref) => (
  <TextInput ref={ref} style={[styles.input, style]} {...props} />
));

Input.displayName = 'Input';

const styles = StyleSheet.create({
  input: {
    height: 42,
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#e6e7e9',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(71,85,105,0.12)'
  }
});

export { Input };



