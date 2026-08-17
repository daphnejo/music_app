import { useCallback, useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ErrorState, LoadingState } from '@/components/ui/DataState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useCourse } from '@/context/CourseContext';
import { useTheme } from '@/context/ThemeContext';
import { ApiError, apiRequest } from '@/services/api/client';
import { lessonProgress } from '@/types/content';

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
  const { colors } = useTheme();
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
  const testStatsUnavailable = !!error && !summary;

  const cardStyle = { backgroundColor: colors.surface, borderColor: colors.border };

  return (
    <Screen>
      <SectionHeader title="Natijalar" caption="Faqat haqiqiy bajarilgan dars va test natijalari." />

      {error && data ? (
        <View style={[styles.warning, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.warningIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="cloud-offline-outline" size={20} color={colors.primary} />
          </View>
          <View style={styles.warningBody}>
            <Text style={[styles.warningTitle, { color: colors.text }]}>Test statistikasi vaqtincha yangilanmadi</Text>
            <Text style={[styles.warningText, { color: colors.muted }]}>{error}</Text>
          </View>
          <Pressable disabled={isLoading} onPress={() => void loadProgress()} style={styles.retry} hitSlop={8}>
            <Ionicons name="refresh" size={19} color={colors.primary} />
          </Pressable>
        </View>
      ) : null}

      <View style={[styles.hero, cardStyle]}>
        <Text style={[styles.value, { color: colors.primary }]}>{overall}%</Text>
        <Text style={[styles.label, { color: colors.muted }]}>Umumiy progress</Text>
        <ProgressBar value={overall} />
      </View>
      <View style={styles.row}>
        <View style={[styles.metric, cardStyle]}>
          <Text style={[styles.metricValue, { color: colors.text }]}>{completedLessons}</Text>
          <Text style={[styles.label, { color: colors.muted }]}>yakunlangan dars</Text>
        </View>
        <View style={[styles.metric, cardStyle]}>
          <Text style={[styles.metricValue, { color: colors.text }]}>{testStatsUnavailable || answerAccuracy === null ? '—' : `${answerAccuracy}%`}</Text>
          <Text style={[styles.label, { color: colors.muted }]}>test aniqligi</Text>
        </View>
      </View>
      <View style={styles.row}>
        <View style={[styles.metric, cardStyle]}>
          <Text style={[styles.metricValue, { color: colors.text }]}>{completedBlocks}</Text>
          <Text style={[styles.label, { color: colors.muted }]}>bajarilgan qism</Text>
        </View>
        <View style={[styles.metric, cardStyle]}>
          <Text style={[styles.metricValue, { color: colors.text }]}>{testStatsUnavailable ? '—' : (summary?.answeredQuestions ?? 0)}</Text>
          <Text style={[styles.label, { color: colors.muted }]}>javob berilgan test</Text>
        </View>
      </View>
      <SectionHeader title="Darslar bo‘yicha" />
      <View style={{ gap: 10 }}>
        {lessons.map((lesson) => {
          const percent = lessonProgress(lesson);
          return (
            <View key={lesson.id} style={[styles.lesson, cardStyle]}>
              <View style={styles.lessonTop}>
                <Text style={[styles.lessonTitle, { color: colors.text }]}>{lesson.declaredNumber ? `${lesson.declaredNumber}-dars · ` : ''}{lesson.title}</Text>
                <Text style={[styles.percent, { color: colors.primary }]}>{percent}%</Text>
              </View>
              <ProgressBar value={percent} />
              <Text style={[styles.lessonMeta, { color: colors.muted }]}>{lesson.completed}/{lesson.blockCount} qism bajarildi</Text>
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  warning: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderRadius: 18, padding: 13 },
  warningIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  warningBody: { flex: 1, gap: 3 },
  warningTitle: { fontSize: 13, fontWeight: '900' },
  warningText: { fontSize: 11, lineHeight: 16 },
  retry: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  hero: { borderRadius: 24, padding: 20, gap: 8, borderWidth: 1 },
  value: { fontSize: 36, fontWeight: '900' },
  label: { fontSize: 12 },
  row: { flexDirection: 'row', gap: 12 },
  metric: { flex: 1, borderRadius: 20, padding: 16, borderWidth: 1 },
  metricValue: { fontSize: 22, fontWeight: '900' },
  lesson: { borderRadius: 18, padding: 15, gap: 10, borderWidth: 1 },
  lessonTop: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  lessonTitle: { flex: 1, fontWeight: '700' },
  percent: { fontWeight: '800' },
  lessonMeta: { fontSize: 11 },
});
