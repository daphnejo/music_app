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
  const mainImage = images.find((asset) => /\.jpe?g(?:$|\?)/i.test(asset.file)) ?? images[0] ?? null;
  const hasGuidoFact = lines.some((line) => /gvido|guido/i.test(line));
  const canGoNext = completed && !!onNext;

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

        <View style={[styles.navButton, styles.placeholderButton]}>
          <Ionicons name="star" size={20} color="#F2B01E" />
        </View>
      </View>

      <View style={[styles.hero, { backgroundColor: colors.primary }]}> 
        <View style={styles.heroBubble}>
          <Ionicons name="musical-note" size={36} color="#FFFFFF" />
        </View>
        <Text style={styles.heroKicker}>BIRINCHI QADAM 🎵</Text>
        <Text style={styles.heroTitle}>Solfedjio bilan tanishamiz!</Text>
        <Text style={styles.heroText}>Musiqa olamiga kirishga tayyormisan?</Text>
      </View>

      <View style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
        <View style={[styles.stepNumber, { backgroundColor: colors.primarySoft }]}>
          <Text style={[styles.stepNumberText, { color: colors.primary }]}>1</Text>
        </View>
        <View style={styles.stepCopy}>
          <Text style={[styles.stepLabel, { color: colors.primary }]}>BILIB OLAMIZ</Text>
          <Text style={[styles.stepTitle, { color: colors.text }]}>Solfedjio nima?</Text>
          <Text style={[styles.stepText, { color: colors.muted }]}>Solfedjio — notaga qarab kuylashni o‘rganishga yordam beradigan musiqa mashg‘uloti.</Text>
        </View>
      </View>

      <View style={[styles.factCard, { backgroundColor: '#FFF1B9' }]}> 
        <View style={styles.factIcon}><Text style={styles.factEmoji}>💡</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.factLabel}>BILASANMI?</Text>
          <Text style={styles.factText}>“Solfedjio” nomi “sol” va “fa” notalari nomidan kelib chiqqan.</Text>
        </View>
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
          {hasGuidoFact ? (
            <View style={styles.imageCaption}>
              <Ionicons name="sparkles" size={18} color={colors.primary} />
              <Text style={[styles.imageCaptionText, { color: colors.text }]}>Gvido de Aresso nomi solfedjio va nota tizimi tarixi bilan bog‘liq.</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.readyCard, { backgroundColor: colors.primarySoft }]}> 
        <Text style={styles.readyEmoji}>{completed ? '🌟' : '🎶'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[styles.readyTitle, { color: colors.text }]}>{completed ? 'Barakalla!' : 'Esda qoldimi?'}</Text>
          <Text style={[styles.readyText, { color: colors.muted }]}>{completed ? 'Birinchi qadamni bajarding. Endi davom etamiz!' : 'Tayyor bo‘lsang, keyingi qadamga o‘tamiz.'}</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={saving}
        onPress={canGoNext ? onNext : onComplete}
        style={[styles.completeButton, { backgroundColor: completed ? colors.success : colors.primary }, saving && styles.disabled]}
      >
        <Text style={styles.completeText}>
          {saving ? 'Saqlanmoqda…' : canGoNext ? 'Keyingi qadam' : completed ? 'Barakalla! ⭐' : 'Tushundim! ⭐'}
        </Text>
        <Ionicons name={canGoNext ? 'arrow-forward' : completed ? 'star' : 'checkmark'} size={21} color="#FFFFFF" />
      </Pressable>

      <Text style={[styles.sourceHint, { color: colors.muted }]} numberOfLines={1}>{lessonTitle} · {sectionTitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 15 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: {
    width: 46,
    height: 46,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderButton: { borderWidth: 0 },
  lessonBadge: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lessonBadgeText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  hero: { borderRadius: 30, padding: 22, minHeight: 220, justifyContent: 'center', overflow: 'hidden' },
  heroBubble: { width: 64, height: 64, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.17)', alignItems: 'center', justifyContent: 'center', marginBottom: 17 },
  heroKicker: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 30, lineHeight: 36, fontWeight: '900', marginTop: 6 },
  heroText: { color: 'rgba(255,255,255,0.82)', fontSize: 14, lineHeight: 20, fontWeight: '700', marginTop: 7 },
  stepCard: { borderRadius: 26, padding: 17, borderWidth: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 13 },
  stepNumber: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 18, fontWeight: '900' },
  stepCopy: { flex: 1 },
  stepLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  stepTitle: { fontSize: 22, lineHeight: 27, fontWeight: '900', marginTop: 4 },
  stepText: { fontSize: 16, lineHeight: 24, fontWeight: '600', marginTop: 7 },
  factCard: { borderRadius: 26, padding: 17, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  factIcon: { width: 45, height: 45, borderRadius: 16, backgroundColor: '#FFE27A', alignItems: 'center', justifyContent: 'center' },
  factEmoji: { fontSize: 24 },
  factLabel: { color: '#926000', fontSize: 10, fontWeight: '900', letterSpacing: 0.9 },
  factText: { color: '#4D4020', fontSize: 16, lineHeight: 23, fontWeight: '800', marginTop: 5 },
  imageCard: { borderRadius: 26, padding: 10, borderWidth: 1, overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 1.45, borderRadius: 19 },
  imageCaption: { flexDirection: 'row', gap: 9, alignItems: 'center', paddingHorizontal: 8, paddingVertical: 11 },
  imageCaptionText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  readyCard: { borderRadius: 24, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  readyEmoji: { fontSize: 30 },
  readyTitle: { fontSize: 16, fontWeight: '900' },
  readyText: { fontSize: 12, lineHeight: 18, fontWeight: '600', marginTop: 2 },
  completeButton: { minHeight: 60, borderRadius: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 18 },
  completeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  sourceHint: { alignSelf: 'center', fontSize: 10, fontWeight: '600', opacity: 0.65 },
  disabled: { opacity: 0.5 },
});
