import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
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

type Point = { x: number; y: number };

const QUIZ_STEP = 4;
const REWARD_STEP = 5;
const TOTAL_STEPS = 6;
const TRACE_TARGET = 65;
const CLEF_RATIO = 340 / 120;

const TREBLE_CLEF_URI = 'data:image/png;base64,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';

const QUIZ_OPTIONS = [
  { id: 'clef', label: 'Musiqa kaliti', emoji: '🎼', correct: true },
  { id: 'number', label: 'Raqam', emoji: '🔢', correct: false },
  { id: 'dot', label: 'Nuqta', emoji: '⚫', correct: false },
];

function interpolatePath(points: Point[], parts = 4) {
  const out: Point[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const from = points[i];
    const to = points[i + 1];
    for (let part = 0; part < parts; part += 1) {
      const t = part / parts;
      out.push({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t });
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

const CLEF_TRACE_POINTS = interpolatePath([
  { x: 0.47, y: 0.95 }, { x: 0.61, y: 0.97 }, { x: 0.70, y: 0.92 }, { x: 0.67, y: 0.86 },
  { x: 0.56, y: 0.82 }, { x: 0.54, y: 0.70 }, { x: 0.53, y: 0.55 }, { x: 0.52, y: 0.40 },
  { x: 0.51, y: 0.25 }, { x: 0.53, y: 0.10 }, { x: 0.58, y: 0.05 }, { x: 0.68, y: 0.13 },
  { x: 0.72, y: 0.22 }, { x: 0.65, y: 0.31 }, { x: 0.52, y: 0.38 }, { x: 0.38, y: 0.46 },
  { x: 0.30, y: 0.56 }, { x: 0.34, y: 0.65 }, { x: 0.48, y: 0.71 }, { x: 0.64, y: 0.68 },
  { x: 0.74, y: 0.59 }, { x: 0.71, y: 0.50 }, { x: 0.60, y: 0.44 }, { x: 0.48, y: 0.47 },
  { x: 0.42, y: 0.55 }, { x: 0.47, y: 0.62 }, { x: 0.58, y: 0.61 }, { x: 0.62, y: 0.53 },
]);

function TrebleClefMark({ width = 60, color = '#C14E70', opacity = 1 }: { width?: number; color?: string; opacity?: number }) {
  return (
    <Image
      source={{ uri: TREBLE_CLEF_URI }}
      resizeMode="contain"
      style={{ width, height: width * CLEF_RATIO, tintColor: color, opacity }}
    />
  );
}

function StaffWithClef() {
  return (
    <View style={styles.staffBox}>
      {[0, 1, 2, 3, 4].map((line) => <View key={line} style={[styles.staffLine, { top: 32 + line * 24 }]} />)}
      <View style={styles.clefBubble}><TrebleClefMark width={48} /></View>
      <View style={[styles.noteHead, { left: '52%', top: 76 }]}><View style={styles.noteStem} /></View>
      <View style={[styles.noteHead, { left: '70%', top: 52 }]}><View style={styles.noteStem} /></View>
      <View style={[styles.noteHead, { left: '84%', top: 100 }]}><View style={styles.noteStem} /></View>
    </View>
  );
}

export function LessonFivePage({ images, completed, saving, onBack, onNext, onComplete, resolveUrl }: LessonFivePageProps) {
  const { colors } = useTheme();
  const { awardLessonStars } = useStars();
  const [step, setStep] = useState(0);
  const [clefFound, setClefFound] = useState(false);
  const [drawnPoints, setDrawnPoints] = useState<Point[]>([]);
  const [traceCoverage, setTraceCoverage] = useState(0);
  const [traceComplete, setTraceComplete] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 1, height: 1 });
  const [hintIndex, setHintIndex] = useState(0);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.84)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const hintPulse = useRef(new Animated.Value(0.88)).current;
  const drawnRef = useRef<Point[]>([]);
  const visitedRef = useRef<Set<number>>(new Set());
  const isFinalStep = step === REWARD_STEP;

  const guideFrame = useMemo(() => ({
    left: canvasSize.width * 0.345,
    top: canvasSize.height * 0.045,
    width: canvasSize.width * 0.31,
    height: canvasSize.height * 0.90,
  }), [canvasSize]);

  const guidePixels = useMemo(
    () => CLEF_TRACE_POINTS.map((point) => ({ x: guideFrame.left + point.x * guideFrame.width, y: guideFrame.top + point.y * guideFrame.height })),
    [guideFrame],
  );

  const tracePoint = useCallback((x: number, y: number) => {
    if (canvasSize.width <= 1 || canvasSize.height <= 1) return;
    const last = drawnRef.current[drawnRef.current.length - 1];
    if (last && Math.hypot(last.x - x, last.y - y) < 2.5) return;

    const nextPoints = [...drawnRef.current, { x, y }].slice(-360);
    drawnRef.current = nextPoints;
    setDrawnPoints(nextPoints);

    guidePixels.forEach((point, index) => {
      if (Math.hypot(point.x - x, point.y - y) <= 24) visitedRef.current.add(index);
    });
    const coverage = Math.min(100, Math.round((visitedRef.current.size / Math.max(1, guidePixels.length)) * 100));
    setTraceCoverage(coverage);
    if (coverage >= TRACE_TARGET) setTraceComplete(true);
  }, [canvasSize.height, canvasSize.width, guidePixels]);

  const drawingGesture = useMemo(() => Gesture.Pan()
    .minDistance(0)
    .maxPointers(1)
    .runOnJS(true)
    .onBegin((event) => tracePoint(event.x, event.y))
    .onUpdate((event) => tracePoint(event.x, event.y)), [tracePoint]);

  useEffect(() => {
    if (step !== REWARD_STEP) return;
    rewardScale.setValue(0.84);
    Animated.spring(rewardScale, { toValue: 1, friction: 5, tension: 85, useNativeDriver: true }).start();
  }, [rewardScale, step]);

  useEffect(() => {
    if (step !== 2 || clefFound) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1.07, duration: 650, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 1, duration: 650, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [clefFound, pulse, step]);

  useEffect(() => {
    if (step !== 3 || traceComplete) return;
    const timer = setInterval(() => setHintIndex((value) => (value + 2) % CLEF_TRACE_POINTS.length), 150);
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(hintPulse, { toValue: 1.08, duration: 380, useNativeDriver: true }),
      Animated.timing(hintPulse, { toValue: 0.88, duration: 380, useNativeDriver: true }),
    ]));
    loop.start();
    return () => { clearInterval(timer); loop.stop(); };
  }, [hintPulse, step, traceComplete]);

  function resetTrace() {
    drawnRef.current = [];
    visitedRef.current = new Set();
    setDrawnPoints([]);
    setTraceCoverage(0);
    setTraceComplete(false);
    setHintIndex(0);
  }

  function goBack() {
    if (step > 0) { setStep((value) => value - 1); return; }
    onBack();
  }

  function goForward() {
    if (step === 2 && !clefFound) return;
    if (step === 3 && !traceComplete) return;
    if (step === QUIZ_STEP) { if (quizChecked) setStep(REWARD_STEP); return; }
    if (!isFinalStep) { setStep((value) => Math.min(REWARD_STEP, value + 1)); return; }
    if (!completed) { onComplete(); return; }
    onNext?.();
  }

  function checkQuiz() {
    if (!selectedQuizId || quizChecked) return;
    const selected = QUIZ_OPTIONS.find((option) => option.id === selectedQuizId);
    const stars: 2 | 3 = selected?.correct ? 3 : 2;
    setRewardStars(stars);
    awardLessonStars(5, stars);
    setQuizChecked(true);
  }

  const selectedQuiz = QUIZ_OPTIONS.find((option) => option.id === selectedQuizId) ?? null;
  const answerCorrect = !!selectedQuiz?.correct;
  const buttonDisabled = saving || (step === 2 && !clefFound) || (step === 3 && !traceComplete) || (step === QUIZ_STEP && !selectedQuizId) || (isFinalStep && completed && !onNext);
  const buttonLabel = step === 2 && !clefFound
    ? 'Avval kalitni top 🎼'
    : step === 3 && !traceComplete
      ? `Chizishni davom et • ${traceCoverage}%`
      : step === QUIZ_STEP
        ? !selectedQuizId ? 'Javobni tanla' : !quizChecked ? 'Javobni tekshirish' : `${rewardStars} yulduz! Natijani ko‘r`
        : !isFinalStep ? 'Davom etish' : saving ? 'Saqlanmoqda…' : completed && onNext ? 'Keyingi dars' : completed ? 'Barakalla! ⭐' : 'Darsni yakunlash';

  const firstImage = images[0] ? resolveUrl(images[0].url) : null;
  const hintPoint = guidePixels[Math.min(hintIndex, Math.max(0, guidePixels.length - 1))] ?? { x: 0, y: 0 };
  const firstGuidePoint = guidePixels[0] ?? { x: 0, y: 0 };

  const primaryAction = () => {
    if (step === QUIZ_STEP && !quizChecked) { checkQuiz(); return; }
    goForward();
  };

  return (
    <View style={styles.page}>
      <View style={styles.topbar}>
        <Pressable onPress={goBack} style={[styles.navButton, { backgroundColor: colors.surface, borderColor: colors.border }]}><Ionicons name="arrow-back" size={22} color={colors.text} /></Pressable>
        <View style={styles.lessonBadge}><Ionicons name="musical-notes" size={17} color="#C14E70" /><Text style={styles.lessonBadgeText}>5-DARS</Text></View>
        <View style={styles.starBadge}><Ionicons name="star" size={22} color="#F2B01E" /></View>
      </View>

      <View style={styles.progressDots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => <View key={index} style={[styles.progressDot, { backgroundColor: index <= step ? '#C14E70' : colors.border }, index === step && styles.progressDotCurrent]} />)}
      </View>

      {step === 0 ? (
        <View style={styles.hero}>
          <View style={styles.heroIcon}><TrebleClefMark width={34} color="#FFFFFF" /></View>
          <Text style={styles.heroKicker}>YANGI BELGI 🎼</Text>
          <Text style={styles.heroTitle}>Skripka kaliti</Text>
          <Text style={styles.heroText}>Notalar yozilishidan oldin nota yo‘lining boshiga maxsus musiqa kaliti qo‘yiladi.</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>BILIB OLAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Kalit yo‘lni ochadi 🔑</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Skripka kaliti notalarni o‘qishga yordam beradi. U nota yo‘lining boshida turadi.</Text>
          <StaffWithClef />
          {firstImage ? <View style={styles.sourceReference}><Text style={styles.sourceReferenceLabel}>Taqdimotdagi asl namuna</Text><Image source={{ uri: firstImage }} resizeMode="contain" style={styles.sourceImage} /></View> : null}
          <View style={styles.tipBox}><Text style={styles.tipEmoji}>💡</Text><Text style={styles.tipText}>Kalitni ko‘rsang, notalar undan keyin yozilishini eslab qol.</Text></View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.findCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>TOPIB KO‘R</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Skripka kaliti qayerda?</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Nota yo‘lining boshidagi katta belgini bos.</Text>
          <View style={styles.findStage}>
            {[0, 1, 2, 3, 4].map((line) => <View key={line} style={[styles.findLine, { top: 38 + line * 29 }]} />)}
            <Animated.View style={[styles.findClefWrap, { transform: [{ scale: pulse }] }]}> 
              <Pressable onPress={() => setClefFound(true)} style={[styles.findClefButton, clefFound && styles.findClefFound]}><TrebleClefMark width={56} color={clefFound ? '#16805A' : '#C14E70'} /></Pressable>
            </Animated.View>
            <Text style={[styles.decoySymbol, { left: '55%', top: 72 }]}>♪</Text><Text style={[styles.decoySymbol, { left: '75%', top: 105 }]}>●</Text>
          </View>
          <View style={[styles.findFeedback, clefFound && styles.findFeedbackDone]}><Text style={styles.findFeedbackEmoji}>{clefFound ? '🎉' : '👀'}</Text><Text style={styles.findFeedbackText}>{clefFound ? 'Topding! Bu — skripka kaliti.' : 'Kalit nota yo‘lining boshida turadi.'}</Text></View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.traceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>QO‘LDA CHIZAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Kalitni barmog‘ing bilan chiz</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Xira kalit va pushti nuqtalar ustidan barmog‘ingni yurgiz. ☝️ yo‘lni ko‘rsatadi.</Text>

          <GestureDetector gesture={drawingGesture}>
            <View style={styles.traceStage} onLayout={(event) => setCanvasSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}>
              <View style={styles.guideGlow} pointerEvents="none" />
              {canvasSize.width > 1 ? <View pointerEvents="none" style={[styles.guideImageWrap, { left: guideFrame.left, top: guideFrame.top, width: guideFrame.width, height: guideFrame.height }]}><TrebleClefMark width={guideFrame.width} color="#C14E70" opacity={0.14} /></View> : null}
              {guidePixels.filter((_, index) => index % 3 === 0).map((point, index) => <View key={index} pointerEvents="none" style={[styles.guideDot, { left: point.x - 3.5, top: point.y - 3.5 }]} />)}
              {drawnPoints.map((point, index) => <View key={index} pointerEvents="none" style={[styles.drawDot, { left: point.x - 5.5, top: point.y - 5.5 }]} />)}
              {!traceComplete && canvasSize.width > 1 ? <Animated.View pointerEvents="none" style={[styles.hintFinger, { left: hintPoint.x - 16, top: hintPoint.y - 30, transform: [{ scale: hintPulse }] }]}><Text style={styles.hintFingerText}>☝️</Text></Animated.View> : null}
              {canvasSize.width > 1 ? <View pointerEvents="none" style={[styles.startBadge, { left: Math.max(8, firstGuidePoint.x - 82), top: Math.max(8, firstGuidePoint.y - 36) }]}><Text style={styles.startBadgeText}>Shu yerdan boshla</Text></View> : null}
            </View>
          </GestureDetector>

          <View style={styles.traceActions}>
            <View style={[styles.traceProgress, traceComplete && styles.traceProgressDone]}><Ionicons name={traceComplete ? 'checkmark-circle' : 'finger-print'} size={21} color={traceComplete ? '#16805A' : '#C14E70'} /><Text style={[styles.traceProgressText, traceComplete && styles.traceProgressTextDone]}>{traceComplete ? 'Ajoyib! Skripka kalitini chizding.' : `Yo‘lning ${traceCoverage}% qismini chizding`}</Text></View>
            <Pressable onPress={resetTrace} style={styles.resetTraceButton}><Ionicons name="refresh" size={18} color="#C14E70" /></Pressable>
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
              const surface = showCorrect ? { backgroundColor: colors.successSurface, borderColor: colors.success } : showWrong ? { backgroundColor: '#FFF3D5', borderColor: '#E2A93B' } : selected ? { backgroundColor: '#FFE7EE', borderColor: '#C14E70' } : { backgroundColor: colors.surface, borderColor: colors.border };
              return <Pressable key={option.id} disabled={quizChecked} onPress={() => setSelectedQuizId(option.id)} style={({ pressed }) => [styles.quizOption, surface, pressed && !quizChecked && styles.pressed]}><Text style={styles.quizOptionEmoji}>{option.emoji}</Text><Text style={[styles.quizOptionText, { color: colors.text }]}>{option.label}</Text>{selected && !quizChecked ? <Ionicons name="radio-button-on" size={22} color="#C14E70" /> : null}{showCorrect ? <Ionicons name="checkmark-circle" size={25} color={colors.success} /> : null}{showWrong ? <Ionicons name="close-circle" size={25} color="#D59A25" /> : null}</Pressable>;
            })}
          </View>
          {quizChecked ? <View style={[styles.feedback, { backgroundColor: answerCorrect ? colors.successSurface : '#FFF3D5' }]}><Text style={styles.feedbackEmoji}>{answerCorrect ? '🎉' : '💡'}</Text><View style={{ flex: 1 }}><Text style={[styles.feedbackTitle, { color: colors.text }]}>{answerCorrect ? 'To‘g‘ri!' : 'Yaxshi urinish!'}</Text><Text style={[styles.feedbackText, { color: colors.muted }]}>{answerCorrect ? 'Ha! Notalardan oldin musiqa kaliti qo‘yiladi.' : 'To‘g‘ri javob — musiqa kaliti.'}</Text></View></View> : null}
        </View>
      ) : null}

      {step === REWARD_STEP ? (
        <View style={styles.rewardCard}><Animated.View style={{ alignItems: 'center', transform: [{ scale: rewardScale }] }}><Text style={styles.rewardEmoji}>{rewardStars === 3 ? '🎉' : '🌟'}</Text><Text style={[styles.rewardTitle, { color: colors.text }]}>{rewardStars === 3 ? 'Ajoyib!' : 'Barakalla!'}</Text><Text style={[styles.rewardText, { color: colors.muted }]}>Skripka kalitini taniy olasan va uni chizib ko‘rding!</Text><View style={styles.starsRow}>{[0, 1, 2].map((star) => <Ionicons key={star} name={star < rewardStars ? 'star' : 'star-outline'} size={40} color={star < rewardStars ? '#F2B01E' : '#B9B2C7'} />)}</View><View style={styles.rewardPill}><Ionicons name="trophy" size={20} color="#A66A00" /><Text style={styles.rewardPillText}>+{rewardStars} yulduz</Text></View></Animated.View></View>
      ) : null}

      <Pressable disabled={buttonDisabled} onPress={primaryAction} style={({ pressed }) => [styles.completeButton, { backgroundColor: isFinalStep ? colors.success : '#C14E70' }, buttonDisabled && styles.disabled, pressed && !buttonDisabled && styles.pressed]}><Text style={styles.completeText}>{buttonLabel}</Text><Ionicons name={step === QUIZ_STEP ? (quizChecked ? 'arrow-forward' : 'checkmark-circle') : isFinalStep ? 'star' : 'arrow-forward'} size={21} color="#FFFFFF" /></Pressable>
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
  progressDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  progressDot: { width: 20, height: 7, borderRadius: 999 },
  progressDotCurrent: { width: 34 },
  hero: { minHeight: 410, borderRadius: 32, padding: 26, justifyContent: 'center', backgroundColor: '#C14E70' },
  heroIcon: { width: 88, height: 112, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 20, overflow: 'hidden' },
  heroKicker: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 34, lineHeight: 40, fontWeight: '900', marginTop: 9 },
  heroText: { color: 'rgba(255,255,255,0.9)', fontSize: 17, lineHeight: 25, fontWeight: '700', marginTop: 12 },
  stepLabel: { color: '#C14E70', fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  sectionTitle: { fontSize: 29, lineHeight: 35, fontWeight: '900', marginTop: 7 },
  sectionText: { fontSize: 16, lineHeight: 24, fontWeight: '600', marginTop: 9 },
  infoCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  staffBox: { height: 178, borderRadius: 22, backgroundColor: '#FFF8FA', marginTop: 20, position: 'relative', overflow: 'hidden' },
  staffLine: { position: 'absolute', left: 20, right: 20, height: 1.5, backgroundColor: '#847C8F' },
  clefBubble: { position: 'absolute', left: 18, top: 8, width: 92, height: 162, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#FFE7EE', borderWidth: 2, borderColor: '#C14E70', overflow: 'hidden' },
  noteHead: { position: 'absolute', width: 17, height: 12, borderRadius: 9, backgroundColor: '#4C4657', transform: [{ rotate: '-15deg' }] },
  noteStem: { position: 'absolute', right: 0, bottom: 5, width: 2, height: 31, backgroundColor: '#4C4657' },
  sourceReference: { marginTop: 12, alignItems: 'center' },
  sourceReferenceLabel: { color: '#8E3D59', fontSize: 10, fontWeight: '900', marginBottom: 3 },
  sourceImage: { width: '100%', height: 94, borderRadius: 18 },
  tipBox: { marginTop: 15, borderRadius: 18, padding: 12, backgroundColor: '#FFF1BE', flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipEmoji: { fontSize: 24 },
  tipText: { flex: 1, color: '#6D5315', fontSize: 11, lineHeight: 17, fontWeight: '700' },
  findCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  findStage: { height: 230, borderRadius: 24, backgroundColor: '#FFF8FA', marginTop: 20, position: 'relative', overflow: 'hidden' },
  findLine: { position: 'absolute', left: 24, right: 24, height: 1.5, backgroundColor: '#8B8496' },
  findClefWrap: { position: 'absolute', left: 22, top: 14 },
  findClefButton: { width: 104, height: 192, borderRadius: 28, backgroundColor: '#FFE7EE', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F0B4C6', overflow: 'hidden' },
  findClefFound: { backgroundColor: '#DFF7EC', borderColor: '#16805A' },
  decoySymbol: { position: 'absolute', color: '#655F75', fontSize: 42, fontWeight: '800' },
  findFeedback: { marginTop: 14, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFE7EE' },
  findFeedbackDone: { backgroundColor: '#DFF7EC' },
  findFeedbackEmoji: { fontSize: 25 },
  findFeedbackText: { flex: 1, color: '#514B5E', fontSize: 12, lineHeight: 18, fontWeight: '800' },
  traceCard: { minHeight: 490, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  traceStage: { height: 310, borderRadius: 26, backgroundColor: '#FFF7FA', marginTop: 18, position: 'relative', overflow: 'hidden', borderWidth: 1.5, borderColor: '#F5C7D4' },
  guideGlow: { position: 'absolute', left: '28%', top: '5%', width: '44%', height: '90%', borderRadius: 70, backgroundColor: '#FFE7EE', opacity: 0.36 },
  guideImageWrap: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  guideDot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: '#C14E70', opacity: 0.70 },
  drawDot: { position: 'absolute', width: 11, height: 11, borderRadius: 6, backgroundColor: '#C14E70', shadowColor: '#C14E70', shadowOpacity: 0.38, shadowRadius: 4, elevation: 2 },
  hintFinger: { position: 'absolute', width: 32, height: 32, alignItems: 'center', justifyContent: 'center', zIndex: 8 },
  hintFingerText: { fontSize: 27 },
  startBadge: { position: 'absolute', borderRadius: 999, backgroundColor: '#FFFFFFEE', paddingHorizontal: 10, paddingVertical: 6, zIndex: 7 },
  startBadgeText: { color: '#9E4564', fontSize: 9, fontWeight: '900' },
  traceActions: { marginTop: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
  traceProgress: { flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: '#FFE7EE', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  traceProgressDone: { backgroundColor: '#DFF7EC' },
  traceProgressText: { color: '#8E3D59', fontSize: 11, fontWeight: '900', flexShrink: 1, textAlign: 'center' },
  traceProgressTextDone: { color: '#16805A' },
  resetTraceButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFF0F4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F5C7D4' },
  quizCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
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
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
