import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const items: Array<[keyof typeof Ionicons.glyphMap, string, Href]> = [
  ['person-circle-outline', 'Profil ma’lumotlari', '/profile-info'],
  ['key-outline', 'Parolni almashtirish', '/change-password'],
  ['contrast-outline', 'Ko‘rinish', '/appearance'],
  ['language-outline', 'Til', '/language'],
  ['notifications-outline', 'Bildirishnomalar', '/notifications'],
  ['help-circle-outline', 'Yordam', '/help'],
  ['information-circle-outline', 'Ilova haqida', '/about'],
];

const roleLabels = {
  student: 'O‘quvchi',
  teacher: 'O‘qituvchi',
  content_editor: 'Metodist',
  admin: 'Admin',
} as const;

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const initials = (user?.fullName ?? 'S').trim().charAt(0).toUpperCase();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  function confirmLogout() {
    Alert.alert(
      'Akkauntdan chiqish',
      'Haqiqatan ham akkauntingizdan chiqmoqchimisiz?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        { text: 'Chiqish', style: 'destructive', onPress: () => void handleLogout() },
      ],
    );
  }

  return (
    <Screen>
      <SectionHeader title="Profil" />
      <View style={[styles.user, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>{initials}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: colors.text }]}>{user?.fullName ?? 'Foydalanuvchi'}</Text>
          <Text style={[styles.meta, { color: colors.muted }]}>{user ? `${roleLabels[user.role]} · ${user.email}` : 'Solfedjio'}</Text>
        </View>
      </View>
      <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {items.map(([icon, label, href], index) => (
          <Pressable
            key={label}
            onPress={() => router.push(href)}
            style={[styles.item, { borderBottomColor: colors.border }, index === items.length - 1 && styles.itemLast]}
          >
            <Ionicons name={icon} size={22} color={colors.primary} />
            <Text style={[styles.itemText, { color: colors.text }]}>{label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </View>
      <Pressable style={[styles.logout, { backgroundColor: colors.dangerSurface }]} onPress={confirmLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={[styles.logoutText, { color: colors.danger }]}>Chiqish</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  user: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 22, padding: 18, borderWidth: 1 },
  avatar: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 20 },
  name: { fontSize: 18, fontWeight: '900' },
  meta: { marginTop: 4, fontSize: 13 },
  menu: { borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  item: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  itemLast: { borderBottomWidth: 0 },
  itemText: { flex: 1, fontSize: 14, fontWeight: '700' },
  logout: { height: 54, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { fontWeight: '800' },
});
