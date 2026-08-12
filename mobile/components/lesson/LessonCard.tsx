import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors } from '@/theme/colors';
import type { Lesson } from '@/types';

export function LessonCard({ lesson }: { lesson: Lesson }) {
  const locked = lesson.status === 'locked';
  return <Pressable disabled={locked} onPress={() => router.push({ pathname: '/lessons/[id]', params: { id: lesson.id } })} style={({ pressed }) => [styles.card, pressed && !locked && styles.pressed, locked && styles.locked]}>
    <View style={styles.top}><View style={styles.number}><Text style={styles.numberText}>{lesson.number}</Text></View><View style={styles.main}><Text style={styles.title}>{lesson.title}</Text><Text style={styles.description}>{lesson.description}</Text></View><Ionicons name={locked ? 'lock-closed-outline' : 'chevron-forward'} size={20} color={colors.muted} /></View>
    {!locked ? <View style={styles.progressRow}><ProgressBar value={lesson.progress} /><Text style={styles.progressText}>{lesson.progress}%</Text></View> : null}
  </Pressable>;
}
const styles = StyleSheet.create({ card: { backgroundColor: colors.surface, borderRadius: 22, padding: 16, gap: 14, borderWidth: 1, borderColor: colors.border }, pressed: { opacity: .78 }, locked: { opacity: .56 }, top: { flexDirection: 'row', gap: 12, alignItems: 'center' }, number: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }, numberText: { fontWeight: '800', fontSize: 16, color: colors.primary }, main: { flex: 1, gap: 3 }, title: { color: colors.text, fontSize: 17, fontWeight: '800' }, description: { color: colors.muted, fontSize: 13, lineHeight: 18 }, progressRow: { gap: 7 }, progressText: { color: colors.muted, fontSize: 12, fontWeight: '700', alignSelf: 'flex-end' } });
