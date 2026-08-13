import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/api/client';
import { colors } from '@/theme/colors';

export default function Register() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready =
    fullName.trim().length >= 2 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    confirmPassword.length >= 8 &&
    !submitting;

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
    <SafeAreaView style={styles.safe}>
      <View style={styles.topRow}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.brand}>
        <View style={styles.logo}><Ionicons name="musical-notes" size={28} color="#fff" /></View>
        <Text style={styles.brandText}>Solfedjio</Text>
        <Text style={styles.tagline}>Yangi o‘quvchi akkaunti</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Ro‘yxatdan o‘tish</Text>
        <Text style={styles.subtitle}>Ma’lumotlaringizni kiriting. Akkaunt yaratilgach kurs avtomatik ochiladi.</Text>

        <TextInput
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          textContentType="name"
          placeholder="Ism va familiya"
          placeholderTextColor="#A0A0B4"
          style={styles.input}
          editable={!submitting}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="Email"
          placeholderTextColor="#A0A0B4"
          style={styles.input}
          editable={!submitting}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="newPassword"
          placeholder="Parol (kamida 8 belgi)"
          placeholderTextColor="#A0A0B4"
          style={styles.input}
          editable={!submitting}
        />
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          textContentType="newPassword"
          placeholder="Parolni takrorlang"
          placeholderTextColor="#A0A0B4"
          style={styles.input}
          editable={!submitting}
          onSubmitEditing={handleRegister}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable disabled={!ready} onPress={handleRegister} style={[styles.button, !ready && styles.disabled]}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Akkaunt yaratish</Text>}
        </Pressable>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Akkauntingiz bormi?</Text>
          <Pressable onPress={() => router.replace('/login')}>
            <Text style={styles.loginLink}>Kirish</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: 20, backgroundColor: colors.background },
  topRow: { height: 48, justifyContent: 'center' },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  brand: { alignItems: 'center', gap: 7, marginTop: 18, marginBottom: 28 },
  logo: { width: 60, height: 60, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandText: { fontSize: 26, fontWeight: '900', color: colors.text },
  tagline: { color: colors.muted },
  form: { gap: 13 },
  title: { fontSize: 27, fontWeight: '900', color: colors.text },
  subtitle: { color: colors.muted, marginBottom: 5, lineHeight: 20 },
  input: { height: 54, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 16, fontSize: 15, color: colors.text },
  error: { color: '#B4233F', backgroundColor: '#FFF0F4', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, lineHeight: 19 },
  button: { height: 56, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  loginRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 },
  loginText: { color: colors.muted, fontSize: 13 },
  loginLink: { color: colors.primary, fontWeight: '800', fontSize: 13 },
});
