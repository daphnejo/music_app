import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ContinueCard } from '@/components/home/ContinueCard';
import { ErrorState, LoadingState } from '@/components/ui/DataState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useAuth } from '@/context/AuthContext';
import { useCourse } from '@/context/CourseContext';
import { useTheme } from '@/context/ThemeContext';
import { lessonProgress } from '@/types/content';

export default function HomeScreen() {
  const { user } = useAuth();
  const { data, isLoading, error, reload } = useCourse();
  const { colors } = useTheme();
  const firstName = user?.fullName?.trim().split(/\s+/)[0] || 'o‘quvchi';
  const initial = firstName.charAt(0).toUpperCase();

  if (isLoading && !data) return <Screen><LoadingState text="Kursingiz yuklanmoqda…" /></Screen>;
  if (error && !data) return <Screen><ErrorState message={error} onRetry={() => void reload()} /></Screen>;

  const lessons = data?.lessons ?? [];
  const lastLesson = data?.lastBlockId
    ? lessons.find((lesson) => lesson.blocks.some((block) => block.id === data.lastBlockId))
    : null;
  const current = lastLesson ?? lessons.find((lesson) => lessonProgress(lesson) < 100) ?? lessons[0];
  const allBlocks = lessons.flatMap((lesson) => lesson.blocks);
  const completedBlocks = allBlocks.filter((block) => block.state === 'completed').length;
  const completedLessons = lessons.filter((lesson) => lesson.blockCount > 0 && lesson.completed === lesson.blockCount).length;
  const overall = allBlocks.length ? Math.round((completedBlocks / allBlocks.length) * 100) : 0;
  const exercise = allBlocks.find((block) => block.type === 'audio_single_choice') ?? allBlocks.find((block) => block.type !== 'theory');

  return (
    <Screen>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.text }]}>Salom, {firstName} 👋</Text>
          <Text style={[styles.caption, { color: colors.muted }]}>Bugun ham bir qadam oldinga.</Text>
        </View>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={styles.avatarText}>{initial}</Text></View>
      </View>

      <View style={[styles.coursePill, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="school-outline" size={16} color={colors.primary} />
        <Text style={[styles.courseText, { color: colors.primary }]}>{data?.course?.title ?? 'Solfedjio'}</Text>
      </View>

      {current ? <ContinueCard lesson={current} /> : <ErrorState message={data?.message ?? 'Kurs kontenti topilmadi'} />}

      {exercise ? (
        <>
          <SectionHeader title="Mashq" caption="Materialdagi interaktiv topshiriq" />
          <Pressable
            style={[styles.exercise, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => router.push({ pathname: '/blocks/[id]', params: { id: exercise.id } })}
          >
            <Ionicons name={exercise.type === 'audio_single_choice' ? 'ear-outline' : 'musical-notes-outline'} size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.exerciseTitle, { color: colors.text }]}>{exercise.title}</Text>
              <Text style={[styles.exerciseText, { color: colors.muted }]}>Boshlash uchun bosing</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        </>
      ) : null}

      <SectionHeader title="Umumiy natija" />
      <View style={[styles.stats, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.statBox}><Text style={[styles.stat, { color: colors.text }]}>{overall}%</Text><Text style={[styles.statLabel, { color: colors.muted }]}>progress</Text></View>
        <View style={styles.statBox}><Text style={[styles.stat, { color: colors.text }]}>{completedLessons}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>dars tugadi</Text></View>
        <View style={styles.statBox}><Text style={[styles.stat, { color: colors.text }]}>{completedBlocks}</Text><Text style={[styles.statLabel, { color: colors.muted }]}>qism tugadi</Text></View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontSize: 27, fontWeight: '900' },
  caption: { marginTop: 4, fontSize: 14 },
  avatar: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '900' },
  coursePill: { alignSelf: 'flex-start', flexDirection: 'row', gap: 6, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 11, borderRadius: 999 },
  courseText: { fontSize: 13, fontWeight: '800' },
  exercise: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 22, borderWidth: 1 },
  exerciseTitle: { fontSize: 16, fontWeight: '800' },
  exerciseText: { marginTop: 3, fontSize: 13 },
  stats: { flexDirection: 'row', justifyContent: 'space-around', borderRadius: 22, padding: 18, borderWidth: 1 },
  statBox: { flex: 1, alignItems: 'center', gap: 3 },
  stat: { fontWeight: '900', fontSize: 18 },
  statLabel: { fontSize: 11, textAlign: 'center' },
});
