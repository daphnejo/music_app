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

type MusicPieceId = 'motiv' | 'ibora' | 'jumla' | 'kuy';

const BUILD_ORDER: Array<{ id: MusicPieceId; label: string; hint: string; emoji: string; color: string; soft: string }> = [
  { id: 'motiv', label: 'Motiv', hint: 'Eng kichik bo‘lak', emoji: '🧩', color: '#7C52B8', soft: '#EEE7FA' },
  { id: 'ibora', label: 'Ibora', hint: 'Motivlardan tuziladi', emoji: '🎵', color: '#2A7FB8', soft: '#E2F3FF' },
  { id: 'jumla', label: 'Jumla', hint: 'Iboralardan tuziladi', emoji: '🎶', color: '#16805A', soft: '#DFF7EC' },
  { id: 'kuy', label: 'Kuy', hint: 'Musiqiy fikr', emoji: '🌈', color: '#C14E70', soft: '#FFE7EE' },
];

const GAME_ORDER: MusicPieceId[] = ['jumla', 'motiv', 'kuy', 'ibora'];

const QUIZ_OPTIONS = [
  { id: 'motiv', label: 'Motiv', emoji: '🧩', correct: true },
  { id: 'jumla', label: 'Jumla', emoji: '🎶', correct: false },
  { id: 'tonika', label: 'Tonika', emoji: '⭐', correct: false },
] as const;

const QUIZ_STEP = 5;
const REWARD_STEP = 6;
const TOTAL_STEPS = 7;

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

