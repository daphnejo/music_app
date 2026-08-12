import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors } from '@/theme/colors';
import type { Lesson } from '@/types';

export function ContinueCard({ lesson }: { lesson: Lesson }) {
  return <View style={styles.card}><View style={styles.icon}><Ionicons name="musical-notes" size={24} color={colors.primary} /></View><View style={styles.body}><Text style={styles.eyebrow}>DAVOM ETTIRISH</Text><Text style={styles.title}>{lesson.number}-dars · {lesson.title}</Text><Text style={styles.caption}>{lesson.progress}% bajarildi</Text><ProgressBar value={lesson.progress} /></View><Pressable onPress={() => router.push({ pathname: '/lessons/[id]', params: { id: lesson.id } })} style={styles.button}><Ionicons name="play" size={17} color="#fff" /></Pressable></View>;
}
const styles = StyleSheet.create({ card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: colors.border }, icon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' }, body: { flex: 1, gap: 5 }, eyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: .7, color: colors.primary }, title: { fontSize: 17, fontWeight: '800', color: colors.text }, caption: { fontSize: 12, color: colors.muted }, button: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' } });
