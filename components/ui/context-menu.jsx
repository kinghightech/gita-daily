import React from 'react';
import { View, Pressable, Modal, StyleSheet } from 'react-native';

// Context menus are typically right-click on web, long-press on mobile
const ContextMenu = ({ children }) => {
  const [visible, setVisible] = React.useState(false);
  return (
    <View>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { visible, setVisible })
      )}
    </View>
  );
};

const ContextMenuTrigger = ({ children, setVisible }) => (
  <Pressable 
    onLongPress={() => setVisible?.(true)}
    onPress={children?.type === 'function' ? () => {} : undefined}
  >
    {children}
  </Pressable>
);

const ContextMenuContent = ({ children, style, visible, setVisible }) => {
  return visible ? (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.overlay} onPress={() => setVisible?.(false)}>
        <View style={[styles.content, style]}>
          {children}
        </View>
      </Pressable>
    </Modal>
  ) : null;
};

const ContextMenuGroup = ({ children }) => <View>{children}</View>;
const ContextMenuRadioGroup = ({ children }) => <View>{children}</View>;
const ContextMenuSub = ({ children }) => <View>{children}</View>;
const ContextMenuSubContent = ({ children, style }) => <View style={[styles.subContent, style]}>{children}</View>;
const ContextMenuSubTrigger = ({ children, style }) => <Pressable style={[styles.item, style]}>{children}</Pressable>;
const ContextMenuItem = ({ children, onPress, style }) => <Pressable style={[styles.item, style]} onPress={onPress}>{children}</Pressable>;
const ContextMenuCheckboxItem = ({ children, checked, onPress, style }) => <Pressable style={[styles.item, style]} onPress={onPress}>{children}</Pressable>;
const ContextMenuRadioItem = ({ children, checked, onPress, style }) => <Pressable style={[styles.item, style]} onPress={onPress}>{children}</Pressable>;
const ContextMenuLabel = ({ children, style }) => <View style={[styles.label, style]}>{children}</View>;
const ContextMenuSeparator = ({ style }) => <View style={[styles.separator, style]} />;
const ContextMenuShortcut = ({ children }) => <View>{children}</View>;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  content: {
    backgroundColor: '#292e3e',
    borderRadius: 8,
    position: 'absolute',
    minWidth: 160,
  },
  subContent: {
    marginLeft: 8,
  },
  item: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  label: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  separator: {
    height: 1,
    backgroundColor: '#475569',
    marginVertical: 4,
  },
});

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuRadioGroup,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
};
