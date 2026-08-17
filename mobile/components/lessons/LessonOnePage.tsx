import { useState } from 'react';
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

const TOTAL_STEPS = 5;

export function LessonOnePage({
  images,
  completed,
  saving,
  onBack,
  onNext,
  onComplete,
}: LessonOnePageProps) {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const mainImage = images.find((asset) => /\.jpe?g(?:$|\?)/i.test(asset.file)) ?? images[0] ?? null;
  const isFinalStep = step === TOTAL_STEPS - 1;

  function goBack() {
    if (step > 0) {
      setStep((value) => value - 1);
      return;
    }
    onBack();
  }

  function goForward() {
    if (!isFinalStep) {
      setStep((value) => Math.min(TOTAL_STEPS - 1, value + 1));
      return;
    }

    if (!completed) {
      onComplete();
      return;
    }

    onNext?.();
  }

  const buttonLabel = !isFinalStep
    ? 'Davom etish'
    : saving
      ? 'Saqlanmoqda…'
      : completed && onNext
        ? 'Keyingi qadam'
        : completed
          ? 'Barakalla! ⭐'
          : 'Darsni tugatish ⭐';

  return (
    <View style={styles.page}>
      <View style={styles.topbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={step > 0 ? 'Oldingi qadam' : 'Orqaga'}
          onPress={goBack}
          style={[styles.navButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>

        <View style={[styles.lessonBadge, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="musical-notes" size={15} color={colors.primary} />
          <Text style={[styles.lessonBadgeText, { color: colors.primary }]}>1-DARS</Text>
        </View>

        <View style={styles.starBadge}>
          <Ionicons name="star" size={22} color="#F2B01E" />
        </View>
      </View>

      <View style={styles.progressDots} accessibilityLabel={`${step + 1} / ${TOTAL_STEPS} qadam`}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              { backgroundColor: index <= step ? colors.primary : colors.border },
              index === step && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      {step === 0 ? (
        <View style={[styles.hero, { backgroundColor: colors.primary }]}> 
          <View style={styles.heroBubble}>
            <Ionicons name="musical-note" size={42} color="#FFFFFF" />
          </View>
          <Text style={styles.heroKicker}>SALOM, MUSIQA! 🎵</Text>
          <Text style={styles.heroTitle}>Solfedjio bilan tanishamiz!</Text>
          <Text style={styles.heroText}>Bugun musiqa olamiga birinchi qadamni qo‘yamiz.</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.focusCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={[styles.largeIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="book" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.stepLabel, { color: colors.primary }]}>BILIB OLAMIZ</Text>
          <Text style={[styles.focusTitle, { color: colors.text }]}>Solfedjio nima?</Text>
          <Text style={[styles.focusText, { color: colors.muted }]}>Solfedjio — notaga qarab kuylashni o‘rganishga yordam beradigan musiqa mashg‘uloti.</Text>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.factFocus, { backgroundColor: '#FFF1B9' }]}> 
          <View style={styles.factIcon}><Text style={styles.factEmoji}>💡</Text></View>
          <Text style={styles.factLabel}>BILASANMI?</Text>
          <Text style={styles.factTitle}>“Solfedjio” nomi qayerdan kelgan?</Text>
          <Text style={styles.factText}>Bu nom “sol” va “fa” notalari nomidan kelib chiqqan.</Text>
          <View style={styles.noteRow}>
            <View style={styles.noteChip}><Text style={styles.noteChipText}>SOL 🎵</Text></View>
            <View style={styles.plus}><Text style={styles.plusText}>+</Text></View>
            <View style={styles.noteChip}><Text style={styles.noteChipText}>FA 🎵</Text></View>
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.historyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.historyHead}>
            <View style={[styles.smallIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="sparkles" size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.stepLabel, { color: colors.primary }]}>BU QIZIQ!</Text>
              <Text style={[styles.historyTitle, { color: colors.text }]}>Gvido de Aresso</Text>
            </View>
          </View>
          {mainImage ? (
            <Image
              source={{ uri: mainImage.url }}
              style={styles.image}
              contentFit="contain"
              cachePolicy="memory-disk"
              transition={180}
            />
          ) : (
            <View style={[styles.imageFallback, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="musical-notes" size={58} color={colors.primary} />
            </View>
          )}
          <Text style={[styles.historyText, { color: colors.muted }]}>Uning nomi solfedjio va nota tizimi tarixi bilan bog‘liq.</Text>
        </View>
      ) : null}

      {step === 4 ? (
        <View style={[styles.rewardCard, { backgroundColor: colors.primarySoft }]}> 
          <Text style={styles.rewardEmoji}>{completed ? '🌟' : '🎉'}</Text>
          <Text style={[styles.rewardTitle, { color: colors.text }]}>{completed ? 'Barakalla!' : 'Ajoyib!'}</Text>
          <Text style={[styles.rewardText, { color: colors.muted }]}>Solfedjio nima ekanini bilib olding. Birinchi qadam tayyor!</Text>
          <View style={styles.starsRow}>
            {[0, 1, 2].map((value) => (
              <Ionicons key={value} name="star" size={34} color="#F2B01E" />
            ))}
          </View>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        disabled={saving || (isFinalStep && completed && !onNext)}
        onPress={goForward}
        style={[
          styles.completeButton,
          { backgroundColor: isFinalStep ? colors.success : colors.primary },
          (saving || (isFinalStep && completed && !onNext)) && styles.disabled,
        ]}
      >
        <Text style={styles.completeText}>{buttonLabel}</Text>
        <Ionicons name={isFinalStep ? (completed ? 'arrow-forward' : 'star') : 'arrow-forward'} size={21} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 15 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 46, height: 46, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  lessonBadge: { minHeight: 38, paddingHorizontal: 14, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 },
  lessonBadgeText: { fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  starBadge: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
  progressDot: { width: 28, height: 7, borderRadius: 999 },
  progressDotCurrent: { width: 42 },
  hero: { minHeight: 410, borderRadius: 32, padding: 26, justifyContent: 'center', alignItems: 'flex-start', overflow: 'hidden' },
  heroBubble: { width: 76, height: 76, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.17)', alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  heroKicker: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 34, lineHeight: 40, fontWeight: '900', marginTop: 9 },
  heroText: { color: 'rgba(255,255,255,0.86)', fontSize: 17, lineHeight: 25, fontWeight: '700', marginTop: 12 },
  focusCard: { minHeight: 410, borderRadius: 32, padding: 26, borderWidth: 1, justifyContent: 'center' },
  largeIcon: { width: 76, height: 76, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  stepLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  focusTitle: { fontSize: 32, lineHeight: 38, fontWeight: '900', marginTop: 8 },
  focusText: { fontSize: 19, lineHeight: 29, fontWeight: '650', marginTop: 18 },
  factFocus: { minHeight: 410, borderRadius: 32, padding: 26, justifyContent: 'center' },
  factIcon: { width: 70, height: 70, borderRadius: 25, backgroundColor: '#FFE27A', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  factEmoji: { fontSize: 34 },
  factLabel: { color: '#926000', fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  factTitle: { color: '#3F351D', fontSize: 28, lineHeight: 34, fontWeight: '900', marginTop: 8 },
  factText: { color: '#5D4B1C', fontSize: 17, lineHeight: 25, fontWeight: '750', marginTop: 13 },
  noteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 28 },
  noteChip: { minWidth: 100, borderRadius: 18, backgroundColor: '#FFE27A', paddingHorizontal: 17, paddingVertical: 13, alignItems: 'center' },
  noteChipText: { color: '#6F4D00', fontSize: 15, fontWeight: '900' },
  plus: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFFFFF99', alignItems: 'center', justifyContent: 'center' },
  plusText: { color: '#7F5B00', fontSize: 22, fontWeight: '900' },
  historyCard: { minHeight: 410, borderRadius: 32, padding: 18, borderWidth: 1, justifyContent: 'center' },
  historyHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 13 },
  smallIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  historyTitle: { fontSize: 24, lineHeight: 30, fontWeight: '900', marginTop: 3 },
  image: { width: '100%', aspectRatio: 1.45, borderRadius: 20 },
  imageFallback: { width: '100%', aspectRatio: 1.45, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  historyText: { fontSize: 15, lineHeight: 22, fontWeight: '700', marginTop: 13 },
  rewardCard: { minHeight: 410, borderRadius: 32, padding: 26, alignItems: 'center', justifyContent: 'center' },
  rewardEmoji: { fontSize: 72 },
  rewardTitle: { fontSize: 34, lineHeight: 40, fontWeight: '900', marginTop: 14 },
  rewardText: { fontSize: 17, lineHeight: 25, fontWeight: '650', textAlign: 'center', marginTop: 10, maxWidth: 310 },
  starsRow: { flexDirection: 'row', gap: 8, marginTop: 26 },
  completeButton: { minHeight: 60, borderRadius: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 18 },
  completeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  disabled: { opacity: 0.5 },
});
