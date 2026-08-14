import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthShell } from '@/components/brand/AuthShell';
import { BrandMark } from '@/components/brand/BrandMark';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/api/client';
import { colors } from '@/theme/colors';

export default function Register() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const ready = fullName.trim().length >= 2 && emailLooksValid && password.length >= 8 && confirmPassword.length >= 8 && !submitting;

  async function handleRegister() {
    if (!ready) return;
    if (password !== confirmPassword) {
      setError('Parollar bir xil emas.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await register(fullName, email, password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Ro‘yxatdan o‘tishda kutilmagan xatolik yuz berdi.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell>
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
        </View>

        <BrandMark size={74} subtitle="Yangi o‘quvchi akkaunti" style={styles.brand} />

        <View style={styles.form}>
          <Text style={styles.title}>Ro‘yxatdan o‘tish</Text>
          <Text style={styles.subtitle}>Ma’lumotlaringizni kiriting. Akkaunt yaratilgach kurs avtomatik ochiladi.</Text>

          <TextInput value={fullName} onChangeText={setFullName} autoCapitalize="words" textContentType="name" autoComplete="name" placeholder="Ism va familiya" placeholderTextColor="#A0A0B4" style={styles.input} editable={!submitting} returnKeyType="next" />
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" placeholder="Email" placeholderTextColor="#A0A0B4" style={styles.input} editable={!submitting} returnKeyType="next" />
          {email.length > 0 && !emailLooksValid ? <Text style={styles.hintError}>Email formatini tekshiring.</Text> : null}

          <PasswordField label="Parol (kamida 8 belgi)" value={password} onChangeText={setPassword} visible={showPasswords} editable={!submitting} />
          <PasswordField label="Parolni takrorlang" value={confirmPassword} onChangeText={setConfirmPassword} visible={showPasswords} editable={!submitting} onSubmit={() => void handleRegister()} />

          <Pressable onPress={() => setShowPasswords((value) => !value)} style={styles.showRow}>
            <Ionicons name={showPasswords ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.primary} />
            <Text style={styles.showText}>{showPasswords ? 'Parollarni yashirish' : 'Parollarni ko‘rsatish'}</Text>
          </Pressable>

          {confirmPassword.length > 0 && password !== confirmPassword ? <Text style={styles.hintError}>Parollar bir xil emas.</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable disabled={!ready || password !== confirmPassword} onPress={() => void handleRegister()} style={[styles.button, (!ready || password !== confirmPassword) && styles.disabled]}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Akkaunt yaratish</Text>}
          </Pressable>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Akkauntingiz bormi?</Text>
            <Pressable onPress={() => router.replace('/login')}><Text style={styles.loginLink}>Kirish</Text></Pressable>
          </View>
        </View>
      </View>
    </AuthShell>
  );
}

function PasswordField({ label, value, onChangeText, visible, editable, onSubmit }: { label: string; value: string; onChangeText: (value: string) => void; visible: boolean; editable: boolean; onSubmit?: () => void }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={!visible}
      textContentType="newPassword"
      autoComplete="new-password"
      placeholder={label}
      placeholderTextColor="#A0A0B4"
      style={styles.input}
      editable={editable}
      returnKeyType={onSubmit ? 'done' : 'next'}
      onSubmitEditing={onSubmit}
    />
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center' },
  topRow: { height: 48, justifyContent: 'center' },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  brand: { marginTop: 8, marginBottom: 20 },
  form: { gap: 12 },
  title: { fontSize: 27, fontWeight: '900', color: colors.text },
  subtitle: { color: colors.muted, marginBottom: 5, lineHeight: 20 },
  input: { height: 54, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 16, fontSize: 15, color: colors.text },
  showRow: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  showText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  hintError: { color: '#B4233F', fontSize: 12, marginTop: -4 },
  error: { color: '#B4233F', backgroundColor: '#FFF0F4', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, lineHeight: 19 },
  button: { height: 56, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  loginRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 },
  loginText: { color: colors.muted, fontSize: 13 },
  loginLink: { color: colors.primary, fontWeight: '800', fontSize: 13 },
});
