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

      <Pressable onPress={() => router.push('/piano')} style={styles.pianoCard}>
        <View style={styles.pianoTop}>
          <View style={styles.pianoIcon}>
            <Ionicons name="musical-notes" size={25} color="#FFFFFF" />
          </View>
          <View style={styles.pianoBody}>
            <Text style={styles.pianoEyebrow}>INTERAKTIV ASBOB</Text>
            <Text style={styles.pianoTitle}>Pianino</Text>
            <Text style={styles.pianoCaption}>Klavishlarni bosib notalarni real vaqtda eshiting.</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={30} color="#FFFFFF" />
        </View>
        <View style={styles.miniKeyboard}>
          {[0, 1, 2, 3, 4, 5, 6].map((key) => <View key={key} style={styles.miniWhiteKey} />)}
          {[0, 1, 3, 4, 5].map((key) => <View key={key} style={[styles.miniBlackKey, { left: (key + 1) * 24 - 7 }]} />)}
        </View>
      </Pressable>

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
  pianoCard: { backgroundColor: '#17172A', borderRadius: 24, padding: 16, gap: 14, overflow: 'hidden' },
  pianoTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pianoIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  pianoBody: { flex: 1 },
  pianoEyebrow: { color: '#A5B4FC', fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  pianoTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 1 },
  pianoCaption: { color: '#BFC0CF', fontSize: 11, lineHeight: 15, marginTop: 2 },
  miniKeyboard: { position: 'relative', height: 46, width: 168, flexDirection: 'row', alignSelf: 'center' },
  miniWhiteKey: { width: 24, height: 46, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DADAE3', borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  miniBlackKey: { position: 'absolute', top: 0, zIndex: 2, width: 14, height: 28, backgroundColor: '#242431', borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
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
