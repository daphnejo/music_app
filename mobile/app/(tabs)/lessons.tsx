import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { LessonCard } from '@/components/lesson/LessonCard';
import { ErrorState, LoadingState } from '@/components/ui/DataState';
import { Screen } from '@/components/ui/Screen';
import { useCourse } from '@/context/CourseContext';
import { useTheme } from '@/context/ThemeContext';

export default function LessonsScreen() {
  const { data, isLoading, error, reload } = useCourse();
  const { colors } = useTheme();

  if (isLoading && !data) return <Screen><LoadingState text="Darslaring yuklanmoqda…" /></Screen>;
  if (error && !data) return <Screen><ErrorState message={error} onRetry={() => void reload()} /></Screen>;
  if (!data?.course) {
    return <Screen><ErrorState message={data?.message ?? 'Senga hali darslar biriktirilmagan'} onRetry={() => void reload()} /></Screen>;
  }

  return (
    <Screen>
      <View style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="musical-notes" size={32} color={colors.primary} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.kicker, { color: colors.primary }]}>D-SOLFEDJIO</Text>
          <Text style={[styles.title, { color: colors.text }]}>Musiqa sarguzashti 🎵</Text>
          <Text style={[styles.caption, { color: colors.muted }]}>Bir darsni tanla va musiqa olamiga kir!</Text>
        </View>
      </View>

      <View style={[styles.tip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.tipEmoji}><Text style={styles.tipEmojiText}>⭐</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.tipTitle, { color: colors.text }]}>Har bir qadam muhim</Text>
          <Text style={[styles.tipText, { color: colors.muted }]}>Darslarni bajarib, yulduzlarni yig‘ib bor.</Text>
        </View>
      </View>

      <View style={styles.list}>
        {data.lessons.map((lesson, index) => (
          <LessonCard key={lesson.id} lesson={lesson} index={index} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 4 },
  heroIcon: { width: 66, height: 66, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  heroCopy: { flex: 1 },
  kicker: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '900' },
  caption: { fontSize: 13, lineHeight: 19, fontWeight: '600', marginTop: 4 },
  tip: { minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 23, borderWidth: 1 },
  tipEmoji: { width: 48, height: 48, borderRadius: 17, backgroundColor: '#FFF1B9', alignItems: 'center', justifyContent: 'center' },
  tipEmojiText: { fontSize: 25 },
  tipTitle: { fontSize: 14, fontWeight: '900' },
  tipText: { fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 2 },
  list: { gap: 13 },
});
