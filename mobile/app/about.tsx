import Constants from 'expo-constants';
import { StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '@/components/brand/BrandMark';
import { BackHeader } from '@/components/ui/BackHeader';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/theme/colors';

export default function AboutScreen() {
  const version = Constants.expoConfig?.version ?? '0.1.0';
  return (
    <Screen>
      <BackHeader title="Ilova haqida" />
      <View style={styles.hero}>
        <BrandMark size={86} subtitle={`Versiya ${version}`} />
      </View>
      <View style={styles.card}>
        <Text style={styles.text}>Solfedjio — mobil o‘quv ilovasi. Darslar, topshiriqlar, natijalar va interaktiv pianino bitta joyda ishlaydi.</Text>
      </View>
      <View style={styles.card}>
        <Row label="Platforma" value="Android / iOS" />
        <Row label="Akkaunt" value="Real server autentifikatsiyasi" />
        <Row label="Progress" value="Har bir foydalanuvchi uchun alohida" last />
      </View>
    </Screen>
  );
}

function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return <View style={[styles.row, last && styles.rowLast]}><Text style={styles.label}>{label}</Text><Text style={styles.value}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', paddingVertical: 16 },
  card: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16 },
  text: { color: colors.muted, lineHeight: 21, paddingVertical: 16, fontSize: 13 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  rowLast: { borderBottomWidth: 0 },
  label: { color: colors.muted, fontSize: 13 },
  value: { flex: 1, color: colors.text, fontWeight: '800', fontSize: 13, textAlign: 'right' },
});
