// @ts-nocheck
import React, { useState } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';

const HoverCard = ({ children }) => {
  const [visible, setVisible] = useState(false);
  return (
    <View>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { visible, setVisible })
      )}
    </View>
  );
};

const HoverCardTrigger = ({ children, onPress, setVisible }) => (
  <Pressable 
    onPress={onPress}
    onLongPress={() => setVisible?.(true)}
  >
    {children}
  </Pressable>
);

const HoverCardContent = React.forwardRef(({ children, style, visible }, ref) => {
  return visible ? (
    <View ref={ref} style={[styles.content, style]}>
      {children}
    </View>
  ) : null;
});
HoverCardContent.displayName = 'HoverCardContent';

const styles = StyleSheet.create({
  content: {
    backgroundColor: '#292e3e',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
});

export { HoverCard, HoverCardTrigger, HoverCardContent };


