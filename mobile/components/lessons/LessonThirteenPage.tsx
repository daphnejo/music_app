import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useStars } from '@/context/StarsContext';
import { useTheme } from '@/context/ThemeContext';
import type { BlockAsset } from '@/types/content';

type Props = {
  audios: BlockAsset[];
  videos: BlockAsset[];
  completed: boolean;
  saving: boolean;
  onBack: () => void;
  onNext?: () => void;
  onComplete: () => void;
  resolveUrl: (url: string) => string;
};

const GAMMA = [
  { note: 'Do', degree: 'I', color: '#6C5CE7', soft: '#EEE9FF' },
  { note: 'Re', degree: 'II', color: '#2483C5', soft: '#E3F4FF' },
  { note: 'Mi', degree: 'III', color: '#16805A', soft: '#DFF7EC' },
  { note: 'Fa', degree: 'IV', color: '#A66A00', soft: '#FFF1BE' },
  { note: 'Sol', degree: 'V', color: '#D27A24', soft: '#FFF0DF' },
  { note: 'Lya', degree: 'VI', color: '#C14E70', soft: '#FFE7EE' },
  { note: 'Si', degree: 'VII', color: '#7C52B8', soft: '#F0E8FF' },
  { note: 'Do', degree: 'VIII', color: '#23866A', soft: '#E2F7F0' },
] as const;

const QUIZ_OPTIONS = [
  { id: 'degree', label: 'Pog‘onalar', emoji: '🪜', correct: true },
  { id: 'bars', label: 'Taktlar', emoji: '🥁', correct: false },
  { id: 'keys', label: 'Klavishlar', emoji: '🎹', correct: false },
];

const QUIZ_STEP = 5;
const REWARD_STEP = 6;
const TOTAL_STEPS = 7;

