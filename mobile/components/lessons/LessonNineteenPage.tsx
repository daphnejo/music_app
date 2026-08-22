import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useStars } from '@/context/StarsContext';
import { useTheme } from '@/context/ThemeContext';
import type { BlockAsset } from '@/types/content';

type Props = {
  images: BlockAsset[];
  videos: BlockAsset[];
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
const ROUTE_SEQUENCE = ['theme', 'first', 'repeat', 'theme', 'second'] as const;
type RouteId = (typeof ROUTE_SEQUENCE)[number];

const ROUTE_OPTIONS: Array<{ id: RouteId; label: string; emoji: string }> = [
  { id: 'theme', label: 'Kuy', emoji: '🎵' },
  { id: 'first', label: '1-yakun', emoji: '1️⃣' },
  { id: 'repeat', label: 'Repriza', emoji: '🔁' },
  { id: 'second', label: '2-yakun', emoji: '2️⃣' },
];

const QUIZ_OPTIONS = [
  { id: 'both', label: 'Repriza va volta', correct: true },
  { id: 'clefs', label: 'Skripka va bas kaliti', correct: false },
  { id: 'rests', label: 'Pauza va nota', correct: false },
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

export function LessonNineteenPage({
  images,
  videos,
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
  const [routeIndex, setRouteIndex] = useState(0);
  const [routeMistakes, setRouteMistakes] = useState(0);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.86)).current;

  const routeComplete = routeIndex >= ROUTE_SEQUENCE.length;
  const expectedRoute = ROUTE_SEQUENCE[Math.min(routeIndex, ROUTE_SEQUENCE.length - 1)];
  const isFinalStep = step === REWARD_STEP;
  const sourceImage = images.find((asset) => asset.file.includes('image114'))
    ?? images.find((asset) => asset.file.includes('image115'))
    ?? images.find((asset) => !asset.file.includes('image108') && !asset.file.includes('image5'));
  const primaryVideo = videos.find((asset) => asset.file.includes('media40')) ?? videos[0];
  const practiceVideos = videos.filter((asset) => asset.id !== primaryVideo?.id).slice(0, 2);

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

  function chooseRoute(id: RouteId) {
    if (routeComplete) return;
    if (id === expectedRoute) {
      setRouteIndex((value) => value + 1);
      return;
    }
    setRouteMistakes((value) => value + 1);
  }

  function checkQuiz() {
    if (!selectedQuizId || quizChecked) return;
    const selected = QUIZ_OPTIONS.find((option) => option.id === selectedQuizId);
    const stars: 2 | 3 = selected?.correct ? 3 : 2;
    setRewardStars(stars);
    awardLessonStars(19, stars);
    setQuizChecked(true);
  }

  function goForward() {
    if (step === 3 && !routeComplete) return;
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
  const quizCorrect = !!selectedQuiz?.correct;
  const buttonDisabled = saving
    || (step === 3 && !routeComplete)
    || (step === QUIZ_STEP && !selectedQuizId)
    || (isFinalStep && completed && !onNext);

  const buttonLabel = step === 3 && !routeComplete
    ? `Yo‘l: ${routeIndex}/${ROUTE_SEQUENCE.length}`
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
          <Ionicons name="git-branch-outline" size={16} color="#8B5E3C" />
          <Text style={styles.lessonBadgeText}>19-DARS</Text>
        </View>
        <View style={styles.starBadge}><Ionicons name="star" size={22} color="#F2B01E" /></View>
      </View>

      <View style={styles.progressDots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              { backgroundColor: index <= step ? '#B87945' : colors.border },
              index === step && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Text style={styles.heroEmoji}>🛤️</Text></View>
          <Text style={styles.heroKicker}>IKKI XIL YAKUN</Text>
          <Text style={styles.heroTitle}>Volta</Text>
          <Text style={styles.heroText}>Kuy takrorlanganda birinchi va ikkinchi ijro uchun turli yakun yo‘llari ishlatilishi mumkin.</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>BILIB OLAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Volta yo‘li qanday ishlaydi?</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Birinchi ijroda 1-yakun, qaytarilgandan keyin esa 2-yakun orqali davom etiladi.</Text>

          <View style={styles.routePreview}>
            <View style={styles.routeNode}><Text style={styles.routeEmoji}>🎵</Text><Text style={styles.routeLabel}>Kuy</Text></View>
            <Text style={styles.routeArrow}>→</Text>
            <View style={[styles.routeNode, styles.firstNode]}><Text style={styles.routeEmoji}>1️⃣</Text><Text style={styles.routeLabel}>1-yakun</Text></View>
            <Text style={styles.routeArrow}>→</Text>
            <View style={[styles.routeNode, styles.repeatNode]}><Text style={styles.routeEmoji}>🔁</Text><Text style={styles.routeLabel}>Qaytar</Text></View>
          </View>
          <View style={styles.routePreview}>
            <View style={styles.routeNode}><Text style={styles.routeEmoji}>🎵</Text><Text style={styles.routeLabel}>Kuy</Text></View>
            <Text style={styles.routeArrow}>→</Text>
            <View style={[styles.routeNode, styles.secondNode]}><Text style={styles.routeEmoji}>2️⃣</Text><Text style={styles.routeLabel}>2-yakun</Text></View>
            <Text style={styles.routeArrow}>→</Text>
            <View style={[styles.routeNode, styles.finishNode]}><Text style={styles.routeEmoji}>🏁</Text><Text style={styles.routeLabel}>Davom</Text></View>
          </View>

          {sourceImage ? (
            <View style={styles.sourceFrame}>
              <ExpoImage source={{ uri: resolveUrl(sourceImage.url) }} style={styles.sourceImage} contentFit="contain" />
            </View>
          ) : null}
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>KO‘RIB O‘RGAN</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Volta ijrosi 🎬</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Taqdimotdagi misolni tomosha qil. Yozilishi va ijro etilishiga e’tibor ber.</Text>
          {primaryVideo ? <PracticeVideo url={resolveUrl(primaryVideo.url)} /> : <View style={styles.emptyMedia}><Text style={styles.emptyMediaText}>Video materiali topilmadi.</Text></View>}
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>YO‘L O‘YINI</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Volta yo‘lini tuz 🛤️</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Ketma-ketlikni esla: Kuy → 1-yakun → Repriza → Kuy → 2-yakun.</Text>

          <View style={styles.sequenceTrack}>
            {ROUTE_SEQUENCE.map((id, index) => {
              const option = ROUTE_OPTIONS.find((item) => item.id === id)!;
              const done = index < routeIndex;
              const current = index === routeIndex && !routeComplete;
              return (
                <View key={`${id}-${index}`} style={[styles.sequenceSlot, done && styles.sequenceDone, current && styles.sequenceCurrent]}>
                  <Text style={styles.sequenceEmoji}>{done ? option.emoji : current ? '👆' : '•'}</Text>
                  <Text style={styles.sequenceText}>{done ? option.label : current ? 'Navbat' : '...'}</Text>
                </View>
              );
            })}
          </View>

          <View style={styles.optionGrid}>
            {ROUTE_OPTIONS.map((option) => (
              <Pressable key={option.id} disabled={routeComplete} onPress={() => chooseRoute(option.id)} style={({ pressed }) => [styles.optionButton, pressed && styles.pressed]}>
                <Text style={styles.optionEmoji}>{option.emoji}</Text>
                <Text style={styles.optionText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.gameStatus}>
            <Text style={styles.gameStatusText}>{routeComplete ? 'Yo‘lni to‘g‘ri tuzding! 🎉' : `${routeIndex}/${ROUTE_SEQUENCE.length} qadam`}</Text>
            <Text style={styles.gameMistakes}>{routeMistakes ? `${routeMistakes} xato — yana urin!` : 'Xatosiz boshlading ✨'}</Text>
          </View>
          <Pressable onPress={() => { setRouteIndex(0); setRouteMistakes(0); }} style={styles.resetButton}><Ionicons name="refresh" size={18} color="#8B5E3C" /><Text style={styles.resetText}>Qaytadan boshlash</Text></Pressable>
        </View>
      ) : null}

      {step === 4 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>MASHQ QILAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Repriza + Volta 🎬</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>59-slayddagi mashqda repriza va volta belgilarini birga qo‘llash ko‘rsatilgan.</Text>
          {practiceVideos.length ? practiceVideos.map((video, index) => (
            <View key={video.id} style={styles.practiceBlock}>
              <Text style={styles.practiceTitle}>{index + 1}-mashq</Text>
              <PracticeVideo url={resolveUrl(video.url)} />
            </View>
          )) : <View style={styles.emptyMedia}><Text style={styles.emptyMediaText}>Mashq videolari topilmadi.</Text></View>}
        </View>
      ) : null}

      {step === QUIZ_STEP ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>MINI-TEST</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>59-slayddagi mashqda qaysi ikkita belgi qo‘yiladi?</Text>
          <View style={styles.quizList}>
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
                    { borderColor: selected ? '#B87945' : colors.border, backgroundColor: colors.surface },
                    showCorrect && styles.quizCorrect,
                    showWrong && styles.quizWrong,
                  ]}
                >
                  <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
                  <Text style={[styles.quizText, { color: colors.text }]}>{option.label}</Text>
                  {showCorrect ? <Ionicons name="checkmark-circle" size={22} color="#2E9B67" /> : null}
                  {showWrong ? <Ionicons name="close-circle" size={22} color="#D45A5A" /> : null}
                </Pressable>
              );
            })}
          </View>
          {quizChecked ? (
            <View style={[styles.feedback, quizCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
              <Text style={styles.feedbackTitle}>{quizCorrect ? 'Barakalla! ⭐⭐⭐' : 'Yaxshi urinish! ⭐⭐'}</Text>
              <Text style={styles.feedbackText}>{quizCorrect ? 'To‘g‘ri: repriza va volta.' : 'To‘g‘ri javob: Repriza va volta.'}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {step === REWARD_STEP ? (
        <Animated.View style={[styles.rewardCard, { transform: [{ scale: rewardScale }] }]}> 
          <Text style={styles.rewardEmoji}>🏆</Text>
          <Text style={styles.rewardTitle}>Volta yo‘lini o‘rganding!</Text>
          <Text style={styles.rewardText}>Endi 1-yakun, repriza va 2-yakun qanday ketma-ket kelishini bilasan.</Text>
          <View style={styles.starsRow}>{[0, 1, 2].map((index) => <Ionicons key={index} name="star" size={38} color={index < rewardStars ? '#F2B01E' : '#E5E1D9'} />)}</View>
          <View style={styles.trophyPill}><Ionicons name="ribbon" size={18} color="#8B5E3C" /><Text style={styles.trophyText}>19-dars mukofoti</Text></View>
        </Animated.View>
      ) : null}

      <Pressable disabled={buttonDisabled} onPress={goForward} style={({ pressed }) => [styles.nextButton, buttonDisabled && styles.nextButtonDisabled, pressed && !buttonDisabled && styles.pressed]}>
        <Text style={styles.nextButtonText}>{buttonLabel}</Text>
        <Ionicons name={isFinalStep ? 'checkmark-circle' : 'arrow-forward'} size={21} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16, gap: 14 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  lessonBadge: { minHeight: 34, paddingHorizontal: 13, borderRadius: 999, backgroundColor: '#FFF2E7', flexDirection: 'row', alignItems: 'center', gap: 6 },
  lessonBadgeText: { color: '#8B5E3C', fontSize: 12, fontWeight: '900' },
  starBadge: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  progressDot: { width: 24, height: 5, borderRadius: 999 },
  progressDotCurrent: { width: 38 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  heroIcon: { width: 104, height: 104, borderRadius: 34, backgroundColor: '#FFF2E7', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  heroEmoji: { fontSize: 53 },
  heroKicker: { color: '#B87945', fontSize: 12, fontWeight: '900', letterSpacing: 1.2, marginBottom: 8 },
  heroTitle: { color: '#2D2A31', fontSize: 34, lineHeight: 39, fontWeight: '900', textAlign: 'center' },
  heroText: { marginTop: 11, color: '#706B76', fontSize: 15, lineHeight: 22, fontWeight: '600', textAlign: 'center', maxWidth: 330 },
  card: { flex: 1, borderWidth: 1, borderRadius: 25, padding: 17, gap: 13 },
  stepLabel: { color: '#B87945', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  sectionTitle: { fontSize: 23, lineHeight: 28, fontWeight: '900' },
  sectionText: { fontSize: 14, lineHeight: 21, fontWeight: '600' },
  routePreview: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  routeNode: { flex: 1, minHeight: 70, borderRadius: 17, backgroundColor: '#F7F3EE', alignItems: 'center', justifyContent: 'center', padding: 8 },
  firstNode: { backgroundColor: '#FFF0CE' },
  repeatNode: { backgroundColor: '#EEE8FF' },
  secondNode: { backgroundColor: '#DFF5EA' },
  finishNode: { backgroundColor: '#E8F2FF' },
  routeEmoji: { fontSize: 23 },
  routeLabel: { marginTop: 4, color: '#3D3842', fontSize: 11, fontWeight: '900', textAlign: 'center' },
  routeArrow: { color: '#A49DAA', fontSize: 18, fontWeight: '900' },
  sourceFrame: { height: 145, borderRadius: 17, backgroundColor: '#FBF9F6', overflow: 'hidden', padding: 8 },
  sourceImage: { width: '100%', height: '100%' },
  video: { width: '100%', aspectRatio: 16 / 9, borderRadius: 17, backgroundColor: '#111' },
  emptyMedia: { minHeight: 120, borderRadius: 17, backgroundColor: '#F4F1ED', alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyMediaText: { color: '#79727D', fontWeight: '700', textAlign: 'center' },
  sequenceTrack: { flexDirection: 'row', gap: 5 },
  sequenceSlot: { flex: 1, minHeight: 70, borderRadius: 14, backgroundColor: '#F1EEE9', alignItems: 'center', justifyContent: 'center', padding: 5, borderWidth: 2, borderColor: 'transparent' },
  sequenceDone: { backgroundColor: '#E3F5EB' },
  sequenceCurrent: { borderColor: '#B87945', backgroundColor: '#FFF7EF' },
  sequenceEmoji: { fontSize: 20 },
  sequenceText: { marginTop: 3, color: '#4B454F', fontSize: 9, fontWeight: '900', textAlign: 'center' },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  optionButton: { width: '48%', minHeight: 72, borderRadius: 17, backgroundColor: '#FFF7EF', borderWidth: 1, borderColor: '#ECD7C4', alignItems: 'center', justifyContent: 'center', padding: 8 },
  optionEmoji: { fontSize: 24 },
  optionText: { marginTop: 3, color: '#5B4636', fontSize: 12, fontWeight: '900' },
  gameStatus: { borderRadius: 15, backgroundColor: '#F7F3EE', padding: 11, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  gameStatusText: { color: '#3E3942', fontSize: 12, fontWeight: '900' },
  gameMistakes: { color: '#817982', fontSize: 11, fontWeight: '700', textAlign: 'right' },
  resetButton: { alignSelf: 'center', flexDirection: 'row', gap: 6, alignItems: 'center', padding: 8 },
  resetText: { color: '#8B5E3C', fontSize: 12, fontWeight: '800' },
  practiceBlock: { gap: 7 },
  practiceTitle: { color: '#6F6874', fontSize: 12, fontWeight: '900' },
  quizList: { gap: 9 },
  quizOption: { minHeight: 58, borderRadius: 17, borderWidth: 1.5, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  quizCorrect: { borderColor: '#2E9B67', backgroundColor: '#ECFAF2' },
  quizWrong: { borderColor: '#D45A5A', backgroundColor: '#FFF0F0' },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 2, borderColor: '#C7C1CA', alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: '#B87945' },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#B87945' },
  quizText: { flex: 1, fontSize: 14, fontWeight: '800' },
  feedback: { borderRadius: 16, padding: 13 },
  feedbackCorrect: { backgroundColor: '#ECFAF2' },
  feedbackWrong: { backgroundColor: '#FFF4E5' },
  feedbackTitle: { color: '#37323B', fontSize: 14, fontWeight: '900' },
  feedbackText: { marginTop: 3, color: '#6C6570', fontSize: 12, lineHeight: 18, fontWeight: '600' },
  rewardCard: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 28, backgroundColor: '#FFF8EE', padding: 24 },
  rewardEmoji: { fontSize: 62 },
  rewardTitle: { marginTop: 12, color: '#342E37', fontSize: 27, lineHeight: 32, fontWeight: '900', textAlign: 'center' },
  rewardText: { marginTop: 9, color: '#756D78', fontSize: 14, lineHeight: 21, fontWeight: '600', textAlign: 'center' },
  starsRow: { flexDirection: 'row', gap: 4, marginTop: 18 },
  trophyPill: { marginTop: 17, minHeight: 38, borderRadius: 999, backgroundColor: '#FFE9D5', paddingHorizontal: 15, flexDirection: 'row', gap: 7, alignItems: 'center' },
  trophyText: { color: '#8B5E3C', fontSize: 12, fontWeight: '900' },
  nextButton: { minHeight: 56, borderRadius: 18, backgroundColor: '#B87945', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  nextButtonDisabled: { opacity: 0.45 },
  nextButtonText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  pressed: { opacity: 0.74, transform: [{ scale: 0.99 }] },
});
