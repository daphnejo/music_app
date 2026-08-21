import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useStars } from '@/context/StarsContext';
import { useTheme } from '@/context/ThemeContext';
import type { BlockAsset } from '@/types/content';

type Props = {
  audios: BlockAsset[];
  completed: boolean;
  saving: boolean;
  onBack: () => void;
  onNext?: () => void;
  onComplete: () => void;
  resolveUrl: (url: string) => string;
};

const DURATIONS = [
  { id: 'whole', name: 'Butun nota', symbol: '𝅝', width: '100%', color: '#6C5CE7', soft: '#EEE9FF' },
  { id: 'half', name: 'Yarim nota', symbol: '𝅗𝅥', width: '79%', color: '#2483C5', soft: '#E3F4FF' },
  { id: 'quarter', name: 'Chorak nota', symbol: '♩', width: '59%', color: '#A66A00', soft: '#FFF1BE' },
  { id: 'eighth', name: 'Nimchorak nota', symbol: '♪', width: '42%', color: '#16805A', soft: '#DFF7EC' },
  { id: 'sixteenth', name: 'O‘n oltitalik nota', symbol: '♫', width: '27%', color: '#C14E70', soft: '#FFE7EE' },
] as const;

const QUIZ_OPTIONS = [
  { id: 'whole', label: 'Butun nota', symbol: '𝅝', correct: true },
  { id: 'quarter', label: 'Chorak nota', symbol: '♩', correct: false },
  { id: 'sixteenth', label: 'O‘n oltitalik nota', symbol: '♫', correct: false },
];

const QUIZ_STEP = 4;
const REWARD_STEP = 5;
const TOTAL_STEPS = 6;

