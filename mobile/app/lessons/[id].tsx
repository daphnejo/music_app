import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ErrorState, LoadingState } from '@/components/ui/DataState';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { useCourse } from '@/context/CourseContext';
import { lessonProgress } from '@/types/content';
import { colors } from '@/theme/colors';

const blockIcon = (type: string) => {
  if (type.includes('audio')) return 'headset-outline';
  if (type.includes('image') || type === 'notation_input') return 'image-outline';
  if (type.includes('choice') || type === 'missing_fragment') return 'checkmark-circle-outline';
  if (type === 'sequence_order') return 'reorder-three-outline';
  if (type === 'practice_acknowledgement') return 'extension-puzzle-outline';
  return 'book-outline';
};

export default function LessonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, error, reload } = useCourse();

  if (isLoading && !data) return <Screen><LoadingState text="Dars yuklanmoqda…" /></Screen>;
  if (error && !data) return <Screen><ErrorState message={error} onRetry={() => void reload()} /></Screen>;

  const lesson = data?.lessons.find((item) => item.id === id);
  if (!lesson) return <Screen><ErrorState message="Dars topilmadi." onRetry={() => void reload()} /></Screen>;

  const progress = lessonProgress(lesson);
  const firstPending = lesson.blocks.find((block) => block.state !== 'completed') ?? lesson.blocks[0];

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow}>{lesson.declaredNumber ? `${lesson.declaredNumber}-DARS` : 'KIRISH'}</Text>
          <Text style={styles.title}>{lesson.title}</Text>
        </View>
      </View>

      <View style={styles.progress}>
        <View style={styles.progressTop}>
          <Text style={styles.progressLabel}>Dars progressi</Text>
          <Text style={styles.progressValue}>{lesson.completed}/{lesson.blockCount} · {progress}%</Text>
        </View>
        <ProgressBar value={progress} />
      </View>

      <View style={styles.list}>
        {lesson.blocks.map((block, index) => (
          <Pressable
            key={block.id}
            onPress={() => router.push({ pathname: '/blocks/[id]', params: { id: block.id } })}
            style={styles.section}
          >
            <View style={[styles.number, block.state === 'completed' && styles.numberDone]}>
              {block.state === 'completed'
                ? <Ionicons name="checkmark" size={17} color="#fff" />
                : <Text style={styles.numberText}>{index + 1}</Text>}
            </View>
            <Ionicons name={blockIcon(block.type) as never} size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>{block.title}</Text>
              <Text style={styles.sectionText}>
                {block.state === 'completed' ? 'Bajarildi' : block.state === 'in_progress' ? 'Davom etmoqda' : 'Boshlanmagan'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color={colors.muted} />
          </Pressable>
        ))}
      </View>

      {firstPending ? (
        <Pressable
          style={styles.cta}
          onPress={() => router.push({ pathname: '/blocks/[id]', params: { id: firstPending.id } })}
        >
          <Text style={styles.ctaText}>{progress > 0 ? 'Darsni davom ettirish' : 'Darsni boshlash'}</Text>
        </Pressable>
      ) : null}
      <Text style={styles.note}>Mazmun sen bergan Solfedjio materialidan backend orqali yuklanadi.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  title: { fontSize: 26, fontWeight: '900', color: colors.text },
  progress: { gap: 9, backgroundColor: colors.surface, padding: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between' },
  progressLabel: { fontSize: 13, fontWeight: '700', color: colors.text },
  progressValue: { fontSize: 13, fontWeight: '900', color: colors.primary },
  list: { gap: 10 },
  section: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colors.border },
  number: { width: 28, height: 28, borderRadius: 10, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  numberDone: { backgroundColor: '#2DAA74' },
  numberText: { color: colors.primary, fontWeight: '900' },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  sectionText: { color: colors.muted, fontSize: 12, lineHeight: 17 },
  cta: { height: 56, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontWeight: '800' },
  note: { color: colors.muted, fontSize: 12, textAlign: 'center' },
});
