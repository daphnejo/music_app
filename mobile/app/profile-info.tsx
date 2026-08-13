import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { BackHeader } from '@/components/ui/BackHeader';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

const roleLabels = {
  student: 'O‘quvchi',
  teacher: 'O‘qituvchi',
  content_editor: 'Metodist',
  admin: 'Admin',
} as const;

export default function ProfileInfoScreen() {
  const { user } = useAuth();
  const initial = (user?.fullName ?? 'S').trim().charAt(0).toUpperCase();

  return (
    <Screen>
      <BackHeader title="Profil ma’lumotlari" caption="Akkauntingizga tegishli ma’lumotlar" />
      <View style={styles.hero}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
        <Text style={styles.name}>{user?.fullName ?? 'Foydalanuvchi'}</Text>
        <Text style={styles.role}>{user ? roleLabels[user.role] : '—'}</Text>
      </View>
      <View style={styles.card}>
        <Row icon="mail-outline" label="Email" value={user?.email ?? '—'} />
        <Row icon="shield-checkmark-outline" label="Rol" value={user ? roleLabels[user.role] : '—'} />
        <Row icon="key-outline" label="User ID" value={user?.id ?? '—'} last />
      </View>
    </Screen>
  );
}

function Row({ icon, label, value, last = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={styles.icon}><Ionicons name={icon} size={20} color={colors.primary} /></View>
      <View style={styles.rowBody}>
        <Text style={styles.label}>{label}</Text>
        <Text selectable style={styles.value}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 7, paddingVertical: 10 },
  avatar: { width: 82, height: 82, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  name: { color: colors.text, fontSize: 21, fontWeight: '900' },
  role: { color: colors.primary, fontWeight: '800' },
  card: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: 12, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLast: { borderBottomWidth: 0 },
  icon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, gap: 3 },
  label: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  value: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
