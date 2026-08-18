import { useEffect, useMemo, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Image, PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
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
const TRACE_TARGET = 55;

const QUIZ_OPTIONS = [
  { id: 'clef', label: 'Musiqa kaliti', emoji: '🎼', correct: true },
  { id: 'number', label: 'Raqam', emoji: '🔢', correct: false },
  { id: 'dot', label: 'Nuqta', emoji: '⚫', correct: false },
];

function linePoints(from: Point, to: Point, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const t = count <= 1 ? 0 : index / (count - 1);
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
  });
}

function ellipsePoints(cx: number, cy: number, rx: number, ry: number, start: number, end: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const t = count <= 1 ? 0 : index / (count - 1);
    const angle = start + (end - start) * t;
    return { x: cx + Math.cos(angle) * rx, y: cy + Math.sin(angle) * ry };
  });
}

const CLEF_GUIDE_POINTS: Point[] = [
  ...linePoints({ x: 0.58, y: 0.06 }, { x: 0.50, y: 0.88 }, 22),
  ...ellipsePoints(0.50, 0.41, 0.23, 0.29, -Math.PI * 0.55, Math.PI * 1.45, 34),
  ...ellipsePoints(0.50, 0.50, 0.12, 0.14, Math.PI * 0.65, Math.PI * 2.65, 24),
  ...ellipsePoints(0.50, 0.82, 0.105, 0.085, -Math.PI * 0.15, Math.PI * 1.85, 18),
];

function TrebleClefVisual({ size = 122, accent = '#C14E70', soft = '#F5C7D4' }: { size?: number; accent?: string; soft?: string }) {
  const height = size * 1.48;
  return (
    <View style={{ width: size, height }}>
      {CLEF_GUIDE_POINTS.map((point, index) => (
        <View
          key={index}
          style={{
            position: 'absolute',
            left: point.x * size - 2.5,
            top: point.y * height - 2.5,
            width: 5,
            height: 5,
            borderRadius: 3,
            backgroundColor: index % 3 === 0 ? accent : soft,
          }}
        />
      ))}
      <View style={{ position: 'absolute', left: size * 0.49, top: size * 0.07, width: 4, height: height * 0.80, borderRadius: 3, backgroundColor: accent, opacity: 0.72 }} />
    </View>
  );
}

