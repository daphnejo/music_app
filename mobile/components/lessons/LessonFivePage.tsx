import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useStars } from '@/context/StarsContext';
import { useTheme } from '@/context/ThemeContext';
import type { BlockAsset } from '@/types/content';

type LessonFivePageProps = {
  images: BlockAsset[];
  completed: boolean;
  saving: boolean;
  onBack: () => void;
  onNext?: () => void;
  onComplete: () => void;
  resolveUrl: (url: string) => string;
};

const QUIZ_STEP = 4;
const REWARD_STEP = 5;
const TOTAL_STEPS = 6;
const TRACE_POINTS = [
  { top: 18, left: 52 },
  { top: 57, left: 40 },
  { top: 93, left: 57 },
  { top: 132, left: 44 },
  { top: 170, left: 55 },
];

const QUIZ_OPTIONS = [
  { id: 'clef', label: 'Musiqa kaliti', emoji: '🎼', correct: true },
  { id: 'number', label: 'Raqam', emoji: '🔢', correct: false },
  { id: 'dot', label: 'Nuqta', emoji: '⚫', correct: false },
];

function StaffWithClef({ active = false }: { active?: boolean }) {
  return (
    <View style={styles.staffBox}>
      {[0, 1, 2, 3, 4].map((line) => (
        <View key={line} style={[styles.staffLine, { top: 32 + line * 24 }]} />
      ))}
      <View style={[styles.clefBubble, active && styles.clefBubbleActive]}>
        <Text style={styles.clefGlyph}>𝄞</Text>
      </View>
      <View style={[styles.noteHead, { left: '52%', top: 76 }]}><View style={styles.noteStem} /></View>
      <View style={[styles.noteHead, { left: '70%', top: 52 }]}><View style={styles.noteStem} /></View>
      <View style={[styles.noteHead, { left: '84%', top: 100 }]}><View style={styles.noteStem} /></View>
    </View>
  );
}

