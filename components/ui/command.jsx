import { Search } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const Command = React.forwardRef(({ children, style }, ref) => (
  <View ref={ref} style={[styles.command, style]}>
    {children}
  </View>
));
Command.displayName = 'Command';

const CommandDialog = ({ children, open, onOpenChange }) => (
  open ? (
    <View style={styles.dialog}>
      {children}
    </View>
  ) : null
);

const CommandInput = React.forwardRef(({ placeholder, onValueChange, style }, ref) => (
  <View style={styles.inputContainer}>
    <Search size={16} color="#cbd5e1" />
    <TextInput
      ref={ref}
      placeholder={placeholder}
      onChangeText={onValueChange}
      style={[styles.input, style]}
      placeholderTextColor="#64748b"
    />
  </View>
));
CommandInput.displayName = 'CommandInput';

const CommandList = React.forwardRef(({ children, style }, ref) => (
  <ScrollView ref={ref} style={[styles.list, style]}>
    {children}
  </ScrollView>
));
CommandList.displayName = 'CommandList';

const CommandEmpty = ({ children, style }) => (
  <Text style={[styles.empty, style]}>{children}</Text>
);

const CommandGroup = ({ children, heading, style }) => (
  <View style={[styles.group, style]}>
    {heading && <Text style={styles.groupHeading}>{heading}</Text>}
    {children}
  </View>
);

const CommandItem = ({ children, onSelect, style }) => (
  <Pressable style={[styles.item, style]} onPress={() => onSelect?.()}>
    {typeof children === 'string' ? <Text style={styles.itemText}>{children}</Text> : children}
  </Pressable>
);

const CommandSeparator = ({ style }) => (
  <View style={[styles.separator, style]} />
);

const CommandShortcut = ({ children, style }) => (
  <Text style={[styles.shortcut, style]}>{children}</Text>
);

const styles = StyleSheet.create({
  command: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  dialog: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1e293b',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  input: {
    flex: 1,
    height: 48,
    marginLeft: 8,
    color: '#e6e7e9',
    fontSize: 14,
  },
  list: {
    maxHeight: 300,
  },
  empty: {
    textAlign: 'center',
    paddingVertical: 12,
    color: '#64748b',
  },
  group: {
    paddingVertical: 8,
  },
  groupHeading: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  item: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  itemText: {
    fontSize: 14,
    color: '#e6e7e9',
  },
  separator: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 4,
  },
  shortcut: {
    fontSize: 12,
    color: '#64748b',
  },
});

export {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
};

