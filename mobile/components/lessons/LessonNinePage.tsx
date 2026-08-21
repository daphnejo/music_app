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
const BEAT_TARGET = 8;

const QUIZ_OPTIONS = [
  { id: 'two', label: '2 ta hissa', emoji: '✌️', correct: true },
  { id: 'three', label: '3 ta hissa', emoji: '3️⃣', correct: false },
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

export function LessonNinePage({ videos, completed, saving, onBack, onNext, onComplete, resolveUrl }: Props) {
  const { colors } = useTheme();
  const { awardLessonStars } = useStars();
  const [step, setStep] = useState(0);
  const [beatIndex, setBeatIndex] = useState(0);
  const [beatMistakes, setBeatMistakes] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<'rhythm' | 'conduct'>('rhythm');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.86)).current;

  const beatComplete = beatIndex >= BEAT_TARGET;
  const isFinalStep = step === REWARD_STEP;
  const expectedStrong = beatIndex % 2 === 0;

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

  function pressBeat(kind: 'strong' | 'weak') {
    if (beatComplete) return;
    const correct = (kind === 'strong') === expectedStrong;
    if (correct) {
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
    awardLessonStars(9, stars);
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
    ? `Navbat: ${expectedStrong ? '1-i — kuchli' : '2-i — kuchsiz'}`
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
  const conductVideo = videos[3] ?? videos[1] ?? videos[0];
  const activeVideo = selectedVideo === 'rhythm' ? rhythmVideo : conductVideo;

  return (
    <View style={styles.page}>
      <View style={styles.topbar}>
        <Pressable onPress={goBack} style={[styles.navButton, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.lessonBadge}>
          <Ionicons name="pulse" size={16} color="#D27A24" />
          <Text style={styles.lessonBadgeText}>9-DARS</Text>
        </View>
        <View style={styles.starBadge}><Ionicons name="star" size={22} color="#F2B01E" /></View>
      </View>

      <View style={styles.progressDots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              { backgroundColor: index <= step ? '#D27A24' : colors.border },
              index === step && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Text style={styles.heroEmoji}>🥁</Text></View>
          <Text style={styles.heroKicker}>BIR — IKKI, BIR — IKKI 👏</Text>
          <Text style={styles.heroTitle}>2/4 o‘lchovi va takt</Text>
          <Text style={styles.heroText}>Musiqani ikki hissadan sanashni, kuchli va kuchsiz urishni birga mashq qilamiz.</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>BILIB OLAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Har taktda 2 ta hissa</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>2/4 o‘lchovida bir takt ichida ikki hissa bor. Birinchi hissa kuchli, ikkinchisi kuchsiz.</Text>

          <View style={styles.meterRow}>
            <View style={styles.fractionCard}>
              <Text style={styles.fractionTop}>2</Text>
              <View style={styles.fractionLine} />
              <Text style={styles.fractionBottom}>4</Text>
            </View>
            <View style={styles.meterInfo}>
              <View style={styles.infoRow}><View style={styles.infoNumber}><Text style={styles.infoNumberText}>2</Text></View><Text style={styles.infoText}>taktdagi hissalar soni</Text></View>
              <View style={styles.infoRow}><View style={[styles.infoNumber, styles.infoNumberSoft]}><Text style={styles.infoNumberText}>4</Text></View><Text style={styles.infoText}>har bir hissaning cho‘zimi</Text></View>
            </View>
          </View>

          <View style={styles.measureDemo}>
            <View style={[styles.beatDemo, styles.strongDemo]}><Text style={styles.beatDemoArrow}>↓</Text><Text style={styles.beatDemoTitle}>1-i</Text><Text style={styles.beatDemoSub}>KUCHLI</Text></View>
            <View style={styles.taktLine} />
            <View style={[styles.beatDemo, styles.weakDemo]}><Text style={styles.beatDemoArrow}>↑</Text><Text style={styles.beatDemoTitle}>2-i</Text><Text style={styles.beatDemoSub}>KUCHSIZ</Text></View>
          </View>

          <View style={styles.tipBox}><Text style={styles.tipEmoji}>💡</Text><Text style={styles.tipText}>Ikki kuchli hissa oralig‘i bir takt bo‘ladi. Taktlar nota yozuvida chiziq bilan ajratiladi.</Text></View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>DIRIJORLIK O‘YINI</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>1-i, 2-i ni urib ko‘r 👋</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>To‘rt takt bajaramiz. Navbatdagi hissani to‘g‘ri bos: 1-i kuchli, 2-i kuchsiz.</Text>

          <View style={styles.beatStatus}>
            <View style={[styles.beatCounter, beatComplete && styles.beatCounterDone]}>
              <Text style={styles.beatCounterText}>{beatComplete ? '✓' : `${beatIndex}/${BEAT_TARGET}`}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.beatStatusTitle}>{beatComplete ? 'Ajoyib! 4 takt tayyor.' : `Navbat: ${expectedStrong ? '↓ 1-i — KUCHLI' : '↑ 2-i — KUCHSIZ'}`}</Text>
              <Text style={styles.beatStatusSub}>{beatMistakes ? `${beatMistakes} marta adashding — davom et!` : `Takt ${Math.min(4, Math.floor(beatIndex / 2) + 1)} / 4`}</Text>
            </View>
          </View>

          <View style={styles.beatButtons}>
            <Pressable
              onPress={() => pressBeat('strong')}
              style={({ pressed }) => [styles.beatButton, styles.strongButton, expectedStrong && !beatComplete && styles.expectedBeat, pressed && styles.pressed]}
            >
              <Text style={styles.bigArrow}>↓</Text>
              <Text style={styles.beatButtonTitle}>1-i</Text>
              <Text style={styles.beatButtonSub}>KUCHLI</Text>
            </Pressable>
            <Pressable
              onPress={() => pressBeat('weak')}
              style={({ pressed }) => [styles.beatButton, styles.weakButton, !expectedStrong && !beatComplete && styles.expectedBeat, pressed && styles.pressed]}
            >
              <Text style={styles.bigArrow}>↑</Text>
              <Text style={styles.beatButtonTitle}>2-i</Text>
              <Text style={styles.beatButtonSub}>KUCHSIZ</Text>
            </Pressable>
          </View>

          <View style={styles.measureProgress}>
            {[0, 1, 2, 3].map((measure) => {
              const done = beatIndex >= (measure + 1) * 2;
              const active = !done && beatIndex >= measure * 2;
              return <View key={measure} style={[styles.measurePill, done && styles.measurePillDone, active && styles.measurePillActive]}><Text style={[styles.measurePillText, done && styles.measurePillTextDone]}>Takt {measure + 1}</Text></View>;
            })}
          </View>

          <Pressable onPress={() => { setBeatIndex(0); setBeatMistakes(0); }} style={styles.resetButton}>
            <Ionicons name="refresh" size={18} color="#D27A24" />
            <Text style={styles.resetText}>Qaytadan boshlash</Text>
          </Pressable>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>KO‘R VA TAKRORLA</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ritm mashqi 🎬</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Taqdimotdagi mashqni ko‘r. Avval ritmni kuzat, keyin 1-i / 2-i deb birga takrorla.</Text>

          <View style={styles.videoTabs}>
            <Pressable onPress={() => setSelectedVideo('rhythm')} style={[styles.videoTab, selectedVideo === 'rhythm' && styles.videoTabActive]}><Text style={[styles.videoTabText, selectedVideo === 'rhythm' && styles.videoTabTextActive]}>🥁 Ritm</Text></Pressable>
            <Pressable onPress={() => setSelectedVideo('conduct')} style={[styles.videoTab, selectedVideo === 'conduct' && styles.videoTabActive]}><Text style={[styles.videoTabText, selectedVideo === 'conduct' && styles.videoTabTextActive]}>👋 Dirijorlik</Text></Pressable>
          </View>

          {activeVideo ? (
            <View style={styles.videoFrame}>
              <PracticeVideo key={activeVideo.id} url={resolveUrl(activeVideo.url)} />
            </View>
          ) : (
            <View style={styles.noVideo}><Ionicons name="videocam-off-outline" size={32} color={colors.muted} /><Text style={[styles.noVideoText, { color: colors.muted }]}>Video topilmadi</Text></View>
          )}

          <View style={styles.tipBox}><Text style={styles.tipEmoji}>👏</Text><Text style={styles.tipText}>Video bilan birga sanagin: “1-i, 2-i, 1-i, 2-i”.</Text></View>
        </View>
      ) : null}

      {step === QUIZ_STEP ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.quizIcon}><Text style={styles.quizEmoji}>🧠</Text></View>
          <Text style={styles.stepLabel}>MINI SAVOL</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>2/4 o‘lchovida bir taktda nechta hissa bor?</Text>
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
                    { borderColor: selected ? '#D27A24' : colors.border, backgroundColor: selected ? '#FFF0DF' : colors.surface },
                    showCorrect && { borderColor: colors.success, backgroundColor: colors.successSurface },
                    showWrong && { borderColor: '#E2A93B', backgroundColor: '#FFF3D5' },
                  ]}
                >
                  <Text style={styles.quizOptionEmoji}>{option.emoji}</Text>
                  <Text style={[styles.quizOptionText, { color: colors.text }]}>{option.label}</Text>
                  {selected && !quizChecked ? <Ionicons name="radio-button-on" size={22} color="#D27A24" /> : null}
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
                <Text style={[styles.feedbackText, { color: colors.muted }]}>{answerCorrect ? 'Ha, 2/4 o‘lchovida har bir taktda 2 ta hissa bor.' : 'To‘g‘ri javob — 2 ta hissa.'}</Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {step === REWARD_STEP ? (
        <View style={styles.rewardCard}>
          <Animated.View style={{ alignItems: 'center', transform: [{ scale: rewardScale }] }}>
            <Text style={styles.rewardEmoji}>{rewardStars === 3 ? '🏆' : '🌟'}</Text>
            <Text style={[styles.rewardTitle, { color: colors.text }]}>{rewardStars === 3 ? 'Zo‘r dirijor!' : 'Barakalla!'}</Text>
            <Text style={[styles.rewardText, { color: colors.muted }]}>Sen 1-i va 2-i hissalarni ajratib, 2/4 o‘lchovini sanay olding.</Text>
            <View style={styles.starsRow}>{[0, 1, 2].map((star) => <Ionicons key={star} name={star < rewardStars ? 'star' : 'star-outline'} size={40} color={star < rewardStars ? '#F2B01E' : '#B9B2C7'} />)}</View>
            <View style={styles.rewardPill}><Ionicons name="trophy" size={20} color="#A66A00" /><Text style={styles.rewardPillText}>+{rewardStars} yulduz</Text></View>
          </Animated.View>
        </View>
      ) : null}

      <Pressable
        disabled={buttonDisabled}
        onPress={goForward}
        style={({ pressed }) => [
          styles.completeButton,
          { backgroundColor: isFinalStep ? colors.success : '#D27A24' },
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
  lessonBadge: { minHeight: 38, paddingHorizontal: 14, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF0DF' },
  lessonBadgeText: { color: '#B76318', fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  starBadge: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 5 },
  progressDot: { width: 20, height: 7, borderRadius: 999 },
  progressDotCurrent: { width: 34 },
  hero: { minHeight: 410, borderRadius: 32, padding: 26, justifyContent: 'center', backgroundColor: '#D27A24' },
  heroIcon: { width: 88, height: 88, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  heroEmoji: { fontSize: 48 },
  heroKicker: { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 34, lineHeight: 41, fontWeight: '900', marginTop: 9 },
  heroText: { color: 'rgba(255,255,255,0.94)', fontSize: 17, lineHeight: 25, fontWeight: '700', marginTop: 12 },
  card: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  stepLabel: { color: '#B76318', fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  sectionTitle: { fontSize: 28, lineHeight: 34, fontWeight: '900', marginTop: 7 },
  sectionText: { fontSize: 15, lineHeight: 23, fontWeight: '600', marginTop: 8 },
  meterRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20 },
  fractionCard: { width: 92, height: 128, borderRadius: 25, backgroundColor: '#FFF0DF', alignItems: 'center', justifyContent: 'center' },
  fractionTop: { color: '#B76318', fontSize: 40, fontWeight: '900', lineHeight: 44 },
  fractionBottom: { color: '#B76318', fontSize: 40, fontWeight: '900', lineHeight: 44 },
  fractionLine: { width: 48, height: 4, borderRadius: 4, backgroundColor: '#B76318' },
  meterInfo: { flex: 1, gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  infoNumber: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#D27A24', alignItems: 'center', justifyContent: 'center' },
  infoNumberSoft: { backgroundColor: '#E8A45F' },
  infoNumberText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  infoText: { flex: 1, color: '#5F576B', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  measureDemo: { flexDirection: 'row', alignItems: 'stretch', gap: 10, marginTop: 18 },
  beatDemo: { flex: 1, minHeight: 96, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  strongDemo: { backgroundColor: '#FFE2C3' },
  weakDemo: { backgroundColor: '#E8F3FF' },
  beatDemoArrow: { fontSize: 29, fontWeight: '900', color: '#443B50' },
  beatDemoTitle: { color: '#332C3D', fontSize: 19, fontWeight: '900' },
  beatDemoSub: { color: '#7D7289', fontSize: 9, fontWeight: '900', letterSpacing: 0.8, marginTop: 3 },
  taktLine: { width: 4, borderRadius: 4, backgroundColor: '#443B50' },
  tipBox: { marginTop: 15, borderRadius: 18, padding: 12, backgroundColor: '#FFF4C9', flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipEmoji: { fontSize: 24 },
  tipText: { flex: 1, color: '#6B5516', fontSize: 11, lineHeight: 17, fontWeight: '700' },
  beatStatus: { marginTop: 17, borderRadius: 20, padding: 13, backgroundColor: '#FFF0DF', flexDirection: 'row', alignItems: 'center', gap: 10 },
  beatCounter: { width: 50, height: 50, borderRadius: 17, backgroundColor: '#D27A24', alignItems: 'center', justifyContent: 'center' },
  beatCounterDone: { backgroundColor: '#16805A' },
  beatCounterText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
  beatStatusTitle: { color: '#332C3D', fontSize: 13, fontWeight: '900' },
  beatStatusSub: { color: '#766C82', fontSize: 10, fontWeight: '700', marginTop: 3 },
  beatButtons: { flexDirection: 'row', gap: 12, marginTop: 18 },
  beatButton: { flex: 1, minHeight: 138, borderRadius: 26, borderWidth: 3, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  strongButton: { backgroundColor: '#FFE2C3' },
  weakButton: { backgroundColor: '#E8F3FF' },
  expectedBeat: { borderColor: '#D27A24', transform: [{ scale: 1.02 }] },
  bigArrow: { color: '#332C3D', fontSize: 37, lineHeight: 42, fontWeight: '900' },
  beatButtonTitle: { color: '#332C3D', fontSize: 25, fontWeight: '900' },
  beatButtonSub: { color: '#6F647A', fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginTop: 4 },
  measureProgress: { flexDirection: 'row', gap: 6, marginTop: 15 },
  measurePill: { flex: 1, minHeight: 32, borderRadius: 11, backgroundColor: '#F0EDF4', alignItems: 'center', justifyContent: 'center' },
  measurePillActive: { backgroundColor: '#FFF0DF' },
  measurePillDone: { backgroundColor: '#DFF7EC' },
  measurePillText: { color: '#81768B', fontSize: 9, fontWeight: '900' },
  measurePillTextDone: { color: '#16805A' },
  resetButton: { marginTop: 12, minHeight: 44, borderRadius: 15, backgroundColor: '#FFF0DF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  resetText: { color: '#B76318', fontSize: 11, fontWeight: '900' },
  videoTabs: { flexDirection: 'row', gap: 8, marginTop: 18 },
  videoTab: { flex: 1, minHeight: 43, borderRadius: 15, backgroundColor: '#F1EEF4', alignItems: 'center', justifyContent: 'center' },
  videoTabActive: { backgroundColor: '#FFF0DF', borderWidth: 1.5, borderColor: '#D27A24' },
  videoTabText: { color: '#766C82', fontSize: 11, fontWeight: '900' },
  videoTabTextActive: { color: '#B76318' },
  videoFrame: { marginTop: 13, borderRadius: 22, overflow: 'hidden', backgroundColor: '#17131C' },
  video: { width: '100%', aspectRatio: 16 / 9 },
  noVideo: { minHeight: 190, borderRadius: 22, marginTop: 13, backgroundColor: '#F1EEF4', alignItems: 'center', justifyContent: 'center', gap: 8 },
  noVideoText: { fontSize: 12, fontWeight: '800' },
  quizIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: '#FFF0DF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  quizEmoji: { fontSize: 36 },
  quizTitle: { fontSize: 26, lineHeight: 33, fontWeight: '900', marginTop: 7, marginBottom: 18 },
  quizOptions: { gap: 9 },
  quizOption: { minHeight: 68, borderRadius: 20, borderWidth: 1.5, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  quizOptionEmoji: { fontSize: 27 },
  quizOptionText: { flex: 1, fontSize: 14, fontWeight: '900' },
  feedback: { marginTop: 13, borderRadius: 19, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackEmoji: { fontSize: 27 },
  feedbackTitle: { fontSize: 15, fontWeight: '900' },
  feedbackText: { fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 2 },
  rewardCard: { minHeight: 410, borderRadius: 32, padding: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF0DF' },
  rewardEmoji: { fontSize: 72 },
  rewardTitle: { fontSize: 33, lineHeight: 39, fontWeight: '900', marginTop: 14 },
  rewardText: { fontSize: 16, lineHeight: 24, fontWeight: '600', textAlign: 'center', marginTop: 10, maxWidth: 310 },
  starsRow: { flexDirection: 'row', gap: 8, marginTop: 26 },
  rewardPill: { marginTop: 20, minHeight: 46, borderRadius: 999, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFFFFFAA' },
  rewardPillText: { color: '#7C5700', fontSize: 14, fontWeight: '900' },
  completeButton: { minHeight: 60, borderRadius: 21, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 18 },
  completeText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  disabled: { opacity: 0.48 },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
});
