import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { BackHeader } from '@/components/ui/BackHeader';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/context/ThemeContext';

const tips = [
  ['log-in-outline', 'Kirish muammosi', 'Email va parolni tekshiring. Internet mavjud bo‘lsa ham kirish amalga oshmasa, qayta urinib ko‘ring.'],
  ['refresh-outline', 'Ma’lumot yangilanmasa', 'Ekrandagi “Qayta urinish” tugmasidan foydalaning yoki ilovani qayta oching.'],
  ['musical-notes-outline', 'Pianino ovozi', 'Telefon media ovozini yoqing. Pianino klavishlari bosilganda ovoz darhol chiqishi kerak.'],
] as const;

export default function HelpScreen() {
  const { colors } = useTheme();
  return (
    <Screen>
      <BackHeader title="Yordam" caption="Ilovadan foydalanish bo‘yicha qisqa yordam" />
      <View style={styles.list}>
        {tips.map(([icon, title, text]) => (
          <View key={title} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}><Ionicons name={icon} size={22} color={colors.primary} /></View>
            <View style={styles.body}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <Text style={[styles.text, { color: colors.muted }]}>{text}</Text>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  card: { flexDirection: 'row', gap: 12, borderRadius: 20, borderWidth: 1, padding: 15 },
  icon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 5 },
  title: { fontWeight: '900', fontSize: 14 },
  text: { lineHeight: 19, fontSize: 13 },
});
