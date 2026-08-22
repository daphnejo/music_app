import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useAudioPlayer } from 'expo-audio';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useStars } from '@/context/StarsContext';
import { useTheme } from '@/context/ThemeContext';
import type { BlockAsset } from '@/types/content';

type Props = {
  images: BlockAsset[];
  audios: BlockAsset[];
  completed: boolean;
  saving: boolean;
  onBack: () => void;
  onNext?: () => void;
  onComplete: () => void;
  resolveUrl: (url: string) => string;
};

type DegreeKind = 'stable' | 'unstable';

type Degree = {
  roman: string;
  note: string;
  stable: boolean;
  color: string;
};

const DEGREES: Degree[] = [
  { roman: 'I', note: 'Do', stable: true, color: '#5BB98C' },
  { roman: 'II', note: 'Re', stable: false, color: '#F0A45D' },
  { roman: 'III', note: 'Mi', stable: true, color: '#5BB98C' },
  { roman: 'IV', note: 'Fa', stable: false, color: '#F0A45D' },
  { roman: 'V', note: 'Sol', stable: true, color: '#5BB98C' },
  { roman: 'VI', note: 'Lya', stable: false, color: '#F0A45D' },
  { roman: 'VII', note: 'Si', stable: false, color: '#F0A45D' },
];

const CLASSIFY_ORDER = ['II', 'I', 'VII', 'III', 'VI', 'V', 'IV'];
const RESOLUTION_ORDER = ['II', 'VII'];
const QUIZ_STEP = 5;
const REWARD_STEP = 6;
const TOTAL_STEPS = 7;

const QUIZ_OPTIONS = [
  { id: '135', label: 'I, III, V', correct: true },
  { id: '2467', label: 'II, IV, VI, VII', correct: false },
  { id: '127', label: 'I, II, VII', correct: false },
] as const;

function DegreeSound({ degree, audio, resolveUrl }: { degree: Degree; audio?: BlockAsset; resolveUrl: (url: string) => string }) {
  const player = useAudioPlayer(audio ? resolveUrl(audio.url) : null);

  const play = () => {
    if (!audio) return;
    player.seekTo(0);
    player.play();
  };

  return (
    <Pressable
      disabled={!audio}
      onPress={play}
      style={({ pressed }) => [
        styles.soundCard,
        { borderColor: degree.color, opacity: audio ? (pressed ? 0.75 : 1) : 0.45 },
      ]}
    >
      <View style={[styles.soundDot, { backgroundColor: degree.color }]} />
      <Text style={styles.soundRoman}>{degree.roman}</Text>
      <Text style={styles.soundNote}>{degree.note}</Text>
      <Ionicons name={audio ? 'volume-high' : 'volume-mute'} size={17} color={degree.color} />
    </Pressable>
  );
}