export function LessonFivePage({
  images,
  completed,
  saving,
  onBack,
  onNext,
  onComplete,
  resolveUrl,
}: LessonFivePageProps) {
  const { colors } = useTheme();
  const { awardLessonStars } = useStars();
  const [step, setStep] = useState(0);
  const [clefFound, setClefFound] = useState(false);
  const [traceStep, setTraceStep] = useState(0);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.84)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const isFinalStep = step === REWARD_STEP;

  useEffect(() => {
    if (step !== REWARD_STEP) return;
    rewardScale.setValue(0.84);
    Animated.spring(rewardScale, {
      toValue: 1,
      friction: 5,
      tension: 85,
      useNativeDriver: true,
    }).start();
  }, [rewardScale, step]);

  useEffect(() => {
    if (step !== 2 || clefFound) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 650, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [clefFound, pulse, step]);

  function goBack() {
    if (step > 0) {
      setStep((value) => value - 1);
      return;
    }
    onBack();
  }

  function goForward() {
    if (step === 2 && !clefFound) return;
    if (step === 3 && traceStep < TRACE_POINTS.length) return;
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

  function chooseQuizOption(id: string) {
    if (quizChecked) return;
    setSelectedQuizId(id);
  }

  function checkQuiz() {
    if (!selectedQuizId || quizChecked) return;
    const selected = QUIZ_OPTIONS.find((option) => option.id === selectedQuizId);
    const stars: 2 | 3 = selected?.correct ? 3 : 2;
    setRewardStars(stars);
    awardLessonStars(5, stars);
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
    || (step === 2 && !clefFound)
    || (step === 3 && traceStep < TRACE_POINTS.length)
    || (step === QUIZ_STEP && !selectedQuizId)
    || (isFinalStep && completed && !onNext);

  const buttonLabel = step === 2 && !clefFound
    ? 'Avval kalitni top 🎼'
    : step === 3 && traceStep < TRACE_POINTS.length
      ? `Yana ${TRACE_POINTS.length - traceStep} qadam`
      : step === QUIZ_STEP
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
              ? 'Keyingi dars'
              : completed
                ? 'Barakalla! ⭐'
                : 'Darsni yakunlash';

  const firstImage = images[0] ? resolveUrl(images[0].url) : null;
  const practiceImage = images[images.length - 1] ? resolveUrl(images[images.length - 1].url) : null;

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

        <View style={styles.lessonBadge}>
          <Text style={styles.badgeClef}>𝄞</Text>
          <Text style={styles.lessonBadgeText}>5-DARS</Text>
        </View>

        <View style={styles.starBadge}><Ionicons name="star" size={22} color="#F2B01E" /></View>
      </View>

      <View style={styles.progressDots} accessibilityLabel={`${step + 1} / ${TOTAL_STEPS} qadam`}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              { backgroundColor: index <= step ? '#C14E70' : colors.border },
              index === step && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Text style={styles.heroClef}>𝄞</Text></View>
          <Text style={styles.heroKicker}>YANGI BELGI 🎼</Text>
          <Text style={styles.heroTitle}>Skripka kaliti</Text>
          <Text style={styles.heroText}>Notalar yozilishidan oldin nota yo‘lining boshiga maxsus musiqa kaliti qo‘yiladi.</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>BILIB OLAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Kalit yo‘lni ochadi 🔑</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Skripka kaliti notalarni o‘qishga yordam beradigan musiqa belgilaridan biridir. U nota yo‘lining boshida turadi.</Text>

          <StaffWithClef active />

          {firstImage ? (
            <Image source={{ uri: firstImage }} resizeMode="contain" style={styles.sourceImage} />
          ) : null}

          <View style={styles.tipBox}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipText}>Kalitni ko‘rsang, notalar undan keyin yozilishini eslab qol.</Text>
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.findCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>TOPIB KO‘R</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Skripka kaliti qayerda?</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Nota yo‘lining boshidagi katta belgini bos.</Text>

          <View style={styles.findStage}>
            {[0, 1, 2, 3, 4].map((line) => (
              <View key={line} style={[styles.findLine, { top: 38 + line * 29 }]} />
            ))}
            <Animated.View style={[styles.findClefWrap, { transform: [{ scale: pulse }] }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Skripka kaliti"
                onPress={() => setClefFound(true)}
                style={[styles.findClefButton, clefFound && styles.findClefFound]}
              >
                <Text style={styles.findClef}>𝄞</Text>
              </Pressable>
            </Animated.View>
            <Text style={[styles.decoySymbol, { left: '52%', top: 73 }]}>♪</Text>
            <Text style={[styles.decoySymbol, { left: '72%', top: 98 }]}>●</Text>
          </View>

          <View style={[styles.findFeedback, clefFound && styles.findFeedbackDone]}>
            <Text style={styles.findFeedbackEmoji}>{clefFound ? '🎉' : '👀'}</Text>
            <Text style={styles.findFeedbackText}>{clefFound ? 'Topding! Bu — skripka kaliti.' : 'Kalit doim nota yo‘lining boshida turadi.'}</Text>
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.traceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>IZLAB CHIZAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Kalit shaklini yodla</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Raqamlarni 1 dan 5 gacha ketma-ket bos.</Text>

          <View style={styles.traceStage}>
            <Text style={styles.traceClef}>𝄞</Text>
            {TRACE_POINTS.map((point, index) => {
              const done = index < traceStep;
              const current = index === traceStep;
              return (
                <Pressable
                  key={index}
                  accessibilityRole="button"
                  accessibilityLabel={`${index + 1}-qadam`}
                  disabled={!current}
                  onPress={() => setTraceStep((value) => Math.min(TRACE_POINTS.length, value + 1))}
                  style={[
                    styles.tracePoint,
                    { top: point.top, left: `${point.left}%` },
                    done && styles.tracePointDone,
                    current && styles.tracePointCurrent,
                  ]}
                >
                  <Text style={[styles.tracePointText, done && styles.tracePointTextDone]}>{done ? '✓' : index + 1}</Text>
                </Pressable>
              );
            })}
          </View>

          {practiceImage ? (
            <Image source={{ uri: practiceImage }} resizeMode="contain" style={styles.practiceImage} />
          ) : null}

          <View style={styles.traceProgress}>
            <Ionicons name={traceStep >= TRACE_POINTS.length ? 'checkmark-circle' : 'pencil'} size={21} color="#C14E70" />
            <Text style={styles.traceProgressText}>{traceStep >= TRACE_POINTS.length ? 'Ajoyib! Kalitni izlab chiqding.' : `${traceStep}/${TRACE_POINTS.length} qadam`}</Text>
          </View>
        </View>
      ) : null}

      {step === QUIZ_STEP ? (
        <View style={[styles.quizCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.quizIcon}><Text style={styles.quizEmoji}>🎼</Text></View>
          <Text style={styles.stepLabel}>MINI SAVOL</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>Notalarni yozishdan avval nota yo‘liga nima qo‘yiladi?</Text>

          <View style={styles.quizOptions}>
            {QUIZ_OPTIONS.map((option) => {
              const selected = selectedQuizId === option.id;
              const showCorrect = quizChecked && option.correct;
              const showWrong = quizChecked && selected && !option.correct;
              const surface = showCorrect
                ? { backgroundColor: colors.successSurface, borderColor: colors.success }
                : showWrong
                  ? { backgroundColor: '#FFF3D5', borderColor: '#E2A93B' }
                  : selected
                    ? { backgroundColor: '#FFE7EE', borderColor: '#C14E70' }
                    : { backgroundColor: colors.surface, borderColor: colors.border };

              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled: quizChecked }}
                  disabled={quizChecked}
                  onPress={() => chooseQuizOption(option.id)}
                  style={({ pressed }) => [styles.quizOption, surface, pressed && !quizChecked && styles.pressed]}
                >
                  <Text style={styles.quizOptionEmoji}>{option.emoji}</Text>
                  <Text style={[styles.quizOptionText, { color: colors.text }]}>{option.label}</Text>
                  {selected && !quizChecked ? (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="radio-button-on" size={20} color="#C14E70" />
                      <Text style={styles.selectedText}>Tanlandi</Text>
                    </View>
                  ) : null}
                  {showCorrect ? <Ionicons name="checkmark-circle" size={25} color={colors.success} /> : null}
                  {showWrong ? <Ionicons name="close-circle" size={25} color="#D59A25" /> : null}
                </Pressable>
              );
            })}
          </View>

          {quizChecked ? (
            <View style={[styles.feedback, { backgroundColor: answerCorrect ? colors.successSurface : '#FFF3D5' }]}> 
              <Text style={styles.feedbackEmoji}>{answerCorrect ? '🎉' : '💡'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.feedbackTitle, { color: colors.text }]}>{answerCorrect ? 'To‘g‘ri!' : 'Yaxshi urinish!'}</Text>
                <Text style={[styles.feedbackText, { color: colors.muted }]}>
                  {answerCorrect
                    ? 'Ha! Notalarni yozishdan avval musiqa kaliti qo‘yiladi.'
                    : 'To‘g‘ri javob — musiqa kaliti. Keyingi safar 3 yulduz olasan!'}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {step === REWARD_STEP ? (
        <View style={styles.rewardCard}>
          <Animated.View style={{ alignItems: 'center', transform: [{ scale: rewardScale }] }}>
            <Text style={styles.rewardEmoji}>{rewardStars === 3 ? '🎉' : '🌟'}</Text>
            <Text style={[styles.rewardTitle, { color: colors.text }]}>{rewardStars === 3 ? 'Ajoyib!' : 'Barakalla!'}</Text>
            <Text style={[styles.rewardText, { color: colors.muted }]}>Skripka kalitini taniy olasan va qayerga qo‘yilishini bilasan!</Text>
            <View style={styles.starsRow}>
              {[0, 1, 2].map((star) => (
                <Ionicons key={star} name={star < rewardStars ? 'star' : 'star-outline'} size={40} color={star < rewardStars ? '#F2B01E' : '#B9B2C7'} />
              ))}
            </View>
            <View style={styles.rewardPill}>
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
          { backgroundColor: isFinalStep ? colors.success : '#C14E70' },
          buttonDisabled && styles.disabled,
          pressed && !buttonDisabled && styles.pressed,
        ]}
      >
        <Text style={styles.completeText}>{buttonLabel}</Text>
        <Ionicons
          name={step === QUIZ_STEP ? (quizChecked ? 'arrow-forward' : 'checkmark-circle') : isFinalStep ? 'star' : 'arrow-forward'}
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
  lessonBadge: { minHeight: 38, paddingHorizontal: 14, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFE7EE' },
  badgeClef: { color: '#C14E70', fontSize: 19, fontWeight: '900' },
  lessonBadgeText: { color: '#C14E70', fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  starBadge: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  progressDot: { width: 20, height: 7, borderRadius: 999 },
  progressDotCurrent: { width: 34 },
  hero: { minHeight: 410, borderRadius: 32, padding: 26, justifyContent: 'center', backgroundColor: '#C14E70' },
  heroIcon: { width: 88, height: 88, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  heroClef: { color: '#FFFFFF', fontSize: 66, lineHeight: 75 },
  heroKicker: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 34, lineHeight: 40, fontWeight: '900', marginTop: 9 },
  heroText: { color: 'rgba(255,255,255,0.9)', fontSize: 17, lineHeight: 25, fontWeight: '700', marginTop: 12 },
  stepLabel: { color: '#C14E70', fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  sectionTitle: { fontSize: 29, lineHeight: 35, fontWeight: '900', marginTop: 7 },
  sectionText: { fontSize: 16, lineHeight: 24, fontWeight: '600', marginTop: 9 },
  infoCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  staffBox: { height: 168, borderRadius: 22, backgroundColor: '#FFF8FA', marginTop: 20, position: 'relative', overflow: 'hidden' },
  staffLine: { position: 'absolute', left: 20, right: 20, height: 1.5, backgroundColor: '#847C8F' },
  clefBubble: { position: 'absolute', left: 20, top: 16, width: 72, height: 138, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#FFE7EE' },
  clefBubbleActive: { borderWidth: 2, borderColor: '#C14E70' },
  clefGlyph: { fontSize: 84, lineHeight: 100, color: '#C14E70' },
  noteHead: { position: 'absolute', width: 17, height: 12, borderRadius: 9, backgroundColor: '#4C4657', transform: [{ rotate: '-15deg' }] },
  noteStem: { position: 'absolute', right: 0, bottom: 5, width: 2, height: 31, backgroundColor: '#4C4657' },
  sourceImage: { width: '100%', height: 100, marginTop: 14, borderRadius: 18 },
  tipBox: { marginTop: 15, borderRadius: 18, padding: 12, backgroundColor: '#FFF1BE', flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipEmoji: { fontSize: 24 },
  tipText: { flex: 1, color: '#6D5315', fontSize: 11, lineHeight: 17, fontWeight: '700' },
  findCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  findStage: { height: 220, borderRadius: 24, backgroundColor: '#FFF8FA', marginTop: 20, position: 'relative', overflow: 'hidden' },
  findLine: { position: 'absolute', left: 24, right: 24, height: 1.5, backgroundColor: '#8B8496' },
  findClefWrap: { position: 'absolute', left: 26, top: 23 },
  findClefButton: { width: 86, height: 168, borderRadius: 26, backgroundColor: '#FFE7EE', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F0B4C6' },
  findClefFound: { backgroundColor: '#DFF7EC', borderColor: '#16805A' },
  findClef: { fontSize: 90, lineHeight: 105, color: '#C14E70' },
  decoySymbol: { position: 'absolute', color: '#655F75', fontSize: 42, fontWeight: '800' },
  findFeedback: { marginTop: 14, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFE7EE' },
  findFeedbackDone: { backgroundColor: '#DFF7EC' },
  findFeedbackEmoji: { fontSize: 25 },
  findFeedbackText: { flex: 1, color: '#514B5E', fontSize: 12, lineHeight: 18, fontWeight: '800' },
  traceCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  traceStage: { height: 220, borderRadius: 24, backgroundColor: '#FFF8FA', marginTop: 18, position: 'relative', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  traceClef: { position: 'absolute', color: '#F2C5D2', fontSize: 168, lineHeight: 190 },
  tracePoint: { position: 'absolute', width: 34, height: 34, marginLeft: -17, borderRadius: 17, backgroundColor: '#E9E4EE', borderWidth: 2, borderColor: '#BDB5C6', alignItems: 'center', justifyContent: 'center' },
  tracePointCurrent: { backgroundColor: '#C14E70', borderColor: '#C14E70', transform: [{ scale: 1.1 }] },
  tracePointDone: { backgroundColor: '#DFF7EC', borderColor: '#16805A' },
  tracePointText: { color: '#655F75', fontSize: 13, fontWeight: '900' },
  tracePointTextDone: { color: '#16805A' },
  practiceImage: { width: '100%', height: 80, marginTop: 12 },
  traceProgress: { marginTop: 13, minHeight: 44, borderRadius: 16, backgroundColor: '#FFE7EE', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  traceProgressText: { color: '#8E3D59', fontSize: 12, fontWeight: '900' },
  quizCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  quizIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: '#FFE7EE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  quizEmoji: { fontSize: 36 },
  quizTitle: { fontSize: 27, lineHeight: 34, fontWeight: '900', marginTop: 7, marginBottom: 18 },
  quizOptions: { gap: 9 },
  quizOption: { minHeight: 68, borderRadius: 20, borderWidth: 1.5, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  quizOptionEmoji: { fontSize: 28 },
  quizOptionText: { flex: 1, fontSize: 16, fontWeight: '900' },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  selectedText: { color: '#C14E70', fontSize: 10, fontWeight: '900' },
  feedback: { marginTop: 13, borderRadius: 19, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackEmoji: { fontSize: 27 },
  feedbackTitle: { fontSize: 15, fontWeight: '900' },
  feedbackText: { fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 2 },
  rewardCard: { minHeight: 410, borderRadius: 32, padding: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFEAF0' },
  rewardEmoji: { fontSize: 72 },
  rewardTitle: { fontSize: 34, lineHeight: 40, fontWeight: '900', marginTop: 14 },
  rewardText: { fontSize: 17, lineHeight: 25, fontWeight: '600', textAlign: 'center', marginTop: 10, maxWidth: 310 },
  starsRow: { flexDirection: 'row', gap: 8, marginTop: 26 },
  rewardPill: { marginTop: 20, minHeight: 46, borderRadius: 999, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFFFFFAA' },
  rewardPillText: { color: '#7C5700', fontSize: 14, fontWeight: '900' },
  completeButton: { minHeight: 60, borderRadius: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 18 },
  completeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
