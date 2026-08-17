import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import type { BlockAsset } from '@/types/content';

type LessonOnePageProps = {
  lessonTitle: string;
  sectionTitle: string;
  lines: string[];
  images: BlockAsset[];
  completed: boolean;
  saving: boolean;
  onBack: () => void;
  onNext?: () => void;
  onComplete: () => void;
};

function cleanTitle(value: string) {
  return value.trim().replace(/[.\s]+$/, '');
}

function isDefinition(line: string) {
  return /^\s*solfedjio\s*[–—-]/i.test(line);
}

export function LessonOnePage({
  lessonTitle,
  sectionTitle,
  lines,
  images,
  completed,
  saving,
  onBack,
  onNext,
  onComplete,
}: LessonOnePageProps) {
  const { colors } = useTheme();
  const definition = lines.find(isDefinition) ?? lines[0] ?? '';
  const history = lines.find((line) => line !== definition) ?? '';
  const mainImage = images.find((asset) => /\.jpe?g(?:$|\?)/i.test(asset.file)) ?? images[0] ?? null;
  const title = cleanTitle(lessonTitle);

  return (
    <View style={styles.page}>
      <View style={styles.topbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Orqaga"
          onPress={onBack}
          style={[styles.navButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>

        <View style={[styles.lessonBadge, { backgroundColor: colors.primarySoft }]}> 
          <Ionicons name="musical-notes" size={15} color={colors.primary} />
          <Text style={[styles.lessonBadgeText, { color: colors.primary }]}>1-DARS</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Keyingi"
          disabled={!onNext}
          onPress={onNext}
          style={[
            styles.navButton,
            { backgroundColor: colors.surface, borderColor: colors.border },
            !onNext && styles.disabled,
          ]}
        >
          <Ionicons name="arrow-forward" size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <View style={[styles.heroIcon, { backgroundColor: colors.primarySoft }]}> 
          <Ionicons name="musical-note" size={30} color={colors.primary} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.kicker, { color: colors.primary }]}>1-DARS</Text>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        </View>
      </View>

      {definition ? (
        <View style={[styles.definitionCard, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}> 
          <View style={[styles.quoteIcon, { backgroundColor: colors.surface }]}> 
            <Ionicons name="book-outline" size={21} color={colors.primary} />
          </View>
          <Text style={[styles.definitionText, { color: colors.text }]}>{definition}</Text>
        </View>
      ) : null}

      <View style={styles.interestingHeader}>
        <View style={[styles.bulb, { backgroundColor: colors.warningSurface }]}> 
          <Ionicons name="bulb-outline" size={22} color={colors.warning} />
        </View>
        <Text style={[styles.interestingTitle, { color: colors.text }]}>{sectionTitle}</Text>
      </View>

      {mainImage ? (
        <View style={[styles.imageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Image
            source={{ uri: mainImage.url }}
            style={styles.image}
            contentFit="contain"
            cachePolicy="memory-disk"
            transition={180}
          />
        </View>
      ) : null}

      {history ? (
        <View style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={[styles.historyMark, { backgroundColor: colors.primarySoft }]}> 
            <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.historyText, { color: colors.text }]}>{history}</Text>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={completed || saving}
        onPress={onComplete}
        style={[
          styles.completeButton,
          { backgroundColor: completed ? colors.success : colors.primary },
          saving && styles.disabled,
        ]}
      >
        <Ionicons name={completed ? 'checkmark-circle' : 'checkmark'} size={20} color="#fff" />
        <Text style={styles.completeText}>
          {completed ? 'Dars o‘qib chiqildi' : saving ? 'Saqlanmoqda…' : 'O‘qib chiqdim'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonBadge: {
    minHeight: 36,
    paddingHorizontal: 13,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lessonBadgeText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  hero: {
    borderWidth: 1,
    borderRadius: 26,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: { flex: 1, gap: 3 },
  kicker: { fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  title: { fontSize: 30, lineHeight: 35, fontWeight: '900', letterSpacing: 0.3 },
  definitionCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 17,
    gap: 12,
  },
  quoteIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  definitionText: { fontSize: 17, lineHeight: 27, fontWeight: '650' },
  interestingHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  bulb: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  interestingTitle: { fontSize: 25, lineHeight: 31, fontWeight: '900' },
  imageCard: { borderWidth: 1, borderRadius: 24, padding: 10, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 1.45, borderRadius: 17 },
  historyCard: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 17,
    gap: 12,
  },
  historyMark: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  historyText: { fontSize: 17, lineHeight: 27, fontWeight: '600' },
  completeButton: {
    minHeight: 58,
    borderRadius: 19,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  completeText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  disabled: { opacity: 0.42 },
});
