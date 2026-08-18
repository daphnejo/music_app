import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
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

const QUIZ_STEP = 4;
const REWARD_STEP = 5;
const TOTAL_STEPS = 6;

const QUIZ_OPTIONS = [
  { id: 'sing', text: 'Notaga qarab kuylashni o‘rganamiz', correct: true, icon: 'musical-notes' as const },
  { id: 'draw', text: 'Faqat rasm chizamiz', correct: false, icon: 'color-palette' as const },
  { id: 'sport', text: 'Faqat sport bilan shug‘ullanamiz', correct: false, icon: 'football' as const },
];

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
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.82)).current;
  const mainImage = images.find((asset) => /\.jpe?g(?:$|\?)/i.test(asset.file)) ?? images[0] ?? null;
  const isFinalStep = step === REWARD_STEP;

  useEffect(() => {
    if (step !== REWARD_STEP) return;
    rewardScale.setValue(0.82);
    Animated.spring(rewardScale, {
      toValue: 1,
      friction: 5,
      tension: 85,
      useNativeDriver: true,
    }).start();
  }, [rewardScale, step]);

  function goBack() {
    if (step > 0) {
      setStep((value) => value - 1);
      return;
    }
    onBack();
  }

  function goForward() {
    if (step === QUIZ_STEP) {
      if (!quizChecked) return;
      setStep(REWARD_STEP);
      return;
    }

    if (!isFinalStep) {
      setStep((value) => Math.min(REWARD_STEP, value + 1));
      return;
    }

    if (!completed) {
      onComplete();
      return;
    }

    onNext?.();
  }

  function chooseQuizOption(optionId: string) {
    if (quizChecked) return;
    setSelectedQuizId(optionId);
  }

  function checkQuiz() {
    if (!selectedQuizId || quizChecked) return;
    const selected = QUIZ_OPTIONS.find((option) => option.id === selectedQuizId);
    setRewardStars(selected?.correct ? 3 : 2);
    setQuizChecked(true);
  }

  function handlePrimaryAction() {
    if (step === QUIZ_STEP && !quizChecked) {
      checkQuiz();
      return;
    }
    goForward();
  }

  const selectedQuiz = QUIZ_OPTIONS.find((option) => option.id === selectedQuizId) ?? null;
  const answerCorrect = !!selectedQuiz?.correct;
  const buttonDisabled = saving
    || (step === QUIZ_STEP && !selectedQuizId)
    || (isFinalStep && completed && !onNext);

  const buttonLabel = step === QUIZ_STEP
    ? !selectedQuizId
      ? 'Javobni tanla'
      : !quizChecked
        ? 'Javobni tekshirish'
        : `${rewardStars} yulduz! Natijani ko‘r`
    : !isFinalStep
      ? 'Davom etish'
      : saving
        ? 'Saqlanmoqda…'
        : completed && onNext
          ? 'Keyingi qadam'
          : completed
            ? 'Barakalla! ⭐'
            : 'Darsni yakunlash';

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

      {step === QUIZ_STEP ? (
        <View style={[styles.quizCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.quizIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="help" size={34} color={colors.primary} />
          </View>
          <Text style={[styles.stepLabel, { color: colors.primary }]}>MINI SAVOL</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>Solfedjioda nimani o‘rganamiz?</Text>
          <Text style={[styles.quizHint, { color: colors.muted }]}>Javob kartasini bosib tanla, keyin tekshir.</Text>

          <View style={styles.quizOptions}>
            {QUIZ_OPTIONS.map((option) => {
              const selected = selectedQuizId === option.id;
              const revealCorrect = quizChecked && option.correct;
              const wrongSelected = quizChecked && selected && !option.correct;
              const optionStyle = revealCorrect
                ? { backgroundColor: colors.successSurface, borderColor: colors.success }
                : wrongSelected
                  ? { backgroundColor: '#FFF3D5', borderColor: '#E2A93B' }
                  : selected
                    ? { backgroundColor: colors.primarySoft, borderColor: colors.primary }
                    : { backgroundColor: colors.surface, borderColor: colors.border };

              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled: quizChecked }}
                  disabled={quizChecked}
                  onPress={() => chooseQuizOption(option.id)}
                  style={({ pressed }) => [
                    styles.quizOption,
                    optionStyle,
                    selected && !quizChecked && styles.quizOptionSelected,
                    pressed && !quizChecked && styles.pressed,
                  ]}
                >
                  <View style={styles.quizOptionLead}>
                    <View
                      style={[
                        styles.quizOptionIcon,
                        { backgroundColor: selected ? colors.primary : colors.primarySoft },
                        revealCorrect && { backgroundColor: colors.success },
                        wrongSelected && { backgroundColor: '#E2A93B' },
                      ]}
                    >
                      <Ionicons
                        name={revealCorrect ? 'checkmark' : wrongSelected ? 'close' : option.icon}
                        size={21}
                        color={selected || revealCorrect || wrongSelected ? '#FFFFFF' : colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.quizOptionText, { color: colors.text }]}>{option.text}</Text>
                      {selected && !quizChecked ? <Text style={[styles.selectedLabel, { color: colors.primary }]}>Tanlandi</Text> : null}
                    </View>
                  </View>
                  <Ionicons
                    name={revealCorrect ? 'checkmark-circle' : wrongSelected ? 'close-circle' : selected ? 'radio-button-on' : 'radio-button-off'}
                    size={25}
                    color={revealCorrect ? colors.success : wrongSelected ? '#E2A93B' : selected ? colors.primary : colors.muted}
                  />
                </Pressable>
              );
            })}
          </View>

          {quizChecked ? (
            <View style={[styles.quizFeedback, { backgroundColor: answerCorrect ? colors.successSurface : '#FFF3D5' }]}>
              <Text style={styles.quizFeedbackEmoji}>{answerCorrect ? '🎉' : '🌟'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.quizFeedbackTitle, { color: colors.text }]}>
                  {answerCorrect ? 'To‘g‘ri! 3 yulduz!' : 'Yaxshi urinish! 2 yulduz!'}
                </Text>
                <Text style={[styles.quizFeedbackText, { color: colors.muted }]}>
                  {answerCorrect
                    ? 'Solfedjio bizga notaga qarab kuylashni o‘rgatadi.'
                    : 'To‘g‘ri javob — notaga qarab kuylashni o‘rganamiz.'}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {step === REWARD_STEP ? (
        <View style={[styles.rewardCard, { backgroundColor: colors.primarySoft }]}>
          <Animated.View style={{ alignItems: 'center', transform: [{ scale: rewardScale }] }}>
            <Text style={styles.rewardEmoji}>{rewardStars === 3 ? '🎉' : '🌟'}</Text>
            <Text style={[styles.rewardTitle, { color: colors.text }]}>{rewardStars === 3 ? 'Ajoyib!' : 'Yaxshi!'}</Text>
            <Text style={[styles.rewardText, { color: colors.muted }]}>Solfedjio nima ekanini bilib olding va mini savolni ham bajarding!</Text>
            <View style={styles.starsRow}>
              {[0, 1, 2].map((value) => (
                <Ionicons
                  key={value}
                  name={value < rewardStars ? 'star' : 'star-outline'}
                  size={38}
                  color={value < rewardStars ? '#F2B01E' : '#B8B1C8'}
                />
              ))}
            </View>
            <View style={[styles.rewardPill, { backgroundColor: '#FFFFFFAA' }]}>
              <Ionicons name="trophy" size={20} color="#A66A00" />
              <Text style={styles.rewardPillText}>+{rewardStars} yulduz</Text>
            </View>
          </Animated.View>
        </View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: buttonDisabled }}
        disabled={buttonDisabled}
        onPress={handlePrimaryAction}
        style={({ pressed }) => [
          styles.completeButton,
          { backgroundColor: isFinalStep ? colors.success : colors.primary },
          buttonDisabled && styles.disabled,
          pressed && !buttonDisabled && styles.pressed,
        ]}
      >
        <Text style={styles.completeText}>{buttonLabel}</Text>
        <Ionicons
          name={step === QUIZ_STEP ? (quizChecked ? 'arrow-forward' : 'checkmark-circle') : isFinalStep ? (completed ? 'arrow-forward' : 'star') : 'arrow-forward'}
          size={21}
          color="#FFFFFF"
        />
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
  progressDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  progressDot: { width: 23, height: 7, borderRadius: 999 },
  progressDotCurrent: { width: 36 },
  hero: { minHeight: 410, borderRadius: 32, padding: 26, justifyContent: 'center', alignItems: 'flex-start', overflow: 'hidden' },
  heroBubble: { width: 76, height: 76, borderRadius: 27, backgroundColor: 'rgba(255,255,255,0.17)', alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  heroKicker: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 34, lineHeight: 40, fontWeight: '900', marginTop: 9 },
  heroText: { color: 'rgba(255,255,255,0.86)', fontSize: 17, lineHeight: 25, fontWeight: '700', marginTop: 12 },
  focusCard: { minHeight: 410, borderRadius: 32, padding: 26, borderWidth: 1, justifyContent: 'center' },
  largeIcon: { width: 76, height: 76, borderRadius: 27, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  stepLabel: { fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  focusTitle: { fontSize: 32, lineHeight: 38, fontWeight: '900', marginTop: 8 },
  focusText: { fontSize: 19, lineHeight: 29, fontWeight: '600', marginTop: 18 },
  factFocus: { minHeight: 410, borderRadius: 32, padding: 26, justifyContent: 'center' },
  factIcon: { width: 70, height: 70, borderRadius: 25, backgroundColor: '#FFE27A', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  factEmoji: { fontSize: 34 },
  factLabel: { color: '#926000', fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  factTitle: { color: '#3F351D', fontSize: 28, lineHeight: 34, fontWeight: '900', marginTop: 8 },
  factText: { color: '#5D4B1C', fontSize: 17, lineHeight: 25, fontWeight: '700', marginTop: 13 },
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
  quizCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  quizIcon: { width: 64, height: 64, borderRadius: 23, alignItems: 'center', justifyContent: 'center', marginBottom: 17 },
  quizTitle: { fontSize: 28, lineHeight: 34, fontWeight: '900', marginTop: 7 },
  quizHint: { fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 7, marginBottom: 18 },
  quizOptions: { gap: 10 },
  quizOption: { minHeight: 68, borderRadius: 20, borderWidth: 1.5, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  quizOptionSelected: { borderWidth: 2.5 },
  quizOptionLead: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  quizOptionIcon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  quizOptionText: { fontSize: 15, lineHeight: 21, fontWeight: '800' },
  selectedLabel: { fontSize: 10, fontWeight: '900', marginTop: 2 },
  quizFeedback: { marginTop: 14, borderRadius: 19, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  quizFeedbackEmoji: { fontSize: 28 },
  quizFeedbackTitle: { fontSize: 15, fontWeight: '900' },
  quizFeedbackText: { fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 2 },
  rewardCard: { minHeight: 410, borderRadius: 32, padding: 26, alignItems: 'center', justifyContent: 'center' },
  rewardEmoji: { fontSize: 72 },
  rewardTitle: { fontSize: 34, lineHeight: 40, fontWeight: '900', marginTop: 14 },
  rewardText: { fontSize: 17, lineHeight: 25, fontWeight: '600', textAlign: 'center', marginTop: 10, maxWidth: 310 },
  starsRow: { flexDirection: 'row', gap: 8, marginTop: 26 },
  rewardPill: { marginTop: 20, minHeight: 46, borderRadius: 999, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 7 },
  rewardPillText: { color: '#7C5700', fontSize: 14, fontWeight: '900' },
  completeButton: { minHeight: 60, borderRadius: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 18 },
  completeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});