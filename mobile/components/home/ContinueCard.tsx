import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useTheme } from '@/context/ThemeContext';
import { lessonProgress, type CourseLessonSummary } from '@/types/content';

export function ContinueCard({ lesson }: { lesson: CourseLessonSummary }) {
  const { colors } = useTheme();
  const progress = lessonProgress(lesson);
  const prefix = lesson.declaredNumber ? `${lesson.declaredNumber}-dars · ` : '';
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}><Ionicons name="musical-notes" size={24} color={colors.primary} /></View>
      <View style={styles.body}>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>DAVOM ETTIRISH</Text>
        <Text style={[styles.title, { color: colors.text }]}>{prefix}{lesson.title}</Text>
        <Text style={[styles.caption, { color: colors.muted }]}>{lesson.completed}/{lesson.blockCount} qism · {progress}% bajarildi</Text>
        <ProgressBar value={progress} />
      </View>
      <Pressable onPress={() => router.push({ pathname: '/lessons/[id]', params: { id: lesson.id } })} style={[styles.button, { backgroundColor: colors.primary }]}>
        <Ionicons name="play" size={17} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 24, padding: 16, borderWidth: 1 },
  icon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 5 },
  eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: .7 },
  title: { fontSize: 17, fontWeight: '800' },
  caption: { fontSize: 12 },
  button: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
