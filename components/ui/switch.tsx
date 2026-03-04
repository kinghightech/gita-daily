// @ts-nocheck
import React, { useState } from 'react';
import { View, Pressable, StyleSheet, Animated } from 'react-native';

const Switch = React.forwardRef(({ checked, onCheckedChange, disabled, style }, ref) => {
  const [isEnabled, setIsEnabled] = useState(checked || false);

  const handleToggle = () => {
    if (!disabled) {
      const newState = !isEnabled;
      setIsEnabled(newState);
      onCheckedChange?.(newState);
    }
  };

  return (
    <Pressable
      ref={ref}
      onPress={handleToggle}
      disabled={disabled}
      style={[
        styles.switch,
        isEnabled ? styles.switchOn : styles.switchOff,
        disabled && styles.switchDisabled,
        style,
      ]}
    >
      <View style={[styles.thumb, isEnabled && styles.thumbOn]} />
    </Pressable>
  );
});

Switch.displayName = 'Switch';

const styles = StyleSheet.create({
  switch: {
    width: 50,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 2,
    justifyContent: 'center',
  },
  switchOn: {
    backgroundColor: '#fbbf24',
  },
  switchOff: {
    backgroundColor: '#475569',
  },
  switchDisabled: {
    opacity: 0.5,
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignSelf: 'flex-start',
  },
  thumbOn: {
    alignSelf: 'flex-end',
  },
});

export { Switch };


