import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

const items: Array<[keyof typeof Ionicons.glyphMap, string, Href]> = [
  ['person-circle-outline', 'Profil ma’lumotlari', '/profile-info'],
  ['key-outline', 'Parolni almashtirish', '/change-password'],
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
      <View style={styles.user}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user?.fullName ?? 'Foydalanuvchi'}</Text>
          <Text style={styles.meta}>{user ? `${roleLabels[user.role]} · ${user.email}` : 'Solfedjio'}</Text>
        </View>
      </View>
      <View style={styles.menu}>
        {items.map(([icon, label, href], index) => (
          <Pressable key={label} onPress={() => router.push(href)} style={[styles.item, index === items.length - 1 && styles.itemLast]}>
            <Ionicons name={icon} size={22} color={colors.primary} />
            <Text style={styles.itemText}>{label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </View>
      <Pressable style={styles.logout} onPress={confirmLogout}>
        <Ionicons name="log-out-outline" size={20} color="#C2415D" />
        <Text style={styles.logoutText}>Chiqish</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  user: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: colors.border },
  avatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 20 },
  name: { fontSize: 18, fontWeight: '900', color: colors.text },
  meta: { marginTop: 4, color: colors.muted, fontSize: 13 },
  menu: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  item: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  itemLast: { borderBottomWidth: 0 },
  itemText: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text },
  logout: { height: 54, borderRadius: 18, backgroundColor: '#FFF0F4', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { color: '#C2415D', fontWeight: '800' },
});
