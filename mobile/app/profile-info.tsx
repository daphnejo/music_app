import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BackHeader } from '@/components/ui/BackHeader';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ApiError } from '@/services/api/client';

const roleLabels = { student: 'O‘quvchi', teacher: 'O‘qituvchi', content_editor: 'Metodist', admin: 'Admin' } as const;

export default function ProfileInfoScreen() {
  const { user, updateProfile } = useAuth();
  const { colors } = useTheme();
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const initial = (user?.fullName ?? 'S').trim().charAt(0).toUpperCase();
  const trimmed = fullName.trim();
  const canSave = trimmed.length >= 2 && trimmed !== (user?.fullName ?? '').trim() && !submitting;

  useEffect(() => { setFullName(user?.fullName ?? ''); }, [user?.fullName]);

  async function save() {
    if (!canSave) return;
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await updateProfile(trimmed);
      setMessage('Profil ma’lumotlari saqlandi.');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Profilni saqlab bo‘lmadi.');
    } finally {
      setSubmitting(false);
    }
  }

  const cardStyle = { backgroundColor: colors.surface, borderColor: colors.border };

  return (
    <Screen>
      <BackHeader title="Profil ma’lumotlari" caption="Akkauntingizga tegishli ma’lumotlar" />
      <View style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>{initial}</Text></View>
        <Text style={[styles.name, { color: colors.text }]}>{user?.fullName ?? 'Foydalanuvchi'}</Text>
        <Text style={[styles.role, { color: colors.primary }]}>{user ? roleLabels[user.role] : '—'}</Text>
      </View>
      <View style={[styles.editCard, cardStyle]}>
        <Text style={[styles.fieldLabel, { color: colors.text }]}>Ism-familiya</Text>
        <TextInput
          value={fullName}
          onChangeText={(value) => { setFullName(value); setMessage(null); setError(null); }}
          placeholder="Ism-familiya"
          placeholderTextColor={colors.muted}
          autoCapitalize="words"
          editable={!submitting}
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.input, color: colors.text }]}
        />
        {message ? <Text style={[styles.feedback, { color: colors.success, backgroundColor: colors.successSurface }]}>{message}</Text> : null}
        {error ? <Text style={[styles.feedback, { color: colors.danger, backgroundColor: colors.dangerSurface }]}>{error}</Text> : null}
        <Pressable disabled={!canSave} onPress={() => void save()} style={[styles.saveButton, { backgroundColor: colors.primary }, !canSave && styles.saveButtonDisabled]}>
          {submitting ? <ActivityIndicator color="#fff" /> : <><Ionicons name="save-outline" size={18} color="#fff" /><Text style={styles.saveText}>Saqlash</Text></>}
        </Pressable>
      </View>
      <View style={[styles.card, cardStyle]}>
        <Row icon="mail-outline" label="Email" value={user?.email ?? '—'} />
        <Row icon="shield-checkmark-outline" label="Rol" value={user ? roleLabels[user.role] : '—'} />
        <Row icon="key-outline" label="User ID" value={user?.id ?? '—'} last />
      </View>
      <Text style={[styles.readOnlyNote, { color: colors.muted }]}>Email va rol xavfsizlik sabab bu ekranda o‘zgartirilmaydi.</Text>
    </Screen>
  );
}

function Row({ icon, label, value, last = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }, last && styles.rowLast]}>
      <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}><Ionicons name={icon} size={20} color={colors.primary} /></View>
      <View style={styles.rowBody}>
        <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
        <Text selectable style={[styles.value, { color: colors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 7, paddingVertical: 10 },
  avatar: { width: 82, height: 82, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '900' },
  name: { fontSize: 21, fontWeight: '900' },
  role: { fontWeight: '800' },
  editCard: { borderRadius: 22, borderWidth: 1, padding: 16, gap: 10 },
  fieldLabel: { fontSize: 13, fontWeight: '800' },
  input: { height: 52, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, fontSize: 15 },
  saveButton: { height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  saveButtonDisabled: { opacity: 0.42 },
  saveText: { color: '#fff', fontWeight: '900' },
  feedback: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  card: { borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: 12, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLast: { borderBottomWidth: 0 },
  icon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, gap: 3 },
  label: { fontSize: 11, fontWeight: '700' },
  value: { fontSize: 14, fontWeight: '700' },
  readOnlyNote: { fontSize: 11, lineHeight: 17, textAlign: 'center' },
});
