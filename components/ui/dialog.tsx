// @ts-nocheck
import React, { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { X } from 'lucide-react-native';

const Dialog = ({ children, open, onOpenChange }) => {
  return (
    <Modal visible={open} transparent animationType="fade">
      {children}
    </Modal>
  );
};

const DialogTrigger = ({ children, onPress }) => (
  <Pressable onPress={onPress}>{children}</Pressable>
);

const DialogPortal = ({ children }) => <>{children}</>;

const DialogClose = ({ onPress, children }) => (
  <Pressable onPress={onPress}>{children}</Pressable>
);

const DialogOverlay = React.forwardRef(({ onPress, style }, ref) => (
  <Pressable ref={ref} onPress={onPress} style={[styles.overlay, style]} />
));
DialogOverlay.displayName = 'DialogOverlay';

const DialogContent = React.forwardRef(({ children, style }, ref) => (
  <View ref={ref} style={[styles.content, style]}>
    <View style={styles.closeContainer}>
      <DialogClose onPress={() => {}} style={styles.closeBtn}>
        <X size={20} color="#fff" />
      </DialogClose>
    </View>
    {children}
  </View>
));
DialogContent.displayName = 'DialogContent';

const DialogHeader = ({ children, style }) => (
  <View style={[styles.header, style]}>{children}</View>
);
DialogHeader.displayName = 'DialogHeader';

const DialogFooter = ({ children, style }) => (
  <View style={[styles.footer, style]}>{children}</View>
);
DialogFooter.displayName = 'DialogFooter';

const DialogTitle = React.forwardRef(({ children, style }, ref) => (
  <Text ref={ref} style={[styles.title, style]}>
    {children}
  </Text>
));
DialogTitle.displayName = 'DialogTitle';

const DialogDescription = React.forwardRef(({ children, style }, ref) => (
  <Text ref={ref} style={[styles.description, style]}>
    {children}
  </Text>
));
DialogDescription.displayName = 'DialogDescription';

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 24,
  },
  closeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  closeBtn: {
    padding: 8,
  },
  header: {
    marginBottom: 12,
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  description: {
    fontSize: 14,
    color: '#cbd5e1',
  },
});

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};


