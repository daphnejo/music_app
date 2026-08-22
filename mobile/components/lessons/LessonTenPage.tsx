import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useStars } from '@/context/StarsContext';
import { useTheme } from '@/context/ThemeContext';
import type { BlockAsset } from '@/types/content';

type Props = {
  videos: BlockAsset[];
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
const BEAT_TARGET = 9;

const BEATS = [
  { label: '1-i', role: 'KUCHLI', arrow: '↓', color: '#7C52B8', soft: '#F2E9FF' },
  { label: '2-i', role: 'KUCHSIZ', arrow: '→', color: '#2483C5', soft: '#E3F4FF' },
  { label: '3-i', role: 'KUCHSIZ', arrow: '↑', color: '#16805A', soft: '#DFF7EC' },
] as const;

const QUIZ_OPTIONS = [
  { id: 'two', label: '2 ta hissa', emoji: '✌️', correct: false },
  { id: 'three', label: '3 ta hissa', emoji: '3️⃣', correct: true },
  { id: 'four', label: '4 ta hissa', emoji: '4️⃣', correct: false },
];

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

export function LessonTenPage({ videos, completed, saving, onBack, onNext, onComplete, resolveUrl }: Props) {
  const { colors } = useTheme();
  const { awardLessonStars } = useStars();
  const [step, setStep] = useState(0);
  const [beatIndex, setBeatIndex] = useState(0);
  const [beatMistakes, setBeatMistakes] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<'rhythm' | 'sing'>('rhythm');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.86)).current;

  const beatComplete = beatIndex >= BEAT_TARGET;
  const expectedBeatIndex = beatIndex % 3;
  const expectedBeat = BEATS[expectedBeatIndex];
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

  function pressBeat(index: number) {
    if (beatComplete) return;
    if (index === expectedBeatIndex) {
      setBeatIndex((value) => value + 1);
      return;
    }
    setBeatMistakes((value) => value + 1);
  }

  function checkQuiz() {
    if (!selectedQuizId || quizChecked) return;
    const selected = QUIZ_OPTIONS.find((option) => option.id === selectedQuizId);
    const stars: 2 | 3 = selected?.correct ? 3 : 2;
    setRewardStars(stars);
    awardLessonStars(10, stars);
    setQuizChecked(true);
  }

  function goForward() {
    if (step === 2 && !beatComplete) return;
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
    || (step === 2 && !beatComplete)
    || (step === QUIZ_STEP && !selectedQuizId)
    || (isFinalStep && completed && !onNext);

  const buttonLabel = step === 2 && !beatComplete
    ? `Navbat: ${expectedBeat.label}`
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

  const rhythmVideo = videos[0];
  const singingVideo = videos[3] ?? videos[1] ?? videos[0];
  const activeVideo = selectedVideo === 'rhythm' ? rhythmVideo : singingVideo;

  return (
    <View style={styles.page}>
      <View style={styles.topbar}>
        <Pressable onPress={goBack} style={[styles.navButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.lessonBadge}>
          <Ionicons name="triangle-outline" size={16} color="#7C52B8" />
          <Text style={styles.lessonBadgeText}>10-DARS</Text>
        </View>
        <View style={styles.starBadge}><Ionicons name="star" size={22} color="#F2B01E" /></View>
      </View>

      <View style={styles.progressDots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              { backgroundColor: index <= step ? '#7C52B8' : colors.border },
              index === step && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Text style={styles.heroEmoji}>💃</Text></View>
          <Text style={styles.heroKicker}>BIR — IKKI — UCH 🎵</Text>
          <Text style={styles.heroTitle}>3/4 o‘lchovi</Text>
          <Text style={styles.heroText}>Endi musiqani uch hissadan sanaymiz: 1-i, 2-i, 3-i. Birinchi urish kuchli bo‘ladi!</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>BILIB OLAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Bir taktda 3 ta hissa</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>3/4 o‘lchovida bir takt ichida uchta hissa sanaladi: 1-i, 2-i, 3-i.</Text>

          <View style={styles.meterRow}>
            <View style={styles.fractionCard}>
              <Text style={styles.fractionTop}>3</Text>
              <View style={styles.fractionLine} />
              <Text style={styles.fractionBottom}>4</Text>
            </View>
            <View style={styles.meterInfo}>
              <View style={styles.infoRow}><View style={styles.infoNumber}><Text style={styles.infoNumberText}>3</Text></View><Text style={styles.infoText}>taktdagi hissalar soni</Text></View>
              <View style={styles.infoRow}><View style={[styles.infoNumber, styles.infoNumberSoft]}><Text style={styles.infoNumberText}>4</Text></View><Text style={styles.infoText}>har bir hissaning cho‘zimi</Text></View>
            </View>
          </View>

          <View style={styles.beatDemoRow}>
            {BEATS.map((beat, index) => (
              <View key={beat.label} style={[styles.beatDemo, { backgroundColor: beat.soft, borderColor: index === 0 ? beat.color : 'transparent' }]}>
                <Text style={[styles.beatDemoArrow, { color: beat.color }]}>{beat.arrow}</Text>
                <Text style={styles.beatDemoTitle}>{beat.label}</Text>
                <Text style={[styles.beatDemoSub, { color: beat.color }]}>{beat.role}</Text>
              </View>
            ))}
          </View>

          <View style={styles.tipBox}><Text style={styles.tipEmoji}>💡</Text><Text style={styles.tipText}>1-i — kuchli. 2-i va 3-i — kuchsiz. Sanash: “1-i, 2-i, 3-i”.</Text></View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>DIRIJORLIK O‘YINI</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Uch urishni boshqar 👋</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Uch takt bajaramiz. Navbatdagi hissani to‘g‘ri bos: 1-i → 2-i → 3-i.</Text>

          <View style={styles.beatStatus}>
            <View style={[styles.beatCounter, beatComplete && styles.beatCounterDone]}>
              <Text style={styles.beatCounterText}>{beatComplete ? '✓' : `${beatIndex}/${BEAT_TARGET}`}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.beatStatusTitle}>{beatComplete ? 'Ajoyib! 3 takt tayyor.' : `${expectedBeat.arrow} ${expectedBeat.label} — ${expectedBeat.role}`}</Text>
              <Text style={styles.beatStatusSub}>{beatMistakes ? `${beatMistakes} marta adashding — davom et!` : `Takt ${Math.min(3, Math.floor(beatIndex / 3) + 1)} / 3`}</Text>
            </View>
          </View>

          <View style={styles.beatButtons}>
            {BEATS.map((beat, index) => (
              <Pressable
                key={beat.label}
                onPress={() => pressBeat(index)}
                style={({ pressed }) => [
                  styles.beatButton,
                  { backgroundColor: beat.soft, borderColor: beat.color },
                  expectedBeatIndex === index && !beatComplete && styles.expectedBeat,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.bigArrow, { color: beat.color }]}>{beat.arrow}</Text>
                <Text style={styles.beatButtonTitle}>{beat.label}</Text>
                <Text style={[styles.beatButtonSub, { color: beat.color }]}>{beat.role}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.measureProgress}>
            {[0, 1, 2].map((measure) => {
              const done = beatIndex >= (measure + 1) * 3;
              const active = !done && beatIndex >= measure * 3;
              return <View key={measure} style={[styles.measurePill, done && styles.measurePillDone, active && styles.measurePillActive]}><Text style={[styles.measurePillText, done && styles.measurePillTextDone]}>Takt {measure + 1}</Text></View>;
            })}
          </View>

          <Pressable onPress={() => { setBeatIndex(0); setBeatMistakes(0); }} style={styles.resetButton}>
            <Ionicons name="refresh" size={18} color="#7C52B8" />
            <Text style={styles.resetText}>Qaytadan boshlash</Text>
          </Pressable>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>KO‘R VA TAKRORLA</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>3 hissali ritm 🎬</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Taqdimotdagi mashqni ko‘r. Ritmni sanab, keyin birga kuylab ko‘r.</Text>

          <View style={styles.videoTabs}>
            <Pressable onPress={() => setSelectedVideo('rhythm')} style={[styles.videoTab, selectedVideo === 'rhythm' && styles.videoTabActive]}><Text style={[styles.videoTabText, selectedVideo === 'rhythm' && styles.videoTabTextActive]}>🥁 Ritm</Text></Pressable>
            <Pressable onPress={() => setSelectedVideo('sing')} style={[styles.videoTab, selectedVideo === 'sing' && styles.videoTabActive]}><Text style={[styles.videoTabText, selectedVideo === 'sing' && styles.videoTabTextActive]}>🎤 Kuylash</Text></Pressable>
          </View>

          {activeVideo ? (
            <View style={styles.videoFrame}>
              <PracticeVideo key={activeVideo.id} url={resolveUrl(activeVideo.url)} />
            </View>
          ) : (
            <View style={styles.noVideo}><Ionicons name="videocam-off-outline" size={32} color={colors.muted} /><Text style={[styles.noVideoText, { color: colors.muted }]}>Video topilmadi</Text></View>
          )}

          <View style={styles.tipBox}><Text style={styles.tipEmoji}>👏</Text><Text style={styles.tipText}>Video bilan birga sanagin: “1-i, 2-i, 3-i”.</Text></View>
        </View>
      ) : null}

      {step === QUIZ_STEP ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.quizIcon}><Text style={styles.quizEmoji}>🧠</Text></View>
          <Text style={styles.stepLabel}>MINI SAVOL</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>3/4 o‘lchovida bir taktda nechta hissa bor?</Text>
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
              <View style={{ flex: 1 }}><Text style={[styles.feedbackTitle, { color: colors.text }]}>{answerCorrect ? 'To‘g‘ri!' : 'Yaxshi urinish!'}</Text><Text style={[styles.feedbackText, { color: colors.muted }]}>{answerCorrect ? 'Ha! 3/4 o‘lchovida 3 ta hissa bor.' : 'To‘g‘ri javob — 3 ta hissa.'}</Text></View>
            </View>
          ) : null}
        </View>
      ) : null}

      {step === REWARD_STEP ? (
        <View style={styles.rewardCard}>
          <Animated.View style={{ alignItems: 'center', transform: [{ scale: rewardScale }] }}>
            <Text style={styles.rewardEmoji}>{rewardStars === 3 ? '🎉' : '🌟'}</Text>
            <Text style={[styles.rewardTitle, { color: colors.text }]}>{rewardStars === 3 ? 'Ajoyib!' : 'Barakalla!'}</Text>
            <Text style={[styles.rewardText, { color: colors.muted }]}>3 hissali o‘lchovni sanash va boshqarishni o‘rganding!</Text>
            <View style={styles.starsRow}>{[0, 1, 2].map((star) => <Ionicons key={star} name={star < rewardStars ? 'star' : 'star-outline'} size={40} color={star < rewardStars ? '#F2B01E' : '#B9B2C7'} />)}</View>
            <View style={styles.rewardPill}><Ionicons name="trophy" size={20} color="#7C52B8" /><Text style={styles.rewardPillText}>+{rewardStars} yulduz</Text></View>
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
  stepLabel: { color: '#7C52B8', fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  sectionTitle: { fontSize: 28, lineHeight: 34, fontWeight: '900', marginTop: 7 },
  sectionText: { fontSize: 15, lineHeight: 23, fontWeight: '600', marginTop: 8 },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 18 },
  fractionCard: { width: 92, height: 128, borderRadius: 27, backgroundColor: '#F2E9FF', alignItems: 'center', justifyContent: 'center' },
  fractionTop: { color: '#7C52B8', fontSize: 40, lineHeight: 43, fontWeight: '900' },
  fractionLine: { width: 46, height: 4, borderRadius: 999, backgroundColor: '#7C52B8', marginVertical: 3 },
  fractionBottom: { color: '#7C52B8', fontSize: 40, lineHeight: 43, fontWeight: '900' },
  meterInfo: { flex: 1, gap: 11 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  infoNumber: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#7C52B8', alignItems: 'center', justifyContent: 'center' },
  infoNumberSoft: { backgroundColor: '#2483C5' },
  infoNumberText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  infoText: { flex: 1, color: '#655F75', fontSize: 11, lineHeight: 16, fontWeight: '700' },
  beatDemoRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  beatDemo: { flex: 1, minHeight: 112, borderRadius: 21, borderWidth: 2, alignItems: 'center', justifyContent: 'center', padding: 8 },
  beatDemoArrow: { fontSize: 28, fontWeight: '900' },
  beatDemoTitle: { color: '#302B3D', fontSize: 17, fontWeight: '900', marginTop: 2 },
  beatDemoSub: { fontSize: 9, fontWeight: '900', marginTop: 3 },
  tipBox: { marginTop: 15, borderRadius: 18, padding: 12, backgroundColor: '#FFF1BE', flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipEmoji: { fontSize: 24 },
  tipText: { flex: 1, color: '#6D5315', fontSize: 11, lineHeight: 17, fontWeight: '700' },
  beatStatus: { marginTop: 17, borderRadius: 20, padding: 13, backgroundColor: '#F2E9FF', flexDirection: 'row', alignItems: 'center', gap: 11 },
  beatCounter: { width: 50, height: 50, borderRadius: 17, backgroundColor: '#7C52B8', alignItems: 'center', justifyContent: 'center' },
  beatCounterDone: { backgroundColor: '#16805A' },
  beatCounterText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  beatStatusTitle: { color: '#302B3D', fontSize: 13, lineHeight: 18, fontWeight: '900' },
  beatStatusSub: { color: '#716A80', fontSize: 10, fontWeight: '700', marginTop: 2 },
  beatButtons: { flexDirection: 'row', gap: 8, marginTop: 17 },
  beatButton: { flex: 1, minHeight: 126, borderRadius: 23, borderWidth: 2, alignItems: 'center', justifyContent: 'center', padding: 8 },
  expectedBeat: { transform: [{ scale: 1.035 }], borderWidth: 4 },
  bigArrow: { fontSize: 34, lineHeight: 38, fontWeight: '900' },
  beatButtonTitle: { color: '#302B3D', fontSize: 20, fontWeight: '900', marginTop: 4 },
  beatButtonSub: { fontSize: 9, fontWeight: '900', marginTop: 3 },
  measureProgress: { flexDirection: 'row', gap: 7, marginTop: 14 },
  measurePill: { flex: 1, minHeight: 34, borderRadius: 12, backgroundColor: '#F0EDF4', alignItems: 'center', justifyContent: 'center' },
  measurePillActive: { backgroundColor: '#F2E9FF' },
  measurePillDone: { backgroundColor: '#DFF7EC' },
  measurePillText: { color: '#81798E', fontSize: 9, fontWeight: '900' },
  measurePillTextDone: { color: '#16805A' },
  resetButton: { marginTop: 12, minHeight: 44, borderRadius: 15, backgroundColor: '#F2E9FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  resetText: { color: '#7C52B8', fontSize: 11, fontWeight: '900' },
  videoTabs: { flexDirection: 'row', gap: 8, marginTop: 17 },
  videoTab: { flex: 1, minHeight: 45, borderRadius: 15, backgroundColor: '#F0EDF4', alignItems: 'center', justifyContent: 'center' },
  videoTabActive: { backgroundColor: '#F2E9FF' },
  videoTabText: { color: '#81798E', fontSize: 11, fontWeight: '900' },
  videoTabTextActive: { color: '#7C52B8' },
  videoFrame: { marginTop: 13, borderRadius: 22, overflow: 'hidden', backgroundColor: '#17151D' },
  video: { width: '100%', height: 220 },
  noVideo: { height: 180, marginTop: 13, borderRadius: 22, backgroundColor: '#F0EDF4', alignItems: 'center', justifyContent: 'center', gap: 8 },
  noVideoText: { fontSize: 12, fontWeight: '800' },
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
  rewardPillText: { color: '#65429A', fontSize: 14, fontWeight: '900' },
  completeButton: { minHeight: 60, borderRadius: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 18 },
  completeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
