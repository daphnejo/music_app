import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';

const slides = [
  ['school-outline', 'Musiqani oson o‘rganing', 'Har bir mavzu kichik va tushunarli bosqichlarga bo‘lingan.'],
  ['headset-outline', 'Tinglang va mashq qiling', 'Audio, ritm va interaktiv mashqlar bilan bilimni mustahkamlang.'],
  ['stats-chart-outline', 'Natijalaringizni kuzating', 'Darslar va testlardagi rivojlanishingizni ko‘rib boring.'],
] as const;

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const [icon, title, text] = slides[index];
  const last = index === slides.length - 1;
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}><Text style={styles.brand}>Solfedjio</Text><Pressable onPress={() => router.replace('/login')}><Text style={styles.skip}>O‘tkazib yuborish</Text></Pressable></View>
      <View style={styles.hero}>
        <View style={styles.icon}><Ionicons name={icon} size={54} color={colors.primary} /></View>
        <Text style={styles.title}>{title}</Text><Text style={styles.text}>{text}</Text>
        <View style={styles.dots}>{slides.map((_, i) => <View key={i} style={[styles.dot, i === index && styles.dotActive]} />)}</View>
      </View>
      <Pressable style={styles.button} onPress={() => last ? router.replace('/login') : setIndex(index + 1)}><Text style={styles.buttonText}>{last ? 'Boshlash' : 'Keyingi'}</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, padding: 20, justifyContent: 'space-between' },
  top: { flexDirection: 'row', justifyContent: 'space-between' }, brand: { color: colors.primary, fontWeight: '900', fontSize: 20 }, skip: { color: colors.muted, fontWeight: '700' },
  hero: { alignItems: 'center', gap: 16 }, icon: { width: 132, height: 132, borderRadius: 44, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 29, lineHeight: 35, fontWeight: '900', textAlign: 'center' }, text: { color: colors.muted, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 7 }, dot: { width: 8, height: 8, borderRadius: 8, backgroundColor: '#D7D8E5' }, dotActive: { width: 22, backgroundColor: colors.primary },
  button: { height: 56, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }, buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
