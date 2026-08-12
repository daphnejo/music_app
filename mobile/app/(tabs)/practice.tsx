import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ErrorState, LoadingState } from '@/components/ui/DataState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useCourse } from '@/context/CourseContext';
import { colors } from '@/theme/colors';

function typeMeta(type: string) {
  if (type === 'audio_single_choice') return { label: 'Eshitish topshirig‘i', icon: 'ear-outline' as const };
  if (type === 'image_choice') return { label: 'Rasmli topshiriq', icon: 'images-outline' as const };
  if (type === 'sequence_order') return { label: 'Ketma-ketlik', icon: 'reorder-three-outline' as const };
  if (type === 'missing_fragment') return { label: 'Yetishmagan qism', icon: 'extension-puzzle-outline' as const };
  if (type === 'notation_input') return { label: 'Nota topshirig‘i', icon: 'musical-notes-outline' as const };
  if (type === 'practice_acknowledgement') return { label: 'Amaliy mashq', icon: 'fitness-outline' as const };
  return { label: 'Test', icon: 'checkmark-circle-outline' as const };
}

export default function PracticeScreen() {
  const { data, isLoading, error, reload } = useCourse();

  if (isLoading && !data) return <Screen><LoadingState text="Mashqlar yuklanmoqda…" /></Screen>;
  if (error && !data) return <Screen><ErrorState message={error} onRetry={() => void reload()} /></Screen>;

  const exercises = (data?.lessons ?? []).flatMap((lesson) =>
    lesson.blocks
      .filter((block) => block.type !== 'theory')
      .map((block) => ({ block, lesson })),
  );

  return (
    <Screen>
      <SectionHeader title="Mashqlar" caption="Solfedjio materialidagi haqiqiy topshiriqlar." />
      {!exercises.length ? <ErrorState message="Materialda mashqlar topilmadi." /> : null}
      <View style={styles.list}>
        {exercises.map(({ block, lesson }) => {
          const meta = typeMeta(block.type);
          return (
            <Pressable
              key={block.id}
              onPress={() => router.push({ pathname: '/blocks/[id]', params: { id: block.id } })}
              style={styles.card}
            >
              <View style={styles.icon}><Ionicons name={meta.icon} size={25} color={colors.primary} /></View>
              <View style={styles.body}>
                <Text style={styles.kind}>{meta.label}</Text>
                <Text style={styles.title}>{block.title}</Text>
                <Text style={styles.subtitle}>
                  {lesson.declaredNumber ? `${lesson.declaredNumber}-dars · ` : ''}{lesson.title}
                </Text>
              </View>
              <View style={[styles.state, block.state === 'completed' && styles.stateDone]}>
                <Ionicons name={block.state === 'completed' ? 'checkmark' : 'chevron-forward'} size={17} color={block.state === 'completed' ? '#fff' : colors.primary} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 11 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colors.border },
  icon: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 3 },
  kind: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: .4 },
  title: { fontSize: 15, lineHeight: 20, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 11, lineHeight: 16, color: colors.muted },
  state: { width: 32, height: 32, borderRadius: 11, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  stateDone: { backgroundColor: '#2DAA74' },
});
