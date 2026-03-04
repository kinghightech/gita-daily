import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

interface DailyQuoteSettingsProps {
  user: { full_name?: string; email?: string } | null;
  // Optional callbacks: if provided, will be called instead of performing network actions here
  onSendTest?: () => Promise<void> | void;
  onToggle?: (enabled: boolean) => Promise<void> | void;
}

export default function DailyQuoteSettings({ user, onSendTest, onToggle }: DailyQuoteSettingsProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [dailyEnabled, setDailyEnabled] = useState(false);

  useEffect(() => {
    // load preferences stub — replace with real loader when available
    let mounted = true;
    (async () => {
      if (!user) return;
      setIsLoading(true);
      // TODO: wire to real preferences (base44) if available
      await new Promise((r) => setTimeout(r, 250));
      if (mounted) setDailyEnabled(false);
      setIsLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [user]);

  const sendDailyQuoteEmail = async () => {
    if (!user) return;
    setIsSendingTest(true);
    try {
      if (onSendTest) {
        await onSendTest();
      } else {
        // Simulate sending — replace with integration call when backend is ready
        await new Promise((r) => setTimeout(r, 700));
        Alert.alert('Daily quote', `Daily quote sent to ${user.email} (simulated)`);
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to send quote');
    } finally {
      setIsSendingTest(false);
    }
  };

  const toggleDailyQuote = async () => {
    if (!user) return;
    setIsSaving(true);
    const newValue = !dailyEnabled;
    try {
      if (onToggle) await onToggle(newValue);
      else await new Promise((r) => setTimeout(r, 400));

      setDailyEnabled(newValue);

      if (newValue) {
        // send first quote when enabling
        sendDailyQuoteEmail();
      }
    } catch (e) {
      Alert.alert('Error', 'Unable to update preference');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <ThemedView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#f59e0b" />
        </View>
      ) : (
        <>
          <ThemedText style={styles.title}>Daily Divine Wisdom</ThemedText>
          <ThemedText style={styles.description}>
            Receive a verse from the Bhagavad Gita in your inbox. Tap to enable daily email reminders.
          </ThemedText>

          <View style={styles.row}>
            <View style={styles.info}>
              <ThemedText style={styles.label}>Daily Email Notifications</ThemedText>
              <ThemedText style={styles.subLabel}>{dailyEnabled ? 'Active — 8:00 AM EST' : 'Inactive'}</ThemedText>
            </View>

            <View style={styles.control}>
              <Switch
                value={dailyEnabled}
                onValueChange={toggleDailyQuote}
                disabled={isSaving}
                trackColor={{ true: '#f59e0b', false: '#374151' }}
                thumbColor={dailyEnabled ? '#fef3c7' : '#94a3b8'}
              />
            </View>
          </View>

          {dailyEnabled && (
            <TouchableOpacity style={styles.actionBtn} onPress={sendDailyQuoteEmail} disabled={isSendingTest}>
              {isSendingTest ? (
                <ActivityIndicator color="#111827" />
              ) : (
                <ThemedText style={styles.actionText}>Send Quote Now</ThemedText>
              )}
            </TouchableOpacity>
          )}
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.6)'.replace(/'/g, ''),
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.12)'.replace(/'/g, ''),
  },
  loadingRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fcd34d',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: '#fbbf24',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(30, 41, 59, 0.2)'.replace(/'/g, ''),
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 49, 0.08)'.replace(/'/g, ''),
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fcd34d',
  },
  subLabel: {
    fontSize: 12,
    color: '#fbbf24',
  },
  control: {
    marginLeft: 12,
  },
  actionBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
  },
  actionText: {
    color: '#111827',
    fontWeight: '700',
  },
});
