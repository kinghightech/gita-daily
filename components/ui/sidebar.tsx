// @ts-nocheck
import { ScrollView, StyleSheet, View } from 'react-native';

const Sidebar = ({ children, ...props }) => (
  <ScrollView style={styles.sidebar} {...props}>{children}</ScrollView>
);

const SidebarContent = ({ children, ...props }) => (
  <View style={styles.content} {...props}>{children}</View>
);

const SidebarFooter = ({ children, ...props }) => (
  <View style={styles.footer} {...props}>{children}</View>
);

const SidebarHeader = ({ children, ...props }) => (
  <View style={styles.header} {...props}>{children}</View>
);

const SidebarGroup = ({ children, ...props }) => (
  <View style={styles.group} {...props}>{children}</View>
);

const SidebarGroupContent = ({ children, ...props }) => (
  <View {...props}>{children}</View>
);

const SidebarGroupLabel = ({ children, ...props }) => (
  <View {...props}>{children}</View>
);

const SidebarMenu = ({ children, ...props }) => (
  <View style={styles.menu} {...props}>{children}</View>
);

const SidebarMenuButton = ({ children, ...props }) => (
  <View style={styles.menuButton} {...props}>{children}</View>
);

const SidebarMenuItem = ({ children, ...props }) => (
  <View style={styles.menuItem} {...props}>{children}</View>
);

const SidebarMenuSubButton = ({ children, ...props }) => (
  <View style={styles.subButton} {...props}>{children}</View>
);

const SidebarMenuSub = ({ children, ...props }) => (
  <View style={styles.sub} {...props}>{children}</View>
);

const SidebarRail = ({ children, ...props }) => (
  <View style={styles.rail} {...props}>{children}</View>
);

const styles = StyleSheet.create({
  sidebar: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 12,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    padding: 12,
  },
  header: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  group: {
    marginVertical: 8,
  },
  menu: {
    gap: 4,
  },
  menuButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  menuItem: {
    marginVertical: 4,
  },
  subButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 12,
  },
  sub: {
    marginLeft: 12,
  },
  rail: {
    width: 60,
    backgroundColor: '#0f172a',
  },
});

export {
    Sidebar,
    SidebarContent,
    SidebarFooter, SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel, SidebarHeader, SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarRail
};


