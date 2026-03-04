// @ts-nocheck
import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

const Drawer = ({ children, open }) => {
  return (
    <Modal visible={open} transparent animationType="none">
      {children}
    </Modal>
  );
};

Drawer.displayName = 'Drawer';

const DrawerTrigger = ({ children, onPress }) => (
  <Pressable onPress={onPress}>{children}</Pressable>
);

const DrawerPortal = ({ children }) => <>{children}</>;

const DrawerClose = ({ onPress, children }) => (
  <Pressable onPress={onPress}>{children}</Pressable>
);

const DrawerOverlay = React.forwardRef(({ onPress, style }, ref) => (
  <Pressable ref={ref} onPress={onPress} style={[styles.overlay, style]} />
));
DrawerOverlay.displayName = 'DrawerOverlay';

const DrawerContent = React.forwardRef(({ children, style }, ref) => (
  <View ref={ref} style={[styles.content, style]}>
    <View style={styles.handle} />
    {children}
  </View>
));
DrawerContent.displayName = 'DrawerContent';

const DrawerHeader = ({ children, style }) => (
  <View style={[styles.header, style]}>{children}</View>
);
DrawerHeader.displayName = 'DrawerHeader';

const DrawerFooter = ({ children, style }) => (
  <View style={[styles.footer, style]}>{children}</View>
);
DrawerFooter.displayName = 'DrawerFooter';

const DrawerTitle = React.forwardRef(({ children, style }, ref) => (
  <Text ref={ref} style={[styles.title, style]}>
    {children}
  </Text>
));
DrawerTitle.displayName = 'DrawerTitle';

const DrawerDescription = React.forwardRef(({ children, style }, ref) => (
  <Text ref={ref} style={[styles.description, style]}>
    {children}
  </Text>
));
DrawerDescription.displayName = 'DrawerDescription';

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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#64748b',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
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
    Drawer, DrawerClose,
    DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerPortal, DrawerTitle, DrawerTrigger
};