function GammaSound({ index, url, active, done, onPress }: { index: number; url?: string; active?: boolean; done?: boolean; onPress?: (index: number) => void }) {
  const item = GAMMA[index];
  const player = useAudioPlayer(url ?? null);
  const status = useAudioPlayerStatus(player);

  function play() {
    if (url) {
      player.seekTo(0);
      player.play();
    }
    onPress?.(index);
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.degree} pog‘ona, ${item.note}`}
      onPress={play}
      style={({ pressed }) => [
        styles.noteChip,
        { backgroundColor: done ? '#DFF7EC' : item.soft, borderColor: active || status.playing ? item.color : 'transparent' },
        active && styles.noteChipActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.degreeBubble, { backgroundColor: done ? '#16805A' : item.color }]}>
        <Text style={styles.degreeText}>{done ? '✓' : item.degree}</Text>
      </View>
      <Text style={styles.noteName}>{item.note}</Text>
      <Ionicons name={status.playing ? 'volume-high' : 'musical-note'} size={18} color={done ? '#16805A' : item.color} />
    </Pressable>
  );
}

function PracticeVideo({ url }: { url: string }) {
  const player = useVideoPlayer(url, (instance) => {
    instance.loop = false;
  });

  return <VideoView player={player} style={styles.video} contentFit="contain" nativeControls allowsFullscreen />;
}

export function LessonThirteenPage({ audios, videos, completed, saving, onBack, onNext, onComplete, resolveUrl }: Props) {
  const { colors } = useTheme();
  const { awardLessonStars } = useStars();
  const [step, setStep] = useState(0);
  const [climbIndex, setClimbIndex] = useState(0);
  const [climbMistakes, setClimbMistakes] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<'sing' | 'rhythm'>('sing');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.86)).current;

  const climbComplete = climbIndex >= GAMMA.length;
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

  function pressClimb(index: number) {
    if (climbComplete) return;
    if (index === climbIndex) {
      setClimbIndex((value) => value + 1);
      return;
    }
    setClimbMistakes((value) => value + 1);
  }

  function checkQuiz() {
    if (!selectedQuizId || quizChecked) return;
    const selected = QUIZ_OPTIONS.find((option) => option.id === selectedQuizId);
    const stars: 2 | 3 = selected?.correct ? 3 : 2;
    setRewardStars(stars);
    awardLessonStars(13, stars);
    setQuizChecked(true);
  }

  function goForward() {
    if (step === 3 && !climbComplete) return;
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
    || (step === 3 && !climbComplete)
    || (step === QUIZ_STEP && !selectedQuizId)
    || (isFinalStep && completed && !onNext);

  const buttonLabel = step === 3 && !climbComplete
    ? `Navbat: ${GAMMA[Math.min(climbIndex, GAMMA.length - 1)].degree} — ${GAMMA[Math.min(climbIndex, GAMMA.length - 1)].note}`
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

  const singVideo = videos[0];
  const rhythmVideo = videos[2] ?? videos[1] ?? videos[0];
  const activeVideo = selectedVideo === 'sing' ? singVideo : rhythmVideo;

  return (
    <View style={styles.page}>
      <View style={styles.topbar}>
        <Pressable onPress={goBack} style={[styles.navButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.lessonBadge}><Ionicons name="trending-up" size={16} color="#6C5CE7" /><Text style={styles.lessonBadgeText}>13-DARS</Text></View>
        <View style={styles.starBadge}><Ionicons name="star" size={22} color="#F2B01E" /></View>
      </View>

      <View style={styles.progressDots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View key={index} style={[styles.progressDot, { backgroundColor: index <= step ? '#6C5CE7' : colors.border }, index === step && styles.progressDotCurrent]} />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Text style={styles.heroEmoji}>🌈</Text></View>
          <Text style={styles.heroKicker}>DO DAN YUQORI DO GACHA 🎵</Text>
          <Text style={styles.heroTitle}>Gamma</Text>
          <Text style={styles.heroText}>Notalar birin-ketin yuqoriga ko‘tariladi. Har qadamni pog‘ona deb ataymiz.</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>BILIB OLAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Gamma — tovushlar zinapoyasi</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Gamma bir notadan boshlanib, shu nota oktava yuqorida yana qaytarilguncha ketadigan tovushlar ketma-ketligidir.</Text>
          <View style={styles.stairPreview}>
            {GAMMA.map((item, index) => (
              <View key={`${item.degree}-${index}`} style={[styles.previewStep, { marginLeft: index * 9, backgroundColor: item.soft, borderColor: item.color }]}>
                <Text style={[styles.previewDegree, { color: item.color }]}>{item.degree}</Text>
                <Text style={styles.previewNote}>{item.note}</Text>
              </View>
            ))}
          </View>
          <View style={styles.tipBox}><Text style={styles.tipEmoji}>🪜</Text><Text style={styles.tipText}>Gammadagi nota qadamlari “pog‘onalar” deyiladi va rim raqamlari bilan belgilanadi.</Text></View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>TINGLAB KO‘R</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Do dan Do gacha 🎧</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Har pog‘onani bosib eshit. Taqdimotdagi real audio namunalar ishlatiladi.</Text>
          <View style={styles.noteGrid}>
            {GAMMA.map((item, index) => (
              <GammaSound key={`${item.degree}-${index}`} index={index} url={audios[index] ? resolveUrl(audios[index].url) : undefined} />
            ))}
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>GAMMA ZINAPOYASI</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Pog‘onama-pog‘ona chiq 🪜</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>I-pog‘onadan boshlang va VIII-pog‘onadagi yuqori Do gacha tartib bilan chiqing.</Text>
          <View style={styles.climbStatus}>
            <View style={[styles.climbCircle, climbComplete && styles.climbCircleDone]}><Text style={styles.climbCircleText}>{climbComplete ? '✓' : `${climbIndex}/8`}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.climbTitle}>{climbComplete ? 'Ajoyib! Gamma tepaga chiqdi.' : `Navbat: ${GAMMA[Math.min(climbIndex, 7)].degree} — ${GAMMA[Math.min(climbIndex, 7)].note}`}</Text><Text style={styles.climbSub}>{climbMistakes ? `${climbMistakes} marta adashding — davom et!` : 'Har pog‘ona bosilganda uning ovozi ham chiqadi.'}</Text></View>
          </View>
          <View style={styles.climbWrap}>
            {GAMMA.map((item, index) => (
              <View key={`${item.degree}-${index}`} style={{ marginLeft: index * 10 }}>
                <GammaSound
                  index={index}
                  url={audios[index] ? resolveUrl(audios[index].url) : undefined}
                  active={!climbComplete && index === climbIndex}
                  done={index < climbIndex || climbComplete}
                  onPress={pressClimb}
                />
              </View>
            ))}
          </View>
          <Pressable onPress={() => { setClimbIndex(0); setClimbMistakes(0); }} style={styles.resetButton}><Ionicons name="refresh" size={18} color="#6C5CE7" /><Text style={styles.resetText}>Qaytadan boshlash</Text></Pressable>
        </View>
      ) : null}

      {step === 4 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>KO‘R VA TAKRORLA</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Gamma bilan mashq 🎬</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Taqdimotdagi mashqni tanla: avval kuylashni, keyin ritmni kuzatib takrorla.</Text>
          <View style={styles.videoTabs}>
            <Pressable onPress={() => setSelectedVideo('sing')} style={[styles.videoTab, selectedVideo === 'sing' && styles.videoTabActive]}><Text style={[styles.videoTabText, selectedVideo === 'sing' && styles.videoTabTextActive]}>🎤 Kuylash</Text></Pressable>
            <Pressable onPress={() => setSelectedVideo('rhythm')} style={[styles.videoTab, selectedVideo === 'rhythm' && styles.videoTabActive]}><Text style={[styles.videoTabText, selectedVideo === 'rhythm' && styles.videoTabTextActive]}>🥁 Ritm</Text></Pressable>
          </View>
          {activeVideo ? <View style={styles.videoFrame}><PracticeVideo key={activeVideo.id} url={resolveUrl(activeVideo.url)} /></View> : <View style={styles.noVideo}><Ionicons name="videocam-off-outline" size={32} color={colors.muted} /><Text style={[styles.noVideoText, { color: colors.muted }]}>Video topilmadi</Text></View>}
          <View style={styles.tipBox}><Text style={styles.tipEmoji}>🎶</Text><Text style={styles.tipText}>Kuylaganda pog‘onalarni ham eslab bor: I, II, III, IV, V, VI, VII, VIII.</Text></View>
        </View>
      ) : null}

      {step === QUIZ_STEP ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.quizIcon}><Text style={styles.quizEmoji}>🧠</Text></View>
          <Text style={styles.stepLabel}>MINI SAVOL</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>Gammada nota qadamlari nima deb ataladi?</Text>
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
                    { borderColor: selected ? '#6C5CE7' : colors.border, backgroundColor: selected ? '#EEE9FF' : colors.surface },
                    showCorrect && { borderColor: colors.success, backgroundColor: colors.successSurface },
                    showWrong && { borderColor: '#E2A93B', backgroundColor: '#FFF3D5' },
                  ]}
                >
                  <Text style={styles.quizOptionEmoji}>{option.emoji}</Text>
                  <Text style={[styles.quizOptionText, { color: colors.text }]}>{option.label}</Text>
                  {selected && !quizChecked ? <Ionicons name="radio-button-on" size={22} color="#6C5CE7" /> : null}
                  {showCorrect ? <Ionicons name="checkmark-circle" size={24} color={colors.success} /> : null}
                  {showWrong ? <Ionicons name="close-circle" size={24} color="#D59A25" /> : null}
                </Pressable>
              );
            })}
          </View>
          {quizChecked ? <View style={[styles.feedback, { backgroundColor: answerCorrect ? colors.successSurface : '#FFF3D5' }]}><Text style={styles.feedbackEmoji}>{answerCorrect ? '🎉' : '💡'}</Text><View style={{ flex: 1 }}><Text style={[styles.feedbackTitle, { color: colors.text }]}>{answerCorrect ? 'To‘g‘ri!' : 'Yaxshi urinish!'}</Text><Text style={[styles.feedbackText, { color: colors.muted }]}>{answerCorrect ? 'Ha, gammadagi nota qadamlari pog‘onalar deyiladi.' : 'To‘g‘ri javob — Pog‘onalar.'}</Text></View></View> : null}
        </View>
      ) : null}

      {step === REWARD_STEP ? (
        <Animated.View style={[styles.rewardCard, { transform: [{ scale: rewardScale }] }]}> 
          <Text style={styles.rewardEmoji}>{rewardStars === 3 ? '🏆' : '🌟'}</Text>
          <Text style={styles.rewardKicker}>13-DARS TAYYOR!</Text>
          <Text style={styles.rewardTitle}>{rewardStars === 3 ? 'Gamma ustasi!' : 'Gamma bilan tanishding!'}</Text>
          <View style={styles.rewardStars}>{[0, 1, 2].map((index) => <Ionicons key={index} name={index < rewardStars ? 'star' : 'star-outline'} size={40} color={index < rewardStars ? '#F2B01E' : '#D8D2E2'} />)}</View>
          <Text style={styles.rewardText}>Do dan yuqori Do gacha gamma va uning pog‘onalarini bilib olding.</Text>
        </Animated.View>
      ) : null}

      <Pressable disabled={buttonDisabled} onPress={goForward} style={({ pressed }) => [styles.continueButton, buttonDisabled && styles.continueDisabled, pressed && !buttonDisabled && styles.pressed]}>
        <Text style={styles.continueText}>{buttonLabel}</Text>
        {!buttonDisabled ? <Ionicons name={isFinalStep ? 'checkmark-circle' : 'arrow-forward'} size={21} color="#fff" /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18, gap: 14 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  lessonBadge: { minHeight: 36, paddingHorizontal: 13, borderRadius: 15, backgroundColor: '#EEE9FF', flexDirection: 'row', alignItems: 'center', gap: 6 },
  lessonBadgeText: { color: '#6C5CE7', fontSize: 12, fontWeight: '900', letterSpacing: 0.7 },
  starBadge: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFF6D9', alignItems: 'center', justifyContent: 'center' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 7 },
  progressDot: { width: 8, height: 8, borderRadius: 99 },
  progressDotCurrent: { width: 24 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 15 },
  heroIcon: { width: 112, height: 112, borderRadius: 38, backgroundColor: '#EEE9FF', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  heroEmoji: { fontSize: 58 },
  heroKicker: { color: '#6C5CE7', fontSize: 12, fontWeight: '900', letterSpacing: 0.7, textAlign: 'center' },
  heroTitle: { color: '#2E2940', fontSize: 35, fontWeight: '900', marginTop: 7, textAlign: 'center' },
  heroText: { color: '#655F75', fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: 10, maxWidth: 330 },
  card: { flex: 1, borderRadius: 28, borderWidth: 1, padding: 17, overflow: 'hidden' },
  stepLabel: { color: '#6C5CE7', fontSize: 11, fontWeight: '900', letterSpacing: 0.8, marginBottom: 5 },
  sectionTitle: { fontSize: 23, lineHeight: 29, fontWeight: '900' },
  sectionText: { marginTop: 7, fontSize: 13, lineHeight: 19 },
  stairPreview: { marginTop: 14, gap: 5 },
  previewStep: { minHeight: 34, maxWidth: '82%', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  previewDegree: { width: 32, fontSize: 11, fontWeight: '900' },
  previewNote: { color: '#2E2940', fontSize: 14, fontWeight: '900' },
  tipBox: { marginTop: 13, padding: 12, borderRadius: 16, backgroundColor: '#F5F1FF', flexDirection: 'row', alignItems: 'center', gap: 9 },
  tipEmoji: { fontSize: 21 },
  tipText: { flex: 1, color: '#655F75', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  noteGrid: { marginTop: 14, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  noteChip: { width: '48%', minHeight: 64, borderRadius: 18, borderWidth: 2, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteChipActive: { transform: [{ scale: 1.02 }] },
  degreeBubble: { minWidth: 34, height: 34, paddingHorizontal: 5, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  degreeText: { color: '#fff', fontSize: 10, fontWeight: '900' },
  noteName: { flex: 1, color: '#2E2940', fontSize: 14, fontWeight: '900' },
  climbStatus: { marginTop: 13, padding: 12, borderRadius: 18, backgroundColor: '#F5F1FF', flexDirection: 'row', alignItems: 'center', gap: 10 },
  climbCircle: { width: 48, height: 48, borderRadius: 17, backgroundColor: '#6C5CE7', alignItems: 'center', justifyContent: 'center' },
  climbCircleDone: { backgroundColor: '#16805A' },
  climbCircleText: { color: '#fff', fontSize: 13, fontWeight: '900' },
  climbTitle: { color: '#2E2940', fontSize: 13, fontWeight: '900' },
  climbSub: { color: '#655F75', fontSize: 11, marginTop: 3 },
  climbWrap: { marginTop: 10, gap: 5 },
  resetButton: { marginTop: 9, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  resetText: { color: '#6C5CE7', fontSize: 12, fontWeight: '900' },
  videoTabs: { flexDirection: 'row', gap: 8, marginTop: 13 },
  videoTab: { flex: 1, minHeight: 42, borderRadius: 14, backgroundColor: '#F2EFF7', alignItems: 'center', justifyContent: 'center' },
  videoTabActive: { backgroundColor: '#6C5CE7' },
  videoTabText: { color: '#655F75', fontSize: 12, fontWeight: '900' },
  videoTabTextActive: { color: '#fff' },
  videoFrame: { marginTop: 12, borderRadius: 20, overflow: 'hidden', backgroundColor: '#17151D' },
  video: { width: '100%', aspectRatio: 16 / 9 },
  noVideo: { marginTop: 12, height: 155, borderRadius: 20, backgroundColor: '#F2EFF7', alignItems: 'center', justifyContent: 'center', gap: 7 },
  noVideoText: { fontSize: 12, fontWeight: '800' },
  quizIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: '#EEE9FF', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 8 },
  quizEmoji: { fontSize: 30 },
  quizTitle: { fontSize: 22, lineHeight: 29, fontWeight: '900', textAlign: 'center' },
  quizOptions: { gap: 9, marginTop: 16 },
  quizOption: { minHeight: 62, borderRadius: 18, borderWidth: 2, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  quizOptionEmoji: { fontSize: 25 },
  quizOptionText: { flex: 1, fontSize: 14, fontWeight: '900' },
  feedback: { marginTop: 12, borderRadius: 17, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  feedbackEmoji: { fontSize: 25 },
  feedbackTitle: { fontSize: 13, fontWeight: '900' },
  feedbackText: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  rewardCard: { flex: 1, borderRadius: 30, backgroundColor: '#F5F1FF', alignItems: 'center', justifyContent: 'center', padding: 24 },
  rewardEmoji: { fontSize: 66 },
  rewardKicker: { color: '#6C5CE7', fontSize: 11, fontWeight: '900', letterSpacing: 0.8, marginTop: 10 },
  rewardTitle: { color: '#2E2940', fontSize: 26, fontWeight: '900', textAlign: 'center', marginTop: 5 },
  rewardStars: { flexDirection: 'row', gap: 5, marginTop: 15 },
  rewardText: { color: '#655F75', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 13 },
  continueButton: { minHeight: 56, borderRadius: 20, backgroundColor: '#6C5CE7', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  continueDisabled: { backgroundColor: '#C8C2D2' },
  continueText: { color: '#fff', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
