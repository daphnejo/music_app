import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { ContinueCard } from '@/components/home/ContinueCard';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useAuth } from '@/context/AuthContext';
import { lessons } from '@/data/mock';
import { colors } from '@/theme/colors';

export default function HomeScreen() {
  const { user } = useAuth();
  const current = lessons.find((l) => l.id === '4') ?? lessons[0];
  const firstName = user?.fullName?.trim().split(/\s+/)[0] || 'o‘quvchi';
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Salom, {firstName} 👋</Text>
          <Text style={styles.caption}>Bugun ham bir qadam oldinga.</Text>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initial}</Text></View>
      </View>
      <View style={styles.coursePill}>
        <Ionicons name="school-outline" size={16} color={colors.primary} />
        <Text style={styles.courseText}>Solfedjio · 1-sinf</Text>
      </View>
      <ContinueCard lesson={current} />
      <SectionHeader title="Bugungi mashq" caption="5 daqiqalik qisqa mashq" />
      <View style={styles.exercise}>
        <Ionicons name="ear-outline" size={24} color={colors.primary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseTitle}>Eshitib toping</Text>
          <Text style={styles.exerciseText}>Registrlarni eshitish orqali farqlang.</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </View>
      <SectionHeader title="Haftalik natija" />
      <View style={styles.stats}>
        <Text style={styles.stat}>4 kun</Text>
        <Text style={styles.stat}>82%</Text>
        <Text style={styles.stat}>3 dars</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 27, fontWeight: '900', color: colors.text },
  caption: { marginTop: 4, fontSize: 14, color: colors.muted },
  avatar: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900' },
  coursePill: { alignSelf: 'flex-start', flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 11, backgroundColor: '#EEF2FF', borderRadius: 999 },
  courseText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  exercise: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, padding: 16, borderRadius: 22, borderWidth: 1, borderColor: colors.border },
  exerciseTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  exerciseText: { marginTop: 3, fontSize: 13, color: colors.muted },
  stats: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: colors.surface, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: colors.border },
  stat: { fontWeight: '900', color: colors.text },
});
