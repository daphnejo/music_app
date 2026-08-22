import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useStars } from '@/context/StarsContext';
import { useTheme } from '@/context/ThemeContext';
import type { BlockAsset } from '@/types/content';

type LessonSixPageProps = {
  audios: BlockAsset[];
  completed: boolean;
  saving: boolean;
  onBack: () => void;
  onNext?: () => void;
  onComplete: () => void;
  resolveUrl: (url: string) => string;
};

const NOTES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'Lya', 'Si'] as const;
const QUIZ_STEP = 4;
const REWARD_STEP = 5;
const TOTAL_STEPS = 6;
const BLACK_KEY_POSITIONS = ['10.3%', '24.6%', '53.1%', '67.4%', '81.7%'] as const;

const QUIZ_OPTIONS = [
  { id: 'ordered', label: 'Tovushlarning balandlik bo‘yicha tartibi', emoji: '📈', correct: true },
  { id: 'random', label: 'Tovushlarni xohlagancha aralashtirish', emoji: '🔀', correct: false },
  { id: 'silent', label: 'Musiqasiz jim turish', emoji: '🤫', correct: false },
];

const NOTE_COLORS = [
  ['#EEE9FF', '#6C5CE7'],
  ['#E3F4FF', '#2483C5'],
  ['#FFF1BE', '#A66A00'],
  ['#DFF7EC', '#16805A'],
  ['#FFE7EE', '#C14E70'],
  ['#F2E9FF', '#7C52B8'],
  ['#E7F8F5', '#197B68'],
] as const;

function SoundNote({
  label,
  index,
  url,
  active,
  done,
  onPress,
}: {
  label: string;
  index: number;
  url?: string;
  active?: boolean;
  done?: boolean;
  onPress?: (index: number) => void;
}) {
  const player = useAudioPlayer(url ?? null);
  const status = useAudioPlayerStatus(player);
  const palette = NOTE_COLORS[index % NOTE_COLORS.length];
  const playable = !!url;

  const play = () => {
    if (playable) {
      player.seekTo(0);
      player.play();
    }
    onPress?.(index);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} notasini eshitish`}
      onPress={play}
      style={({ pressed }) => [
        styles.noteTile,
        { backgroundColor: done ? '#DFF7EC' : palette[0], borderColor: active || status.playing ? palette[1] : 'transparent' },
        active && styles.noteTileActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.noteBubble, { backgroundColor: done ? '#16805A' : palette[1] }]}>
        <Ionicons name={done ? 'checkmark' : status.playing ? 'volume-high' : 'musical-note'} size={18} color="#FFFFFF" />
      </View>
      <Text style={styles.noteName}>{label}</Text>
      <Text style={styles.noteNumber}>{index + 1}</Text>
    </Pressable>
  );
}

function PianoKey({
  label,
  index,
  url,
  active,
  done,
  onPress,
}: {
  label: string;
  index: number;
  url?: string;
  active: boolean;
  done: boolean;
  onPress: (index: number) => void;
}) {
  const player = useAudioPlayer(url ?? null);
  const status = useAudioPlayerStatus(player);
  const playable = !!url;

  const play = () => {
    if (playable) {
      player.seekTo(0);
      player.play();
    }
    onPress(index);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} pianino klavishi`}
      onPress={play}
      style={({ pressed }) => [
        styles.whiteKey,
        done && styles.whiteKeyDone,
        active && styles.whiteKeyActive,
        status.playing && styles.whiteKeyPlaying,
        pressed && styles.whiteKeyPressed,
      ]}
    >
      {done ? <Ionicons name="checkmark-circle" size={17} color="#16805A" style={styles.keyCheck} /> : null}
      <Text style={[styles.whiteKeyLabel, active && styles.whiteKeyLabelActive]}>{label}</Text>
      <Text style={styles.whiteKeyNumber}>{index + 1}</Text>
    </Pressable>
  );
}

