import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { lessonProgress, type CourseLessonSummary } from '@/types/content';
import { childLessonTitle } from '@/utils/lesson-display';

function customLessonHref(pathname: '/lesson-three' | '/lesson-four' | '/lesson-five', blockId: string): Href {
  return `${pathname}?blockId=${encodeURIComponent(blockId)}` as Href;
}

export function ContinueCard({ lesson }: { lesson: CourseLessonSummary }) {
  const { colors } = useTheme();
  const progress = lessonProgress(lesson);
  const nextBlock = lesson.blocks.find((block) => block.state !== 'completed') ?? lesson.blocks[0];
  const filledDots = Math.max(0, Math.min(5, Math.ceil(progress / 20)));
  const isDone = progress >= 100;
  const title = childLessonTitle(lesson);

  const openLesson = () => {
    if (lesson.declaredNumber === 2 && nextBlock) {
      router.push({ pathname: '/lesson-two', params: { blockId: nextBlock.id } });
      return;
    }
    if (lesson.declaredNumber === 3 && nextBlock) {
      router.push(customLessonHref('/lesson-three', nextBlock.id));
      return;
    }
    if (lesson.declaredNumber === 4 && nextBlock) {
      router.push(customLessonHref('/lesson-four', nextBlock.id));
      return;
    }
    if (lesson.declaredNumber === 5 && nextBlock) {
      router.push(customLessonHref('/lesson-five', nextBlock.id));
      return;
    }
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
          <Ionicons name="musical-notes" size={25} color="#FFFFFF" />
        </View>
        <View style={styles.lessonBadge}>
          <Text style={styles.lessonBadgeText}>
            {lesson.declaredNumber ? `${lesson.declaredNumber}-DARS` : 'DARS'}
          </Text>
        </View>
      </View>

      <Text style={styles.kicker}>{isDone ? 'YANA BIR MARTA KO‘RAMIZMI?' : 'DAVOM ETAMIZMI?'}</Text>
      <Text style={styles.title} numberOfLines={3}>{title}</Text>

      <View style={styles.dotRow} accessibilityLabel={`Dars progressi ${progress} foiz`}>
        {Array.from({ length: 5 }).map((_, index) => (
          <View key={index} style={[styles.dot, index < filledDots && styles.dotFilled]} />
        ))}
      </View>

      <Pressable onPress={openLesson} style={[styles.button, { backgroundColor: colors.surface }]}>
        <Ionicons name={isDone ? 'refresh' : 'play'} size={19} color={colors.primary} />
        <Text style={[styles.buttonText, { color: colors.primary }]}>{isDone ? 'Qayta ko‘rish' : progress > 0 ? 'Davom etish' : 'Boshlash'}</Text>
        <Ionicons name="arrow-forward" size={19} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 238,
    borderRadius: 30,
    padding: 20,
    overflow: 'hidden',
    gap: 8,
  },
  decorOne: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255,255,255,0.08)',
    right: -50,
    top: -48,
  },
  decorTwo: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: 'rgba(255,255,255,0.07)',
    left: -36,
    bottom: -30,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 },
  musicBubble: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  lessonBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  kicker: { color: 'rgba(255,255,255,0.76)', fontSize: 11, fontWeight: '900', letterSpacing: 0.75 },
  title: { color: '#FFFFFF', fontSize: 25, lineHeight: 30, fontWeight: '900', maxWidth: '94%' },
  dotRow: { flexDirection: 'row', gap: 7, marginTop: 2, marginBottom: 5 },
  dot: { width: 24, height: 7, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotFilled: { backgroundColor: '#FFD85A' },
  button: {
    minHeight: 54,
    borderRadius: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 'auto',
  },
  buttonText: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '900' },
});
