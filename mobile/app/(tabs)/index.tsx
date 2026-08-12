import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';

export default function Home() {
  return <SafeAreaView style={styles.safe}><Text style={styles.title}>Salom, Anvar 👋</Text><Text style={styles.subtitle}>Solfedjio · 1-sinf</Text><View style={styles.card}><Text style={styles.eyebrow}>DAVOM ETTIRISH</Text><Text style={styles.cardTitle}>4-dars · Nota yo‘li</Text><Text style={styles.text}>60% bajarildi</Text><View style={styles.track}><View style={styles.fill} /></View></View><View style={styles.card}><Text style={styles.cardTitle}>Bugungi mashq</Text><Text style={styles.text}>Registrlarni eshitish orqali farqlash · 5 daqiqa</Text></View></SafeAreaView>;
}
const styles = StyleSheet.create({ safe: { flex: 1, padding: 20, gap: 14, backgroundColor: colors.background }, title: { fontSize: 28, fontWeight: '900', color: colors.text }, subtitle: { color: colors.muted, marginBottom: 6 }, card: { backgroundColor: colors.surface, borderRadius: 22, padding: 18, gap: 8, borderWidth: 1, borderColor: colors.border }, eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900', letterSpacing: .7 }, cardTitle: { fontSize: 18, fontWeight: '800', color: colors.text }, text: { color: colors.muted, lineHeight: 20 }, track: { height: 8, backgroundColor: '#E7E8F5', borderRadius: 99, overflow: 'hidden' }, fill: { width: '60%', height: '100%', backgroundColor: colors.primary } });
