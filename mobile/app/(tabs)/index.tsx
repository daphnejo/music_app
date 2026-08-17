import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ContinueCard } from '@/components/home/ContinueCard';
import { ErrorState, LoadingState } from '@/components/ui/DataState';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useCourse } from '@/context/CourseContext';
import { useTheme } from '@/context/ThemeContext';
import { lessonProgress } from '@/types/content';

export default function HomeScreen() {
  const { user } = useAuth();
  const { data, isLoading, error, reload } = useCourse();
  const { colors } = useTheme();
  const firstName = user?.fullName?.trim().split(/\s+/)[0] || 'do‘stim';
  const initial = firstName.charAt(0).toUpperCase();

  if (isLoading && !data) return <Screen><LoadingState text="Darslaring yuklanmoqda…" /></Screen>;
  if (error && !data) return <Screen><ErrorState message={error} onRetry={() => void reload()} /></Screen>;

  const lessons = data?.lessons ?? [];
  const lastLesson = data?.lastBlockId
    ? lessons.find((lesson) => lesson.blocks.some((block) => block.id === data.lastBlockId))
    : null;
  const current = lastLesson ?? lessons.find((lesson) => lessonProgress(lesson) < 100) ?? lessons[0];
  const allBlocks = lessons.flatMap((lesson) => lesson.blocks);
  const completedBlocks = allBlocks.filter((block) => block.state === 'completed').length;
  const completedLessons = lessons.filter((lesson) => lesson.blockCount > 0 && lesson.completed === lesson.blockCount).length;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <View style={[styles.brandPill, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="musical-note" size={14} color={colors.primary} />
            <Text style={[styles.brandText, { color: colors.primary }]}>D-SOLFEDJIO</Text>
          </View>
          <Text style={[styles.greeting, { color: colors.text }]}>Salom, {firstName}! 👋</Text>
          <Text style={[styles.caption, { color: colors.muted }]}>Bugun musiqa bilan o‘ynaymizmi?</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mening profilim"
          onPress={() => router.push('/(tabs)/profile')}
          style={[styles.avatar, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>
      </View>

      {current ? <ContinueCard lesson={current} /> : <ErrorState message={data?.message ?? 'Hali darslar topilmadi'} />}

      <View style={styles.rewardRow}>
        <View style={[styles.rewardCard, { backgroundColor: '#FFF2B8' }]}>
          <View style={[styles.rewardIcon, { backgroundColor: '#FFE27A' }]}>
            <Ionicons name="star" size={26} color="#A66A00" />
          </View>
          <Text style={styles.rewardValue}>{completedBlocks}</Text>
          <Text style={styles.rewardLabel}>yulduz</Text>
        </View>

        <View style={[styles.rewardCard, { backgroundColor: '#DFF7EC' }]}>
          <View style={[styles.rewardIcon, { backgroundColor: '#BCEBD6' }]}>
            <Ionicons name="trophy" size={25} color="#167A53" />
          </View>
          <Text style={styles.rewardValue}>{completedLessons}</Text>
          <Text style={styles.rewardLabel}>dars tugadi</Text>
        </View>
      </View>

      <View style={styles.sectionHead}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Darslarim 🎵</Text>
          <Text style={[styles.sectionCaption, { color: colors.muted }]}>Hammasini bir joyda ko‘r</Text>
        </View>
        <Pressable onPress={() => router.push('/(tabs)/lessons')} style={[styles.roundArrow, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="arrow-forward" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.push('/(tabs)/lessons')}
        style={[styles.lessonsButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        <View style={[styles.lessonsIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="map" size={25} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.lessonsButtonTitle, { color: colors.text }]}>Musiqa sarguzashti</Text>
          <Text style={[styles.lessonsButtonText, { color: colors.muted }]}>{lessons.length} ta dars seni kutyapti</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.primary} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  headerCopy: { flex: 1, gap: 4 },
  brandPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 3,
  },
  brandText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  greeting: { fontSize: 29, lineHeight: 35, fontWeight: '900' },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
  avatar: { width: 52, height: 52, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  rewardRow: { flexDirection: 'row', gap: 12 },
  rewardCard: { flex: 1, minHeight: 128, borderRadius: 26, padding: 15, justifyContent: 'center' },
  rewardIcon: { width: 43, height: 43, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  rewardValue: { color: '#2F2B3E', fontSize: 24, fontWeight: '900' },
  rewardLabel: { color: '#5D576E', fontSize: 12, fontWeight: '800', marginTop: 1 },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  sectionTitle: { fontSize: 23, lineHeight: 29, fontWeight: '900' },
  sectionCaption: { fontSize: 13, marginTop: 2, fontWeight: '600' },
  roundArrow: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  lessonsButton: { minHeight: 82, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 24, borderWidth: 1 },
  lessonsIcon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  lessonsButtonTitle: { fontSize: 16, fontWeight: '900' },
  lessonsButtonText: { marginTop: 3, fontSize: 12, fontWeight: '600' },
});