function DurationSound({ index, url, active, done, onPress }: { index: number; url?: string; active?: boolean; done?: boolean; onPress?: (index: number) => void }) {
  const item = DURATIONS[index];
  const player = useAudioPlayer(url ?? null);
  const status = useAudioPlayerStatus(player);

  const play = () => {
    if (url) {
      player.seekTo(0);
      player.play();
    }
    onPress?.(index);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.name}ni eshitish`}
      onPress={play}
      style={({ pressed }) => [
        styles.soundCard,
        { backgroundColor: done ? '#DFF7EC' : item.soft, borderColor: active || status.playing ? item.color : 'transparent' },
        active && styles.soundCardActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.symbolBubble, { backgroundColor: done ? '#16805A' : item.color }]}>
        <Text style={styles.symbolText}>{done ? '✓' : item.symbol}</Text>
      </View>
      <View style={styles.soundMain}>
        <Text style={styles.soundName}>{item.name}</Text>
        <View style={styles.lengthTrack}>
          <View style={[styles.lengthFill, { width: item.width, backgroundColor: done ? '#16805A' : item.color }]} />
        </View>
      </View>
      <Ionicons name={status.playing ? 'volume-high' : 'play-circle'} size={25} color={done ? '#16805A' : item.color} />
    </Pressable>
  );
}

export function LessonEightPage({ audios, completed, saving, onBack, onNext, onComplete, resolveUrl }: Props) {
  const { colors } = useTheme();
  const { awardLessonStars } = useStars();
  const [step, setStep] = useState(0);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [sequenceMistakes, setSequenceMistakes] = useState(0);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.86)).current;
  const sequenceComplete = sequenceIndex >= DURATIONS.length;
  const isFinalStep = step === REWARD_STEP;

  useEffect(() => {
    if (step !== REWARD_STEP) return;
    rewardScale.setValue(0.86);
    Animated.spring(rewardScale, { toValue: 1, friction: 5, tension: 82, useNativeDriver: true }).start();
  }, [rewardScale, step]);

  function goBack() {
    if (step > 0) {
      setStep((value) => value - 1);
      return;
    }
    onBack();
  }

  function handleSequencePress(index: number) {
    if (sequenceComplete) return;
    if (index === sequenceIndex) {
      setSequenceIndex((value) => value + 1);
      return;
    }
    setSequenceMistakes((value) => value + 1);
    setSequenceIndex(index === 0 ? 1 : 0);
  }

  function checkQuiz() {
    if (!selectedQuizId || quizChecked) return;
    const selected = QUIZ_OPTIONS.find((option) => option.id === selectedQuizId);
    const stars: 2 | 3 = selected?.correct ? 3 : 2;
    setRewardStars(stars);
    awardLessonStars(8, stars);
    setQuizChecked(true);
  }

  function goForward() {
    if (step === 3 && !sequenceComplete) return;
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
  const buttonDisabled = saving
    || (step === 3 && !sequenceComplete)
    || (step === QUIZ_STEP && !selectedQuizId)
    || (isFinalStep && completed && !onNext);

  const buttonLabel = step === 3 && !sequenceComplete
    ? `Navbat: ${DURATIONS[Math.min(sequenceIndex, DURATIONS.length - 1)].name}`
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
        <View style={styles.lessonBadge}><Ionicons name="timer-outline" size={16} color="#C14E70" /><Text style={styles.lessonBadgeText}>8-DARS</Text></View>
        <View style={styles.starBadge}><Ionicons name="star" size={22} color="#F2B01E" /></View>
      </View>

      <View style={styles.progressDots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View key={index} style={[styles.progressDot, { backgroundColor: index <= step ? '#C14E70' : colors.border }, index === step && styles.progressDotCurrent]} />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Text style={styles.heroEmoji}>⏱️</Text></View>
          <Text style={styles.heroKicker}>UZUN VA QISQA TOVUSHLAR 🎵</Text>
          <Text style={styles.heroTitle}>Notalar cho‘zimlari</Text>
          <Text style={styles.heroText}>Ba’zi notalar uzoqroq, ba’zilari esa qisqaroq yangraydi. Ularni birga ajratamiz!</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>BILIB OLAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Cho‘zimlar oilasi</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Taqdimotimizda 5 xil nota cho‘zimi bor. Ularning ko‘rinishi va davomiyligi bir-biridan farq qiladi.</Text>
          <View style={styles.durationList}>
            {DURATIONS.map((item, index) => (
              <View key={item.id} style={styles.durationRow}>
                <View style={[styles.smallSymbol, { backgroundColor: item.soft }]}><Text style={[styles.smallSymbolText, { color: item.color }]}>{item.symbol}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.durationName, { color: colors.text }]}>{item.name}</Text>
                  <View style={styles.lengthTrack}><View style={[styles.lengthFill, { width: item.width, backgroundColor: item.color }]} /></View>
                </View>
                <Text style={styles.orderNumber}>{index + 1}</Text>
              </View>
            ))}
          </View>
          <View style={styles.tipBox}><Text style={styles.tipEmoji}>👀</Text><Text style={styles.tipText}>Yuqoridan pastga qarab cho‘zimlar qisqarib borayotganini ko‘r.</Text></View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>TINGLAB KO‘R</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>5 ta cho‘zimni eshit 🎧</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Har bir kartani bosib, taqdimotdagi real tovush namunasini tingla.</Text>
          <View style={styles.soundList}>
            {DURATIONS.map((item, index) => (
              <DurationSound key={item.id} index={index} url={audios[index] ? resolveUrl(audios[index].url) : undefined} />
            ))}
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>MINI O‘YIN</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Uzunidan qisqaga 🎯</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Butun notadan boshlang. Keyin cho‘zimlarni ketma-ket qisqartirib boring.</Text>
          <View style={styles.sequenceStatus}>
            <View style={[styles.sequenceCircle, sequenceComplete && styles.sequenceDone]}><Text style={styles.sequenceCircleText}>{sequenceComplete ? '✓' : `${sequenceIndex}/5`}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.sequenceTitle}>{sequenceComplete ? 'Ajoyib! Tartib tayyor.' : `Navbat: ${DURATIONS[Math.min(sequenceIndex, 4)].name}`}</Text><Text style={styles.sequenceSub}>{sequenceMistakes ? `${sequenceMistakes} marta qayta urinib ko‘rding — davom et!` : 'Har bosganda tovushini ham eshitasan.'}</Text></View>
          </View>
          <View style={styles.soundList}>
            {DURATIONS.map((item, index) => (
              <DurationSound
                key={item.id}
                index={index}
                url={audios[index] ? resolveUrl(audios[index].url) : undefined}
                active={!sequenceComplete && index === sequenceIndex}
                done={index < sequenceIndex || sequenceComplete}
                onPress={handleSequencePress}
              />
            ))}
          </View>
          <Pressable onPress={() => { setSequenceIndex(0); setSequenceMistakes(0); }} style={styles.resetButton}><Ionicons name="refresh" size={18} color="#C14E70" /><Text style={styles.resetText}>Qaytadan boshlash</Text></Pressable>
        </View>
      ) : null}

      {step === QUIZ_STEP ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.quizIcon}><Text style={styles.quizEmoji}>🎼</Text></View>
          <Text style={styles.stepLabel}>MINI SAVOL</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>Qaysi nota cho‘zimi eng uzunroq yangraydi?</Text>
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
                  <Text style={styles.quizOptionSymbol}>{option.symbol}</Text>
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
              <View style={{ flex: 1 }}><Text style={[styles.feedbackTitle, { color: colors.text }]}>{answerCorrect ? 'To‘g‘ri!' : 'Yaxshi urinish!'}</Text><Text style={[styles.feedbackText, { color: colors.muted }]}>{answerCorrect ? 'Ha, butun nota cho‘zimlar ichida eng uzunroq.' : 'To‘g‘ri javob — Butun nota.'}</Text></View>
            </View>
          ) : null}
        </View>
      ) : null}

      {step === REWARD_STEP ? (
        <View style={styles.rewardCard}>
          <Animated.View style={{ alignItems: 'center', transform: [{ scale: rewardScale }] }}>
            <Text style={styles.rewardEmoji}>{rewardStars === 3 ? '🎉' : '🌟'}</Text>
            <Text style={[styles.rewardTitle, { color: colors.text }]}>{rewardStars === 3 ? 'Ajoyib!' : 'Barakalla!'}</Text>
            <Text style={[styles.rewardText, { color: colors.muted }]}>Nota cho‘zimlarini ko‘rib, eshitib va tartiblab olding!</Text>
            <View style={styles.starsRow}>{[0, 1, 2].map((star) => <Ionicons key={star} name={star < rewardStars ? 'star' : 'star-outline'} size={40} color={star < rewardStars ? '#F2B01E' : '#B9B2C7'} />)}</View>
            <View style={styles.rewardPill}><Ionicons name="trophy" size={20} color="#A66A00" /><Text style={styles.rewardPillText}>+{rewardStars} yulduz</Text></View>
          </Animated.View>
        </View>
      ) : null}

      <Pressable disabled={buttonDisabled} onPress={goForward} style={({ pressed }) => [styles.completeButton, { backgroundColor: isFinalStep ? colors.success : '#C14E70' }, buttonDisabled && styles.disabled, pressed && !buttonDisabled && styles.pressed]}>
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
  heroIcon: { width: 88, height: 88, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  heroEmoji: { fontSize: 48 },
  heroKicker: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 34, lineHeight: 40, fontWeight: '900', marginTop: 9 },
  heroText: { color: 'rgba(255,255,255,0.92)', fontSize: 17, lineHeight: 25, fontWeight: '700', marginTop: 12 },
  card: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  stepLabel: { color: '#C14E70', fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  sectionTitle: { fontSize: 29, lineHeight: 35, fontWeight: '900', marginTop: 7 },
  sectionText: { fontSize: 15, lineHeight: 23, fontWeight: '600', marginTop: 8 },
  durationList: { gap: 8, marginTop: 18 },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  smallSymbol: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  smallSymbolText: { fontSize: 27, fontWeight: '900' },
  durationName: { fontSize: 12, fontWeight: '900', marginBottom: 6 },
  orderNumber: { color: '#A39CAD', fontSize: 11, fontWeight: '900' },
  lengthTrack: { height: 7, borderRadius: 999, backgroundColor: '#ECE8F1', overflow: 'hidden' },
  lengthFill: { height: '100%', borderRadius: 999 },
  tipBox: { marginTop: 16, borderRadius: 18, padding: 12, backgroundColor: '#FFF1BE', flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipEmoji: { fontSize: 23 },
  tipText: { flex: 1, color: '#6D5315', fontSize: 11, lineHeight: 17, fontWeight: '700' },
  soundList: { gap: 8, marginTop: 17 },
  soundCard: { minHeight: 67, borderRadius: 20, borderWidth: 2, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  soundCardActive: { transform: [{ scale: 1.015 }] },
  symbolBubble: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  symbolText: { color: '#FFFFFF', fontSize: 25, fontWeight: '900' },
  soundMain: { flex: 1, gap: 7 },
  soundName: { color: '#302B3D', fontSize: 13, fontWeight: '900' },
  sequenceStatus: { marginTop: 17, borderRadius: 19, padding: 12, backgroundColor: '#FFE7EE', flexDirection: 'row', alignItems: 'center', gap: 10 },
  sequenceCircle: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#C14E70', alignItems: 'center', justifyContent: 'center' },
  sequenceDone: { backgroundColor: '#16805A' },
  sequenceCircleText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  sequenceTitle: { color: '#302B3D', fontSize: 13, fontWeight: '900' },
  sequenceSub: { color: '#716A80', fontSize: 10, lineHeight: 15, fontWeight: '700', marginTop: 2 },
  resetButton: { marginTop: 12, minHeight: 43, borderRadius: 15, backgroundColor: '#FFE7EE', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  resetText: { color: '#C14E70', fontSize: 11, fontWeight: '900' },
  quizIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: '#FFE7EE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  quizEmoji: { fontSize: 36 },
  quizTitle: { fontSize: 27, lineHeight: 34, fontWeight: '900', marginTop: 7, marginBottom: 18 },
  quizOptions: { gap: 9 },
  quizOption: { minHeight: 68, borderRadius: 20, borderWidth: 1.5, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  quizOptionSymbol: { width: 40, textAlign: 'center', fontSize: 28, fontWeight: '900', color: '#C14E70' },
  quizOptionText: { flex: 1, fontSize: 15, fontWeight: '900' },
  feedback: { marginTop: 13, borderRadius: 19, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackEmoji: { fontSize: 27 },
  feedbackTitle: { fontSize: 15, fontWeight: '900' },
  feedbackText: { fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 2 },
  rewardCard: { minHeight: 410, borderRadius: 32, padding: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFE7EE' },
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
