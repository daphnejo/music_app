import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BackHeader } from '@/components/ui/BackHeader';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/api/client';
import { colors } from '@/theme/colors';

const roleLabels = { student: 'O‘quvchi', teacher: 'O‘qituvchi', content_editor: 'Metodist', admin: 'Admin' } as const;

export default function ProfileInfoScreen() {
  const { user, updateProfile } = useAuth();
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

  return (
    <Screen>
      <BackHeader title="Profil ma’lumotlari" caption="Akkauntingizga tegishli ma’lumotlar" />
      <View style={styles.hero}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
        <Text style={styles.name}>{user?.fullName ?? 'Foydalanuvchi'}</Text>
        <Text style={styles.role}>{user ? roleLabels[user.role] : '—'}</Text>
      </View>
      <View style={styles.editCard}>
        <Text style={styles.fieldLabel}>Ism-familiya</Text>
        <TextInput value={fullName} onChangeText={(value) => { setFullName(value); setMessage(null); setError(null); }} placeholder="Ism-familiya" placeholderTextColor="#A0A0B4" autoCapitalize="words" editable={!submitting} style={styles.input} />
        {message ? <Text style={styles.success}>{message}</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable disabled={!canSave} onPress={() => void save()} style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}>
          {submitting ? <ActivityIndicator color="#fff" /> : <><Ionicons name="save-outline" size={18} color="#fff" /><Text style={styles.saveText}>Saqlash</Text></>}
        </Pressable>
      </View>
      <View style={styles.card}>
        <Row icon="mail-outline" label="Email" value={user?.email ?? '—'} />
        <Row icon="shield-checkmark-outline" label="Rol" value={user ? roleLabels[user.role] : '—'} />
        <Row icon="key-outline" label="User ID" value={user?.id ?? '—'} last />
      </View>
      <Text style={styles.readOnlyNote}>Email va rol xavfsizlik sabab bu ekranda o‘zgartirilmaydi.</Text>
    </Screen>
  );
}

function Row({ icon, label, value, last = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean }) {
  return <View style={[styles.row, last && styles.rowLast]}><View style={styles.icon}><Ionicons name={icon} size={20} color={colors.primary} /></View><View style={styles.rowBody}><Text style={styles.label}>{label}</Text><Text selectable style={styles.value}>{value}</Text></View></View>;
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: 7, paddingVertical: 10 }, avatar: { width: 82, height: 82, borderRadius: 28, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#fff', fontSize: 28, fontWeight: '900' }, name: { color: colors.text, fontSize: 21, fontWeight: '900' }, role: { color: colors.primary, fontWeight: '800' },
  editCard: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 }, fieldLabel: { color: colors.text, fontSize: 13, fontWeight: '800' }, input: { height: 52, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FAFAFE', paddingHorizontal: 14, color: colors.text, fontSize: 15 },
  saveButton: { height: 50, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 }, saveButtonDisabled: { opacity: 0.42 }, saveText: { color: '#fff', fontWeight: '900' }, success: { color: '#16794C', backgroundColor: '#ECFAF3', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }, error: { color: '#B4233F', backgroundColor: '#FFF0F4', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  card: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }, row: { flexDirection: 'row', gap: 12, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }, rowLast: { borderBottomWidth: 0 }, icon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }, rowBody: { flex: 1, gap: 3 }, label: { color: colors.muted, fontSize: 11, fontWeight: '700' }, value: { color: colors.text, fontSize: 14, fontWeight: '700' }, readOnlyNote: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'center' },
});
