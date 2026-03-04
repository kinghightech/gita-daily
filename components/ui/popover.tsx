// @ts-nocheck
import React, { useState } from 'react';
import { Modal, View, Pressable, StyleSheet } from 'react-native';

const Popover = ({ children, open, onOpenChange }) => {
  return (
    <Modal visible={open} transparent animationType="fade">
      {children}
    </Modal>
  );
};

const PopoverTrigger = ({ children, onPress }) => (
  <Pressable onPress={onPress}>{children}</Pressable>
);

const PopoverAnchor = ({ children }) => <View>{children}</View>;

const PopoverContent = React.forwardRef(({ children, style, align = 'center', sideOffset = 4 }, ref) => (
  <Pressable style={styles.overlay}>
    <View ref={ref} style={[styles.content, style]}>
      {children}
    </View>
  </Pressable>
));
PopoverContent.displayName = 'PopoverContent';

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  content: {
    backgroundColor: '#292e3e',
    borderRadius: 8,
    padding: 16,
    width: '80%',
  },
});

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };


