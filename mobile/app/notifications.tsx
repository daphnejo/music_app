import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BackHeader } from '@/components/ui/BackHeader';
import { ErrorState, LoadingState } from '@/components/ui/DataState';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/context/ThemeContext';
import { apiRequest } from '@/services/api/client';

type NotificationItem = {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
};

type NotificationResponse = { notifications: NotificationItem[]; unread: number };

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const [data, setData] = useState<NotificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await apiRequest<NotificationResponse>('/api/notifications'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bildirishnomalar yuklanmadi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function markRead(item: NotificationItem) {
    if (item.readAt) return;
    setData((current) => current ? {
      ...current,
      unread: Math.max(0, current.unread - 1),
      notifications: current.notifications.map((n) => n.id === item.id ? { ...n, readAt: new Date().toISOString() } : n),
    } : current);
    try {
      await apiRequest(`/api/notifications/${item.id}/read`, { method: 'POST' });
    } catch {
      void load();
    }
  }

  return (
    <Screen>
      <BackHeader title="Bildirishnomalar" caption={data ? `${data.unread} ta o‘qilmagan` : 'Akkauntingizga tegishli xabarlar'} />
      {loading && !data ? <LoadingState text="Bildirishnomalar yuklanmoqda…" /> : null}
      {error && !data ? <ErrorState message={error} onRetry={() => void load()} /> : null}
      {data && !data.notifications.length ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={34} color={colors.muted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Hozircha bildirishnoma yo‘q</Text>
          <Text style={[styles.emptyText, { color: colors.muted }]}>Yangi xabarlar shu yerda ko‘rinadi.</Text>
        </View>
      ) : null}
      <View style={styles.list}>
        {data?.notifications.map((item) => {
          const unread = !item.readAt;
          return (
            <Pressable
              key={item.id}
              onPress={() => void markRead(item)}
              style={[
                styles.card,
                {
                  backgroundColor: unread ? colors.primarySoft : colors.surface,
                  borderColor: unread ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={[styles.icon, { backgroundColor: unread ? colors.primarySoft : colors.surfaceAlt }]}>
                <Ionicons name="notifications-outline" size={20} color={unread ? colors.primary : colors.muted} />
              </View>
              <View style={styles.body}>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                  {unread ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
                </View>
                {item.body ? <Text style={[styles.text, { color: colors.muted }]}>{item.body}</Text> : null}
                <Text style={[styles.date, { color: colors.muted }]}>{formatDate(item.createdAt)}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('uz-UZ', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(date);
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  card: { flexDirection: 'row', gap: 12, borderRadius: 20, padding: 15, borderWidth: 1 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 14, fontWeight: '900' },
  dot: { width: 8, height: 8, borderRadius: 8 },
  text: { lineHeight: 19, fontSize: 13 },
  date: { marginTop: 2, fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', gap: 7, paddingVertical: 42, paddingHorizontal: 20 },
  emptyTitle: { fontWeight: '900', fontSize: 16 },
  emptyText: { textAlign: 'center' },
});