export function LessonFifteenPage({
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
  const [buildIndex, setBuildIndex] = useState(0);
  const [buildMistakes, setBuildMistakes] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.86)).current;

  const buildComplete = buildIndex >= BUILD_ORDER.length;
  const isFinalStep = step === REWARD_STEP;
  const expectedPiece = BUILD_ORDER[Math.min(buildIndex, BUILD_ORDER.length - 1)];

  const sourceImage = images.find((asset) => asset.file.includes('image101'))
    ?? images.find((asset) => !asset.file.includes('image5'))
    ?? images[0];
  const mainVideo = videos.find((asset) => asset.file.includes('media36')) ?? videos[0];
  const singingVideo = videos.find((asset) => asset.file.includes('media37')) ?? videos[1] ?? videos[0];
  const activeVideo = selectedVideoIndex === 0 ? mainVideo : singingVideo;
  const practiceAudio = audios.find((asset) => asset.file.includes('media35')) ?? audios[0];

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

  function pressBuildPiece(id: MusicPieceId) {
    if (buildComplete) return;
    if (id === expectedPiece.id) {
      setBuildIndex((value) => value + 1);
      return;
    }
    setBuildMistakes((value) => value + 1);
  }

  function checkQuiz() {
    if (!selectedQuizId || quizChecked) return;
    const selected = QUIZ_OPTIONS.find((option) => option.id === selectedQuizId);
    const stars: 2 | 3 = selected?.correct ? 3 : 2;
    setRewardStars(stars);
    awardLessonStars(15, stars);
    setQuizChecked(true);
  }

  function goForward() {
    if (step === 2 && !buildComplete) return;
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
    || (step === 2 && !buildComplete)
    || (step === QUIZ_STEP && !selectedQuizId)
    || (isFinalStep && completed && !onNext);

  const buttonLabel = step === 2 && !buildComplete
    ? `Navbat: ${expectedPiece.label}`
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
          <Ionicons name="layers-outline" size={16} color="#7C52B8" />
          <Text style={styles.lessonBadgeText}>15-DARS</Text>
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
          <View style={styles.heroIcon}><Text style={styles.heroEmoji}>🧱🎵</Text></View>
          <Text style={styles.heroKicker}>MUSIQANI BO‘LAKLARDAN QURAMIZ</Text>
          <Text style={styles.heroTitle}>Motiv, ibora, jumla</Text>
          <Text style={styles.heroText}>She’r so‘z va misralardan tuzilgani kabi, kuy ham kichik musiqiy bo‘laklardan tashkil topadi.</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>BILIB OLAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Kuy qanday quriladi?</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Kuyning eng kichik bo‘lagi — motiv. Motivlar iborani, iboralar esa jumlani hosil qiladi.</Text>

          <View style={styles.buildStack}>
            {BUILD_ORDER.map((piece, index) => (
              <View key={piece.id} style={[styles.buildRow, { width: `${58 + index * 13}%`, backgroundColor: piece.soft, borderColor: piece.color }]}>
                <Text style={styles.buildEmoji}>{piece.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.buildName, { color: piece.color }]}>{piece.label}</Text>
                  <Text style={styles.buildHint}>{piece.hint}</Text>
                </View>
                <Text style={[styles.buildNumber, { color: piece.color }]}>{index + 1}</Text>
              </View>
            ))}
          </View>

          <View style={styles.tonicCard}>
            <View style={styles.tonicRoman}><Text style={styles.tonicRomanText}>I</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tonicTitle}>Tonika — I pog‘ona ⭐</Text>
              <Text style={styles.tonicText}>Taqdimotda tonika ladning birinchi pog‘onasi deb berilgan.</Text>
            </View>
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>MINI O‘YIN</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Musiqani qur 🧩</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Eng kichik bo‘lakdan boshlang va kattasiga qarab tartib bilan bosing.</Text>

          <View style={styles.gameStatus}>
            <View style={[styles.gameCounter, buildComplete && styles.gameCounterDone]}>
              <Text style={styles.gameCounterText}>{buildComplete ? '✓' : `${buildIndex}/4`}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.gameStatusTitle}>{buildComplete ? 'Ajoyib! Kuy qurildi.' : `Navbat: ${expectedPiece.label}`}</Text>
              <Text style={styles.gameStatusSub}>{buildMistakes ? `${buildMistakes} marta qayta urinib ko‘rding — davom et!` : 'Motivdan boshlashni eslab qol.'}</Text>
            </View>
          </View>

          <View style={styles.gameGrid}>
            {GAME_ORDER.map((id) => {
              const piece = BUILD_ORDER.find((item) => item.id === id)!;
              const pieceOrder = BUILD_ORDER.findIndex((item) => item.id === id);
              const done = pieceOrder < buildIndex || buildComplete;
              const active = !buildComplete && piece.id === expectedPiece.id;
              return (
                <Pressable
                  key={piece.id}
                  onPress={() => pressBuildPiece(piece.id)}
                  style={({ pressed }) => [
                    styles.gamePiece,
                    { backgroundColor: done ? '#DFF7EC' : piece.soft, borderColor: done ? '#16805A' : active ? piece.color : 'transparent' },
                    active && styles.gamePieceActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.gameEmoji}>{done ? '✓' : piece.emoji}</Text>
                  <Text style={[styles.gamePieceText, { color: done ? '#16805A' : piece.color }]}>{piece.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sequenceLine}>
            {BUILD_ORDER.map((piece, index) => (
              <View key={piece.id} style={styles.sequenceItem}>
                <View style={[styles.sequenceDot, index < buildIndex && styles.sequenceDotDone]} />
                {index < BUILD_ORDER.length - 1 ? <View style={[styles.sequenceConnector, index < buildIndex - 1 && styles.sequenceConnectorDone]} /> : null}
              </View>
            ))}
          </View>

          <Pressable onPress={() => { setBuildIndex(0); setBuildMistakes(0); }} style={styles.resetButton}>
            <Ionicons name="refresh" size={18} color="#7C52B8" />
            <Text style={styles.resetText}>Qaytadan boshlash</Text>
          </Pressable>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>KO‘R VA KUZAT</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Motivdan kuyga 🎬</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Taqdimotdagi misolni ko‘rib, motiv, ibora, jumla va tonikani kuzat.</Text>

          {sourceImage ? (
            <View style={styles.sourceImageFrame}>
              <ExpoImage source={resolveUrl(sourceImage.url)} contentFit="contain" style={styles.sourceImage} />
            </View>
          ) : null}

          <View style={styles.videoTabs}>
            <Pressable onPress={() => setSelectedVideoIndex(0)} style={[styles.videoTab, selectedVideoIndex === 0 && styles.videoTabActive]}>
              <Text style={[styles.videoTabText, selectedVideoIndex === 0 && styles.videoTabTextActive]}>🎼 Asosiy misol</Text>
            </Pressable>
            <Pressable onPress={() => setSelectedVideoIndex(1)} style={[styles.videoTab, selectedVideoIndex === 1 && styles.videoTabActive]}>
              <Text style={[styles.videoTabText, selectedVideoIndex === 1 && styles.videoTabTextActive]}>🎤 Kuylash</Text>
            </Pressable>
          </View>

          {activeVideo ? (
            <View style={styles.videoFrame}>
              <PracticeVideo key={activeVideo.id} url={resolveUrl(activeVideo.url)} />
            </View>
          ) : (
            <View style={styles.noMedia}><Ionicons name="videocam-off-outline" size={30} color={colors.muted} /><Text style={[styles.noMediaText, { color: colors.muted }]}>Video topilmadi</Text></View>
          )}
        </View>
      ) : null}

      {step === 4 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>TINGLA VA KUYLA</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Musiqiy jumlani eshit 🎧</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Mashqni tingla. Qayerda kichik motiv tugab, kattaroq musiqiy fikr davom etayotganini sezishga harakat qil.</Text>

          {practiceAudio ? (
            <AudioPlayer url={resolveUrl(practiceAudio.url)} title="15-dars kuylash mashqi" />
          ) : (
            <View style={styles.noMedia}><Ionicons name="volume-mute-outline" size={30} color={colors.muted} /><Text style={[styles.noMediaText, { color: colors.muted }]}>Audio topilmadi</Text></View>
          )}

          <View style={styles.listenChecklist}>
            <View style={styles.listenItem}><Text style={styles.listenEmoji}>🧩</Text><Text style={styles.listenText}>Motiv — eng kichik bo‘lak</Text></View>
            <View style={styles.listenItem}><Text style={styles.listenEmoji}>🎵</Text><Text style={styles.listenText}>Motivlar iborani hosil qiladi</Text></View>
            <View style={styles.listenItem}><Text style={styles.listenEmoji}>⭐</Text><Text style={styles.listenText}>Tonika — I pog‘ona</Text></View>
          </View>
        </View>
      ) : null}

      {step === QUIZ_STEP ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.quizIcon}><Text style={styles.quizEmoji}>🧠</Text></View>
          <Text style={styles.stepLabel}>MINI SAVOL</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>Kuyning eng kichik bo‘lagi nima?</Text>
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
                    { borderColor: selected ? '#7C52B8' : colors.border, backgroundColor: selected ? '#EEE7FA' : colors.surface },
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
              <View style={{ flex: 1 }}>
                <Text style={[styles.feedbackTitle, { color: colors.text }]}>{answerCorrect ? 'To‘g‘ri!' : 'Yaxshi urinish!'}</Text>
                <Text style={[styles.feedbackText, { color: colors.muted }]}>{answerCorrect ? 'Ha, kuyning eng kichik bo‘lagi — motiv.' : 'To‘g‘ri javob — Motiv.'}</Text>
              </View>
            </View>
          ) : null}
        </View>
      ) : null}

      {step === REWARD_STEP ? (
        <View style={styles.rewardWrap}>
          <Animated.View style={[styles.rewardMedal, { transform: [{ scale: rewardScale }] }]}>
            <Text style={styles.rewardEmoji}>🏗️🎵</Text>
          </Animated.View>
          <Text style={styles.rewardKicker}>15-DARS TAYYOR!</Text>
          <Text style={[styles.rewardTitle, { color: colors.text }]}>Musiqani qurishni bilding!</Text>
          <Text style={[styles.rewardText, { color: colors.muted }]}>Motiv → Ibora → Jumla → Kuy. Tonika esa ladning I pog‘onasi.</Text>
          <View style={styles.rewardStars}>
            {[0, 1, 2].map((index) => (
              <Ionicons key={index} name="star" size={42} color={index < rewardStars ? '#F2B01E' : '#DDD8E6'} />
            ))}
          </View>
          <View style={styles.rewardChip}><Text style={styles.rewardChipText}>{rewardStars === 3 ? 'Ajoyib natija! 🌟' : 'Yaxshi natija! 🌈'}</Text></View>
        </View>
      ) : null}

      <View style={styles.footer}>
        <Pressable
          disabled={buttonDisabled}
          onPress={goForward}
          style={({ pressed }) => [
            styles.primaryButton,
            { backgroundColor: buttonDisabled ? colors.border : '#7C52B8' },
            pressed && !buttonDisabled && styles.pressed,
          ]}
        >
          <Text style={[styles.primaryButtonText, buttonDisabled && { color: colors.muted }]}>{buttonLabel}</Text>
          {!buttonDisabled ? <Ionicons name={isFinalStep ? 'checkmark-circle' : 'arrow-forward'} size={21} color="#fff" /> : null}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 10 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  navButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  lessonBadge: { height: 38, paddingHorizontal: 14, borderRadius: 15, backgroundColor: '#EEE7FA', flexDirection: 'row', alignItems: 'center', gap: 7 },
  lessonBadgeText: { color: '#7C52B8', fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  starBadge: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFF4CF', alignItems: 'center', justifyContent: 'center' },
  progressDots: { flexDirection: 'row', gap: 6, marginBottom: 15 },
  progressDot: { flex: 1, height: 5, borderRadius: 999 },
  progressDotCurrent: { height: 7, marginTop: -1 },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingBottom: 20 },
  heroIcon: { width: 126, height: 126, borderRadius: 40, backgroundColor: '#EEE7FA', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  heroEmoji: { fontSize: 46 },
  heroKicker: { color: '#7C52B8', fontSize: 12, fontWeight: '900', letterSpacing: 0.8, textAlign: 'center', marginBottom: 8 },
  heroTitle: { color: '#282235', fontSize: 31, lineHeight: 37, fontWeight: '900', textAlign: 'center' },
  heroText: { marginTop: 12, color: '#716A7D', fontSize: 15, lineHeight: 23, fontWeight: '600', textAlign: 'center' },
  card: { flex: 1, borderRadius: 25, borderWidth: 1, padding: 18, overflow: 'hidden' },
  stepLabel: { color: '#7C52B8', fontSize: 11, fontWeight: '900', letterSpacing: 1, marginBottom: 7 },
  sectionTitle: { fontSize: 23, lineHeight: 29, fontWeight: '900' },
  sectionText: { marginTop: 7, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  buildStack: { marginTop: 14, alignItems: 'center', gap: 7 },
  buildRow: { minHeight: 54, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  buildEmoji: { fontSize: 22 },
  buildName: { fontSize: 14, fontWeight: '900' },
  buildHint: { color: '#777181', fontSize: 10, fontWeight: '700', marginTop: 1 },
  buildNumber: { fontSize: 16, fontWeight: '900' },
  tonicCard: { marginTop: 13, padding: 12, borderRadius: 17, backgroundColor: '#FFF4CF', flexDirection: 'row', alignItems: 'center', gap: 11 },
  tonicRoman: { width: 45, height: 45, borderRadius: 14, backgroundColor: '#F2B01E', alignItems: 'center', justifyContent: 'center' },
  tonicRomanText: { color: '#fff', fontSize: 23, fontWeight: '900' },
  tonicTitle: { color: '#5A4511', fontSize: 14, fontWeight: '900' },
  tonicText: { color: '#7B6732', fontSize: 10, lineHeight: 15, fontWeight: '700', marginTop: 2 },
  gameStatus: { marginTop: 14, padding: 12, borderRadius: 17, backgroundColor: '#F7F3FC', flexDirection: 'row', gap: 11, alignItems: 'center' },
  gameCounter: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#7C52B8', alignItems: 'center', justifyContent: 'center' },
  gameCounterDone: { backgroundColor: '#16805A' },
  gameCounterText: { color: '#fff', fontSize: 15, fontWeight: '900' },
  gameStatusTitle: { color: '#332C40', fontSize: 14, fontWeight: '900' },
  gameStatusSub: { color: '#777181', fontSize: 10, lineHeight: 15, fontWeight: '700', marginTop: 2 },
  gameGrid: { marginTop: 13, flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  gamePiece: { width: '48.5%', minHeight: 91, borderRadius: 20, borderWidth: 2, alignItems: 'center', justifyContent: 'center', padding: 10 },
  gamePieceActive: { shadowColor: '#7C52B8', shadowOpacity: 0.18, shadowRadius: 8, elevation: 3 },
  gameEmoji: { fontSize: 28 },
  gamePieceText: { marginTop: 5, fontSize: 14, fontWeight: '900' },
  sequenceLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 15, paddingHorizontal: 22 },
  sequenceItem: { flexDirection: 'row', alignItems: 'center' },
  sequenceDot: { width: 13, height: 13, borderRadius: 7, backgroundColor: '#DDD6E8', borderWidth: 2, borderColor: '#BFB4D0' },
  sequenceDotDone: { backgroundColor: '#16805A', borderColor: '#16805A' },
  sequenceConnector: { width: 35, height: 3, backgroundColor: '#DDD6E8' },
  sequenceConnectorDone: { backgroundColor: '#16805A' },
  resetButton: { marginTop: 12, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  resetText: { color: '#7C52B8', fontSize: 12, fontWeight: '800' },
  sourceImageFrame: { marginTop: 12, height: 108, borderRadius: 17, overflow: 'hidden', backgroundColor: '#FBF8FF' },
  sourceImage: { width: '100%', height: '100%' },
  videoTabs: { marginTop: 11, flexDirection: 'row', gap: 8 },
  videoTab: { flex: 1, height: 39, borderRadius: 13, backgroundColor: '#F2EEF7', alignItems: 'center', justifyContent: 'center' },
  videoTabActive: { backgroundColor: '#7C52B8' },
  videoTabText: { color: '#716A7D', fontSize: 11, fontWeight: '800' },
  videoTabTextActive: { color: '#fff' },
  videoFrame: { marginTop: 10, borderRadius: 18, overflow: 'hidden', backgroundColor: '#18151D' },
  video: { width: '100%', height: 205 },
  noMedia: { marginTop: 14, minHeight: 110, borderRadius: 18, backgroundColor: '#F5F2F8', alignItems: 'center', justifyContent: 'center', gap: 7 },
  noMediaText: { fontSize: 12, fontWeight: '700' },
  listenChecklist: { marginTop: 14, gap: 8 },
  listenItem: { minHeight: 44, borderRadius: 14, backgroundColor: '#F7F3FC', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 9 },
  listenEmoji: { fontSize: 19 },
  listenText: { color: '#514A60', fontSize: 12, fontWeight: '800' },
  quizIcon: { width: 63, height: 63, borderRadius: 21, backgroundColor: '#EEE7FA', alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 10 },
  quizEmoji: { fontSize: 30 },
  quizTitle: { fontSize: 22, lineHeight: 28, fontWeight: '900', textAlign: 'center', marginBottom: 15 },
  quizOptions: { gap: 9 },
  quizOption: { minHeight: 62, borderRadius: 18, borderWidth: 2, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 11 },
  quizOptionEmoji: { fontSize: 25 },
  quizOptionText: { flex: 1, fontSize: 14, fontWeight: '900' },
  feedback: { marginTop: 13, borderRadius: 17, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center' },
  feedbackEmoji: { fontSize: 25 },
  feedbackTitle: { fontSize: 13, fontWeight: '900' },
  feedbackText: { marginTop: 2, fontSize: 11, lineHeight: 16, fontWeight: '600' },
  rewardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  rewardMedal: { width: 118, height: 118, borderRadius: 40, backgroundColor: '#EEE7FA', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  rewardEmoji: { fontSize: 43 },
  rewardKicker: { color: '#7C52B8', fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  rewardTitle: { marginTop: 7, fontSize: 25, lineHeight: 31, fontWeight: '900', textAlign: 'center' },
  rewardText: { marginTop: 8, fontSize: 13, lineHeight: 19, fontWeight: '600', textAlign: 'center' },
  rewardStars: { flexDirection: 'row', gap: 4, marginTop: 16 },
  rewardChip: { marginTop: 13, borderRadius: 999, backgroundColor: '#FFF4CF', paddingHorizontal: 16, paddingVertical: 8 },
  rewardChipText: { color: '#7A5B0D', fontSize: 12, fontWeight: '900' },
  footer: { paddingTop: 12 },
  primaryButton: { minHeight: 56, borderRadius: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.84, transform: [{ scale: 0.985 }] },
});
