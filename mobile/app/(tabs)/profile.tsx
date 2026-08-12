import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';

export default function Screen() {
  return <SafeAreaView style={styles.safe}><Text style={styles.title}>Profile</Text><View style={styles.card}><Text style={styles.text}>Mobil foundation tayyor. Keyingi milestone’da bu ekran real Solfedjio kontenti va backend API bilan to‘ldiriladi.</Text></View></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, padding: 20, gap: 16, backgroundColor: colors.background }, title: { fontSize: 28, fontWeight: '900', color: colors.text }, card: { backgroundColor: colors.surface, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: colors.border }, text: { color: colors.muted, lineHeight: 21 } });
