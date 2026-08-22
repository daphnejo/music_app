import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useStars } from '@/context/StarsContext';
import { useTheme } from '@/context/ThemeContext';
import type { BlockAsset } from '@/types/content';
import { TREBLE_CLEF_DOTS, TREBLE_CLEF_HINT_PATH } from '@/utils/treble-clef-dots';

type LessonFivePageProps = {
  images: BlockAsset[];
  completed: boolean;
  saving: boolean;
  onBack: () => void;
  onNext?: () => void;
  onComplete: () => void;
  resolveUrl: (url: string) => string;
};

type Point = { x: number; y: number };

const QUIZ_STEP = 4;
const REWARD_STEP = 5;
const TOTAL_STEPS = 6;
const TRACE_TARGET = 48;

const QUIZ_OPTIONS = [
  { id: 'clef', label: 'Musiqa kaliti', emoji: '🎼', correct: true },
  { id: 'number', label: 'Raqam', emoji: '🔢', correct: false },
  { id: 'dot', label: 'Nuqta', emoji: '⚫', correct: false },
];

export function LessonFivePageV3({
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
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const [drawnPoints, setDrawnPoints] = useState<Point[]>([]);
  const drawnRef = useRef<Point[]>([]);
  const visitedRef = useRef<Set<number>>(new Set());
  const [traceCoverage, setTraceCoverage] = useState(0);
  const [traceComplete, setTraceComplete] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.86)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const hintPulse = useRef(new Animated.Value(0.9)).current;
  const isFinalStep = step === REWARD_STEP;

  const firstImage = images[0] ? resolveUrl(images[0].url) : null;
  const practiceImage = images[images.length - 1] ? resolveUrl(images[images.length - 1].url) : null;

  const guideFrame = useMemo(() => {
    const size = Math.min(canvasSize.width * 0.88, canvasSize.height * 0.90);
    return {
      size,
      left: (canvasSize.width - size) / 2,
      top: (canvasSize.height - size) / 2,
    };
  }, [canvasSize.height, canvasSize.width]);

  const guidePixels = useMemo(
    () => TREBLE_CLEF_DOTS.map((point) => ({
      x: guideFrame.left + point.x * guideFrame.size,
      y: guideFrame.top + point.y * guideFrame.size,
    })),
    [guideFrame.left, guideFrame.size, guideFrame.top],
  );

  const hintPixels = useMemo(
    () => TREBLE_CLEF_HINT_PATH.map((point) => ({
      x: guideFrame.left + point.x * guideFrame.size,
      y: guideFrame.top + point.y * guideFrame.size,
    })),
    [guideFrame.left, guideFrame.size, guideFrame.top],
  );

  const tracePoint = useCallback((x: number, y: number) => {
    if (canvasSize.width <= 1 || canvasSize.height <= 1) return;

    const last = drawnRef.current[drawnRef.current.length - 1];
    if (last && Math.hypot(last.x - x, last.y - y) < 4) return;

    const next = [...drawnRef.current, { x, y }].slice(-280);
    drawnRef.current = next;
    setDrawnPoints(next);

    guidePixels.forEach((point, index) => {
      if (Math.hypot(point.x - x, point.y - y) <= 22) visitedRef.current.add(index);
    });

    const coverage = Math.round((visitedRef.current.size / Math.max(1, guidePixels.length)) * 100);
    setTraceCoverage(coverage);
    if (coverage >= TRACE_TARGET) setTraceComplete(true);
  }, [canvasSize.height, canvasSize.width, guidePixels]);

  const drawingGesture = useMemo(
    () => Gesture.Pan()
      .maxPointers(1)
      .minDistance(0)
      .shouldCancelWhenOutside(false)
      .runOnJS(true)
      .onBegin((event) => tracePoint(event.x, event.y))
      .onUpdate((event) => tracePoint(event.x, event.y)),
    [tracePoint],
  );

  useEffect(() => {
    if (step !== 2 || clefFound) return;
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.06, duration: 650, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [clefFound, pulse, step]);

  useEffect(() => {
    if (step !== 3 || traceComplete) return;
    const timer = setInterval(() => {
      setHintIndex((value) => (value + 1) % Math.max(1, TREBLE_CLEF_HINT_PATH.length));
    }, 300);
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(hintPulse, { toValue: 1.08, duration: 380, useNativeDriver: true }),
      Animated.timing(hintPulse, { toValue: 0.9, duration: 380, useNativeDriver: true }),
    ]));
    animation.start();
    return () => {
      clearInterval(timer);
      animation.stop();
    };
  }, [hintPulse, step, traceComplete]);

  useEffect(() => {
    if (step !== REWARD_STEP) return;
    rewardScale.setValue(0.86);
    Animated.spring(rewardScale, {
      toValue: 1,
      friction: 5,
      tension: 82,
      useNativeDriver: true,
    }).start();
  }, [rewardScale, step]);

  function resetTrace() {
    drawnRef.current = [];
    visitedRef.current = new Set();
    setDrawnPoints([]);
    setTraceCoverage(0);
    setTraceComplete(false);
    setHintIndex(0);
  }

  function goBack() {
    if (step > 0) {
      setStep((value) => value - 1);
      return;
    }
    onBack();
  }

  function checkQuiz() {
    if (!selectedQuizId || quizChecked) return;
    const selected = QUIZ_OPTIONS.find((option) => option.id === selectedQuizId);
    const stars: 2 | 3 = selected?.correct ? 3 : 2;
    setRewardStars(stars);
    awardLessonStars(5, stars);
    setQuizChecked(true);
  }

  function goForward() {
    if (step === 2 && !clefFound) return;
    if (step === 3 && !traceComplete) return;

    if (step === QUIZ_STEP) {
      if (!quizChecked) {
        checkQuiz();
        return;
      }
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

  const selectedQuiz = QUIZ_OPTIONS.find((option) => option.id === selectedQuizId) ?? null;
  const answerCorrect = !!selectedQuiz?.correct;
  const hintPoint = hintPixels[Math.min(hintIndex, Math.max(0, hintPixels.length - 1))] ?? { x: 0, y: 0 };
  const buttonDisabled = saving
    || (step === 2 && !clefFound)
    || (step === 3 && !traceComplete)
    || (step === QUIZ_STEP && !selectedQuizId)
    || (isFinalStep && completed && !onNext);

  const buttonLabel = step === 2 && !clefFound
    ? 'Avval kalitni top 🎼'
    : step === 3 && !traceComplete
      ? `Chizishni davom et • ${traceCoverage}%`
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

  return (
    <View style={styles.page}>
      <View style={styles.topbar}>
        <Pressable onPress={goBack} style={[styles.navButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.lessonBadge}>
          <Ionicons name="musical-notes" size={17} color="#C14E70" />
          <Text style={styles.lessonBadgeText}>5-DARS</Text>
        </View>
        <View style={styles.starBadge}><Ionicons name="star" size={22} color="#F2B01E" /></View>
      </View>

      <View style={styles.progressDots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View key={index} style={[styles.progressDot, { backgroundColor: index <= step ? '#C14E70' : colors.border }, index === step && styles.progressDotCurrent]} />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Text style={styles.heroIconText}>🎼</Text></View>
          <Text style={styles.heroKicker}>YANGI BELGI 🎼</Text>
          <Text style={styles.heroTitle}>Skripka kaliti</Text>
          <Text style={styles.heroText}>Notalar yozilishidan oldin nota yo‘lining boshiga maxsus musiqa kaliti qo‘yiladi.</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>BILIB OLAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Kalit yo‘lni ochadi 🔑</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Skripka kaliti nota yo‘lining boshida turadi. Notalar undan keyin yoziladi.</Text>
          <View style={styles.realClefCard}>
            {firstImage ? <Image source={{ uri: firstImage }} resizeMode="contain" style={styles.realClefImage} /> : <Text style={styles.fallbackClef}>🎼</Text>}
          </View>
          <View style={styles.tipBox}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipText}>Asl namunani eslab qol: kalit doim nota yo‘lining boshida turadi.</Text>
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>TOPIB KO‘R</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Skripka kaliti qaysi?</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>To‘g‘ri belgini bos.</Text>
          <View style={styles.findGrid}>
            <Animated.View style={{ flex: 1, transform: [{ scale: pulse }] }}>
              <Pressable onPress={() => setClefFound(true)} style={[styles.findChoice, clefFound && styles.findChoiceCorrect]}>
                {firstImage ? <Image source={{ uri: firstImage }} resizeMode="contain" style={styles.findImage} /> : <Text style={styles.findEmoji}>🎼</Text>}
                <Text style={styles.findChoiceLabel}>Kalit</Text>
              </Pressable>
            </Animated.View>
            <Pressable style={styles.findChoice}><Text style={styles.decoy}>♪</Text><Text style={styles.findChoiceLabel}>Nota</Text></Pressable>
            <Pressable style={styles.findChoice}><Text style={styles.decoy}>●</Text><Text style={styles.findChoiceLabel}>Nuqta</Text></Pressable>
          </View>
          <View style={[styles.findFeedback, clefFound && styles.findFeedbackDone]}>
            <Text style={styles.findFeedbackEmoji}>{clefFound ? '🎉' : '👀'}</Text>
            <Text style={styles.findFeedbackText}>{clefFound ? 'Topding! Bu — skripka kaliti.' : 'Asl rasmga qarab kalitni top.'}</Text>
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.traceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>QO‘LDA CHIZAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Kalitni barmog‘ing bilan chiz</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Nuqtalar aynan skripka kaliti shaklida. ☝️ yo‘lni ko‘rsatadi.</Text>

          <GestureDetector gesture={drawingGesture}>
            <View
              style={styles.traceStage}
              onLayout={(event) => setCanvasSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
            >
              <View pointerEvents="none" style={styles.traceGlow} />

              {guidePixels.map((point, index) => (
                <View
                  key={index}
                  pointerEvents="none"
                  style={[
                    styles.guideDot,
                    {
                      left: point.x - 3.5,
                      top: point.y - 3.5,
                      opacity: visitedRef.current.has(index) ? 0.22 : 0.82,
                    },
                  ]}
                />
              ))}

              {drawnPoints.map((point, index) => (
                <View key={index} pointerEvents="none" style={[styles.drawDot, { left: point.x - 5, top: point.y - 5 }]} />
              ))}

              {!traceComplete && canvasSize.width > 1 ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.hintFinger,
                    {
                      left: hintPoint.x - 16,
                      top: hintPoint.y - 32,
                      transform: [{ scale: hintPulse }],
                    },
                  ]}
                >
                  <Text style={styles.hintFingerText}>☝️</Text>
                </Animated.View>
              ) : null}

              <View pointerEvents="none" style={styles.startBadge}>
                <Text style={styles.startBadgeText}>Nuqtalar ustidan yurgiz</Text>
              </View>
            </View>
          </GestureDetector>

          <View style={styles.traceActions}>
            <View style={[styles.traceProgress, traceComplete && styles.traceProgressDone]}>
              <Ionicons name={traceComplete ? 'checkmark-circle' : 'finger-print'} size={21} color={traceComplete ? '#16805A' : '#C14E70'} />
              <Text style={[styles.traceProgressText, traceComplete && styles.traceProgressTextDone]}>
                {traceComplete ? 'Ajoyib! Kalitni chizding.' : `Yo‘lning ${traceCoverage}% qismini chizding`}
              </Text>
            </View>
            <Pressable onPress={resetTrace} style={styles.resetButton}>
              <Ionicons name="refresh" size={19} color="#C14E70" />
            </Pressable>
          </View>

          {practiceImage ? (
            <View style={styles.practiceReference}>
              <Text style={styles.practiceLabel}>Taqdimotdagi mashq namunasi</Text>
              <Image source={{ uri: practiceImage }} resizeMode="contain" style={styles.practiceImage} />
            </View>
          ) : null}
        </View>
      ) : null}

      {step === QUIZ_STEP ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.quizIcon}><Text style={styles.quizEmoji}>🎼</Text></View>
          <Text style={styles.stepLabel}>MINI SAVOL</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>Notalarni yozishdan avval nota yo‘liga nima qo‘yiladi?</Text>
          <View style={styles.quizOptions}>
            {QUIZ_OPTIONS.map((option) => {
              const selected = selectedQuizId === option.id;
              const showCorrect = quizChecked && option.correct;
              const showWrong = quizChecked && selected && !option.correct;
              return (
                <Pressable
                  key={option.id}
                  disabled={quizChecked}
                  onPress={() => setSelectedQuizId(option.id)}
                  style={[
                    styles.quizOption,
                    { borderColor: selected ? '#C14E70' : colors.border, backgroundColor: selected ? '#FFE7EE' : colors.surface },
                    showCorrect && { borderColor: colors.success, backgroundColor: colors.successSurface },
                    showWrong && { borderColor: '#E2A93B', backgroundColor: '#FFF3D5' },
                  ]}
                >
                  <Text style={styles.quizOptionEmoji}>{option.emoji}</Text>
                  <Text style={[styles.quizOptionText, { color: colors.text }]}>{option.label}</Text>
                  {selected && !quizChecked ? <Ionicons name="radio-button-on" size={22} color="#C14E70" /> : null}
                  {showCorrect ? <Ionicons name="checkmark-circle" size={24} color={colors.success} /> : null}
                  {showWrong ? <Ionicons name="close-circle" size={24} color="#D59A25" /> : null}
                </Pressable>
              );
            })}
          </View>
          {quizChecked ? (
            <View style={[styles.feedback, { backgroundColor: answerCorrect ? colors.successSurface : '#FFF3D5' }]}>
              <Text style={styles.feedbackEmoji}>{answerCorrect ? '🎉' : '💡'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.feedbackTitle, { color: colors.text }]}>{answerCorrect ? 'To‘g‘ri!' : 'Yaxshi urinish!'}</Text>
                <Text style={[styles.feedbackText, { color: colors.muted }]}>{answerCorrect ? 'Ha! Avval musiqa kaliti qo‘yiladi.' : 'To‘g‘ri javob — musiqa kaliti.'}</Text>
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
            <Text style={[styles.rewardText, { color: colors.muted }]}>Skripka kalitini taniy olasan va uning haqiqiy shaklini nuqtalar ustidan chizding!</Text>
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
        disabled={buttonDisabled}
        onPress={goForward}
        style={[styles.completeButton, { backgroundColor: isFinalStep ? colors.success : '#C14E70' }, buttonDisabled && styles.disabled]}
      >
        <Text style={styles.completeText}>{buttonLabel}</Text>
        <Ionicons name={step === QUIZ_STEP ? (quizChecked ? 'arrow-forward' : 'checkmark-circle') : isFinalStep ? 'star' : 'arrow-forward'} size={21} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 15 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 46, height: 46, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  lessonBadge: { minHeight: 38, paddingHorizontal: 14, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFE7EE' },
  lessonBadgeText: { color: '#C14E70', fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  starBadge: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 5 },
  progressDot: { width: 20, height: 7, borderRadius: 999 },
  progressDotCurrent: { width: 34 },
  hero: { minHeight: 410, borderRadius: 32, padding: 26, justifyContent: 'center', backgroundColor: '#C14E70' },
  heroIcon: { width: 88, height: 88, borderRadius: 30, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  heroIconText: { fontSize: 48 },
  heroKicker: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 34, lineHeight: 40, fontWeight: '900', marginTop: 9 },
  heroText: { color: 'rgba(255,255,255,0.92)', fontSize: 17, lineHeight: 25, fontWeight: '700', marginTop: 12 },
  card: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  traceCard: { minHeight: 520, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  stepLabel: { color: '#C14E70', fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  sectionTitle: { fontSize: 29, lineHeight: 35, fontWeight: '900', marginTop: 7 },
  sectionText: { fontSize: 16, lineHeight: 24, fontWeight: '600', marginTop: 9 },
  realClefCard: { height: 190, borderRadius: 24, marginTop: 18, backgroundColor: '#FFF7FA', borderWidth: 1.5, borderColor: '#F5C7D4', padding: 8 },
  realClefImage: { width: '100%', height: '100%' },
  fallbackClef: { fontSize: 80, textAlign: 'center', marginTop: 45 },
  tipBox: { marginTop: 14, borderRadius: 18, padding: 13, backgroundColor: '#FFF1BE', flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipEmoji: { fontSize: 24 },
  tipText: { flex: 1, color: '#6D5315', fontSize: 11, lineHeight: 17, fontWeight: '700' },
  findGrid: { flexDirection: 'row', gap: 9, marginTop: 20 },
  findChoice: { minHeight: 165, borderRadius: 22, flex: 1, backgroundColor: '#FFF8FA', borderWidth: 1.5, borderColor: '#E6DDE5', alignItems: 'center', justifyContent: 'center', padding: 8 },
  findChoiceCorrect: { backgroundColor: '#DFF7EC', borderColor: '#16805A' },
  findImage: { width: '100%', height: 105 },
  findEmoji: { fontSize: 55 },
  decoy: { fontSize: 58, color: '#655F75' },
  findChoiceLabel: { color: '#514B5E', fontSize: 11, fontWeight: '900', marginTop: 7 },
  findFeedback: { marginTop: 13, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFE7EE' },
  findFeedbackDone: { backgroundColor: '#DFF7EC' },
  findFeedbackEmoji: { fontSize: 25 },
  findFeedbackText: { flex: 1, color: '#514B5E', fontSize: 12, lineHeight: 18, fontWeight: '800' },
  traceStage: { height: 340, borderRadius: 26, marginTop: 18, backgroundColor: '#FFFDFE', borderWidth: 1.5, borderColor: '#F5C7D4', overflow: 'hidden', position: 'relative' },
  traceGlow: { position: 'absolute', left: '25%', top: '7%', width: '50%', height: '86%', borderRadius: 100, backgroundColor: '#FFE7EE', opacity: 0.25 },
  guideDot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: '#C14E70' },
  drawDot: { position: 'absolute', width: 10, height: 10, borderRadius: 6, backgroundColor: '#7B4FE4', shadowColor: '#7B4FE4', shadowOpacity: 0.28, shadowRadius: 4, elevation: 2 },
  hintFinger: { position: 'absolute', width: 32, height: 32, alignItems: 'center', justifyContent: 'center', zIndex: 8 },
  hintFingerText: { fontSize: 26 },
  startBadge: { position: 'absolute', left: 12, top: 10, borderRadius: 999, backgroundColor: '#FFFFFFE8', paddingHorizontal: 10, paddingVertical: 6 },
  startBadgeText: { color: '#9E4564', fontSize: 9, fontWeight: '900' },
  traceActions: { marginTop: 13, flexDirection: 'row', gap: 8 },
  traceProgress: { flex: 1, minHeight: 50, borderRadius: 16, backgroundColor: '#FFE7EE', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 10 },
  traceProgressDone: { backgroundColor: '#DFF7EC' },
  traceProgressText: { color: '#8E3D59', fontSize: 11, fontWeight: '900', flex: 1, textAlign: 'center' },
  traceProgressTextDone: { color: '#16805A' },
  resetButton: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#FFF0F4', borderWidth: 1, borderColor: '#F5C7D4', alignItems: 'center', justifyContent: 'center' },
  practiceReference: { marginTop: 12, borderRadius: 18, padding: 8, backgroundColor: '#FFF8FA', alignItems: 'center' },
  practiceLabel: { color: '#8E3D59', fontSize: 9, fontWeight: '900' },
  practiceImage: { width: '100%', height: 66, marginTop: 3 },
  quizIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: '#FFE7EE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  quizEmoji: { fontSize: 36 },
  quizTitle: { fontSize: 27, lineHeight: 34, fontWeight: '900', marginTop: 7, marginBottom: 18 },
  quizOptions: { gap: 9 },
  quizOption: { minHeight: 68, borderRadius: 20, borderWidth: 1.5, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  quizOptionEmoji: { fontSize: 28 },
  quizOptionText: { flex: 1, fontSize: 16, fontWeight: '900' },
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
});
