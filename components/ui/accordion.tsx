// @ts-nocheck
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ChevronDown } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, View } from 'react-native';

/**
 * Custom Accordion component for React Native
 * Manages internal state for expanded/collapsed items
 */
const Accordion = ({ children, ...props }) => {
  const [expandedId, setExpandedId] = useState(null);

  const handleToggle = useCallback((id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  }, [expandedId]);

  return (
    <ThemedView style={styles.accordionContainer} {...props}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { expandedId, onToggle: handleToggle })
      )}
    </ThemedView>
  );
};

const AccordionItem = ({ id, children, expandedId, onToggle, ...props }) => {
  return (
    <View style={styles.itemContainer} {...props}>
      {React.Children.map(children, (child) =>
        React.cloneElement(child, { id, expandedId, onToggle })
      )}
    </View>
  );
};

const AccordionTrigger = ({ children, id, expandedId, onToggle, ...props }) => {
  const isExpanded = expandedId === id;

  return (
    <Pressable
      onPress={() => onToggle(id)}
      style={styles.trigger}
      {...props}
    >
      <View style={styles.triggerContent}>
        <ThemedText style={styles.triggerText}>{children}</ThemedText>
      </View>
      <ChevronDown
        size={16}
        color="rgba(100, 116, 139, 0.8)"
        style={[
          styles.chevron,
          isExpanded && styles.chevronRotated,
        ]}
      />
    </Pressable>
  );
};

const AccordionContent = ({ children, id, expandedId, ...props }) => {
  const isExpanded = expandedId === id;

  if (!isExpanded) {
    return null;
  }

  return (
    <View style={styles.contentContainer} {...props}>
      <ThemedText style={styles.contentText}>{children}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  accordionContainer: {
    width: '100%',
  },
  itemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(71, 85, 105, 0.3)',
  },
  trigger: {
    paddingVertical: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triggerContent: {
    flex: 1,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fcd34d',
  },
  chevron: {
    marginLeft: 8,
    transition: 'transform 0.2s ease-in-out',
  },
  chevronRotated: {
    transform: [{ rotate: '180deg' }],
  },
  contentContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 16,
    backgroundColor: 'rgba(30, 41, 59, 0.2)',
  },
  contentText: {
    fontSize: 13,
    color: 'rgba(254, 243, 199, 0.8)',
    lineHeight: 20,
  },
});

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };




