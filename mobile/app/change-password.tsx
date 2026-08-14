import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BackHeader } from '@/components/ui/BackHeader';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { ApiError, apiRequest } from '@/services/api/client';
import { colors } from '@/theme/colors';

export default function ChangePasswordScreen() {
  const { logout } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = currentPassword.length > 0 && newPassword.length >= 8 && confirmPassword === newPassword && !submitting;

  async function submit() {
    if (!ready) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest('/api/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      });
      await logout();
      router.replace('/login');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Parolni almashtirishda xatolik yuz berdi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <BackHeader title="Parolni almashtirish" caption="Xavfsizlik uchun joriy parolni tasdiqlang" />
      <View style={styles.card}>
        <Field label="Joriy parol" value={currentPassword} onChangeText={setCurrentPassword} visible={showCurrent} onToggle={() => setShowCurrent((v) => !v)} />
        <Field label="Yangi parol" value={newPassword} onChangeText={setNewPassword} hint="Kamida 8 belgi" visible={showNew} onToggle={() => setShowNew((v) => !v)} />
        <Field label="Yangi parolni takrorlang" value={confirmPassword} onChangeText={setConfirmPassword} visible={showConfirm} onToggle={() => setShowConfirm((v) => !v)} onSubmit={() => void submit()} />
        {confirmPassword.length > 0 && confirmPassword !== newPassword ? <Text style={styles.error}>Parollar mos kelmadi.</Text> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable disabled={!ready} onPress={() => void submit()} style={[styles.button, !ready && styles.buttonDisabled]}>
          {submitting ? <ActivityIndicator color="#fff" /> : <><Ionicons name="shield-checkmark-outline" size={20} color="#fff" /><Text style={styles.buttonText}>Parolni yangilash</Text></>}
        </Pressable>
      </View>
      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.noteText}>Parol o‘zgargach, xavfsizlik uchun barcha qurilmalardagi sessiyalar yopiladi va qayta kirish kerak bo‘ladi.</Text>
      </View>
    </Screen>
  );
}

function Field({ label, value, onChangeText, hint, visible, onToggle, onSubmit }: { label: string; value: string; onChangeText: (value: string) => void; hint?: string; visible: boolean; onToggle: () => void; onSubmit?: () => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput value={value} onChangeText={onChangeText} secureTextEntry={!visible} autoCapitalize="none" autoCorrect={false} style={styles.input} returnKeyType={onSubmit ? 'done' : 'next'} onSubmitEditing={onSubmit} />
        <Pressable onPress={onToggle} hitSlop={8} style={styles.eyeButton}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} />
        </Pressable>
      </View>
      <Text style={styles.hint}>{hint ?? ' '}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 10 },
  field: { gap: 6 },
  label: { color: colors.text, fontSize: 13, fontWeight: '800' },
  inputRow: { height: 52, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FAFAFE', flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, height: '100%', paddingLeft: 14, paddingRight: 8, color: colors.text, fontSize: 15 },
  eyeButton: { width: 48, height: 50, alignItems: 'center', justifyContent: 'center' },
  hint: { minHeight: 15, color: colors.muted, fontSize: 11 },
  error: { color: '#B4233F', backgroundColor: '#FFF0F4', borderRadius: 13, paddingHorizontal: 12, paddingVertical: 9, lineHeight: 18 },
  button: { height: 54, borderRadius: 17, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  buttonDisabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  note: { flexDirection: 'row', gap: 10, backgroundColor: '#EEF2FF', borderRadius: 18, padding: 14 },
  noteText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 20 },
});
