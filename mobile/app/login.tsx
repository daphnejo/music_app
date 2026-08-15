import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AuthShell } from '@/components/brand/AuthShell';
import { BrandMark } from '@/components/brand/BrandMark';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ApiError } from '@/services/api/client';

export default function Login() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = email.trim().length > 0 && password.length > 0 && !submitting;

  async function handleLogin() {
    if (!ready) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Kirishda kutilmagan xatolik yuz berdi.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputSurface = { backgroundColor: colors.surface, borderColor: colors.border };

  return (
    <AuthShell>
      <View style={styles.content}>
        <BrandMark size={86} subtitle="Musiqani tingla. O‘rgan. His qil." />

        <View style={styles.form}>
          <Text style={[styles.title, { color: colors.text }]}>Xush kelibsiz 👋</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>O‘qishni davom ettirish uchun tizimga kiring.</Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="username"
            autoComplete="email"
            placeholder="Email"
            placeholderTextColor={colors.muted}
            style={[styles.input, inputSurface, { color: colors.text }]}
            editable={!submitting}
            returnKeyType="next"
          />

          <View style={[styles.passwordRow, inputSurface]}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              textContentType="password"
              autoComplete="current-password"
              placeholder="Parol"
              placeholderTextColor={colors.muted}
              style={[styles.passwordInput, { color: colors.text }]}
              editable={!submitting}
              returnKeyType="done"
              onSubmitEditing={() => void handleLogin()}
            />
            <Pressable onPress={() => setShowPassword((value) => !value)} hitSlop={8} style={styles.eyeButton}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={21} color={colors.muted} />
            </Pressable>
          </View>

          {error ? <Text style={[styles.error, { color: colors.danger, backgroundColor: colors.dangerSurface }]}>{error}</Text> : null}

          <Pressable disabled={!ready} onPress={() => void handleLogin()} style={[styles.button, { backgroundColor: colors.primary }, !ready && styles.disabled]}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Kirish</Text>}
          </Pressable>

          <View style={styles.registerRow}>
            <Text style={[styles.registerText, { color: colors.muted }]}>Yangi foydalanuvchimisiz?</Text>
            <Pressable onPress={() => router.push('/register')}>
              <Text style={[styles.registerLink, { color: colors.primary }]}>Ro‘yxatdan o‘tish</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, justifyContent: 'center', gap: 34 },
  form: { gap: 14 },
  title: { fontSize: 27, fontWeight: '900' },
  subtitle: { marginBottom: 6 },
  input: { height: 54, borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, fontSize: 15 },
  passwordRow: { height: 54, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16 },
  passwordInput: { flex: 1, height: '100%', paddingLeft: 16, paddingRight: 8, fontSize: 15 },
  eyeButton: { width: 48, height: 52, alignItems: 'center', justifyContent: 'center' },
  error: { borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, lineHeight: 19 },
  button: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  registerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 2 },
  registerText: { fontSize: 13 },
  registerLink: { fontWeight: '800', fontSize: 13 },
});
