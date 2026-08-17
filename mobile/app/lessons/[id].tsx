import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ErrorState, LoadingState } from '@/components/ui/DataState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { useCourse } from '@/context/CourseContext';
import { useTheme } from '@/context/ThemeContext';
import { lessonProgress, type CourseBlockSummary } from '@/types/content';

const blockIcon = (type: string) => {
  if (type.includes('audio')) return 'headset-outline';
  if (type.includes('image') || type === 'notation_input') return 'image-outline';
  if (type.includes('choice') || type === 'missing_fragment') return 'checkmark-circle-outline';
  if (type === 'sequence_order') return 'reorder-three-outline';
  if (type === 'practice_acknowledgement') return 'extension-puzzle-outline';
  return 'book-outline';
};

function cleanBlockTitle(value: string) {
  const trimmed = value.trim();
  const withoutLessonPrefix = trimmed.replace(/^\s*\d+\s*[-.]?\s*dars\s*[.:'’\-–—]*\s*/i, '').trim();
  return withoutLessonPrefix || trimmed;
}

function lessonTitleForDisplay(lessonTitle: string, blocks: CourseBlockSummary[]) {
  const trimmed = lessonTitle.trim();
  if (!trimmed.endsWith('…')) return trimmed;

  const prefix = trimmed.slice(0, -1);
  const completeSourceTitle = blocks
    .map((block) => cleanBlockTitle(block.title))
    .find((title) => !title.endsWith('…') && title.startsWith(prefix));

  return completeSourceTitle || trimmed;
}

function blockTitleForDisplay(value: string, lessonTitle: string) {
  const cleaned = cleanBlockTitle(value);
  const completeLessonTitle = lessonTitle.trim();

  if (cleaned.endsWith('…') && completeLessonTitle && !completeLessonTitle.endsWith('…') && cleaned.startsWith(completeLessonTitle)) {
    return completeLessonTitle;
  }

  return cleaned;
}

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, reload } = useCourse();
  const { colors } = useTheme();

  if (isLoading && !data) return <Screen><LoadingState text="Dars yuklanmoqda…" /></Screen>;
  if (error && !data) return <Screen><ErrorState message={error} onRetry={() => void reload()} /></Screen>;

  const lesson = data?.lessons.find((item) => item.id === id);
  if (!lesson) return <Screen><ErrorState message="Dars topilmadi." onRetry={() => void reload()} /></Screen>;

  const displayLessonTitle = lessonTitleForDisplay(lesson.title, lesson.blocks);
  const progress = lessonProgress(lesson);
  const firstPending = lesson.blocks.find((block) => block.state !== 'completed');
  const ctaBlock = firstPending ?? lesson.blocks[0];
  const ctaLabel = progress >= 100
    ? 'Darsni qayta ko‘rish'
    : progress > 0
      ? 'Darsni davom ettirish'
      : 'Darsni boshlash';
  const cardStyle = { backgroundColor: colors.surface, borderColor: colors.border };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.back, cardStyle]}>
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{lesson.declaredNumber ? `${lesson.declaredNumber}-DARS` : 'KIRISH'}</Text>
          <Text style={[styles.title, { color: colors.text }]}>{displayLessonTitle}</Text>
        </View>
      </View>

      <View style={[styles.progress, cardStyle]}>
        <View style={styles.progressTop}>
          <Text style={[styles.progressLabel, { color: colors.text }]}>Dars progressi</Text>
          <Text style={[styles.progressValue, { color: colors.primary }]}>{lesson.completed}/{lesson.blockCount} · {progress}%</Text>
        </View>
        <ProgressBar value={progress} />
      </View>

      <View style={styles.list}>
        {lesson.blocks.map((block, index) => {
          const done = block.state === 'completed';
          const waitingForReview = block.needsReview && !done;
          return (
            <Pressable
              key={block.id}
              onPress={() => router.push({ pathname: '/blocks/[id]', params: { id: block.id } })}
              style={[styles.section, cardStyle]}
            >
              <View style={[styles.number, { backgroundColor: done ? colors.success : colors.primarySoft }]}>
                {done
                  ? <Ionicons name="checkmark" size={17} color="#fff" />
                  : <Text style={[styles.numberText, { color: colors.primary }]}>{index + 1}</Text>}
              </View>
              <Ionicons name={blockIcon(block.type) as never} size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>{blockTitleForDisplay(block.title, displayLessonTitle)}</Text>
                <Text style={[styles.sectionText, { color: waitingForReview ? colors.warning : colors.muted }]}>
                  {done
                    ? 'Bajarildi'
                    : waitingForReview
                      ? 'Metodist tasdig‘i kutilmoqda'
                      : block.state === 'in_progress'
                        ? 'Davom etmoqda'
                        : 'Boshlanmagan'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={19} color={colors.muted} />
            </Pressable>
          );
        })}
      </View>

      {ctaBlock ? (
        <Pressable
          style={[styles.cta, { backgroundColor: colors.primary }]}
          onPress={() => router.push({ pathname: '/blocks/[id]', params: { id: ctaBlock.id } })}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 11, fontWeight: '900' },
  title: { fontSize: 26, fontWeight: '900' },
  progress: { gap: 9, padding: 16, borderRadius: 20, borderWidth: 1 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 13, fontWeight: '700' },
  progressValue: { fontSize: 13, fontWeight: '900' },
  list: { gap: 10 },
  section: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 20, padding: 14, borderWidth: 1 },
  number: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  numberText: { fontWeight: '900' },
  sectionTitle: { fontSize: 15, fontWeight: '800' },
  sectionText: { fontSize: 12, lineHeight: 17 },
  cta: { height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontWeight: '800' },
});
