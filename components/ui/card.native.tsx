// @ts-nocheck
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React from 'react';
import { StyleSheet, View } from 'react-native';

const Card = React.forwardRef(({ children, style, ...props }, ref) => (
  <ThemedView ref={ref} style={[styles.card, style]} {...props}>
    {children}
  </ThemedView>
));
Card.displayName = 'Card';

const CardHeader = React.forwardRef(({ children, style, ...props }, ref) => (
  <View ref={ref} style={[styles.header, style]} {...props}>
    {children}
  </View>
));
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef(({ children, style, ...props }, ref) => (
  <ThemedText ref={ref} style={[styles.title, style]} {...props}>{children}</ThemedText>
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef(({ children, style, ...props }, ref) => (
  <ThemedText ref={ref} style={[styles.description, style]} {...props}>{children}</ThemedText>
));
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef(({ children, style, ...props }, ref) => (
  <View ref={ref} style={[styles.content, style]} {...props}>{children}</View>
));
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef(({ children, style, ...props }, ref) => (
  <View ref={ref} style={[styles.footer, style]} {...props}>{children}</View>
));
CardFooter.displayName = 'CardFooter';

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 0,
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(71,85,105,0.12)'
  },
  header: { padding: 16 },
  title: { fontSize: 16, fontWeight: '700', color: '#fcd34d' },
  description: { fontSize: 13, color: 'rgba(254,243,199,0.8)' },
  content: { padding: 16 },
  footer: { padding: 12, flexDirection: 'row', alignItems: 'center' },
});

export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };



