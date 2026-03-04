// @ts-nocheck
import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Circle } from 'lucide-react-native';

const RadioGroup = React.forwardRef(({ children, value, onValueChange, style }, ref) => (
  <View ref={ref} style={[styles.group, style]}>
    {React.Children.map(children, (child) =>
      React.cloneElement(child, { value, onValueChange })
    )}
  </View>
));
RadioGroup.displayName = 'RadioGroup';

const RadioGroupItem = React.forwardRef(({ value, onValueChange, style, label, disabled }, ref) => {
  const isSelected = value === label;

  return (
    <Pressable
      ref={ref}
      style={[styles.item, style]}
      onPress={() => !disabled && onValueChange?.(label)}
      disabled={disabled}
    >
      <View style={[styles.radio, isSelected && styles.radioSelected]}>
        {isSelected && <Circle size={12} color="#1e293b" fill="#1e293b" />}
      </View>
    </Pressable>
  );
});
RadioGroupItem.displayName = 'RadioGroupItem';

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#fbbf24',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    backgroundColor: '#fbbf24',
    borderColor: '#fbbf24',
  },
});

export { RadioGroup, RadioGroupItem };