function StaffWithClef({ active = false }: { active?: boolean }) {
  return (
    <View style={styles.staffBox}>
      {[0, 1, 2, 3, 4].map((line) => (
        <View key={line} style={[styles.staffLine, { top: 32 + line * 24 }]} />
      ))}
      <View style={[styles.clefBubble, active && styles.clefBubbleActive]}>
        <TrebleClefVisual size={74} />
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
  const hintPulse = useRef(new Animated.Value(0.82)).current;
  const drawnRef = useRef<Point[]>([]);
  const visitedRef = useRef<Set<number>>(new Set());
  const isFinalStep = step === REWARD_STEP;

  const guidePixels = useMemo(
    () => CLEF_GUIDE_POINTS.map((point) => ({ x: point.x * canvasSize.width, y: point.y * canvasSize.height })),
    [canvasSize.height, canvasSize.width],
  );

  const tracePoint = (x: number, y: number) => {
    if (canvasSize.width <= 1 || canvasSize.height <= 1) return;
    const last = drawnRef.current[drawnRef.current.length - 1];
    if (last && Math.hypot(last.x - x, last.y - y) < 4) return;

    const nextPoints = [...drawnRef.current, { x, y }].slice(-240);
    drawnRef.current = nextPoints;
    setDrawnPoints(nextPoints);

    guidePixels.forEach((point, index) => {
      if (Math.hypot(point.x - x, point.y - y) <= 26) visitedRef.current.add(index);
    });
    const coverage = Math.min(100, Math.round((visitedRef.current.size / Math.max(1, guidePixels.length)) * 100));
    setTraceCoverage(coverage);
    if (coverage >= TRACE_TARGET) setTraceComplete(true);
  };

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => step === 3,
    onMoveShouldSetPanResponder: () => step === 3,
    onPanResponderGrant: (event) => tracePoint(event.nativeEvent.locationX, event.nativeEvent.locationY),
    onPanResponderMove: (event) => tracePoint(event.nativeEvent.locationX, event.nativeEvent.locationY),
  }), [guidePixels, step]);

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

  useEffect(() => {
    if (step !== 3 || traceComplete) return;
    const timer = setInterval(() => setHintIndex((value) => (value + 2) % CLEF_GUIDE_POINTS.length), 180);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hintPulse, { toValue: 1.08, duration: 420, useNativeDriver: true }),
        Animated.timing(hintPulse, { toValue: 0.82, duration: 420, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => {
      clearInterval(timer);
      loop.stop();
    };
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
    if (step > 0) {
      setStep((value) => value - 1);
      return;
    }
    onBack();
  }

  function goForward() {
    if (step === 2 && !clefFound) return;
    if (step === 3 && !traceComplete) return;
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

  const firstImage = images[0] ? resolveUrl(images[0].url) : null;
  const practiceImage = images[images.length - 1] ? resolveUrl(images[images.length - 1].url) : null;
  const hintPoint = guidePixels[Math.min(hintIndex, guidePixels.length - 1)] ?? { x: 0, y: 0 };

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
          <Ionicons name="musical-notes" size={17} color="#C14E70" />
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
          <View style={styles.heroIcon}><TrebleClefVisual size={54} accent="#FFFFFF" soft="rgba(255,255,255,0.55)" /></View>
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
            <View style={styles.sourceReference}>
              <Text style={styles.sourceReferenceLabel}>Asl namunasi</Text>
              <Image source={{ uri: firstImage }} resizeMode="contain" style={styles.sourceImage} />
            </View>
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
                <TrebleClefVisual size={74} accent={clefFound ? '#16805A' : '#C14E70'} soft={clefFound ? '#BDEDD8' : '#F3B9CA'} />
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
          <Text style={styles.stepLabel}>QO‘LDA CHIZAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Kalitni barmog‘ing bilan chiz</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Pushti nuqtalar ustidan barmog‘ingni uzmasdan yurgiz. ☝️ animatsiyasi yo‘lni ko‘rsatadi.</Text>

          <View
            style={styles.traceStage}
            onLayout={(event) => setCanvasSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })}
            {...panResponder.panHandlers}
          >
            <View style={styles.guideGlow} />
            {guidePixels.map((point, index) => (
              <View
                key={index}
                style={[
                  styles.guideDot,
                  {
                    left: point.x - 3,
                    top: point.y - 3,
                    opacity: visitedRef.current.has(index) ? 0.18 : index % 2 === 0 ? 0.82 : 0.46,
                  },
                ]}
              />
            ))}

            {drawnPoints.map((point, index) => (
              <View key={index} style={[styles.drawDot, { left: point.x - 5, top: point.y - 5 }]} />
            ))}

            {!traceComplete && canvasSize.width > 1 ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.hintFinger,
                  {
                    left: hintPoint.x - 15,
                    top: hintPoint.y - 31,
                    transform: [{ scale: hintPulse }],
                  },
                ]}
              >
                <Text style={styles.hintFingerText}>☝️</Text>
              </Animated.View>
            ) : null}

            <View style={styles.startBadge} pointerEvents="none">
              <Text style={styles.startBadgeText}>1 • shu yerdan boshla</Text>
            </View>
          </View>

          <View style={styles.traceActions}>
            <View style={[styles.traceProgress, traceComplete && styles.traceProgressDone]}>
              <Ionicons name={traceComplete ? 'checkmark-circle' : 'finger-print'} size={21} color={traceComplete ? '#16805A' : '#C14E70'} />
              <Text style={[styles.traceProgressText, traceComplete && styles.traceProgressTextDone]}>
                {traceComplete ? 'Ajoyib! Skripka kalitini chizding.' : `Yo‘lning ${traceCoverage}% qismini chizding`}
              </Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Chizishni tozalash" onPress={resetTrace} style={styles.resetTraceButton}>
              <Ionicons name="refresh" size={18} color="#C14E70" />
            </Pressable>
          </View>

          {practiceImage ? (
            <View style={styles.practiceReference}>
              <Text style={styles.practiceReferenceText}>Taqdimotdagi mashq namunasi</Text>
              <Image source={{ uri: practiceImage }} resizeMode="contain" style={styles.practiceImage} />
            </View>
          ) : null}
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
  lessonBadgeText: { color: '#C14E70', fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  starBadge: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  progressDot: { width: 20, height: 7, borderRadius: 999 },
  progressDotCurrent: { width: 34 },
  hero: { minHeight: 410, borderRadius: 32, padding: 26, justifyContent: 'center', backgroundColor: '#C14E70' },
  heroIcon: { width: 88, height: 112, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  heroKicker: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 34, lineHeight: 40, fontWeight: '900', marginTop: 9 },
  heroText: { color: 'rgba(255,255,255,0.9)', fontSize: 17, lineHeight: 25, fontWeight: '700', marginTop: 12 },
  stepLabel: { color: '#C14E70', fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  sectionTitle: { fontSize: 29, lineHeight: 35, fontWeight: '900', marginTop: 7 },
  sectionText: { fontSize: 16, lineHeight: 24, fontWeight: '600', marginTop: 9 },
  infoCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  staffBox: { height: 178, borderRadius: 22, backgroundColor: '#FFF8FA', marginTop: 20, position: 'relative', overflow: 'hidden' },
  staffLine: { position: 'absolute', left: 20, right: 20, height: 1.5, backgroundColor: '#847C8F' },
  clefBubble: { position: 'absolute', left: 18, top: 8, width: 92, height: 162, alignItems: 'center', justifyContent: 'center', borderRadius: 24, backgroundColor: '#FFE7EE' },
  clefBubbleActive: { borderWidth: 2, borderColor: '#C14E70' },
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
  findClefButton: { width: 104, height: 192, borderRadius: 28, backgroundColor: '#FFE7EE', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#F0B4C6' },
  findClefFound: { backgroundColor: '#DFF7EC', borderColor: '#16805A' },
  decoySymbol: { position: 'absolute', color: '#655F75', fontSize: 42, fontWeight: '800' },
  findFeedback: { marginTop: 14, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFE7EE' },
  findFeedbackDone: { backgroundColor: '#DFF7EC' },
  findFeedbackEmoji: { fontSize: 25 },
  findFeedbackText: { flex: 1, color: '#514B5E', fontSize: 12, lineHeight: 18, fontWeight: '800' },
  traceCard: { minHeight: 490, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  traceStage: { height: 290, borderRadius: 26, backgroundColor: '#FFF7FA', marginTop: 18, position: 'relative', overflow: 'hidden', borderWidth: 1.5, borderColor: '#F5C7D4' },
  guideGlow: { position: 'absolute', left: '23%', top: '8%', width: '54%', height: '84%', borderRadius: 80, backgroundColor: '#FFE7EE', opacity: 0.34 },
  guideDot: { position: 'absolute', width: 6, height: 6, borderRadius: 4, backgroundColor: '#C14E70' },
  drawDot: { position: 'absolute', width: 10, height: 10, borderRadius: 6, backgroundColor: '#C14E70', shadowColor: '#C14E70', shadowOpacity: 0.34, shadowRadius: 4, elevation: 2 },
  hintFinger: { position: 'absolute', width: 30, height: 30, alignItems: 'center', justifyContent: 'center', zIndex: 8 },
  hintFingerText: { fontSize: 25 },
  startBadge: { position: 'absolute', left: 12, top: 10, borderRadius: 999, backgroundColor: '#FFFFFFE8', paddingHorizontal: 10, paddingVertical: 6 },
  startBadgeText: { color: '#9E4564', fontSize: 9, fontWeight: '900' },
  traceActions: { marginTop: 13, flexDirection: 'row', alignItems: 'center', gap: 8 },
  traceProgress: { flex: 1, minHeight: 48, borderRadius: 16, backgroundColor: '#FFE7EE', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 12 },
  traceProgressDone: { backgroundColor: '#DFF7EC' },
  traceProgressText: { color: '#8E3D59', fontSize: 11, fontWeight: '900', flexShrink: 1, textAlign: 'center' },
  traceProgressTextDone: { color: '#16805A' },
  resetTraceButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFF0F4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F5C7D4' },
  practiceReference: { marginTop: 12, borderRadius: 18, padding: 8, backgroundColor: '#FFF8FA', alignItems: 'center' },
  practiceReferenceText: { color: '#8E3D59', fontSize: 9, fontWeight: '900' },
  practiceImage: { width: '100%', height: 64, marginTop: 2 },
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
