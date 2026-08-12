import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/api/client';
import { colors } from '@/theme/colors';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.brand}>
        <View style={styles.logo}><Ionicons name="musical-notes" size={30} color="#fff" /></View>
        <Text style={styles.brandText}>Solfedjio</Text>
        <Text style={styles.tagline}>Musiqani tingla. O‘rgan. His qil.</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.title}>Xush kelibsiz 👋</Text>
        <Text style={styles.subtitle}>O‘qishni davom ettirish uchun tizimga kiring.</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="username"
          placeholder="Email"
          placeholderTextColor="#A0A0B4"
          style={styles.input}
          editable={!submitting}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          placeholder="Parol"
          placeholderTextColor="#A0A0B4"
          style={styles.input}
          editable={!submitting}
          onSubmitEditing={handleLogin}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable><Text style={styles.forgot}>Parolni unutdingizmi?</Text></Pressable>
        <Pressable disabled={!ready} onPress={handleLogin} style={[styles.button, !ready && styles.disabled]}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Kirish</Text>}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: 20, justifyContent: 'center', gap: 36, backgroundColor: colors.background },
  brand: { alignItems: 'center', gap: 7 },
  logo: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brandText: { fontSize: 28, fontWeight: '900', color: colors.text },
  tagline: { color: colors.muted },
  form: { gap: 14 },
  title: { fontSize: 27, fontWeight: '900', color: colors.text },
  subtitle: { color: colors.muted, marginBottom: 6 },
  input: { height: 54, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 16, fontSize: 15, color: colors.text },
  error: { color: '#B4233F', backgroundColor: '#FFF0F4', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, lineHeight: 19 },
  forgot: { color: colors.primary, alignSelf: 'flex-end', fontWeight: '700' },
  button: { height: 56, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
