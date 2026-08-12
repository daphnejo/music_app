import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ErrorState, LoadingState } from '@/components/ui/DataState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useCourse } from '@/context/CourseContext';
import { ApiError, apiRequest } from '@/services/api/client';
import { lessonProgress } from '@/types/content';
import { colors } from '@/theme/colors';

type ProgressResponse = {
  summary: null | {
    totalBlocks: number;
    completedBlocks: number;
    answeredQuestions: number;
    correctAnswers: number;
  };
  perLesson?: Array<{ lesson: string; orderIndex: number; total: number; done: number }>;
};

export default function ProgressScreen() {
  const { data, isLoading: courseLoading, error: courseError, reload: reloadCourse } = useCourse();
  const [progressData, setProgressData] = useState<ProgressResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProgress = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setProgressData(await apiRequest<ProgressResponse>('/api/progress'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Natijalarni yuklab bo‘lmadi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadProgress(); }, [loadProgress]);

  if ((courseLoading || isLoading) && !data && !progressData) return <Screen><LoadingState text="Natijalar hisoblanmoqda…" /></Screen>;
  if ((courseError || error) && !data) {
    return <Screen><ErrorState message={courseError ?? error ?? 'Natijalarni yuklab bo‘lmadi'} onRetry={() => { void reloadCourse(); void loadProgress(); }} /></Screen>;
  }

  const lessons = data?.lessons ?? [];
  const summary = progressData?.summary;
  const totalBlocks = summary?.totalBlocks ?? lessons.reduce((sum, lesson) => sum + lesson.blockCount, 0);
  const completedBlocks = summary?.completedBlocks ?? lessons.reduce((sum, lesson) => sum + lesson.completed, 0);
  const overall = totalBlocks ? Math.round((completedBlocks / totalBlocks) * 100) : 0;
  const completedLessons = lessons.filter((lesson) => lesson.blockCount > 0 && lesson.completed === lesson.blockCount).length;
  const answerAccuracy = summary?.answeredQuestions
    ? Math.round((summary.correctAnswers / summary.answeredQuestions) * 100)
    : null;

  return (
    <Screen>
      <SectionHeader title="Natijalar" caption="Faqat haqiqiy bajarilgan dars va test natijalari." />
      <View style={styles.hero}>
        <Text style={styles.value}>{overall}%</Text>
        <Text style={styles.label}>Umumiy progress</Text>
        <ProgressBar value={overall} />
      </View>
      <View style={styles.row}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{completedLessons}</Text>
          <Text style={styles.label}>yakunlangan dars</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{answerAccuracy === null ? '—' : `${answerAccuracy}%`}</Text>
          <Text style={styles.label}>test aniqligi</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{completedBlocks}</Text>
          <Text style={styles.label}>bajarilgan qism</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>{summary?.answeredQuestions ?? 0}</Text>
          <Text style={styles.label}>javob berilgan test</Text>
        </View>
      </View>
      <SectionHeader title="Darslar bo‘yicha" />
      <View style={{ gap: 10 }}>
        {lessons.map((lesson) => {
          const percent = lessonProgress(lesson);
          return (
            <View key={lesson.id} style={styles.lesson}>
              <View style={styles.lessonTop}>
                <Text style={styles.lessonTitle}>{lesson.declaredNumber ? `${lesson.declaredNumber}-dars · ` : ''}{lesson.title}</Text>
                <Text style={styles.percent}>{percent}%</Text>
              </View>
              <ProgressBar value={percent} />
              <Text style={styles.lessonMeta}>{lesson.completed}/{lesson.blockCount} qism bajarildi</Text>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, gap: 8, borderWidth: 1, borderColor: colors.border },
  value: { fontSize: 36, fontWeight: '900', color: colors.primary },
  label: { color: colors.muted, fontSize: 12 },
  row: { flexDirection: 'row', gap: 12 },
  metric: { flex: 1, backgroundColor: colors.surface, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: colors.border },
  metricValue: { fontSize: 22, fontWeight: '900', color: colors.text },
  lesson: { backgroundColor: colors.surface, borderRadius: 18, padding: 15, gap: 10, borderWidth: 1, borderColor: colors.border },
  lessonTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  lessonTitle: { flex: 1, fontWeight: '700', color: colors.text },
  percent: { color: colors.primary, fontWeight: '800' },
  lessonMeta: { color: colors.muted, fontSize: 11 },
});
