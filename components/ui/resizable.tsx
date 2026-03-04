// @ts-nocheck
import { GripVertical } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

// Resizable panels are a desktop pattern - simplified for mobile
const ResizableHandle = ({ onDrag, style, ...props }) => (
  <View style={[styles.handle, style]} {...props}>
    <GripVertical size={16} color="#cbd5e1" />
  </View>
);

const Resizable = ({ children, style, ...props }) => (
  <View style={[styles.container, style]} {...props}>{children}</View>
);

const ResizablePanel = ({ children, style, ...props }) => (
  <View style={[styles.panel, style]} {...props}>{children}</View>
);

const ResizablePanelGroup = ({ children, direction = 'vertical', style, ...props }) => (
  <View 
    style={[
      styles.group,
      direction === 'horizontal' ? { flexDirection: 'row' } : {},
      style
    ]} 
    {...props}
  >
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  handle: {
    width: 6,
    height: 6,
    backgroundColor: '#cbd5e1',
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  group: {
    flex: 1,
  },
  panel: {
    flex: 1,
  },
});

export { Resizable, ResizableHandle, ResizablePanel, ResizablePanelGroup };


