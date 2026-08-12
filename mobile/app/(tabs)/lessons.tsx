import { StyleSheet, Text, View } from 'react-native';
import { LessonCard } from '@/components/lesson/LessonCard';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { lessons } from '@/data/mock';
import { colors } from '@/theme/colors';

export default function LessonsScreen() {
  return <Screen><SectionHeader title="Darslar" caption="Solfedjio · 1-sinf" /><View style={styles.summary}><Text style={styles.value}>3 / 22</Text><Text style={styles.label}>dars boshlandi</Text></View><View style={styles.list}>{lessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)}</View></Screen>;
}
const styles = StyleSheet.create({ list: { gap: 12 }, summary: { flexDirection: 'row', alignItems: 'baseline', gap: 8 }, value: { color: colors.primary, fontSize: 22, fontWeight: '900' }, label: { color: colors.muted, fontSize: 13 } });
