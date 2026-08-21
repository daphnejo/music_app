import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { AudioPlayer } from '@/components/media/AudioPlayer';
import { useStars } from '@/context/StarsContext';
import { useTheme } from '@/context/ThemeContext';
import type { BlockAsset } from '@/types/content';

type Props = {
  images: BlockAsset[];
  videos: BlockAsset[];
  audios: BlockAsset[];
  completed: boolean;
  saving: boolean;
  onBack: () => void;
  onNext?: () => void;
  onComplete: () => void;
  resolveUrl: (url: string) => string;
};

const QUIZ_STEP = 5;
const REWARD_STEP = 6;
const TOTAL_STEPS = 7;

const REGISTER_OPTIONS = [
  { id: 'low', label: 'Pastki registr', emoji: '🐻', hint: 'Yo‘g‘on va past tovushlar', correct: true },
  { id: 'middle', label: 'O‘rta registr', emoji: '🐱', hint: 'O‘rtacha balandlik', correct: false },
  { id: 'high', label: 'Yuqori registr', emoji: '🐦', hint: 'Ingichka va baland tovushlar', correct: false },
] as const;

const QUIZ_OPTIONS = [
  { id: 'fa', label: 'Fa kaliti', emoji: '🎼', correct: true },
  { id: 'sol', label: 'Sol kaliti', emoji: '🎵', correct: false },
  { id: 'do', label: 'Do kaliti', emoji: '🎶', correct: false },
] as const;

function PracticeVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url, (instance) => {
    instance.loop = false;
  });

  return (
    <VideoView
      player={player}
      style={styles.video}
      contentFit="contain"
      nativeControls
      allowsFullscreen
    />
  );
}

