import { Text, View, StyleSheet } from 'react-native';
import { LessonCard } from '@/components/lesson/LessonCard';
import { ErrorState, LoadingState } from '@/components/ui/DataState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useCourse } from '@/context/CourseContext';
import { colors } from '@/theme/colors';

export default function LessonsScreen() {
  const { data, isLoading, error, reload } = useCourse();

  if (isLoading && !data) return <Screen><LoadingState text="Darslar yuklanmoqda…" /></Screen>;
  if (error && !data) return <Screen><ErrorState message={error} onRetry={() => void reload()} /></Screen>;
  if (!data?.course) {
    return <Screen><SectionHeader title="Darslar" /><ErrorState message={data?.message ?? 'Sizga hali kurs tayinlanmagan'} onRetry={() => void reload()} /></Screen>;
  }

  const started = data.lessons.filter((lesson) => lesson.completed > 0 || lesson.blocks.some((b) => b.state === 'in_progress')).length;

  return (
    <Screen>
      <SectionHeader title="Darslar" caption={`${data.course.title}${data.course.subtitle ? ` · ${data.course.subtitle}` : ''}`} />
      <View style={styles.summary}>
        <Text style={styles.value}>{started} / {data.lessons.length}</Text>
        <Text style={styles.label}>dars boshlandi</Text>
      </View>
      <View style={styles.list}>{data.lessons.map((lesson) => <LessonCard key={lesson.id} lesson={lesson} />)}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  summary: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  value: { color: colors.primary, fontSize: 22, fontWeight: '900' },
  label: { color: colors.muted, fontSize: 13 },
});
