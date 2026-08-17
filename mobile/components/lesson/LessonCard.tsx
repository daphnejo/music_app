import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useTheme } from '@/context/ThemeContext';
import { lessonProgress, type CourseLessonSummary } from '@/types/content';

export function LessonCard({ lesson }: { lesson: CourseLessonSummary }) {
  const { colors } = useTheme();
  const progress = lessonProgress(lesson);
  const numberLabel = lesson.declaredNumber ? `${lesson.declaredNumber}` : '•';

  const openLesson = () => {
    const firstBlock = lesson.blocks[0];
    if (lesson.declaredNumber === 1 && firstBlock) {
      router.push({ pathname: '/blocks/[id]', params: { id: firstBlock.id } });
      return;
    }
    router.push({ pathname: '/lessons/[id]', params: { id: lesson.id } });
  };

  return (
    <Pressable
      onPress={openLesson}
      style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}
    >
      <View style={styles.top}>
        <View style={[styles.number, { backgroundColor: colors.primarySoft }]}><Text style={[styles.numberText, { color: colors.primary }]}>{numberLabel}</Text></View>
        <View style={styles.main}>
          <Text style={[styles.title, { color: colors.text }]}>{lesson.title}</Text>
          <Text style={[styles.description, { color: colors.muted }]}>{lesson.blockCount} ta o‘quv qismi</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.muted} />
      </View>
      <View style={styles.progressRow}>
        <ProgressBar value={progress} />
        <Text style={[styles.progressText, { color: colors.muted }]}>{lesson.completed}/{lesson.blockCount} · {progress}%</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 22, padding: 16, gap: 14, borderWidth: 1 },
  pressed: { opacity: .78 },
  top: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  number: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontWeight: '800', fontSize: 16 },
  main: { flex: 1, gap: 3 },
  title: { fontSize: 17, fontWeight: '800' },
  description: { fontSize: 13, lineHeight: 18 },
  progressRow: { gap: 7 },
  progressText: { fontSize: 12, fontWeight: '700', alignSelf: 'flex-end' },
});
