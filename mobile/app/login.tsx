import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const ready = email.trim().length > 0 && password.length > 0;
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.brand}><View style={styles.logo}><Ionicons name="musical-notes" size={30} color="#fff" /></View><Text style={styles.brandText}>Solfedjio</Text><Text style={styles.tagline}>Musiqani tingla. O‘rgan. His qil.</Text></View>
      <View style={styles.form}><Text style={styles.title}>Xush kelibsiz 👋</Text><Text style={styles.subtitle}>O‘qishni davom ettirish uchun tizimga kiring.</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email" placeholderTextColor="#A0A0B4" style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Parol" placeholderTextColor="#A0A0B4" style={styles.input} />
        <Pressable><Text style={styles.forgot}>Parolni unutdingizmi?</Text></Pressable>
        <Pressable disabled={!ready} onPress={() => router.replace('/(tabs)')} style={[styles.button, !ready && styles.disabled]}><Text style={styles.buttonText}>Kirish</Text></Pressable>
        <Text style={styles.note}>Hozir login UI mock. Keyingi milestone’da mavjud JWT backend ulanadi.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: 20, justifyContent: 'center', gap: 36, backgroundColor: colors.background }, brand: { alignItems: 'center', gap: 7 }, logo: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, brandText: { fontSize: 28, fontWeight: '900', color: colors.text }, tagline: { color: colors.muted },
  form: { gap: 14 }, title: { fontSize: 27, fontWeight: '900', color: colors.text }, subtitle: { color: colors.muted, marginBottom: 6 }, input: { height: 54, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 16, paddingHorizontal: 16, fontSize: 15, color: colors.text }, forgot: { color: colors.primary, alignSelf: 'flex-end', fontWeight: '700' }, button: { height: 56, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: .4 }, buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 }, note: { color: colors.muted, fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
