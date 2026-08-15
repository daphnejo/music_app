import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/brand/BrandMark';
import { useTheme } from '@/context/ThemeContext';
import { markOnboardingSeen } from '@/services/app/preferences';

const slides = [
  ['school-outline', 'Musiqani oson o‘rganing', 'Har bir mavzu kichik va tushunarli bosqichlarga bo‘lingan.'],
  ['headset-outline', 'Tinglang va mashq qiling', 'Audio, ritm va interaktiv mashqlar bilan bilimni mustahkamlang.'],
  ['stats-chart-outline', 'Natijalaringizni kuzating', 'Darslar va testlardagi rivojlanishingizni ko‘rib boring.'],
] as const;

export default function Onboarding() {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const [icon, title, text] = slides[index];
  const last = index === slides.length - 1;

  async function finish() {
    await markOnboardingSeen();
    router.replace('/login');
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.top}>
        <BrandMark size={42} showName={false} style={styles.brand} />
        <Text style={[styles.brandName, { color: colors.text }]}>Solfedjio</Text>
        <View style={styles.spacer} />
        <Pressable onPress={() => void finish()} hitSlop={10}>
          <Text style={[styles.skip, { color: colors.muted }]}>O‘tkazib yuborish</Text>
        </Pressable>
      </View>

      <View style={styles.hero}>
        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={icon} size={54} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.text, { color: colors.muted }]}>{text}</Text>
        <View style={styles.dots}>
          {slides.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                { backgroundColor: i === index ? colors.primary : colors.border },
                i === index && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={() => last ? void finish() : setIndex(index + 1)}>
        <Text style={styles.buttonText}>{last ? 'Boshlash' : 'Keyingi'}</Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, padding: 20, justifyContent: 'space-between' },
  top: { flexDirection: 'row', alignItems: 'center' },
  brand: { marginRight: 8 },
  brandName: { fontWeight: '900', fontSize: 20 },
  spacer: { flex: 1 },
  skip: { fontWeight: '700' },
  hero: { alignItems: 'center', gap: 16 },
  icon: { width: 132, height: 132, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 29, lineHeight: 35, fontWeight: '900', textAlign: 'center' },
  text: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
  dots: { flexDirection: 'row', gap: 7 },
  dot: { width: 8, height: 8, borderRadius: 8 },
  dotActive: { width: 22 },
  button: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
