import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { BackHeader } from '@/components/ui/BackHeader';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/theme/colors';

const tips = [
  ['log-in-outline', 'Kirish muammosi', 'Email va parolni tekshiring. Internet mavjud bo‘lsa ham kirish amalga oshmasa, qayta urinib ko‘ring.'],
  ['refresh-outline', 'Ma’lumot yangilanmasa', 'Ekrandagi “Qayta urinish” tugmasidan foydalaning yoki ilovani qayta oching.'],
  ['musical-notes-outline', 'Pianino ovozi', 'Telefon media ovozini yoqing. Pianino klavishlari bosilganda ovoz darhol chiqishi kerak.'],
] as const;

export default function HelpScreen() {
  return (
    <Screen>
      <BackHeader title="Yordam" caption="Ilovadan foydalanish bo‘yicha qisqa yordam" />
      <View style={styles.list}>
        {tips.map(([icon, title, text]) => (
          <View key={title} style={styles.card}>
            <View style={styles.icon}><Ionicons name={icon} size={22} color={colors.primary} /></View>
            <View style={styles.body}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.text}>{text}</Text>
            </View>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  card: { flexDirection: 'row', gap: 12, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 15 },
  icon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 5 },
  title: { color: colors.text, fontWeight: '900', fontSize: 14 },
  text: { color: colors.muted, lineHeight: 19, fontSize: 13 },
});
