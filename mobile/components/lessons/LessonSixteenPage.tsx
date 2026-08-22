import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { AudioPlayer } from '@/components/media/AudioPlayer';
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

const QUIZ_STEP = 4;
const REWARD_STEP = 5;
const TOTAL_STEPS = 6;

const MOOD_ROUNDS = [
  {
    id: 'bright',
    prompt: 'Yorqin va quvnoq kayfiyat',
    emoji: '☀️',
    answer: 'major',
  },
  {
    id: 'calm',
    prompt: 'Bosiq va g‘amginroq kayfiyat',
    emoji: '🌙',
    answer: 'minor',
  },
] as const;

const QUIZ_OPTIONS = [
  { id: 'major', label: 'Major', emoji: '☀️', correct: true },
  { id: 'minor', label: 'Minor', emoji: '🌙', correct: false },
  { id: 'oktava', label: 'Oktava', emoji: '🎹', correct: false },
] as const;

export function LessonSixteenPage({
  audios,
  completed,
  saving,
  onBack,
  onNext,
  onComplete,
  resolveUrl,
}: Props) {
  const { colors } = useTheme();
  const { awardLessonStars } = useStars();
  const [step, setStep] = useState(0);
  const [moodRound, setMoodRound] = useState(0);
  const [moodMistakes, setMoodMistakes] = useState(0);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.86)).current;

  const moodComplete = moodRound >= MOOD_ROUNDS.length;
  const currentMood = MOOD_ROUNDS[Math.min(moodRound, MOOD_ROUNDS.length - 1)];
  const isFinalStep = step === REWARD_STEP;

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

  function goBack() {
    if (step > 0) {
      setStep((value) => value - 1);
      return;
    }
    onBack();
  }

  function chooseMood(answer: 'major' | 'minor') {
    if (moodComplete) return;
    if (answer === currentMood.answer) {
      setMoodRound((value) => value + 1);
      return;
    }
    setMoodMistakes((value) => value + 1);
  }

  function checkQuiz() {
    if (!selectedQuizId || quizChecked) return;
    const selected = QUIZ_OPTIONS.find((option) => option.id === selectedQuizId);
    const stars: 2 | 3 = selected?.correct ? 3 : 2;
    setRewardStars(stars);
    awardLessonStars(16, stars);
    setQuizChecked(true);
  }

  function goForward() {
    if (step === 3 && !moodComplete) return;
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
    || (step === 3 && !moodComplete)
    || (step === QUIZ_STEP && !selectedQuizId)
    || (isFinalStep && completed && !onNext);

  const buttonLabel = step === 3 && !moodComplete
    ? `Top: ${currentMood.prompt}`
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
          <Ionicons name="happy-outline" size={16} color="#7A58B5" />
          <Text style={styles.lessonBadgeText}>16-DARS</Text>
        </View>
        <View style={styles.starBadge}><Ionicons name="star" size={22} color="#F2B01E" /></View>
      </View>

      <View style={styles.progressDots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              { backgroundColor: index <= step ? '#7A58B5' : colors.border },
              index === step && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.hero}>
          <View style={styles.heroFaces}>
            <View style={[styles.faceBubble, styles.faceMajor]}><Text style={styles.faceEmoji}>☀️</Text></View>
            <View style={[styles.faceBubble, styles.faceMinor]}><Text style={styles.faceEmoji}>🌙</Text></View>
          </View>
          <Text style={styles.heroKicker}>MUSIQANING KAYFIYATI 🎵</Text>
          <Text style={styles.heroTitle}>Major va minor</Text>
          <Text style={styles.heroText}>Ba’zi kuylar yorqin va quvnoq, ba’zilari esa bosiq va g‘amginroq eshitiladi.</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.stepLabel}>BILIB OLAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ikki xil lad</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Major va minor — musiqiy asar kayfiyatini ifodalovchi ikkita asosiy lad.</Text>

          <View style={styles.modeCards}>
            <View style={[styles.modeCard, styles.majorCard]}>
              <Text style={styles.modeEmoji}>☀️</Text>
              <Text style={styles.modeTitle}>MAJOR</Text>
              <Text style={styles.modeText}>Asosan yorqin va quvnoq yangraydi.</Text>
            </View>
            <View style={[styles.modeCard, styles.minorCard]}>
              <Text style={styles.modeEmoji}>🌙</Text>
              <Text style={styles.modeTitle}>MINOR</Text>
              <Text style={styles.modeText}>Bosiq, g‘amginroq yangrashi mumkin.</Text>
            </View>
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipText}>Lad — kuy qanday kayfiyatda eshitilishini sezishga yordam beradi.</Text>
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.stepLabel}>TINGLAB KO‘R</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>4 ta musiqiy namuna 🎧</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Har bir namunani tingla. Kayfiyati bir xil emasligini sezishga harakat qil.</Text>
          <View style={styles.audioList}>
            {audios.slice(0, 4).map((audio, index) => (
              <AudioPlayer
                key={audio.id}
                url={resolveUrl(audio.url)}
                title={`${index + 1}-namuna`}
              />
            ))}
          </View>
          {!audios.length ? <Text style={[styles.emptyText, { color: colors.muted }]}>Audio namunalar topilmadi.</Text> : null}
          <View style={styles.tipBox}>
            <Text style={styles.tipEmoji}>👂</Text>
            <Text style={styles.tipText}>Bu manbada audiolarga “major/minor” yorlig‘i berilmagan, shuning uchun faqat tinglab farqini sezamiz.</Text>
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.stepLabel}>MINI O‘YIN</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Kayfiyatni lad bilan bog‘la 🎯</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Berilgan kayfiyat qaysi ladga mos kelishini top.</Text>

          <View style={styles.moodPrompt}>
            <Text style={styles.moodPromptEmoji}>{moodComplete ? '🎉' : currentMood.emoji}</Text>
            <Text style={styles.moodPromptTitle}>{moodComplete ? 'Ajoyib! Ikkalasini ham topding.' : currentMood.prompt}</Text>
            <Text style={styles.moodPromptSub}>{moodComplete ? 'Major va minor farqini eslab qolding.' : `${moodRound + 1} / ${MOOD_ROUNDS.length}`}</Text>
          </View>

          <View style={styles.choiceRow}>
            <Pressable
              disabled={moodComplete}
              onPress={() => chooseMood('major')}
              style={({ pressed }) => [styles.choiceButton, styles.majorChoice, pressed && styles.pressed]}
            >
              <Text style={styles.choiceEmoji}>☀️</Text>
              <Text style={styles.choiceTitle}>Major</Text>
              <Text style={styles.choiceSub}>Yorqin</Text>
            </Pressable>
            <Pressable
              disabled={moodComplete}
              onPress={() => chooseMood('minor')}
              style={({ pressed }) => [styles.choiceButton, styles.minorChoice, pressed && styles.pressed]}
            >
              <Text style={styles.choiceEmoji}>🌙</Text>
              <Text style={styles.choiceTitle}>Minor</Text>
              <Text style={styles.choiceSub}>Bosiq</Text>
            </Pressable>
          </View>

          {moodMistakes ? <Text style={styles.mistakeText}>{moodMistakes} marta qayta urinib ko‘rding — davom et! 💪</Text> : null}
          <Pressable onPress={() => { setMoodRound(0); setMoodMistakes(0); }} style={styles.resetButton}>
            <Ionicons name="refresh" size={18} color="#7A58B5" />
            <Text style={styles.resetText}>Qaytadan boshlash</Text>
          </Pressable>
        </View>
      ) : null}

      {step === QUIZ_STEP ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.quizIcon}><Text style={styles.quizEmoji}>🧠</Text></View>
          <Text style={styles.stepLabel}>MINI SAVOL</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>Qaysi lad asosan yorqin va quvnoq yangraydi?</Text>
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
                    { borderColor: selected ? '#7A58B5' : colors.border, backgroundColor: selected ? '#F2ECFF' : colors.surface },
                    showCorrect && { borderColor: colors.success, backgroundColor: colors.successSurface },
                    showWrong && { borderColor: '#E2A93B', backgroundColor: '#FFF3D5' },
                  ]}
                >
                  <Text style={styles.quizOptionEmoji}>{option.emoji}</Text>
                  <Text style={[styles.quizOptionText, { color: colors.text }]}>{option.label}</Text>
                  {selected && !quizChecked ? <Ionicons name="radio-button-on" size={22} color="#7A58B5" /> : null}
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
                <Text style={[styles.feedbackText, { color: colors.muted }]}>{answerCorrect ? 'Ha, major asosan yorqin va quvnoq yangraydi.' : 'To‘g‘ri javob — Major.'}</Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {step === REWARD_STEP ? (
        <Animated.View style={[styles.rewardCard, { transform: [{ scale: rewardScale }] }]}>
          <Text style={styles.rewardEmoji}>{rewardStars === 3 ? '🏆' : '🌟'}</Text>
          <Text style={styles.rewardKicker}>16-DARS TUGADI!</Text>
          <Text style={styles.rewardTitle}>{rewardStars === 3 ? 'Major va minorni ajrata olding!' : 'Major va minorni o‘rganding!'}</Text>
          <View style={styles.rewardStars}>
            {[0, 1, 2].map((index) => <Ionicons key={index} name="star" size={38} color={index < rewardStars ? '#F2B01E' : '#E7E1EF'} />)}
          </View>
          <Text style={styles.rewardText}>Major — yorqinroq, minor — bosiqroq kayfiyat berishi mumkin.</Text>
        </Animated.View>
      ) : null}

      <Pressable
        disabled={buttonDisabled}
        onPress={goForward}
        style={({ pressed }) => [styles.nextButton, buttonDisabled && styles.nextButtonDisabled, pressed && !buttonDisabled && styles.pressed]}
      >
        <Text style={styles.nextButtonText}>{buttonLabel}</Text>
        {!buttonDisabled ? <Ionicons name={isFinalStep && completed ? 'arrow-forward' : 'chevron-forward'} size={21} color="#fff" /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 18, gap: 14 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  lessonBadge: { minHeight: 34, paddingHorizontal: 13, borderRadius: 999, backgroundColor: '#F2ECFF', flexDirection: 'row', alignItems: 'center', gap: 6 },
  lessonBadgeText: { color: '#7A58B5', fontSize: 12, fontWeight: '900', letterSpacing: 0.4 },
  starBadge: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFF5D3', alignItems: 'center', justifyContent: 'center' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 7 },
  progressDot: { width: 9, height: 9, borderRadius: 999 },
  progressDotCurrent: { width: 24 },
  hero: { flex: 1, minHeight: 420, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  heroFaces: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  faceBubble: { width: 86, height: 86, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  faceMajor: { backgroundColor: '#FFF0B8', transform: [{ rotate: '-5deg' }] },
  faceMinor: { backgroundColor: '#E7E7FF', transform: [{ rotate: '5deg' }] },
  faceEmoji: { fontSize: 44 },
  heroKicker: { color: '#7A58B5', fontSize: 12, fontWeight: '900', letterSpacing: 0.6, textAlign: 'center' },
  heroTitle: { marginTop: 8, color: '#292435', fontSize: 32, lineHeight: 38, fontWeight: '900', textAlign: 'center' },
  heroText: { marginTop: 12, maxWidth: 320, color: '#716A7E', fontSize: 15, lineHeight: 23, fontWeight: '600', textAlign: 'center' },
  card: { flex: 1, borderWidth: 1, borderRadius: 26, padding: 18 },
  stepLabel: { color: '#7A58B5', fontSize: 11, fontWeight: '900', letterSpacing: 0.7 },
  sectionTitle: { marginTop: 6, fontSize: 24, lineHeight: 30, fontWeight: '900' },
  sectionText: { marginTop: 7, fontSize: 14, lineHeight: 21, fontWeight: '600' },
  modeCards: { flexDirection: 'row', gap: 10, marginTop: 20 },
  modeCard: { flex: 1, minHeight: 205, borderRadius: 24, padding: 15, alignItems: 'center', justifyContent: 'center' },
  majorCard: { backgroundColor: '#FFF2BF' },
  minorCard: { backgroundColor: '#EAE8FF' },
  modeEmoji: { fontSize: 43 },
  modeTitle: { marginTop: 10, color: '#332E3E', fontSize: 18, fontWeight: '900' },
  modeText: { marginTop: 7, color: '#665F70', fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
  tipBox: { marginTop: 16, borderRadius: 18, padding: 13, backgroundColor: '#F6F1FF', flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipEmoji: { fontSize: 21 },
  tipText: { flex: 1, color: '#655C73', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  audioList: { marginTop: 15, gap: 10 },
  emptyText: { marginTop: 18, textAlign: 'center', fontWeight: '700' },
  moodPrompt: { marginTop: 20, minHeight: 168, borderRadius: 25, backgroundColor: '#F7F3FF', alignItems: 'center', justifyContent: 'center', padding: 18 },
  moodPromptEmoji: { fontSize: 46 },
  moodPromptTitle: { marginTop: 9, color: '#302A3B', fontSize: 20, lineHeight: 25, fontWeight: '900', textAlign: 'center' },
  moodPromptSub: { marginTop: 5, color: '#7A7187', fontSize: 12, fontWeight: '800' },
  choiceRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  choiceButton: { flex: 1, minHeight: 148, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  majorChoice: { backgroundColor: '#FFF3C9', borderColor: '#E0B64F' },
  minorChoice: { backgroundColor: '#ECEAFF', borderColor: '#8B7DD4' },
  choiceEmoji: { fontSize: 38 },
  choiceTitle: { marginTop: 7, color: '#302A3B', fontSize: 18, fontWeight: '900' },
  choiceSub: { marginTop: 3, color: '#6D6577', fontSize: 12, fontWeight: '700' },
  mistakeText: { marginTop: 12, color: '#8B6A2A', fontSize: 12, fontWeight: '800', textAlign: 'center' },
  resetButton: { marginTop: 12, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  resetText: { color: '#7A58B5', fontSize: 12, fontWeight: '900' },
  quizIcon: { width: 66, height: 66, borderRadius: 22, backgroundColor: '#F2ECFF', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  quizEmoji: { fontSize: 31 },
  quizTitle: { fontSize: 23, lineHeight: 30, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  quizOptions: { gap: 10, marginTop: 20 },
  quizOption: { minHeight: 66, borderRadius: 19, borderWidth: 2, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  quizOptionEmoji: { fontSize: 25 },
  quizOptionText: { flex: 1, fontSize: 15, fontWeight: '900' },
  feedback: { marginTop: 14, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackEmoji: { fontSize: 25 },
  feedbackTitle: { fontSize: 14, fontWeight: '900' },
  feedbackText: { marginTop: 2, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  rewardCard: { flex: 1, minHeight: 400, borderRadius: 30, backgroundColor: '#F7F1FF', alignItems: 'center', justifyContent: 'center', padding: 24 },
  rewardEmoji: { fontSize: 64 },
  rewardKicker: { marginTop: 14, color: '#7A58B5', fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  rewardTitle: { marginTop: 8, color: '#2E2938', fontSize: 25, lineHeight: 31, fontWeight: '900', textAlign: 'center' },
  rewardStars: { flexDirection: 'row', marginTop: 18, gap: 5 },
  rewardText: { marginTop: 16, maxWidth: 300, color: '#6D6578', fontSize: 13, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
  nextButton: { minHeight: 56, borderRadius: 19, backgroundColor: '#7A58B5', paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  nextButtonDisabled: { opacity: 0.45 },
  nextButtonText: { color: '#fff', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.985 }] },
});
