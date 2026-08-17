import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { lessonProgress, type CourseLessonSummary } from '@/types/content';

export function ContinueCard({ lesson }: { lesson: CourseLessonSummary }) {
  const { colors } = useTheme();
  const progress = lessonProgress(lesson);
  const nextBlock = lesson.blocks.find((block) => block.state !== 'completed') ?? lesson.blocks[0];
  const filledDots = Math.max(0, Math.min(5, Math.ceil(progress / 20)));
  const isDone = progress >= 100;

  const openLesson = () => {
    if (nextBlock) {
      router.push({ pathname: '/blocks/[id]', params: { id: nextBlock.id } });
      return;
    }
    router.push({ pathname: '/lessons/[id]', params: { id: lesson.id } });
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.primary }]}>
      <View style={styles.decorOne} />
      <View style={styles.decorTwo} />

      <View style={styles.topRow}>
        <View style={styles.musicBubble}>
          <Ionicons name="musical-notes" size={28} color="#FFFFFF" />
        </View>
        <View style={styles.lessonBadge}>
          <Text style={styles.lessonBadgeText}>
            {lesson.declaredNumber ? `${lesson.declaredNumber}-DARS` : 'DARS'}
          </Text>
        </View>
      </View>

      <Text style={styles.kicker}>{isDone ? 'YANA BIR MARTA KO‘RAMIZMI?' : 'DAVOM ETAMIZMI?'}</Text>
      <Text style={styles.title}>{lesson.title}</Text>

      <View style={styles.dotRow} accessibilityLabel={`Dars progressi ${progress} foiz`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <View key={index} style={[styles.dot, index < filledDots && styles.dotFilled]} />
        ))}
      </View>

      <Pressable onPress={openLesson} style={[styles.button, { backgroundColor: colors.surface }]}>
        <Ionicons name={isDone ? 'refresh' : 'play'} size={20} color={colors.primary} />
        <Text style={[styles.buttonText, { color: colors.primary }]}>{isDone ? 'Qayta ko‘rish' : progress > 0 ? 'Davom etish' : 'Boshlash'}</Text>
        <Ionicons name="arrow-forward" size={19} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 280,
    borderRadius: 32,
    padding: 22,
    overflow: 'hidden',
    gap: 10,
  },
  decorOne: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
    right: -52,
    top: -48,
  },
  decorTwo: {
    position: 'absolute',
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(255,255,255,0.07)',
    left: -38,
    bottom: -32,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  musicBubble: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonBadge: {
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  lessonBadgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  kicker: { color: 'rgba(255,255,255,0.76)', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: '#FFFFFF', fontSize: 30, lineHeight: 36, fontWeight: '900', maxWidth: '92%' },
  dotRow: { flexDirection: 'row', gap: 7, marginTop: 4, marginBottom: 6 },
  dot: { width: 25, height: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotFilled: { backgroundColor: '#FFD85A' },
  button: {
    minHeight: 58,
    borderRadius: 19,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 'auto',
  },
  buttonText: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '900' },
});
