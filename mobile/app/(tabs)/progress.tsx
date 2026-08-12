import { StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { lessons } from '@/data/mock';
import { colors } from '@/theme/colors';

export default function ProgressScreen() {
  return <Screen><SectionHeader title="Natijalar" caption="O‘qishdagi rivojlanishingiz bir joyda." /><View style={styles.hero}><Text style={styles.value}>36%</Text><Text style={styles.label}>Umumiy progress</Text><ProgressBar value={36} /></View><View style={styles.row}><View style={styles.metric}><Text style={styles.metricValue}>3</Text><Text style={styles.label}>yakunlangan dars</Text></View><View style={styles.metric}><Text style={styles.metricValue}>82%</Text><Text style={styles.label}>test o‘rtachasi</Text></View></View><SectionHeader title="Darslar bo‘yicha" /><View style={{ gap: 10 }}>{lessons.filter((l) => l.status !== 'locked').map((lesson) => <View key={lesson.id} style={styles.lesson}><View style={styles.lessonTop}><Text style={styles.lessonTitle}>{lesson.number}-dars · {lesson.title}</Text><Text style={styles.percent}>{lesson.progress}%</Text></View><ProgressBar value={lesson.progress} /></View>)}</View></Screen>;
}
const styles = StyleSheet.create({ hero: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, gap: 8, borderWidth: 1, borderColor: colors.border }, value: { fontSize: 36, fontWeight: '900', color: colors.primary }, label: { color: colors.muted, fontSize: 12 }, row: { flexDirection: 'row', gap: 12 }, metric: { flex: 1, backgroundColor: colors.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border }, metricValue: { fontSize: 22, fontWeight: '900', color: colors.text }, lesson: { backgroundColor: colors.surface, borderRadius: 18, padding: 15, gap: 10, borderWidth: 1, borderColor: colors.border }, lessonTop: { flexDirection: 'row', justifyContent: 'space-between' }, lessonTitle: { fontWeight: '700', color: colors.text }, percent: { color: colors.primary, fontWeight: '800' } });
