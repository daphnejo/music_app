import Constants from 'expo-constants';
import { StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '@/components/brand/BrandMark';
import { BackHeader } from '@/components/ui/BackHeader';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/context/ThemeContext';

export default function AboutScreen() {
  const { colors } = useTheme();
  const version = Constants.expoConfig?.version ?? '0.1.0';
  const cardStyle = { backgroundColor: colors.surface, borderColor: colors.border };
  return (
    <Screen>
      <BackHeader title="Ilova haqida" />
      <View style={styles.hero}>
        <BrandMark size={86} subtitle={`Versiya ${version}`} />
      </View>
      <View style={[styles.card, cardStyle]}>
        <Text style={[styles.text, { color: colors.muted }]}>Solfedjio — mobil o‘quv ilovasi. Darslar, topshiriqlar, natijalar va interaktiv pianino bitta joyda ishlaydi.</Text>
      </View>
      <View style={[styles.card, cardStyle]}>
        <Row label="Platforma" value="Android / iOS" />
        <Row label="Akkaunt" value="Real server autentifikatsiyasi" />
        <Row label="Progress" value="Har bir foydalanuvchi uchun alohida" last />
      </View>
    </Screen>
  );
}

function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }, last && styles.rowLast]}>
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 16 },
  card: { borderRadius: 22, borderWidth: 1, paddingHorizontal: 16 },
  text: { lineHeight: 21, paddingVertical: 16, fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLast: { borderBottomWidth: 0 },
  label: { fontSize: 13 },
  value: { flex: 1, fontWeight: '800', fontSize: 13, textAlign: 'right' },
});
