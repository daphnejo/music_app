import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
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

const QUIZ_STEP = 4;
const REWARD_STEP = 5;
const TOTAL_STEPS = 6;
const REPEAT_SEQUENCE = ['a', 'b', 'a', 'b'] as const;

const QUIZ_OPTIONS = [
  { id: 'repeat', label: 'Qaytarishni', emoji: '🔁', correct: true },
  { id: 'stop', label: 'To‘xtashni', emoji: '🛑', correct: false },
  { id: 'faster', label: 'Tezroq chalishni', emoji: '⚡', correct: false },
];

function PracticeVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url, (instance) => {
    instance.loop = false;
  });
  return <VideoView player={player} style={styles.video} contentFit="contain" nativeControls allowsFullscreen />;
}

export function LessonTwelvePage({ images, videos, audios, completed, saving, onBack, onNext, onComplete, resolveUrl }: Props) {
  const { colors } = useTheme();
  const { awardLessonStars } = useStars();
  const [step, setStep] = useState(0);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [sequenceMistakes, setSequenceMistakes] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState(0);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.86)).current;

  const sequenceComplete = sequenceIndex >= REPEAT_SEQUENCE.length;
  const isFinalStep = step === REWARD_STEP;
  const reprizaImage = images.find((asset) => asset.file.includes('image80'))
    ?? images.find((asset) => asset.file.includes('image82'))
    ?? images.find((asset) => asset.file.includes('image81'))
    ?? images[0];
  const firstAudio = audios[0];
  const activeVideo = videos[selectedVideo] ?? videos[0];

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

  function pressPart(part: 'a' | 'b') {
    if (sequenceComplete) return;
    if (REPEAT_SEQUENCE[sequenceIndex] === part) {
      setSequenceIndex((value) => value + 1);
      return;
    }
    setSequenceMistakes((value) => value + 1);
  }

  function checkQuiz() {
    if (!selectedQuizId || quizChecked) return;
    const selected = QUIZ_OPTIONS.find((option) => option.id === selectedQuizId);
    const stars: 2 | 3 = selected?.correct ? 3 : 2;
    setRewardStars(stars);
    awardLessonStars(12, stars);
    setQuizChecked(true);
  }

  function goForward() {
    if (step === 2 && !sequenceComplete) return;
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
  const expectedPart = REPEAT_SEQUENCE[Math.min(sequenceIndex, REPEAT_SEQUENCE.length - 1)];
  const buttonDisabled = saving
    || (step === 2 && !sequenceComplete)
    || (step === QUIZ_STEP && !selectedQuizId)
    || (isFinalStep && completed && !onNext);

  const buttonLabel = step === 2 && !sequenceComplete
    ? `Navbat: ${expectedPart === 'a' ? '1-bo‘lak' : '2-bo‘lak'}`
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
        <View style={styles.lessonBadge}><Ionicons name="repeat" size={16} color="#6C5CE7" /><Text style={styles.lessonBadgeText}>12-DARS</Text></View>
        <View style={styles.starBadge}><Ionicons name="star" size={22} color="#F2B01E" /></View>
      </View>

      <View style={styles.progressDots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View key={index} style={[styles.progressDot, { backgroundColor: index <= step ? '#6C5CE7' : colors.border }, index === step && styles.progressDotCurrent]} />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Text style={styles.heroEmoji}>🔁</Text></View>
          <Text style={styles.heroKicker}>YANA BIR MARTA IJRO ETAMIZ 🎵</Text>
          <Text style={styles.heroTitle}>Repriza</Text>
          <Text style={styles.heroText}>Musiqada ba’zan bir bo‘lakni yana qaytarib ijro qilish kerak bo‘ladi. Buni repriza belgisi ko‘rsatadi.</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>BILIB OLAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Repriza — qaytarish belgisi</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Belgi ko‘rinsa, belgilangan musiqa bo‘lagini yana bir marta ijro qilamiz.</Text>
          <View style={styles.symbolStage}>
            {reprizaImage ? <Image source={{ uri: resolveUrl(reprizaImage.url) }} style={styles.symbolImage} contentFit="contain" /> : <Text style={styles.fallbackSymbol}>🔁</Text>}
          </View>
          <View style={styles.flowRow}>
            <View style={styles.flowPart}><Text style={styles.flowEmoji}>🎵</Text><Text style={styles.flowText}>1-bo‘lak</Text></View>
            <Ionicons name="arrow-forward" size={18} color="#8A8397" />
            <View style={styles.flowPart}><Text style={styles.flowEmoji}>🎶</Text><Text style={styles.flowText}>2-bo‘lak</Text></View>
            <Ionicons name="repeat" size={22} color="#6C5CE7" />
            <View style={[styles.flowPart, styles.flowRepeat]}><Text style={styles.flowEmoji}>🔁</Text><Text style={styles.flowText}>Qaytar</Text></View>
          </View>
          <View style={styles.tipBox}><Text style={styles.tipEmoji}>💡</Text><Text style={styles.tipText}>Repriza kuyga “shu joyni yana bir marta ijro et” deydi.</Text></View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>MINI O‘YIN</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Qaytarib ijro et 🔁</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Avval 1-bo‘lak, keyin 2-bo‘lak. Reprizadan keyin ikkalasini yana qaytaramiz.</Text>

          <View style={styles.sequenceStrip}>
            {REPEAT_SEQUENCE.map((part, index) => (
              <View key={index} style={[styles.sequenceCell, index < sequenceIndex && styles.sequenceCellDone, index === sequenceIndex && !sequenceComplete && styles.sequenceCellActive]}>
                <Text style={[styles.sequenceCellText, index < sequenceIndex && styles.sequenceCellTextDone]}>{part === 'a' ? '1' : '2'}</Text>
                {index === 1 ? <Text style={styles.repeatMarker}>↻</Text> : null}
              </View>
            ))}
          </View>

          <View style={styles.sequenceStatus}>
            <View style={[styles.sequenceCount, sequenceComplete && styles.sequenceCountDone]}><Text style={styles.sequenceCountText}>{sequenceComplete ? '✓' : `${sequenceIndex}/4`}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.sequenceTitle}>{sequenceComplete ? 'Ajoyib! Reprizani bajarding.' : `Navbat: ${expectedPart === 'a' ? '1-bo‘lak' : '2-bo‘lak'}`}</Text><Text style={styles.sequenceSub}>{sequenceMistakes ? `${sequenceMistakes} marta adashding — davom et!` : 'Repriza belgisi kelganda boshidan qayt.'}</Text></View>
          </View>

          <View style={styles.partButtons}>
            <Pressable onPress={() => pressPart('a')} style={({ pressed }) => [styles.partButton, styles.partA, expectedPart === 'a' && !sequenceComplete && styles.partExpected, pressed && styles.pressed]}>
              <Text style={styles.partEmoji}>🎵</Text><Text style={styles.partTitle}>1-bo‘lak</Text>
            </Pressable>
            <Pressable onPress={() => pressPart('b')} style={({ pressed }) => [styles.partButton, styles.partB, expectedPart === 'b' && !sequenceComplete && styles.partExpected, pressed && styles.pressed]}>
              <Text style={styles.partEmoji}>🎶</Text><Text style={styles.partTitle}>2-bo‘lak</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => { setSequenceIndex(0); setSequenceMistakes(0); }} style={styles.resetButton}><Ionicons name="refresh" size={18} color="#6C5CE7" /><Text style={styles.resetText}>Qaytadan boshlash</Text></Pressable>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>KO‘R VA ESHIT</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Repriza qanday ijro qilinadi? 🎬</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Taqdimotdagi asl mashqlarni ko‘r va qaytariladigan joyni top.</Text>

          {videos.length ? (
            <>
              <View style={styles.videoTabs}>
                {videos.slice(0, 3).map((video, index) => (
                  <Pressable key={video.id} onPress={() => setSelectedVideo(index)} style={[styles.videoTab, selectedVideo === index && styles.videoTabActive]}>
                    <Text style={[styles.videoTabText, selectedVideo === index && styles.videoTabTextActive]}>Mashq {index + 1}</Text>
                  </Pressable>
                ))}
              </View>
              {activeVideo ? <View style={styles.videoFrame}><PracticeVideo key={activeVideo.id} url={resolveUrl(activeVideo.url)} /></View> : null}
            </>
          ) : <View style={styles.emptyBox}><Ionicons name="videocam-off-outline" size={32} color={colors.muted} /><Text style={[styles.emptyText, { color: colors.muted }]}>Video topilmadi</Text></View>}

          {firstAudio ? <View style={styles.audioWrap}><AudioPlayer url={resolveUrl(firstAudio.url)} title="Repriza mashqi" /></View> : null}
        </View>
      ) : null}

      {step === QUIZ_STEP ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.quizIcon}><Text style={styles.quizEmoji}>🧠</Text></View>
          <Text style={styles.stepLabel}>MINI SAVOL</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>Repriza belgisi nimani bildiradi?</Text>
          <View style={styles.quizOptions}>
            {QUIZ_OPTIONS.map((option) => {
              const selected = selectedQuizId === option.id;
              const showCorrect = quizChecked && option.correct;
              const showWrong = quizChecked && selected && !option.correct;
              return (
                <Pressable key={option.id} disabled={quizChecked} onPress={() => setSelectedQuizId(option.id)} style={[
                  styles.quizOption,
                  { borderColor: selected ? '#6C5CE7' : colors.border, backgroundColor: selected ? '#EEE9FF' : colors.surface },
                  showCorrect && { borderColor: colors.success, backgroundColor: colors.successSurface },
                  showWrong && { borderColor: '#E2A93B', backgroundColor: '#FFF3D5' },
                ]}>
                  <Text style={styles.quizOptionEmoji}>{option.emoji}</Text><Text style={[styles.quizOptionText, { color: colors.text }]}>{option.label}</Text>
                  {showCorrect ? <Ionicons name="checkmark-circle" size={24} color={colors.success} /> : null}
                  {showWrong ? <Ionicons name="close-circle" size={24} color="#D59A25" /> : null}
                </Pressable>
              );
            })}
          </View>
          {quizChecked ? <View style={[styles.feedback, { backgroundColor: answerCorrect ? colors.successSurface : '#FFF3D5' }]}><Text style={styles.feedbackEmoji}>{answerCorrect ? '🎉' : '💡'}</Text><View style={{ flex: 1 }}><Text style={[styles.feedbackTitle, { color: colors.text }]}>{answerCorrect ? 'To‘g‘ri!' : 'Yaxshi urinish!'}</Text><Text style={[styles.feedbackText, { color: colors.muted }]}>{answerCorrect ? 'Ha, repriza musiqa bo‘lagini qaytarishni bildiradi.' : 'To‘g‘ri javob — qaytarishni.'}</Text></View></View> : null}
        </View>
      ) : null}

      {step === REWARD_STEP ? (
        <Animated.View style={[styles.reward, { transform: [{ scale: rewardScale }] }]}>
          <Text style={styles.rewardEmoji}>{rewardStars === 3 ? '🏆' : '🌟'}</Text>
          <Text style={styles.rewardKicker}>12-DARS TAYYOR!</Text>
          <Text style={styles.rewardTitle}>Reprizani bilding!</Text>
          <View style={styles.rewardStars}>{[0, 1, 2].map((star) => <Ionicons key={star} name={star < rewardStars ? 'star' : 'star-outline'} size={36} color="#F2B01E" />)}</View>
          <Text style={styles.rewardText}>Endi qaytarish belgisini ko‘rsang, musiqa bo‘lagini yana ijro qilish kerakligini bilasan.</Text>
        </Animated.View>
      ) : null}

      <Pressable disabled={buttonDisabled} onPress={goForward} style={({ pressed }) => [styles.primaryButton, buttonDisabled && styles.primaryDisabled, pressed && !buttonDisabled && styles.pressed]}>
        <Text style={styles.primaryText}>{buttonLabel}</Text><Ionicons name={isFinalStep ? 'checkmark-circle' : 'arrow-forward'} size={21} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 14, gap: 12 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 44, height: 44, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  lessonBadge: { height: 38, borderRadius: 14, paddingHorizontal: 13, backgroundColor: '#EEE9FF', flexDirection: 'row', alignItems: 'center', gap: 6 },
  lessonBadgeText: { color: '#6C5CE7', fontSize: 12, fontWeight: '900' },
  starBadge: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#FFF4CC', alignItems: 'center', justifyContent: 'center' },
  progressDots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  progressDot: { width: 18, height: 6, borderRadius: 999 },
  progressDotCurrent: { width: 32 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  heroIcon: { width: 112, height: 112, borderRadius: 38, backgroundColor: '#EEE9FF', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  heroEmoji: { fontSize: 55 },
  heroKicker: { color: '#6C5CE7', fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textAlign: 'center' },
  heroTitle: { marginTop: 8, color: '#2E2940', fontSize: 34, fontWeight: '900', textAlign: 'center' },
  heroText: { marginTop: 12, color: '#716A80', fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 420 },
  card: { flex: 1, borderRadius: 28, borderWidth: 1, padding: 18, overflow: 'hidden' },
  stepLabel: { color: '#6C5CE7', fontSize: 11, fontWeight: '900', letterSpacing: 0.7, marginBottom: 5 },
  sectionTitle: { fontSize: 23, lineHeight: 29, fontWeight: '900' },
  sectionText: { marginTop: 7, fontSize: 13, lineHeight: 20 },
  symbolStage: { height: 122, borderRadius: 22, backgroundColor: '#F8F5FF', marginTop: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  symbolImage: { width: '78%', height: '78%' },
  fallbackSymbol: { fontSize: 60 },
  flowRow: { marginTop: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  flowPart: { minWidth: 67, borderRadius: 16, backgroundColor: '#F5F2FA', paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center' },
  flowRepeat: { backgroundColor: '#EEE9FF' },
  flowEmoji: { fontSize: 20 },
  flowText: { marginTop: 3, color: '#514A60', fontSize: 10, fontWeight: '900' },
  tipBox: { marginTop: 14, borderRadius: 17, padding: 12, backgroundColor: '#FFF4CC', flexDirection: 'row', alignItems: 'center', gap: 9 },
  tipEmoji: { fontSize: 20 },
  tipText: { flex: 1, color: '#6A5B28', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  sequenceStrip: { flexDirection: 'row', gap: 7, justifyContent: 'center', marginTop: 15 },
  sequenceCell: { width: 55, height: 58, borderRadius: 17, backgroundColor: '#F0EDF5', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  sequenceCellActive: { borderColor: '#6C5CE7', backgroundColor: '#EEE9FF' },
  sequenceCellDone: { backgroundColor: '#DFF7EC' },
  sequenceCellText: { color: '#655F75', fontSize: 21, fontWeight: '900' },
  sequenceCellTextDone: { color: '#16805A' },
  repeatMarker: { position: 'absolute', right: -8, top: -9, color: '#6C5CE7', fontSize: 17, fontWeight: '900' },
  sequenceStatus: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 15, padding: 12, borderRadius: 18, backgroundColor: '#F8F5FF' },
  sequenceCount: { width: 49, height: 49, borderRadius: 17, backgroundColor: '#6C5CE7', alignItems: 'center', justifyContent: 'center' },
  sequenceCountDone: { backgroundColor: '#16805A' },
  sequenceCountText: { color: '#fff', fontWeight: '900' },
  sequenceTitle: { color: '#393246', fontSize: 13, fontWeight: '900' },
  sequenceSub: { marginTop: 3, color: '#777083', fontSize: 11, lineHeight: 16 },
  partButtons: { flexDirection: 'row', gap: 11, marginTop: 14 },
  partButton: { flex: 1, minHeight: 100, borderRadius: 23, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'transparent' },
  partA: { backgroundColor: '#E3F4FF' },
  partB: { backgroundColor: '#FFE7EE' },
  partExpected: { borderColor: '#6C5CE7', transform: [{ scale: 1.02 }] },
  partEmoji: { fontSize: 31 },
  partTitle: { marginTop: 6, color: '#393246', fontSize: 14, fontWeight: '900' },
  resetButton: { alignSelf: 'center', marginTop: 12, paddingHorizontal: 13, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  resetText: { color: '#6C5CE7', fontSize: 12, fontWeight: '900' },
  videoTabs: { flexDirection: 'row', gap: 7, marginTop: 13 },
  videoTab: { flex: 1, minHeight: 37, borderRadius: 13, backgroundColor: '#F0EDF5', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  videoTabActive: { backgroundColor: '#6C5CE7' },
  videoTabText: { color: '#655F75', fontSize: 10, fontWeight: '900' },
  videoTabTextActive: { color: '#fff' },
  videoFrame: { marginTop: 10, height: 185, borderRadius: 20, overflow: 'hidden', backgroundColor: '#17131D' },
  video: { width: '100%', height: '100%' },
  audioWrap: { marginTop: 10 },
  emptyBox: { height: 150, borderRadius: 18, backgroundColor: '#F0EDF5', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  emptyText: { marginTop: 7, fontWeight: '800' },
  quizIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#EEE9FF', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 9 },
  quizEmoji: { fontSize: 29 },
  quizTitle: { fontSize: 22, lineHeight: 29, fontWeight: '900', textAlign: 'center', marginBottom: 14 },
  quizOptions: { gap: 9 },
  quizOption: { minHeight: 64, borderRadius: 20, borderWidth: 2, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  quizOptionEmoji: { fontSize: 24 },
  quizOptionText: { flex: 1, fontSize: 14, fontWeight: '900' },
  feedback: { marginTop: 12, borderRadius: 18, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackEmoji: { fontSize: 24 },
  feedbackTitle: { fontWeight: '900', fontSize: 13 },
  feedbackText: { marginTop: 2, fontSize: 11, lineHeight: 16 },
  reward: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  rewardEmoji: { fontSize: 70 },
  rewardKicker: { marginTop: 12, color: '#6C5CE7', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  rewardTitle: { marginTop: 8, color: '#2E2940', fontSize: 30, fontWeight: '900', textAlign: 'center' },
  rewardStars: { flexDirection: 'row', gap: 5, marginTop: 14 },
  rewardText: { marginTop: 13, color: '#716A80', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  primaryButton: { minHeight: 56, borderRadius: 20, backgroundColor: '#6C5CE7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  primaryDisabled: { opacity: 0.42 },
  primaryText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.8, transform: [{ scale: 0.985 }] },
});