export function LessonSixPage({ audios, completed, saving, onBack, onNext, onComplete, resolveUrl }: LessonSixPageProps) {
  const { colors } = useTheme();
  const { awardLessonStars } = useStars();
  const [step, setStep] = useState(0);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [sequenceMistakes, setSequenceMistakes] = useState(0);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.86)).current;
  const isFinalStep = step === REWARD_STEP;
  const sequenceComplete = sequenceIndex >= NOTES.length;

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
    awardLessonStars(6, stars);
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
    ? `Navbatdagi klavish: ${NOTES[Math.min(sequenceIndex, NOTES.length - 1)]}`
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
            ? 'Darslarga qaytish'
            : completed
              ? 'Barakalla! ⭐'
              : 'Darsni yakunlash';

  return (
    <View style={styles.page}>
      <View style={styles.topbar}>
        <Pressable onPress={goBack} style={[styles.navButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.lessonBadge}><Ionicons name="stats-chart" size={16} color="#7C52B8" /><Text style={styles.lessonBadgeText}>6-DARS</Text></View>
        <View style={styles.starBadge}><Ionicons name="star" size={22} color="#F2B01E" /></View>
      </View>

      <View style={styles.progressDots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View key={index} style={[styles.progressDot, { backgroundColor: index <= step ? '#7C52B8' : colors.border }, index === step && styles.progressDotCurrent]} />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Text style={styles.heroEmoji}>🎶</Text></View>
          <Text style={styles.heroKicker}>PASTDAN YUQORIGA 📈</Text>
          <Text style={styles.heroTitle}>Tovush qator</Text>
          <Text style={styles.heroText}>Musiqiy tovushlar balandligiga qarab tartib bilan joylashadi. Bugun shu qatorni eshitamiz!</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>BILIB OLAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Nota zinapoyasi 🪜</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Tovush qator — tovushlarning pastdan balandga tartib bilan joylashishi.</Text>
          <View style={styles.ladder}>
            {NOTES.map((note, index) => (
              <View key={note} style={[styles.ladderStep, { width: `${54 + index * 7}%`, backgroundColor: NOTE_COLORS[index][0] }]}> 
                <Text style={[styles.ladderNumber, { color: NOTE_COLORS[index][1] }]}>{index + 1}</Text>
                <Text style={styles.ladderText}>{note}</Text>
                <Ionicons name="arrow-up" size={15} color={NOTE_COLORS[index][1]} />
              </View>
            ))}
          </View>
          <View style={styles.tipBox}><Text style={styles.tipEmoji}>💡</Text><Text style={styles.tipText}>Do dan boshlaymiz, keyin tovushlar asta-sekin yuqorilaydi.</Text></View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>TINGLAB KO‘R</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>7 ta notani eshit 🎧</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Har bir notani bos. Tovushlar bir-biridan qanday farq qilishini tingla.</Text>
          <View style={styles.notesGrid}>
            {NOTES.map((note, index) => (
              <SoundNote key={note} label={note} index={index} url={audios[index] ? resolveUrl(audios[index].url) : undefined} />
            ))}
          </View>
          <View style={styles.orderPill}><Text style={styles.orderText}>Do → Re → Mi → Fa → Sol → Lya → Si</Text></View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.pianoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>PIANINO O‘YINI 🎹</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tovush qatorni chal</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Do dan Si gacha oq klavishlarni tartib bilan bos. Har klavish haqiqiy nota ovozini beradi.</Text>

          <View style={styles.sequenceStatus}>
            <View style={[styles.sequenceCircle, sequenceComplete && styles.sequenceCircleDone]}>
              <Text style={styles.sequenceCircleText}>{sequenceComplete ? '✓' : `${Math.min(sequenceIndex, 7)}/7`}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sequenceTitle}>{sequenceComplete ? 'Ajoyib! Tovush qatorni chalding.' : `Navbat: ${NOTES[Math.min(sequenceIndex, NOTES.length - 1)]}`}</Text>
              <Text style={styles.sequenceSub}>{sequenceMistakes > 0 ? `${sequenceMistakes} marta qayta urinib ko‘rding — davom et!` : 'Chapdan o‘ngga chalib bor.'}</Text>
            </View>
          </View>

          <View style={styles.pianoShell}>
            <View style={styles.pianoTop}><View style={styles.pianoLight} /><Text style={styles.pianoBrand}>D-SOLFEDJIO PIANO</Text><View style={styles.pianoLight} /></View>
            <View style={styles.pianoKeys}>
              {NOTES.map((note, index) => (
                <PianoKey
                  key={note}
                  label={note}
                  index={index}
                  url={audios[index] ? resolveUrl(audios[index].url) : undefined}
                  active={!sequenceComplete && index === sequenceIndex}
                  done={index < sequenceIndex || sequenceComplete}
                  onPress={handleSequencePress}
                />
              ))}
              {BLACK_KEY_POSITIONS.map((left, index) => (
                <View key={`${left}-${index}`} pointerEvents="none" style={[styles.blackKey, { left }]} />
              ))}
            </View>
          </View>

          <View style={styles.pianoHint}>
            <Ionicons name="finger-print" size={20} color="#7C52B8" />
            <Text style={styles.pianoHintText}>{sequenceComplete ? 'Zo‘r! Endi tovush qatorni pianinoda ham bilasan.' : `Hozir ${NOTES[Math.min(sequenceIndex, NOTES.length - 1)]} klavishini bos.`}</Text>
          </View>

          <Pressable onPress={() => { setSequenceIndex(0); setSequenceMistakes(0); }} style={styles.resetButton}>
            <Ionicons name="refresh" size={18} color="#7C52B8" />
            <Text style={styles.resetText}>Qaytadan chalish</Text>
          </Pressable>
        </View>
      ) : null}

      {step === QUIZ_STEP ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.quizIcon}><Text style={styles.quizEmoji}>🎼</Text></View>
          <Text style={styles.stepLabel}>MINI SAVOL</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>Tovush qator nimani bildiradi?</Text>
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
                    { borderColor: selected ? '#7C52B8' : colors.border, backgroundColor: selected ? '#F2E9FF' : colors.surface },
                    showCorrect && { borderColor: colors.success, backgroundColor: colors.successSurface },
                    showWrong && { borderColor: '#E2A93B', backgroundColor: '#FFF3D5' },
                  ]}
                >
                  <Text style={styles.quizOptionEmoji}>{option.emoji}</Text>
                  <Text style={[styles.quizOptionText, { color: colors.text }]}>{option.label}</Text>
                  {selected && !quizChecked ? <Ionicons name="radio-button-on" size={22} color="#7C52B8" /> : null}
                  {showCorrect ? <Ionicons name="checkmark-circle" size={24} color={colors.success} /> : null}
                  {showWrong ? <Ionicons name="close-circle" size={24} color="#D59A25" /> : null}
                </Pressable>
              );
            })}
          </View>
          {quizChecked ? (
            <View style={[styles.feedback, { backgroundColor: answerCorrect ? colors.successSurface : '#FFF3D5' }]}> 
              <Text style={styles.feedbackEmoji}>{answerCorrect ? '🎉' : '💡'}</Text>
              <View style={{ flex: 1 }}><Text style={[styles.feedbackTitle, { color: colors.text }]}>{answerCorrect ? 'To‘g‘ri!' : 'Yaxshi urinish!'}</Text><Text style={[styles.feedbackText, { color: colors.muted }]}>{answerCorrect ? 'Ha! Tovushlar balandlik bo‘yicha tartiblanadi.' : 'Tovush qator — tovushlarning balandlik bo‘yicha tartibi.'}</Text></View>
            </View>
          ) : null}
        </View>
      ) : null}

      {step === REWARD_STEP ? (
        <View style={styles.rewardCard}>
          <Animated.View style={{ alignItems: 'center', transform: [{ scale: rewardScale }] }}>
            <Text style={styles.rewardEmoji}>{rewardStars === 3 ? '🎉' : '🌟'}</Text>
            <Text style={[styles.rewardTitle, { color: colors.text }]}>{rewardStars === 3 ? 'Ajoyib!' : 'Barakalla!'}</Text>
            <Text style={[styles.rewardText, { color: colors.muted }]}>Do dan Si gacha tovush qatorni tuza va pianinoda chala olding!</Text>
            <View style={styles.starsRow}>{[0, 1, 2].map((star) => <Ionicons key={star} name={star < rewardStars ? 'star' : 'star-outline'} size={40} color={star < rewardStars ? '#F2B01E' : '#B9B2C7'} />)}</View>
            <View style={styles.rewardPill}><Ionicons name="trophy" size={20} color="#A66A00" /><Text style={styles.rewardPillText}>+{rewardStars} yulduz</Text></View>
          </Animated.View>
        </View>
      ) : null}

      <Pressable disabled={buttonDisabled} onPress={goForward} style={({ pressed }) => [styles.completeButton, { backgroundColor: isFinalStep ? colors.success : '#7C52B8' }, buttonDisabled && styles.disabled, pressed && !buttonDisabled && styles.pressed]}>
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
  lessonBadge: { minHeight: 38, paddingHorizontal: 14, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F2E9FF' },
  lessonBadgeText: { color: '#7C52B8', fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  starBadge: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 5 },
  progressDot: { width: 20, height: 7, borderRadius: 999 },
  progressDotCurrent: { width: 34 },
  hero: { minHeight: 410, borderRadius: 32, padding: 26, justifyContent: 'center', backgroundColor: '#7C52B8' },
  heroIcon: { width: 88, height: 88, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  heroEmoji: { fontSize: 48 },
  heroKicker: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 36, lineHeight: 42, fontWeight: '900', marginTop: 9 },
  heroText: { color: 'rgba(255,255,255,0.92)', fontSize: 17, lineHeight: 25, fontWeight: '700', marginTop: 12 },
  card: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  pianoCard: { minHeight: 500, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  stepLabel: { color: '#7C52B8', fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  sectionTitle: { fontSize: 29, lineHeight: 35, fontWeight: '900', marginTop: 7 },
  sectionText: { fontSize: 16, lineHeight: 24, fontWeight: '600', marginTop: 9 },
  ladder: { marginTop: 17, gap: 6 },
  ladderStep: { minHeight: 34, borderRadius: 13, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  ladderNumber: { width: 18, fontSize: 11, fontWeight: '900' },
  ladderText: { flex: 1, color: '#302B3D', fontSize: 13, fontWeight: '900' },
  tipBox: { marginTop: 14, borderRadius: 18, padding: 12, backgroundColor: '#FFF1BE', flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipEmoji: { fontSize: 24 },
  tipText: { flex: 1, color: '#6D5315', fontSize: 11, lineHeight: 17, fontWeight: '700' },
  notesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 18 },
  noteTile: { width: '30.5%', minHeight: 86, borderRadius: 20, borderWidth: 2, padding: 10, alignItems: 'center', justifyContent: 'center', gap: 5 },
  noteTileActive: { transform: [{ scale: 1.035 }] },
  noteBubble: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  noteName: { color: '#302B3D', fontSize: 14, fontWeight: '900' },
  noteNumber: { color: '#8B8496', fontSize: 9, fontWeight: '800' },
  orderPill: { marginTop: 16, borderRadius: 17, paddingVertical: 12, paddingHorizontal: 8, backgroundColor: '#F2E9FF', alignItems: 'center' },
  orderText: { color: '#65429A', fontSize: 11, fontWeight: '900' },
  sequenceStatus: { marginTop: 17, borderRadius: 19, padding: 12, backgroundColor: '#F2E9FF', flexDirection: 'row', alignItems: 'center', gap: 10 },
  sequenceCircle: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#7C52B8', alignItems: 'center', justifyContent: 'center' },
  sequenceCircleDone: { backgroundColor: '#16805A' },
  sequenceCircleText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  sequenceTitle: { color: '#302B3D', fontSize: 13, fontWeight: '900' },
  sequenceSub: { color: '#716A80', fontSize: 10, fontWeight: '700', marginTop: 2 },
  pianoShell: { marginTop: 16, borderRadius: 22, backgroundColor: '#282431', padding: 9, paddingTop: 0, overflow: 'hidden', borderWidth: 2, borderColor: '#4B4459' },
  pianoTop: { height: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  pianoBrand: { color: '#D9D3E5', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  pianoLight: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#A781E8' },
  pianoKeys: { height: 190, borderRadius: 14, overflow: 'hidden', flexDirection: 'row', position: 'relative', backgroundColor: '#FFFFFF' },
  whiteKey: { flex: 1, backgroundColor: '#FFFFFF', borderLeftWidth: 1, borderLeftColor: '#C8C3CF', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 12, position: 'relative' },
  whiteKeyDone: { backgroundColor: '#EAF9F2' },
  whiteKeyActive: { backgroundColor: '#F2E9FF', borderWidth: 2, borderColor: '#7C52B8', zIndex: 3 },
  whiteKeyPlaying: { backgroundColor: '#E9DFFF' },
  whiteKeyPressed: { backgroundColor: '#DED0FA' },
  whiteKeyLabel: { color: '#302B3D', fontSize: 10, fontWeight: '900' },
  whiteKeyLabelActive: { color: '#6A43A0' },
  whiteKeyNumber: { color: '#9A94A5', fontSize: 8, fontWeight: '800', marginTop: 2 },
  keyCheck: { position: 'absolute', bottom: 36 },
  blackKey: { position: 'absolute', top: 0, width: '8%', height: 110, backgroundColor: '#302B3D', borderBottomLeftRadius: 7, borderBottomRightRadius: 7, zIndex: 6, borderWidth: 1, borderColor: '#16131C' },
  pianoHint: { marginTop: 12, minHeight: 50, borderRadius: 17, backgroundColor: '#F2E9FF', flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 12 },
  pianoHintText: { flex: 1, color: '#604487', fontSize: 11, lineHeight: 17, fontWeight: '800' },
  resetButton: { marginTop: 10, minHeight: 44, borderRadius: 15, backgroundColor: '#F2E9FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  resetText: { color: '#7C52B8', fontSize: 11, fontWeight: '900' },
  quizIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: '#F2E9FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  quizEmoji: { fontSize: 36 },
  quizTitle: { fontSize: 27, lineHeight: 34, fontWeight: '900', marginTop: 7, marginBottom: 18 },
  quizOptions: { gap: 9 },
  quizOption: { minHeight: 68, borderRadius: 20, borderWidth: 1.5, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  quizOptionEmoji: { fontSize: 27 },
  quizOptionText: { flex: 1, fontSize: 14, lineHeight: 19, fontWeight: '900' },
  feedback: { marginTop: 13, borderRadius: 19, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackEmoji: { fontSize: 27 },
  feedbackTitle: { fontSize: 15, fontWeight: '900' },
  feedbackText: { fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 2 },
  rewardCard: { minHeight: 410, borderRadius: 32, padding: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2E9FF' },
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