export function LessonEighteenPage({
  images,
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
  const [classifyIndex, setClassifyIndex] = useState(0);
  const [classifyMistakes, setClassifyMistakes] = useState(0);
  const [resolutionIndex, setResolutionIndex] = useState(0);
  const [resolutionMistakes, setResolutionMistakes] = useState(0);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.86)).current;

  const classifyComplete = classifyIndex >= CLASSIFY_ORDER.length;
  const resolutionComplete = resolutionIndex >= RESOLUTION_ORDER.length;
  const isFinalStep = step === REWARD_STEP;
  const currentRoman = CLASSIFY_ORDER[Math.min(classifyIndex, CLASSIFY_ORDER.length - 1)];
  const currentDegree = DEGREES.find((item) => item.roman === currentRoman) ?? DEGREES[0];
  const resolutionRoman = RESOLUTION_ORDER[Math.min(resolutionIndex, RESOLUTION_ORDER.length - 1)];
  const resolutionDegree = DEGREES.find((item) => item.roman === resolutionRoman) ?? DEGREES[1];

  const sourceImage = images.find((asset) => asset.file.includes('image109'))
    ?? images.find((asset) => asset.file.includes('image110'))
    ?? images.find((asset) => !asset.file.includes('image5'));

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

  function classify(kind: DegreeKind) {
    if (classifyComplete) return;
    const correctKind: DegreeKind = currentDegree.stable ? 'stable' : 'unstable';
    if (kind === correctKind) {
      setClassifyIndex((value) => value + 1);
      return;
    }
    setClassifyMistakes((value) => value + 1);
  }

  function resolveTo(roman: string) {
    if (resolutionComplete) return;
    if (roman === 'I') {
      setResolutionIndex((value) => value + 1);
      return;
    }
    setResolutionMistakes((value) => value + 1);
  }

  function checkQuiz() {
    if (!selectedQuizId || quizChecked) return;
    const selected = QUIZ_OPTIONS.find((option) => option.id === selectedQuizId);
    const stars: 2 | 3 = selected?.correct ? 3 : 2;
    setRewardStars(stars);
    awardLessonStars(18, stars);
    setQuizChecked(true);
  }

  function goForward() {
    if (step === 3 && !classifyComplete) return;
    if (step === 4 && !resolutionComplete) return;
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
    || (step === 3 && !classifyComplete)
    || (step === 4 && !resolutionComplete)
    || (step === QUIZ_STEP && !selectedQuizId)
    || (isFinalStep && completed && !onNext);

  const buttonLabel = step === 3 && !classifyComplete
    ? `Ajrat: ${currentDegree.roman} pog‘ona`
    : step === 4 && !resolutionComplete
      ? `${resolutionDegree.roman} qayerga intiladi?`
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
          <Ionicons name="git-compare-outline" size={16} color="#477D68" />
          <Text style={styles.lessonBadgeText}>18-DARS</Text>
        </View>
        <View style={styles.starBadge}><Ionicons name="star" size={22} color="#F2B01E" /></View>
      </View>

      <View style={styles.progressDots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              { backgroundColor: index <= step ? '#477D68' : colors.border },
              index === step && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Text style={styles.heroEmoji}>⚖️</Text></View>
          <Text style={styles.heroKicker}>MUSIQADA MUVOZANAT</Text>
          <Text style={styles.heroTitle}>Turg‘un va noturg‘un pog‘onalar</Text>
          <Text style={styles.heroText}>Ba’zi pog‘onalar tinch va tayanchdek eshitiladi, boshqalari esa turg‘un pog‘onaga intiladi.</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>BILIB OLAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ikki guruhni eslab qol</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Do major ladida turg‘un pog‘onalar I, III, V. Noturg‘un pog‘onalar II, IV, VI, VII.</Text>

          <View style={styles.kindRow}>
            <View style={[styles.kindCard, styles.stableCard]}>
              <Text style={styles.kindEmoji}>🏠</Text>
              <Text style={styles.kindTitle}>TURG‘UN</Text>
              <Text style={styles.kindDegrees}>I · III · V</Text>
              <Text style={styles.kindHint}>Tayanch pog‘onalar</Text>
            </View>
            <View style={[styles.kindCard, styles.unstableCard]}>
              <Text style={styles.kindEmoji}>➡️</Text>
              <Text style={styles.kindTitle}>NOTURG‘UN</Text>
              <Text style={styles.kindDegrees}>II · IV · VI · VII</Text>
              <Text style={styles.kindHint}>Turg‘unga intiladi</Text>
            </View>
          </View>

          <View style={styles.leadingBox}>
            <View style={styles.leadingIcon}><Text style={styles.leadingEmoji}>🧲</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.leadingTitle}>Yetakchi pog‘onalar</Text>
              <Text style={styles.leadingText}>VII va II Tonika atrofida turadi va I pog‘onaga kuchli intiladi.</Text>
            </View>
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
          <Text style={styles.stepLabel}>TINGLAB KO‘R</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>7 ta pog‘ona 🎧</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Har bir pog‘onani bosib eshit. Yashil rang turg‘un, to‘q sariq rang noturg‘un pog‘onani bildiradi.</Text>
          <View style={styles.soundGrid}>
            {DEGREES.map((degree, index) => (
              <DegreeSound key={degree.roman} degree={degree} audio={audios[index]} resolveUrl={resolveUrl} />
            ))}
          </View>
          <View style={styles.tipBox}><Text style={styles.tipEmoji}>👂</Text><Text style={styles.tipText}>Manbadagi audio55–audio61 pog‘onalar I–VII ketma-ketligiga mos keladi.</Text></View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>AJRATISH O‘YINI</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Qaysi guruhga kiradi?</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Ko‘rsatilgan pog‘ona turg‘unmi yoki noturg‘unmi — to‘g‘ri tugmani bos.</Text>

          <View style={[styles.targetDegree, { borderColor: currentDegree.color }]}> 
            <Text style={[styles.targetRoman, { color: currentDegree.color }]}>{classifyComplete ? '✓' : currentDegree.roman}</Text>
            <Text style={styles.targetNote}>{classifyComplete ? 'Hammasini ajratding!' : `${currentDegree.note} pog‘onasi`}</Text>
          </View>

          <View style={styles.choiceRow}>
            <Pressable onPress={() => classify('stable')} disabled={classifyComplete} style={({ pressed }) => [styles.choiceButton, styles.stableChoice, pressed && styles.pressed]}>
              <Text style={styles.choiceEmoji}>🏠</Text><Text style={styles.choiceTitle}>Turg‘un</Text><Text style={styles.choiceSub}>I · III · V</Text>
            </Pressable>
            <Pressable onPress={() => classify('unstable')} disabled={classifyComplete} style={({ pressed }) => [styles.choiceButton, styles.unstableChoice, pressed && styles.pressed]}>
              <Text style={styles.choiceEmoji}>➡️</Text><Text style={styles.choiceTitle}>Noturg‘un</Text><Text style={styles.choiceSub}>II · IV · VI · VII</Text>
            </Pressable>
          </View>

          <View style={styles.gameStatus}>
            <Text style={styles.gameStatusText}>{classifyComplete ? '7/7 — ajoyib! 🎉' : `${classifyIndex}/7 to‘g‘ri`}</Text>
            <Text style={styles.gameMistakes}>{classifyMistakes ? `${classifyMistakes} xato — davom et!` : 'Xatosiz boshlading ✨'}</Text>
          </View>
          <Pressable onPress={() => { setClassifyIndex(0); setClassifyMistakes(0); }} style={styles.resetButton}><Ionicons name="refresh" size={18} color="#477D68" /><Text style={styles.resetText}>Qaytadan boshlash</Text></Pressable>
        </View>
      ) : null}

      {step === 4 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>YECHILISH O‘YINI</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tonikaga yo‘l top 🧲</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Yetakchi II va VII pog‘onalar qaysi pog‘onaga kuchli intilishini top.</Text>

          <View style={styles.resolutionPath}>
            <View style={styles.resolutionStart}><Text style={styles.resolutionRoman}>{resolutionComplete ? '✓' : resolutionDegree.roman}</Text><Text style={styles.resolutionLabel}>{resolutionComplete ? 'Tayyor!' : resolutionDegree.note}</Text></View>
            <Text style={styles.resolutionArrow}>→</Text>
            <View style={styles.resolutionQuestion}><Text style={styles.resolutionQuestionText}>?</Text></View>
          </View>

          <View style={styles.destinationRow}>
            {['I', 'III', 'V'].map((roman) => (
              <Pressable key={roman} disabled={resolutionComplete} onPress={() => resolveTo(roman)} style={({ pressed }) => [styles.destinationButton, roman === 'I' && styles.tonicButton, pressed && styles.pressed]}>
                <Text style={[styles.destinationRoman, roman === 'I' && styles.tonicText]}>{roman}</Text>
                <Text style={[styles.destinationNote, roman === 'I' && styles.tonicText]}>{roman === 'I' ? 'Do · Tonika' : roman === 'III' ? 'Mi' : 'Sol'}</Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.gameStatus}>
            <Text style={styles.gameStatusText}>{resolutionComplete ? 'II → I va VII → I ✓' : `${resolutionIndex}/2 yechildi`}</Text>
            <Text style={styles.gameMistakes}>{resolutionMistakes ? `${resolutionMistakes} xato — Tonikani esla!` : 'I pog‘ona — Tonika ⭐'}</Text>
          </View>
          <Pressable onPress={() => { setResolutionIndex(0); setResolutionMistakes(0); }} style={styles.resetButton}><Ionicons name="refresh" size={18} color="#477D68" /><Text style={styles.resetText}>Qaytadan boshlash</Text></Pressable>
        </View>
      ) : null}

      {step === QUIZ_STEP ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.quizIcon}><Text style={styles.quizEmoji}>🧠</Text></View>
          <Text style={styles.stepLabel}>MINI SAVOL</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>Ladning turg‘un pog‘onalari qaysilar?</Text>
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
                    { borderColor: selected ? '#477D68' : colors.border, backgroundColor: selected ? '#EAF5F0' : colors.surface },
                    showCorrect && { borderColor: colors.success, backgroundColor: colors.successSurface },
                    showWrong && { borderColor: '#E59A9A', backgroundColor: '#FFF0F0' },
                  ]}
                >
                  <View style={styles.quizRadio}>{(selected || showCorrect) ? <View style={[styles.quizRadioInner, { backgroundColor: showWrong ? '#D66C6C' : '#477D68' }]} /> : null}</View>
                  <Text style={[styles.quizOptionText, { color: colors.text }]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {quizChecked ? (
            <View style={[styles.feedback, { backgroundColor: quizCorrect ? colors.successSurface : '#FFF4E8' }]}>
              <Text style={styles.feedbackEmoji}>{quizCorrect ? '🎉' : '💡'}</Text>
              <Text style={[styles.feedbackText, { color: colors.text }]}>{quizCorrect ? 'To‘g‘ri! I, III va V — turg‘un pog‘onalar.' : 'Yodda tut: turg‘un pog‘onalar I, III va V.'}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {step === REWARD_STEP ? (
        <Animated.View style={[styles.reward, { transform: [{ scale: rewardScale }] }]}> 
          <Text style={styles.rewardEmoji}>🏆</Text>
          <Text style={styles.rewardKicker}>18-DARS BAJARILDI</Text>
          <Text style={styles.rewardTitle}>Pog‘onalarni juda yaxshi ajratding!</Text>
          <View style={styles.rewardStars}>{[0, 1, 2].map((index) => <Ionicons key={index} name="star" size={42} color={index < rewardStars ? '#F2B01E' : '#E3DED3'} />)}</View>
          <Text style={styles.rewardText}>Turg‘un I, III, V ni va II hamda VII ning Tonikaga intilishini eslab qolding.</Text>
        </Animated.View>
      ) : null}

      <Pressable disabled={buttonDisabled} onPress={goForward} style={({ pressed }) => [styles.primaryButton, buttonDisabled && styles.primaryButtonDisabled, pressed && !buttonDisabled && styles.pressed]}>
        <Text style={styles.primaryButtonText}>{buttonLabel}</Text>
        {!buttonDisabled ? <Ionicons name="arrow-forward" size={20} color="#fff" /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 18, gap: 14 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  lessonBadge: { minHeight: 38, borderRadius: 14, backgroundColor: '#EAF5F0', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 7 },
  lessonBadgeText: { color: '#477D68', fontSize: 12, fontWeight: '900', letterSpacing: 0.8 },
  starBadge: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFF5D9', alignItems: 'center', justifyContent: 'center' },
  progressDots: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  progressDot: { height: 5, width: 22, borderRadius: 99 },
  progressDotCurrent: { width: 34 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  heroIcon: { width: 118, height: 118, borderRadius: 38, backgroundColor: '#EAF5F0', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  heroEmoji: { fontSize: 58 },
  heroKicker: { color: '#477D68', fontWeight: '900', fontSize: 12, letterSpacing: 1.2, marginBottom: 8 },
  heroTitle: { color: '#292535', fontSize: 29, lineHeight: 35, fontWeight: '900', textAlign: 'center' },
  heroText: { marginTop: 12, color: '#777181', fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 340 },
  card: { flex: 1, borderRadius: 25, borderWidth: 1, padding: 18 },
  stepLabel: { color: '#477D68', fontSize: 11, fontWeight: '900', letterSpacing: 1.1, marginBottom: 7 },
  sectionTitle: { fontSize: 23, lineHeight: 29, fontWeight: '900' },
  sectionText: { marginTop: 7, fontSize: 13, lineHeight: 20 },
  kindRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  kindCard: { flex: 1, minHeight: 138, borderRadius: 20, padding: 13, alignItems: 'center', justifyContent: 'center' },
  stableCard: { backgroundColor: '#E8F7EF' },
  unstableCard: { backgroundColor: '#FFF1E4' },
  kindEmoji: { fontSize: 28 },
  kindTitle: { marginTop: 6, color: '#3D3946', fontWeight: '900', fontSize: 12 },
  kindDegrees: { marginTop: 5, color: '#3D3946', fontWeight: '900', fontSize: 17 },
  kindHint: { marginTop: 4, color: '#777181', fontSize: 10, textAlign: 'center' },
  leadingBox: { marginTop: 12, backgroundColor: '#F5F1FF', borderRadius: 18, padding: 13, flexDirection: 'row', gap: 10, alignItems: 'center' },
  leadingIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#E7DFFF', alignItems: 'center', justifyContent: 'center' },
  leadingEmoji: { fontSize: 21 },
  leadingTitle: { color: '#514678', fontWeight: '900', fontSize: 13 },
  leadingText: { marginTop: 3, color: '#6D6780', fontSize: 11, lineHeight: 16 },
  sourceFrame: { marginTop: 12, height: 125, borderRadius: 18, overflow: 'hidden', backgroundColor: '#FAFAF7' },
  sourceImage: { width: '100%', height: '100%' },
  soundGrid: { marginTop: 15, flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  soundCard: { width: '30%', minWidth: 86, minHeight: 92, borderWidth: 1.5, borderRadius: 18, padding: 9, alignItems: 'center', justifyContent: 'center' },
  soundDot: { width: 8, height: 8, borderRadius: 99, marginBottom: 3 },
  soundRoman: { color: '#302B3A', fontSize: 20, fontWeight: '900' },
  soundNote: { color: '#777181', fontSize: 11, fontWeight: '800', marginBottom: 4 },
  tipBox: { marginTop: 13, borderRadius: 17, backgroundColor: '#F5F1FF', padding: 12, flexDirection: 'row', gap: 8, alignItems: 'center' },
  tipEmoji: { fontSize: 19 },
  tipText: { flex: 1, color: '#6D6780', fontSize: 11, lineHeight: 16, fontWeight: '700' },
  targetDegree: { marginTop: 18, minHeight: 130, borderRadius: 24, borderWidth: 2, backgroundColor: '#FBFAF7', alignItems: 'center', justifyContent: 'center' },
  targetRoman: { fontSize: 42, fontWeight: '900' },
  targetNote: { marginTop: 3, color: '#777181', fontWeight: '800' },
  choiceRow: { marginTop: 13, flexDirection: 'row', gap: 10 },
  choiceButton: { flex: 1, minHeight: 115, borderRadius: 20, padding: 12, alignItems: 'center', justifyContent: 'center' },
  stableChoice: { backgroundColor: '#E8F7EF', borderWidth: 1.5, borderColor: '#7BC6A2' },
  unstableChoice: { backgroundColor: '#FFF1E4', borderWidth: 1.5, borderColor: '#EAB17B' },
  choiceEmoji: { fontSize: 26 },
  choiceTitle: { marginTop: 4, color: '#3D3946', fontWeight: '900' },
  choiceSub: { marginTop: 3, color: '#777181', fontSize: 10, fontWeight: '800' },
  gameStatus: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gameStatusText: { color: '#477D68', fontWeight: '900', fontSize: 12 },
  gameMistakes: { color: '#8A8290', fontSize: 10, fontWeight: '700' },
  resetButton: { alignSelf: 'center', marginTop: 11, paddingHorizontal: 13, height: 36, borderRadius: 12, backgroundColor: '#EAF5F0', flexDirection: 'row', gap: 6, alignItems: 'center' },
  resetText: { color: '#477D68', fontWeight: '900', fontSize: 11 },
  resolutionPath: { marginTop: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  resolutionStart: { width: 104, height: 104, borderRadius: 30, backgroundColor: '#FFF1E4', alignItems: 'center', justifyContent: 'center' },
  resolutionRoman: { color: '#D78438', fontSize: 34, fontWeight: '900' },
  resolutionLabel: { color: '#8A6B4D', fontSize: 11, fontWeight: '800' },
  resolutionArrow: { color: '#8C8495', fontSize: 34, fontWeight: '300' },
  resolutionQuestion: { width: 104, height: 104, borderRadius: 30, borderWidth: 2, borderStyle: 'dashed', borderColor: '#8C8495', alignItems: 'center', justifyContent: 'center' },
  resolutionQuestionText: { color: '#8C8495', fontSize: 38, fontWeight: '900' },
  destinationRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
  destinationButton: { flex: 1, minHeight: 80, borderRadius: 18, backgroundColor: '#F2F0F5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#DED9E5' },
  tonicButton: { backgroundColor: '#E8F7EF', borderColor: '#73BE99' },
  destinationRoman: { color: '#6F6878', fontSize: 22, fontWeight: '900' },
  destinationNote: { color: '#88818F', fontSize: 9, fontWeight: '800', marginTop: 2 },
  tonicText: { color: '#477D68' },
  quizIcon: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#EAF5F0', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 12 },
  quizEmoji: { fontSize: 34 },
  quizTitle: { fontSize: 22, lineHeight: 29, fontWeight: '900', textAlign: 'center', marginBottom: 17 },
  quizOptions: { gap: 9 },
  quizOption: { minHeight: 57, borderRadius: 17, borderWidth: 1.5, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  quizRadio: { width: 21, height: 21, borderRadius: 99, borderWidth: 1.5, borderColor: '#A7A0AD', alignItems: 'center', justifyContent: 'center' },
  quizRadioInner: { width: 11, height: 11, borderRadius: 99 },
  quizOptionText: { fontSize: 14, fontWeight: '800' },
  feedback: { marginTop: 13, borderRadius: 17, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  feedbackEmoji: { fontSize: 20 },
  feedbackText: { flex: 1, fontSize: 11, lineHeight: 17, fontWeight: '700' },
  reward: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  rewardEmoji: { fontSize: 68 },
  rewardKicker: { marginTop: 14, color: '#477D68', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  rewardTitle: { marginTop: 7, color: '#292535', fontSize: 26, lineHeight: 32, fontWeight: '900', textAlign: 'center' },
  rewardStars: { marginTop: 18, flexDirection: 'row', gap: 4 },
  rewardText: { marginTop: 13, color: '#777181', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  primaryButton: { minHeight: 56, borderRadius: 18, backgroundColor: '#477D68', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18 },
  primaryButtonDisabled: { backgroundColor: '#B9C7C1' },
  primaryButtonText: { color: '#fff', fontWeight: '900', fontSize: 14 },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.88 },
});
