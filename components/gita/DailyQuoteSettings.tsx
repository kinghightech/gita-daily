import LotusLoader from '@/components/ui/LotusLoader';
import { useTheme } from '@/hooks/useTheme';
import { DAILY_WISDOM_NOTIFICATION_TIME_LABEL } from '@/lib/notificationConfig';
import { supabase } from '@/lib/supabase';
import type { Theme } from '@/theme/colors';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

interface DailyQuoteSettingsProps {
  user: { id: string; full_name?: string; email?: string } | null;
  // Optional callbacks: if provided, will be called instead of performing network actions here
  onSendTest?: () => Promise<void> | void;
  onToggle?: (enabled: boolean) => Promise<void> | void;
}

export default function DailyQuoteSettings({ user, onSendTest, onToggle }: DailyQuoteSettingsProps) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const isDarkMode = theme.blurTint === 'dark';
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [dailyEnabled, setDailyEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('daily_notification_enabled')
          .eq('id', user.id)
          .maybeSingle();

        if (!mounted) return;

        if (!error && typeof data?.daily_notification_enabled === 'boolean') {
          setDailyEnabled(data.daily_notification_enabled);
        } else {
          setDailyEnabled(false);
        }
      } catch {
        if (!mounted) return;
        setDailyEnabled(false);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user?.id]);

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
    } catch {
      Alert.alert('Error', 'Unable to send quote');
    } finally {
      setIsSendingTest(false);
    }
  };

  const toggleDailyQuote = async () => {
    if (!user?.id) return;
    setIsSaving(true);
    const newValue = !dailyEnabled;
    try {
      if (onToggle) {
        await onToggle(newValue);
      } else {
        const { error } = await supabase.from('profiles').upsert(
          {
            id: user.id,
            daily_notification_enabled: newValue,
          },
          { onConflict: 'id' }
        );

        if (error) {
          throw error;
        }
      }

      setDailyEnabled(newValue);

      if (newValue) {
        // send first quote when enabling
        sendDailyQuoteEmail();
      }
    } catch {
      Alert.alert('Error', 'Unable to update preference');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingRow}>
          <LotusLoader size={30} color="#D4AF37" strokeWidth={2.4} duration={1100} />
        </View>
      ) : (
        <>
          <Text style={styles.title}>Daily Divine Wisdom</Text>
          <Text style={styles.description}>
            Receive a verse from the Bhagavad Gita in your inbox. Tap to enable daily email reminders.
          </Text>

          <View style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.label}>Daily Email Notifications</Text>
              <Text style={styles.subLabel}>
                {dailyEnabled ? `Active - ${DAILY_WISDOM_NOTIFICATION_TIME_LABEL} local time` : 'Inactive'}
              </Text>
            </View>

            <View style={styles.control}>
              <Switch
                value={dailyEnabled}
                onValueChange={toggleDailyQuote}
                disabled={isSaving}
                trackColor={{
                  true: '#f59e0b',
                  false: isDarkMode ? '#374151' : 'rgba(26,26,26,0.18)',
                }}
                thumbColor={dailyEnabled ? '#fef3c7' : isDarkMode ? '#94a3b8' : '#FFFFFF'}
              />
            </View>
          </View>

          {dailyEnabled && (
            <TouchableOpacity style={styles.actionBtn} onPress={sendDailyQuoteEmail} disabled={isSendingTest}>
              {isSendingTest ? (
                <LotusLoader size={18} color="#111827" strokeWidth={2.2} duration={1000} />
              ) : (
                <Text style={styles.actionText}>Send Quote Now</Text>
              )}
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.border,
  },
  loadingRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.goldText,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: theme.subtext,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: theme.card,
    borderWidth: 1,
    borderColor: theme.border,
  },
  info: {
    flex: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.text,
  },
  subLabel: {
    fontSize: 12,
    color: theme.subtext,
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