export function LessonElevenPage({
  images,
  videos,
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
  const [registerChoice, setRegisterChoice] = useState<string | null>(null);
  const [registerDone, setRegisterDone] = useState(false);
  const [registerMistakes, setRegisterMistakes] = useState(0);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.86)).current;
  const isFinalStep = step === REWARD_STEP;

  const sourceImage = images.find((asset) => asset.file.includes('image75'))
    ?? images.find((asset) => asset.file.endsWith('.png') && !asset.file.includes('image5'))
    ?? images.find((asset) => !asset.file.includes('image5'))
    ?? images[0];
  const bassVideo = videos.find((asset) => asset.file.includes('media15')) ?? videos[0];
  const singingOne = audios.find((asset) => asset.file.includes('audio36')) ?? audios[0];
  const singingTwo = audios.find((asset) => asset.file.includes('audio37')) ?? audios[1];

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

  function chooseRegister(id: string) {
    if (registerDone) return;
    setRegisterChoice(id);
    const option = REGISTER_OPTIONS.find((item) => item.id === id);
    if (option?.correct) {
      setRegisterDone(true);
      return;
    }
    setRegisterMistakes((value) => value + 1);
  }

  function checkQuiz() {
    if (!selectedQuizId || quizChecked) return;
    const selected = QUIZ_OPTIONS.find((option) => option.id === selectedQuizId);
    const stars: 2 | 3 = selected?.correct ? 3 : 2;
    setRewardStars(stars);
    awardLessonStars(11, stars);
    setQuizChecked(true);
  }

  function goForward() {
    if (step === 2 && !registerDone) return;
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
    || (step === 2 && !registerDone)
    || (step === QUIZ_STEP && !selectedQuizId)
    || (isFinalStep && completed && !onNext);

  const buttonLabel = step === 2 && !registerDone
    ? 'Pastki registrni top'
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
          <Ionicons name="musical-notes" size={16} color="#496AA8" />
          <Text style={styles.lessonBadgeText}>11-DARS</Text>
        </View>
        <View style={styles.starBadge}><Ionicons name="star" size={22} color="#F2B01E" /></View>
      </View>

      <View style={styles.progressDots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              { backgroundColor: index <= step ? '#496AA8' : colors.border },
              index === step && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Text style={styles.heroEmoji}>🎻</Text></View>
          <Text style={styles.heroKicker}>PAST TOVUSHLAR UCHUN YANGI KALIT 🎼</Text>
          <Text style={styles.heroTitle}>Bas kaliti</Text>
          <Text style={styles.heroText}>Bugun pastki registr notalarini yozishda ishlatiladigan Bas — ya’ni Fa kaliti bilan tanishamiz.</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>BILIB OLAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bas kaliti = Fa kaliti</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Taqdimotimizga ko‘ra Bas kaliti pastki registr notalarini belgilash uchun qo‘llaniladi.</Text>

          {sourceImage ? (
            <View style={styles.sourceFrame}>
              <ExpoImage
                source={{ uri: resolveUrl(sourceImage.url) }}
                style={styles.sourceImage}
                contentFit="contain"
              />
            </View>
          ) : (
            <View style={styles.sourceFallback}>
              <Ionicons name="musical-notes-outline" size={54} color="#496AA8" />
              <Text style={styles.sourceFallbackText}>Bas kaliti — pastki registr uchun</Text>
            </View>
          )}

          <View style={styles.factRow}>
            <View style={styles.factBadge}><Text style={styles.factEmoji}>🎼</Text><Text style={styles.factTitle}>Nomi</Text><Text style={styles.factText}>Fa kaliti</Text></View>
            <View style={styles.factBadge}><Text style={styles.factEmoji}>⬇️</Text><Text style={styles.factTitle}>Registr</Text><Text style={styles.factText}>Pastki</Text></View>
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>MINI O‘YIN</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bas kaliti qayerda ishlaydi?</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>To‘g‘ri registrni top. Bas kaliti qaysi tovushlar uchun kerak?</Text>

          <View style={styles.registerOptions}>
            {REGISTER_OPTIONS.map((option) => {
              const selected = registerChoice === option.id;
              const showCorrect = registerDone && option.correct;
              const showWrong = selected && !option.correct && !registerDone;
              return (
                <Pressable
                  key={option.id}
                  disabled={registerDone}
                  onPress={() => chooseRegister(option.id)}
                  style={({ pressed }) => [
                    styles.registerCard,
                    { backgroundColor: selected ? '#EEF3FF' : colors.surface, borderColor: selected ? '#496AA8' : colors.border },
                    showCorrect && { backgroundColor: colors.successSurface, borderColor: colors.success },
                    showWrong && styles.wrongChoice,
                    pressed && !registerDone && styles.pressed,
                  ]}
                >
                  <Text style={styles.registerEmoji}>{option.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.registerTitle, { color: colors.text }]}>{option.label}</Text>
                    <Text style={[styles.registerHint, { color: colors.muted }]}>{option.hint}</Text>
                  </View>
                  {showCorrect ? <Ionicons name="checkmark-circle" size={27} color={colors.success} /> : <Ionicons name="chevron-forward" size={22} color="#8B8496" />}
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.gameFeedback, { backgroundColor: registerDone ? colors.successSurface : '#EEF3FF' }]}> 
            <Text style={styles.gameFeedbackEmoji}>{registerDone ? '🎉' : registerMistakes ? '💡' : '👂'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.gameFeedbackTitle, { color: colors.text }]}>{registerDone ? 'To‘g‘ri!' : registerMistakes ? 'Yana bir marta!' : 'Eslab qol'}</Text>
              <Text style={[styles.gameFeedbackText, { color: colors.muted }]}>{registerDone ? 'Bas kaliti pastki registr notalarini belgilaydi.' : 'Bas kaliti past va yo‘g‘on tovushlar bilan bog‘liq.'}</Text>
            </View>
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>KO‘R VA TAKRORLA</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bas kalitini videoda ko‘r 🎬</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Taqdimotdagi Bas kaliti mashqini ko‘r. Kalitning shakli va pastki registr bilan bog‘liqligiga e’tibor ber.</Text>

          {bassVideo ? (
            <View style={styles.videoFrame}>
              <PracticeVideo url={resolveUrl(bassVideo.url)} />
            </View>
          ) : (
            <View style={styles.noMedia}>
              <Ionicons name="videocam-off-outline" size={34} color={colors.muted} />
              <Text style={[styles.noMediaText, { color: colors.muted }]}>Video topilmadi</Text>
            </View>
          )}
        </View>
      ) : null}

      {step === 4 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>KUYLAB KO‘R</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notalarni birga kuylaymiz 🎤</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Avval mashqni tingla. Keyin audio bilan birga nota nomlarini kuylab ko‘r.</Text>

          <View style={styles.audioList}>
            {singingOne ? <AudioPlayer url={resolveUrl(singingOne.url)} title="1-mashq • kuylab ko‘r" /> : null}
            {singingTwo ? <AudioPlayer url={resolveUrl(singingTwo.url)} title="2-mashq • kuylab ko‘r" /> : null}
            {!singingOne && !singingTwo ? (
              <View style={styles.noMedia}>
                <Ionicons name="volume-mute-outline" size={34} color={colors.muted} />
                <Text style={[styles.noMediaText, { color: colors.muted }]}>Audio mashqlar topilmadi</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.tipBox}><Text style={styles.tipEmoji}>🎵</Text><Text style={styles.tipText}>Pastki registrni ovozingda zo‘riqtirmay, qulay balandlikda takrorla.</Text></View>
        </View>
      ) : null}

      {step === QUIZ_STEP ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.quizIcon}><Text style={styles.quizEmoji}>🧠</Text></View>
          <Text style={styles.stepLabel}>MINI SAVOL</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>Bas kalitining boshqa nomi qaysi?</Text>
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
                    { borderColor: selected ? '#496AA8' : colors.border, backgroundColor: selected ? '#EEF3FF' : colors.surface },
                    showCorrect && { borderColor: colors.success, backgroundColor: colors.successSurface },
                    showWrong && { borderColor: '#E2A93B', backgroundColor: '#FFF3D5' },
                  ]}
                >
                  <Text style={styles.quizOptionEmoji}>{option.emoji}</Text>
                  <Text style={[styles.quizOptionText, { color: colors.text }]}>{option.label}</Text>
                  {selected && !quizChecked ? <Ionicons name="radio-button-on" size={22} color="#496AA8" /> : null}
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
                <Text style={[styles.feedbackText, { color: colors.muted }]}>{answerCorrect ? 'Ha! Bas kaliti Fa kaliti deb ham ataladi.' : 'To‘g‘ri javob — Fa kaliti.'}</Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {step === REWARD_STEP ? (
        <View style={styles.rewardCard}>
          <Animated.View style={{ alignItems: 'center', transform: [{ scale: rewardScale }] }}>
            <Text style={styles.rewardEmoji}>{rewardStars === 3 ? '🏆' : '🌟'}</Text>
            <Text style={[styles.rewardTitle, { color: colors.text }]}>{rewardStars === 3 ? 'Ajoyib!' : 'Barakalla!'}</Text>
            <Text style={[styles.rewardText, { color: colors.muted }]}>Bas kaliti pastki registr uchun ishlatilishini va uning Fa kaliti deb atalishini bilding!</Text>
            <View style={styles.starsRow}>
              {[0, 1, 2].map((star) => (
                <Ionicons key={star} name={star < rewardStars ? 'star' : 'star-outline'} size={40} color={star < rewardStars ? '#F2B01E' : '#B9B2C7'} />
              ))}
            </View>
            <View style={styles.rewardPill}><Ionicons name="trophy" size={20} color="#7B5D0D" /><Text style={styles.rewardPillText}>+{rewardStars} yulduz</Text></View>
          </Animated.View>
        </View>
      ) : null}

      <Pressable
        disabled={buttonDisabled}
        onPress={goForward}
        style={({ pressed }) => [
          styles.completeButton,
          { backgroundColor: isFinalStep ? colors.success : '#496AA8' },
          buttonDisabled && styles.disabled,
          pressed && !buttonDisabled && styles.pressed,
        ]}
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
  lessonBadge: { minHeight: 38, paddingHorizontal: 14, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#EEF3FF' },
  lessonBadgeText: { color: '#496AA8', fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  starBadge: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 5 },
  progressDot: { width: 18, height: 7, borderRadius: 999 },
  progressDotCurrent: { width: 31 },
  hero: { minHeight: 410, borderRadius: 32, padding: 26, justifyContent: 'center', backgroundColor: '#496AA8' },
  heroIcon: { width: 88, height: 88, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  heroEmoji: { fontSize: 48 },
  heroKicker: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 36, lineHeight: 42, fontWeight: '900', marginTop: 9 },
  heroText: { color: 'rgba(255,255,255,0.92)', fontSize: 17, lineHeight: 25, fontWeight: '700', marginTop: 12 },
  card: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  stepLabel: { color: '#496AA8', fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  sectionTitle: { fontSize: 28, lineHeight: 34, fontWeight: '900', marginTop: 7 },
  sectionText: { fontSize: 15, lineHeight: 23, fontWeight: '600', marginTop: 8 },
  sourceFrame: { height: 205, marginTop: 16, borderRadius: 23, overflow: 'hidden', backgroundColor: '#F8FAFF', borderWidth: 1, borderColor: '#DFE7F7' },
  sourceImage: { width: '100%', height: '100%' },
  sourceFallback: { height: 180, marginTop: 16, borderRadius: 23, backgroundColor: '#EEF3FF', alignItems: 'center', justifyContent: 'center', gap: 10 },
  sourceFallbackText: { color: '#496AA8', fontSize: 14, fontWeight: '900' },
  factRow: { flexDirection: 'row', gap: 10, marginTop: 13 },
  factBadge: { flex: 1, minHeight: 92, borderRadius: 19, backgroundColor: '#EEF3FF', alignItems: 'center', justifyContent: 'center', padding: 10 },
  factEmoji: { fontSize: 25 },
  factTitle: { color: '#7D88A5', fontSize: 9, fontWeight: '900', marginTop: 4 },
  factText: { color: '#334E86', fontSize: 13, fontWeight: '900', marginTop: 2 },
  registerOptions: { gap: 10, marginTop: 17 },
  registerCard: { minHeight: 76, borderRadius: 20, borderWidth: 1.5, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  registerEmoji: { fontSize: 32 },
  registerTitle: { fontSize: 15, fontWeight: '900' },
  registerHint: { fontSize: 11, lineHeight: 16, fontWeight: '600', marginTop: 2 },
  wrongChoice: { backgroundColor: '#FFF3D5', borderColor: '#E2A93B' },
  gameFeedback: { marginTop: 13, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  gameFeedbackEmoji: { fontSize: 26 },
  gameFeedbackTitle: { fontSize: 14, fontWeight: '900' },
  gameFeedbackText: { fontSize: 11, lineHeight: 16, fontWeight: '600', marginTop: 2 },
  videoFrame: { marginTop: 17, borderRadius: 22, overflow: 'hidden', backgroundColor: '#111111' },
  video: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#111111' },
  audioList: { gap: 11, marginTop: 17 },
  noMedia: { minHeight: 160, marginTop: 17, borderRadius: 22, backgroundColor: '#F4F5F8', alignItems: 'center', justifyContent: 'center', gap: 8 },
  noMediaText: { fontSize: 12, fontWeight: '800' },
  tipBox: { marginTop: 13, borderRadius: 18, padding: 12, backgroundColor: '#FFF1BE', flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipEmoji: { fontSize: 24 },
  tipText: { flex: 1, color: '#6D5315', fontSize: 11, lineHeight: 17, fontWeight: '700' },
  quizIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: '#EEF3FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
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
  rewardCard: { minHeight: 410, borderRadius: 32, padding: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF3FF' },
  rewardEmoji: { fontSize: 72 },
  rewardTitle: { fontSize: 34, lineHeight: 40, fontWeight: '900', marginTop: 14 },
  rewardText: { fontSize: 16, lineHeight: 24, fontWeight: '600', textAlign: 'center', marginTop: 10, maxWidth: 310 },
  starsRow: { flexDirection: 'row', gap: 8, marginTop: 26 },
  rewardPill: { marginTop: 20, minHeight: 46, borderRadius: 999, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFFFFFAA' },
  rewardPillText: { color: '#7B5D0D', fontSize: 14, fontWeight: '900' },
  completeButton: { minHeight: 60, borderRadius: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 18 },
  completeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
