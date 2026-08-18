import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { AudioPlayer } from '@/components/media/AudioPlayer';
import { useStars } from '@/context/StarsContext';
import { useTheme } from '@/context/ThemeContext';
import type { BlockAsset } from '@/types/content';

type LessonFourPageProps = {
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

const QUIZ_OPTIONS = [
  { id: 'four', label: '4 ta', correct: false },
  { id: 'five', label: '5 ta', correct: true },
  { id: 'six', label: '6 ta', correct: false },
];

function Staff({ highlighted = 0, ledger = false }: { highlighted?: number; ledger?: boolean }) {
  return (
    <View style={styles.staff}>
      {[0, 1, 2, 3, 4].map((index) => (
        <View
          key={index}
          style={[
            styles.staffLine,
            { top: 34 + index * 27 },
            index < highlighted && styles.staffLineActive,
          ]}
        >
          {index < highlighted ? (
            <View style={styles.lineNumber}><Text style={styles.lineNumberText}>{index + 1}</Text></View>
          ) : null}
        </View>
      ))}

      <View style={[styles.noteHead, { left: '56%', top: 75 }]}>
        <View style={styles.noteStem} />
      </View>
      <View style={[styles.noteHead, { left: '30%', top: 128 }]}>
        <View style={styles.noteStem} />
      </View>

      {ledger ? (
        <>
          <View style={[styles.ledgerLine, { top: 8, left: '67%' }]} />
          <View style={[styles.noteHead, styles.ledgerNote, { left: '72%', top: 1 }]}>
            <View style={styles.noteStem} />
          </View>
          <View style={[styles.ledgerLine, { top: 168, left: '10%' }]} />
          <View style={[styles.noteHead, styles.ledgerNote, { left: '15%', top: 160 }]}>
            <View style={styles.noteStem} />
          </View>
        </>
      ) : null}
    </View>
  );
}

export function LessonFourPage({
  audios,
  completed,
  saving,
  onBack,
  onNext,
  onComplete,
  resolveUrl,
}: LessonFourPageProps) {
  const { colors } = useTheme();
  const { awardLessonStars } = useStars();
  const [step, setStep] = useState(0);
  const [countedLines, setCountedLines] = useState(0);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.84)).current;
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

  function goBack() {
    if (step > 0) {
      setStep((value) => value - 1);
      return;
    }
    onBack();
  }

  function goForward() {
    if (step === 1 && countedLines < 5) return;
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
    awardLessonStars(4, stars);
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
    || (step === 1 && countedLines < 5)
    || (step === QUIZ_STEP && !selectedQuizId)
    || (isFinalStep && completed && !onNext);

  const buttonLabel = step === 1 && countedLines < 5
    ? `Yana ${5 - countedLines} ta chiziq`
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={step > 0 ? 'Oldingi qadam' : 'Orqaga'}
          onPress={goBack}
          style={[styles.navButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.lessonBadge}>
          <Ionicons name="reorder-four" size={17} color="#16805A" />
          <Text style={styles.lessonBadgeText}>4-DARS</Text>
        </View>

        <View style={styles.starBadge}><Ionicons name="star" size={22} color="#F2B01E" /></View>
      </View>

      <View style={styles.progressDots} accessibilityLabel={`${step + 1} / ${TOTAL_STEPS} qadam`}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              { backgroundColor: index <= step ? '#16805A' : colors.border },
              index === step && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Text style={styles.heroEmoji}>🎼</Text></View>
          <Text style={styles.heroKicker}>NOTALAR UYI 🎵</Text>
          <Text style={styles.heroTitle}>Nota yo‘li</Text>
          <Text style={styles.heroText}>Notalar yozilishi uchun maxsus 5 ta chiziq bor. Keling, ularni topamiz!</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.countCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>SANAB KO‘RAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>5 ta chiziqni top</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Pastdagi tugmani bos. Har safar bitta chiziq ranglanadi.</Text>

          <Staff highlighted={countedLines} />

          <Pressable
            onPress={() => setCountedLines((value) => Math.min(5, value + 1))}
            disabled={countedLines >= 5}
            style={({ pressed }) => [styles.countButton, countedLines >= 5 && styles.countButtonDone, pressed && countedLines < 5 && styles.pressed]}
          >
            <Ionicons name={countedLines >= 5 ? 'checkmark-circle' : 'hand-left'} size={21} color="#FFFFFF" />
            <Text style={styles.countButtonText}>{countedLines >= 5 ? 'Topding! 5 ta 🎉' : 'Keyingi chiziq'}</Text>
          </Pressable>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.ledgerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>BU QIZIQ!</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Qo‘shimcha chiziqlar ham bor</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Ba’zi notalar asosiy 5 ta chiziqdan tashqarida bo‘lsa, ularga kichik qo‘shimcha chiziq yordam beradi.</Text>
          <Staff highlighted={5} ledger />
          <View style={styles.ledgerTip}>
            <Text style={styles.ledgerTipEmoji}>✨</Text>
            <Text style={styles.ledgerTipText}>Kichik chiziqlar yuqorida yoki pastda paydo bo‘lishi mumkin.</Text>
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.listenCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.listenHead}>
            <View style={styles.listenIcon}><Ionicons name="headset" size={28} color="#16805A" /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepLabel}>TINGLAB KO‘R</Text>
              <Text style={[styles.listenTitle, { color: colors.text }]}>Musiqani eshitamiz</Text>
            </View>
          </View>

          {audios.length ? (
            <View style={styles.audioList}>
              {audios.slice(0, 2).map((audio, index) => (
                <AudioPlayer
                  key={audio.id}
                  url={resolveUrl(audio.url)}
                  title={index === 0 ? '1-namuna 🎵' : '2-namuna 🎶'}
                />
              ))}
            </View>
          ) : (
            <View style={styles.audioFallback}>
              <Text style={styles.audioFallbackEmoji}>🎧</Text>
              <Text style={[styles.audioFallbackText, { color: colors.text }]}>Audio material yuklanganda shu yerda tinglaymiz.</Text>
            </View>
          )}

          <View style={styles.listenTip}>
            <Text style={styles.listenTipEmoji}>💡</Text>
            <Text style={styles.listenTipText}>Musiqani yozish uchun notalar nota yo‘liga joylanadi.</Text>
          </View>
        </View>
      ) : null}

      {step === QUIZ_STEP ? (
        <View style={[styles.quizCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.quizIcon}><Text style={styles.quizEmoji}>🎼</Text></View>
          <Text style={styles.stepLabel}>MINI SAVOL</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>Nota yo‘li nechta asosiy chiziqdan iborat?</Text>

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
                    ? { backgroundColor: '#E4F7EE', borderColor: '#16805A' }
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
                  <View style={styles.quizNumber}><Text style={styles.quizNumberText}>{option.label.split(' ')[0]}</Text></View>
                  <Text style={[styles.quizOptionText, { color: colors.text }]}>{option.label}</Text>
                  {selected && !quizChecked ? (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="radio-button-on" size={20} color="#16805A" />
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
                    ? 'Ha! Nota yo‘li 5 ta asosiy chiziqdan iborat.'
                    : 'To‘g‘ri javob — 5 ta chiziq. Keyingi safar 3 yulduz olasan!'}
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
            <Text style={[styles.rewardText, { color: colors.muted }]}>Nota yo‘lining 5 ta chizig‘ini bilib olding!</Text>
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
          { backgroundColor: isFinalStep ? colors.success : '#16805A' },
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
  lessonBadge: { minHeight: 38, paddingHorizontal: 14, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#DFF7EC' },
  lessonBadgeText: { color: '#16805A', fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  starBadge: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  progressDot: { width: 23, height: 7, borderRadius: 999 },
  progressDotCurrent: { width: 36 },
  hero: { minHeight: 410, borderRadius: 32, padding: 26, justifyContent: 'center', backgroundColor: '#16805A' },
  heroIcon: { width: 82, height: 82, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  heroEmoji: { fontSize: 46 },
  heroKicker: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 36, lineHeight: 42, fontWeight: '900', marginTop: 9 },
  heroText: { color: 'rgba(255,255,255,0.9)', fontSize: 17, lineHeight: 25, fontWeight: '700', marginTop: 12 },
  stepLabel: { color: '#16805A', fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  sectionTitle: { fontSize: 29, lineHeight: 35, fontWeight: '900', marginTop: 7 },
  sectionText: { fontSize: 15, lineHeight: 23, fontWeight: '600', marginTop: 8 },
  countCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  staff: { height: 195, marginTop: 18, marginBottom: 12, borderRadius: 22, backgroundColor: '#FBFAFD', position: 'relative', overflow: 'hidden' },
  staffLine: { position: 'absolute', left: 24, right: 24, height: 3, borderRadius: 3, backgroundColor: '#AAA3B7' },
  staffLineActive: { backgroundColor: '#16805A', height: 5 },
  lineNumber: { position: 'absolute', left: -8, top: -13, width: 28, height: 28, borderRadius: 14, backgroundColor: '#16805A', alignItems: 'center', justifyContent: 'center' },
  lineNumberText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  noteHead: { position: 'absolute', width: 25, height: 18, borderRadius: 12, backgroundColor: '#2F2B3E', transform: [{ rotate: '-18deg' }] },
  noteStem: { position: 'absolute', width: 3, height: 48, backgroundColor: '#2F2B3E', right: 1, bottom: 9, transform: [{ rotate: '18deg' }] },
  ledgerLine: { position: 'absolute', width: 54, height: 3, backgroundColor: '#A9A3B7' },
  ledgerNote: { backgroundColor: '#16805A' },
  countButton: { minHeight: 52, borderRadius: 18, backgroundColor: '#16805A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6 },
  countButtonDone: { backgroundColor: '#29A86E' },
  countButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  ledgerCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  ledgerTip: { borderRadius: 18, padding: 12, backgroundColor: '#DFF7EC', flexDirection: 'row', alignItems: 'center', gap: 10 },
  ledgerTipEmoji: { fontSize: 25 },
  ledgerTipText: { flex: 1, color: '#285F4B', fontSize: 11, lineHeight: 17, fontWeight: '700' },
  listenCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  listenHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  listenIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#DFF7EC', alignItems: 'center', justifyContent: 'center' },
  listenTitle: { fontSize: 25, lineHeight: 31, fontWeight: '900', marginTop: 3 },
  audioList: { gap: 10 },
  audioFallback: { minHeight: 150, borderRadius: 22, backgroundColor: '#DFF7EC', alignItems: 'center', justifyContent: 'center', padding: 20 },
  audioFallbackEmoji: { fontSize: 48 },
  audioFallbackText: { fontSize: 13, lineHeight: 20, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  listenTip: { marginTop: 15, borderRadius: 18, padding: 12, backgroundColor: '#FFF1BE', flexDirection: 'row', alignItems: 'center', gap: 10 },
  listenTipEmoji: { fontSize: 24 },
  listenTipText: { flex: 1, color: '#6D5315', fontSize: 11, lineHeight: 17, fontWeight: '700' },
  quizCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  quizIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: '#DFF7EC', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  quizEmoji: { fontSize: 38 },
  quizTitle: { fontSize: 28, lineHeight: 34, fontWeight: '900', marginTop: 7, marginBottom: 18 },
  quizOptions: { gap: 9 },
  quizOption: { minHeight: 68, borderRadius: 20, borderWidth: 1.5, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  quizNumber: { width: 42, height: 42, borderRadius: 15, backgroundColor: '#DFF7EC', alignItems: 'center', justifyContent: 'center' },
  quizNumberText: { color: '#16805A', fontSize: 18, fontWeight: '900' },
  quizOptionText: { flex: 1, fontSize: 17, fontWeight: '900' },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  selectedText: { color: '#16805A', fontSize: 10, fontWeight: '900' },
  feedback: { marginTop: 13, borderRadius: 19, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackEmoji: { fontSize: 27 },
  feedbackTitle: { fontSize: 15, fontWeight: '900' },
  feedbackText: { fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 2 },
  rewardCard: { minHeight: 410, borderRadius: 32, padding: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#DFF7EC' },
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
