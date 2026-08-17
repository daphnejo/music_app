import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { lessonProgress, type CourseLessonSummary } from '@/types/content';
import { childLessonTitle } from '@/utils/lesson-display';

const CARD_PALETTES = [
  { background: '#EEE9FF', icon: '#6C5CE7', bubble: '#DDD4FF' },
  { background: '#E3F4FF', icon: '#2483C5', bubble: '#CDEBFF' },
  { background: '#FFF1BE', icon: '#A66A00', bubble: '#FFE58A' },
  { background: '#DFF7EC', icon: '#16805A', bubble: '#BDEDD8' },
  { background: '#FFE7EE', icon: '#C14E70', bubble: '#FFD0DE' },
];

const LESSON_ICONS: Array<keyof typeof Ionicons.glyphMap> = [
  'musical-notes',
  'ear',
  'musical-note',
  'grid',
  'color-wand',
  'headset',
];

export function LessonCard({ lesson, index = 0 }: { lesson: CourseLessonSummary; index?: number }) {
  const progress = lessonProgress(lesson);
  const palette = CARD_PALETTES[index % CARD_PALETTES.length];
  const iconName = LESSON_ICONS[index % LESSON_ICONS.length];
  const nextBlock = lesson.blocks.find((block) => block.state !== 'completed') ?? lesson.blocks[0];
  const stars = progress >= 100 ? 3 : progress >= 66 ? 2 : progress > 0 ? 1 : 0;
  const title = childLessonTitle(lesson);

  const openLesson = () => {
    if (lesson.declaredNumber === 2 && nextBlock) {
      router.push({ pathname: '/lesson-two', params: { blockId: nextBlock.id } });
      return;
    }
    if (nextBlock) {
      router.push({ pathname: '/blocks/[id]', params: { id: nextBlock.id } });
      return;
    }
    router.push({ pathname: '/lessons/[id]', params: { id: lesson.id } });
  };

  const statusLabel = progress >= 100 ? 'Barakalla!' : progress > 0 ? 'Davom etamiz' : 'Boshlaymiz';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${lesson.declaredNumber ?? index + 1}-dars. ${title}. ${statusLabel}`}
      onPress={openLesson}
      style={({ pressed }) => [styles.card, { backgroundColor: palette.background }, pressed && styles.pressed]}
    >
      <View style={[styles.iconBubble, { backgroundColor: palette.bubble }]}>
        <Ionicons name={iconName} size={31} color={palette.icon} />
      </View>

      <View style={styles.main}>
        <Text style={[styles.eyebrow, { color: palette.icon }]}>
          {lesson.declaredNumber ? `${lesson.declaredNumber}-DARS` : `DARS ${index + 1}`}
        </Text>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>

        <View style={styles.bottomRow}>
          <View style={styles.stars} accessibilityLabel={`${stars} ta yulduz`}>
            {[0, 1, 2].map((star) => (
              <Ionicons key={star} name={star < stars ? 'star' : 'star-outline'} size={17} color={star < stars ? '#F2B01E' : '#A9A3B7'} />
            ))}
          </View>
          <Text style={styles.status}>{statusLabel}</Text>
        </View>
      </View>

      <View style={[styles.goButton, { backgroundColor: palette.icon }]}>
        <Ionicons name={progress >= 100 ? 'refresh' : 'arrow-forward'} size={21} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 136,
    borderRadius: 30,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  iconBubble: { width: 66, height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  main: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8, marginBottom: 5 },
  title: { color: '#2E2940', fontSize: 18, lineHeight: 23, fontWeight: '900' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 9, marginTop: 11 },
  stars: { flexDirection: 'row', gap: 2 },
  status: { color: '#655F75', fontSize: 11, fontWeight: '800' },
  goButton: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
