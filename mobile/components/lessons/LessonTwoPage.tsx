import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { AudioPlayer } from '@/components/media/AudioPlayer';
import { useTheme } from '@/context/ThemeContext';
import type { BlockAsset } from '@/types/content';

type LessonTwoPageProps = {
  audios: BlockAsset[];
  completed: boolean;
  saving: boolean;
  onBack: () => void;
  onNext?: () => void;
  onComplete: () => void;
  resolveUrl: (url: string) => string;
};

const QUIZ_STEP = 3;
const REWARD_STEP = 4;
const TOTAL_STEPS = 5;

const QUIZ_OPTIONS = [
  { id: 'low', label: 'Past registr', emoji: '🐻', correct: false },
  { id: 'middle', label: 'O‘rta registr', emoji: '🐱', correct: false },
  { id: 'high', label: 'Yuqori registr', emoji: '🐦', correct: true },
];

export function LessonTwoPage({
  audios,
  completed,
  saving,
  onBack,
  onNext,
  onComplete,
  resolveUrl,
}: LessonTwoPageProps) {
  const { colors } = useTheme();
  const [step, setStep] = useState(0);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.84)).current;
  const isFinalStep = step === REWARD_STEP;

  const registerAudios = audios.slice(0, 3);
  const audioLabels = ['Past tovush 🐻', 'O‘rta tovush 🐱', 'Yuqori tovush 🐦'];

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

        <View style={[styles.lessonBadge, { backgroundColor: '#DDF2FF' }]}>
          <Ionicons name="ear" size={16} color="#2483C5" />
          <Text style={styles.lessonBadgeText}>2-DARS</Text>
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
              { backgroundColor: index <= step ? '#2483C5' : colors.border },
              index === step && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="ear" size={43} color="#FFFFFF" />
          </View>
          <Text style={styles.heroKicker}>QULOQ SOLAMIZ 👂</Text>
          <Text style={styles.heroTitle}>Baland va past tovushlar</Text>
          <Text style={styles.heroText}>Tovushlar turli balandlikda yangraydi. Keling, farqini eshitamiz!</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.registerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.stepLabel}>UCHTA REGISTR</Text>
          <Text style={[styles.registerTitle, { color: colors.text }]}>Tovush qayerda yangrayapti?</Text>
          <Text style={[styles.registerText, { color: colors.muted }]}>Bir-biriga yaqin balandlikdagi tovushlar uch guruhga bo‘linadi.</Text>

          <View style={styles.registerList}>
            <View style={[styles.registerItem, { backgroundColor: '#FFF1BE' }]}>
              <Text style={styles.registerEmoji}>🐻</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.registerItemTitle}>Past registr</Text>
                <Text style={styles.registerItemText}>Yo‘g‘onroq, past tovushlar</Text>
              </View>
              <Ionicons name="arrow-down" size={25} color="#A66A00" />
            </View>

            <View style={[styles.registerItem, { backgroundColor: '#EAF6FF' }]}>
              <Text style={styles.registerEmoji}>🐱</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.registerItemTitle}>O‘rta registr</Text>
                <Text style={styles.registerItemText}>O‘rtacha balandlikdagi tovushlar</Text>
              </View>
              <Ionicons name="remove" size={25} color="#2483C5" />
            </View>

            <View style={[styles.registerItem, { backgroundColor: '#E8F8EF' }]}>
              <Text style={styles.registerEmoji}>🐦</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.registerItemTitle}>Yuqori registr</Text>
                <Text style={styles.registerItemText}>Ingichkaroq, baland tovushlar</Text>
              </View>
              <Ionicons name="arrow-up" size={25} color="#16805A" />
            </View>
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.listenCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.listenHeading}>
            <View style={styles.listenIcon}>
              <Ionicons name="headset" size={29} color="#2483C5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepLabel}>TINGLAB KO‘R</Text>
              <Text style={[styles.listenTitle, { color: colors.text }]}>Qaysi biri balandroq?</Text>
            </View>
          </View>

          {registerAudios.length ? (
            <View style={styles.audioList}>
              {registerAudios.map((audio, index) => (
                <AudioPlayer
                  key={audio.id}
                  url={resolveUrl(audio.url)}
                  title={audioLabels[index] ?? `Audio ${index + 1}`}
                />
              ))}
            </View>
          ) : (
            <View style={[styles.noAudio, { backgroundColor: colors.primarySoft }]}>
              <Text style={styles.noAudioEmoji}>🎧</Text>
              <Text style={[styles.noAudioText, { color: colors.text }]}>Audio material yuklanganda shu yerda eshitamiz.</Text>
            </View>
          )}

          <View style={styles.listenTip}>
            <Text style={styles.listenTipEmoji}>💡</Text>
            <Text style={styles.listenTipText}>Avval past, keyin o‘rta, so‘ng yuqori tovushni tinglab farqini eslab qol.</Text>
          </View>
        </View>
      ) : null}

      {step === QUIZ_STEP ? (
        <View style={[styles.quizCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.quizBird}><Text style={styles.quizBirdEmoji}>🐦</Text></View>
          <Text style={styles.stepLabel}>MINI SAVOL</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>Qushlar sayrashini qaysi registrda ifoda qilish mumkin?</Text>
          <Text style={[styles.quizHint, { color: colors.muted }]}>Javob kartasini bosib tanla, keyin tekshir.</Text>

          <View style={styles.quizOptions}>
            {QUIZ_OPTIONS.map((option) => {
              const selected = selectedQuizId === option.id;
              const revealCorrect = quizChecked && option.correct;
              const wrongSelected = quizChecked && selected && !option.correct;

              const surface = revealCorrect
                ? { backgroundColor: colors.successSurface, borderColor: colors.success }
                : wrongSelected
                  ? { backgroundColor: '#FFF3D5', borderColor: '#E2A93B' }
                  : selected
                    ? { backgroundColor: '#E6F5FF', borderColor: '#2483C5' }
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
                    surface,
                    selected && !quizChecked && styles.quizOptionSelected,
                    pressed && !quizChecked && styles.pressed,
                  ]}
                >
                  <View style={styles.quizOptionLead}>
                    <Text style={styles.quizOptionEmoji}>{option.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.quizOptionText, { color: colors.text }]}>{option.label}</Text>
                      {selected && !quizChecked ? <Text style={styles.selectedLabel}>Tanlandi</Text> : null}
                    </View>
                  </View>

                  <Ionicons
                    name={
                      revealCorrect
                        ? 'checkmark-circle'
                        : wrongSelected
                          ? 'close-circle'
                          : selected
                            ? 'radio-button-on'
                            : 'radio-button-off'
                    }
                    size={26}
                    color={
                      revealCorrect
                        ? colors.success
                        : wrongSelected
                          ? '#E2A93B'
                          : selected
                            ? '#2483C5'
                            : colors.muted
                    }
                  />
                </Pressable>
              );
            })}
          </View>

          {quizChecked ? (
            <View style={[styles.feedback, { backgroundColor: answerCorrect ? colors.successSurface : '#FFF3D5' }]}>
              <Text style={styles.feedbackEmoji}>{answerCorrect ? '🎉' : '🌟'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.feedbackTitle, { color: colors.text }]}>
                  {answerCorrect ? 'To‘g‘ri! 3 yulduz!' : 'Yaxshi urinish! 2 yulduz!'}
                </Text>
                <Text style={[styles.feedbackText, { color: colors.muted }]}>
                  {answerCorrect
                    ? 'Qushlar sayrashi yuqori registrga mos.'
                    : 'To‘g‘ri javob — Yuqori registr. Endi buni eslab qolamiz!'}
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
            <Text style={[styles.rewardTitle, { color: colors.text }]}>{rewardStars === 3 ? 'Ajoyib!' : 'Yaxshi!'}</Text>
            <Text style={[styles.rewardText, { color: colors.muted }]}>Past, o‘rta va yuqori registrni ajratishni o‘rganding!</Text>
            <View style={styles.starsRow}>
              {[0, 1, 2].map((star) => (
                <Ionicons
                  key={star}
                  name={star < rewardStars ? 'star' : 'star-outline'}
                  size={38}
                  color={star < rewardStars ? '#F2B01E' : '#B8B1C8'}
                />
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
          { backgroundColor: isFinalStep ? colors.success : '#2483C5' },
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
  lessonBadge: { minHeight: 38, paddingHorizontal: 14, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6 },
  lessonBadgeText: { color: '#2483C5', fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  starBadge: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 7 },
  progressDot: { width: 28, height: 7, borderRadius: 999 },
  progressDotCurrent: { width: 42 },
  hero: { minHeight: 410, borderRadius: 32, padding: 26, justifyContent: 'center', backgroundColor: '#2483C5' },
  heroIcon: { width: 78, height: 78, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.17)', alignItems: 'center', justifyContent: 'center', marginBottom: 25 },
  heroKicker: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 34, lineHeight: 40, fontWeight: '900', marginTop: 9 },
  heroText: { color: 'rgba(255,255,255,0.88)', fontSize: 17, lineHeight: 25, fontWeight: '700', marginTop: 12 },
  stepLabel: { color: '#2483C5', fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  registerCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  registerTitle: { fontSize: 29, lineHeight: 35, fontWeight: '900', marginTop: 7 },
  registerText: { fontSize: 15, lineHeight: 22, fontWeight: '600', marginTop: 7, marginBottom: 17 },
  registerList: { gap: 10 },
  registerItem: { minHeight: 83, borderRadius: 22, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  registerEmoji: { fontSize: 34 },
  registerItemTitle: { color: '#2E2940', fontSize: 16, fontWeight: '900' },
  registerItemText: { color: '#655F75', fontSize: 11, lineHeight: 16, fontWeight: '600', marginTop: 2 },
  listenCard: { minHeight: 410, borderRadius: 32, padding: 18, borderWidth: 1 },
  listenHeading: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  listenIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#DDF2FF', alignItems: 'center', justifyContent: 'center' },
  listenTitle: { fontSize: 25, lineHeight: 30, fontWeight: '900', marginTop: 3 },
  audioList: { gap: 9 },
  noAudio: { minHeight: 160, borderRadius: 24, alignItems: 'center', justifyContent: 'center', padding: 20 },
  noAudioEmoji: { fontSize: 48 },
  noAudioText: { textAlign: 'center', fontSize: 14, lineHeight: 21, fontWeight: '700', marginTop: 8 },
  listenTip: { marginTop: 14, borderRadius: 19, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#FFF3C8' },
  listenTipEmoji: { fontSize: 25 },
  listenTipText: { flex: 1, color: '#65511A', fontSize: 11, lineHeight: 17, fontWeight: '700' },
  quizCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  quizBird: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F8EF', marginBottom: 16 },
  quizBirdEmoji: { fontSize: 39 },
  quizTitle: { fontSize: 27, lineHeight: 33, fontWeight: '900', marginTop: 7 },
  quizHint: { fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 7, marginBottom: 16 },
  quizOptions: { gap: 9 },
  quizOption: { minHeight: 68, borderRadius: 20, borderWidth: 1.5, padding: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 11 },
  quizOptionSelected: { borderWidth: 2.5 },
  quizOptionLead: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  quizOptionEmoji: { fontSize: 30 },
  quizOptionText: { fontSize: 15, fontWeight: '900' },
  selectedLabel: { color: '#2483C5', fontSize: 10, fontWeight: '900', marginTop: 2 },
  feedback: { marginTop: 13, borderRadius: 19, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackEmoji: { fontSize: 27 },
  feedbackTitle: { fontSize: 15, fontWeight: '900' },
  feedbackText: { fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 2 },
  rewardCard: { minHeight: 410, borderRadius: 32, padding: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6F5FF' },
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