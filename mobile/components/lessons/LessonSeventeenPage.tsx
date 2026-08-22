import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useStars } from '@/context/StarsContext';
import { useTheme } from '@/context/ThemeContext';
import type { BlockAsset } from '@/types/content';

type Props = {
  images: BlockAsset[];
  completed: boolean;
  saving: boolean;
  onBack: () => void;
  onNext?: () => void;
  onComplete: () => void;
  resolveUrl: (url: string) => string;
};

const NOTES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'Lya', 'Si', 'Do'] as const;
const DEGREES = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'] as const;
const QUIZ_STEP = 5;
const REWARD_STEP = 6;
const TOTAL_STEPS = 7;

const TONIC_OPTIONS = [
  { id: 'do', label: 'Do', degree: 'I', correct: true },
  { id: 'mi', label: 'Mi', degree: 'III', correct: false },
  { id: 'sol', label: 'Sol', degree: 'V', correct: false },
] as const;

const QUIZ_OPTIONS = [
  { id: 'white', label: 'Do dan Do gacha oq klavishlar', emoji: '⬜', correct: true },
  { id: 'black', label: 'Faqat qora klavishlar', emoji: '⬛', correct: false },
  { id: 'three', label: 'Faqat Do, Mi, Sol', emoji: '3️⃣', correct: false },
] as const;

const BLACK_KEY_POSITIONS = [12.5, 25, 50, 62.5, 75];

export function LessonSeventeenPage({ images, completed, saving, onBack, onNext, onComplete, resolveUrl }: Props) {
  const { colors } = useTheme();
  const { awardLessonStars } = useStars();
  const [step, setStep] = useState(0);
  const [pathIndex, setPathIndex] = useState(0);
  const [pathMistakes, setPathMistakes] = useState(0);
  const [tonicChoice, setTonicChoice] = useState<string | null>(null);
  const [tonicChecked, setTonicChecked] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.86)).current;

  const sourceImage = images.find((asset) => asset.file.includes('image108'))
    ?? images.find((asset) => asset.file.includes('image107'))
    ?? images.find((asset) => !asset.file.includes('image5'));
  const pathComplete = pathIndex >= NOTES.length;
  const tonicCorrect = tonicChoice === 'do';
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

  function pressWhiteKey(index: number) {
    if (pathComplete) return;
    if (index === pathIndex) {
      setPathIndex((value) => value + 1);
      return;
    }
    setPathMistakes((value) => value + 1);
  }

  function pressBlackKey() {
    if (pathComplete) return;
    setPathMistakes((value) => value + 1);
  }

  function checkTonic() {
    if (!tonicChoice || tonicChecked) return;
    setTonicChecked(true);
  }

  function checkQuiz() {
    if (!selectedQuizId || quizChecked) return;
    const selected = QUIZ_OPTIONS.find((option) => option.id === selectedQuizId);
    const stars: 2 | 3 = selected?.correct ? 3 : 2;
    setRewardStars(stars);
    awardLessonStars(17, stars);
    setQuizChecked(true);
  }

  function goForward() {
    if (step === 3 && !pathComplete) return;
    if (step === 4) {
      if (!tonicChecked) {
        checkTonic();
        return;
      }
      setStep(QUIZ_STEP);
      return;
    }
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
    || (step === 3 && !pathComplete)
    || (step === 4 && !tonicChoice)
    || (step === QUIZ_STEP && !selectedQuizId)
    || (isFinalStep && completed && !onNext);

  const buttonLabel = step === 3 && !pathComplete
    ? `Navbat: ${NOTES[Math.min(pathIndex, NOTES.length - 1)]}`
    : step === 4
      ? !tonicChoice
        ? 'Tonikani tanla'
        : !tonicChecked
          ? 'Javobni tekshirish'
          : 'Davom etish'
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
        <View style={styles.lessonBadge}><Ionicons name="keypad-outline" size={16} color="#2C8B57" /><Text style={styles.lessonBadgeText}>17-DARS</Text></View>
        <View style={styles.starBadge}><Ionicons name="star" size={22} color="#F2B01E" /></View>
      </View>

      <View style={styles.progressDots}>
        {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
          <View key={index} style={[styles.progressDot, { backgroundColor: index <= step ? '#2C8B57' : colors.border }, index === step && styles.progressDotCurrent]} />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Text style={styles.heroEmoji}>🎹</Text></View>
          <Text style={styles.heroKicker}>OQ KLAVISHLAR BO‘YLAB 🌿</Text>
          <Text style={styles.heroTitle}>Do major tonalligi</Text>
          <Text style={styles.heroText}>Do notasidan keyingi Do notasigacha bo‘lgan oq klavishlarni birga topamiz.</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>BILIB OLAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Do dan Do gacha</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Taqdimotga ko‘ra, Do notasidan keyingi Do notasigacha bo‘lgan oq klavishli notalarni Do major tonalligi deb ataymiz.</Text>
          {sourceImage ? (
            <View style={styles.sourceFrame}>
              <ExpoImage source={{ uri: resolveUrl(sourceImage.url) }} style={styles.sourceImage} contentFit="contain" />
            </View>
          ) : null}
          <View style={styles.noteStrip}>
            {NOTES.map((note, index) => <View key={`${note}-${index}`} style={[styles.noteChip, index === 0 || index === 7 ? styles.noteChipDo : null]}><Text style={[styles.noteChipText, index === 0 || index === 7 ? styles.noteChipTextDo : null]}>{note}</Text></View>)}
          </View>
          <View style={styles.tipBox}><Text style={styles.tipEmoji}>💡</Text><Text style={styles.tipText}>Do major gammada 7 ta asosiy pog‘ona bor. Keyingi Do yangi oktavaning boshlanishi.</Text></View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>POG‘ONALAR</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>I pog‘ona — Tonika ⭐</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Do major tonalligida I pog‘ona Do notasi. U markaziy asosiy pog‘ona bo‘lib, Tonika deyiladi.</Text>
          <View style={styles.degreeGrid}>
            {NOTES.slice(0, 7).map((note, index) => (
              <View key={note} style={[styles.degreeCard, index === 0 && styles.degreeCardTonic]}>
                <Text style={[styles.degreeRoman, index === 0 && styles.degreeRomanTonic]}>{DEGREES[index]}</Text>
                <Text style={[styles.degreeNote, index === 0 && styles.degreeNoteTonic]}>{note}</Text>
                {index === 0 ? <Text style={styles.tonicBadge}>TONIKA</Text> : null}
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>MINI O‘YIN</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Do major yo‘lini bos 🎯</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Do dan boshlang va oq klavishlarni chapdan o‘ngga tartib bilan bosib, keyingi Do gacha boring. Qora klavishlarga tegmang.</Text>

          <View style={styles.pathStatus}>
            <View style={[styles.pathCounter, pathComplete && styles.pathCounterDone]}><Text style={styles.pathCounterText}>{pathComplete ? '✓' : `${pathIndex}/8`}</Text></View>
            <View style={{ flex: 1 }}><Text style={styles.pathStatusTitle}>{pathComplete ? 'Ajoyib! Do major yo‘li tayyor.' : `Navbat: ${NOTES[Math.min(pathIndex, 7)]}`}</Text><Text style={styles.pathStatusSub}>{pathMistakes ? `${pathMistakes} marta boshqa klavishga tegding — davom et!` : 'Faqat oq klavishlarni tartib bilan bos.'}</Text></View>
          </View>

          <View style={styles.keyboard}>
            <View style={styles.whiteRow}>
              {NOTES.map((note, index) => {
                const done = index < pathIndex || pathComplete;
                const active = !pathComplete && index === pathIndex;
                return (
                  <Pressable key={`${note}-${index}`} onPress={() => pressWhiteKey(index)} style={({ pressed }) => [styles.whiteKey, done && styles.whiteKeyDone, active && styles.whiteKeyActive, pressed && styles.keyPressed]}>
                    <Text style={[styles.whiteKeyNumber, done && styles.whiteKeyTextDone]}>{index + 1}</Text>
                    <Text style={[styles.whiteKeyText, done && styles.whiteKeyTextDone]}>{done ? '✓' : note}</Text>
                  </Pressable>
                );
              })}
            </View>
            {BLACK_KEY_POSITIONS.map((left, index) => (
              <Pressable key={left} onPress={pressBlackKey} style={({ pressed }) => [styles.blackKey, { left: `${left}%` }, pressed && styles.blackKeyPressed]}>
                <Text style={styles.blackKeyText}>×</Text>
              </Pressable>
            ))}
          </View>

          <Pressable onPress={() => { setPathIndex(0); setPathMistakes(0); }} style={styles.resetButton}><Ionicons name="refresh" size={18} color="#2C8B57" /><Text style={styles.resetText}>Qaytadan boshlash</Text></Pressable>
        </View>
      ) : null}

      {step === 4 ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.quizIcon}><Text style={styles.quizEmoji}>⭐</Text></View>
          <Text style={styles.stepLabel}>TONIKANI TOP</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>Do major tonalligida I pog‘ona — Tonika qaysi nota?</Text>
          <View style={styles.tonicOptions}>
            {TONIC_OPTIONS.map((option) => {
              const selected = tonicChoice === option.id;
              const showCorrect = tonicChecked && option.correct;
              const showWrong = tonicChecked && selected && !option.correct;
              return (
                <Pressable key={option.id} disabled={tonicChecked} onPress={() => setTonicChoice(option.id)} style={[styles.tonicOption, { borderColor: selected ? '#2C8B57' : colors.border, backgroundColor: selected ? '#E5F7EC' : colors.surface }, showCorrect && { borderColor: colors.success, backgroundColor: colors.successSurface }, showWrong && { borderColor: '#E2A93B', backgroundColor: '#FFF3D5' }]}>
                  <Text style={styles.tonicDegree}>{option.degree}</Text><Text style={[styles.tonicLabel, { color: colors.text }]}>{option.label}</Text>
                  {showCorrect ? <Ionicons name="checkmark-circle" size={24} color={colors.success} /> : null}
                  {showWrong ? <Ionicons name="close-circle" size={24} color="#D59A25" /> : null}
                </Pressable>
              );
            })}
          </View>
          {tonicChecked ? <View style={[styles.feedback, { backgroundColor: tonicCorrect ? colors.successSurface : '#FFF3D5' }]}><Text style={styles.feedbackEmoji}>{tonicCorrect ? '🎉' : '💡'}</Text><View style={{ flex: 1 }}><Text style={[styles.feedbackTitle, { color: colors.text }]}>{tonicCorrect ? 'To‘g‘ri!' : 'Yaxshi urinish!'}</Text><Text style={[styles.feedbackText, { color: colors.muted }]}>{tonicCorrect ? 'Do majorning I pog‘onasi — Do. U Tonika.' : 'To‘g‘ri javob — I pog‘ona, Do notasi.'}</Text></View></View> : null}
        </View>
      ) : null}

      {step === QUIZ_STEP ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.quizIcon}><Text style={styles.quizEmoji}>🧠</Text></View>
          <Text style={styles.stepLabel}>MINI SAVOL</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>Do major tonalligi qaysi klavishlardan tuziladi?</Text>
          <View style={styles.quizOptions}>
            {QUIZ_OPTIONS.map((option) => {
              const selected = selectedQuizId === option.id;
              const showCorrect = quizChecked && option.correct;
              const showWrong = quizChecked && selected && !option.correct;
              return (
                <Pressable key={option.id} disabled={quizChecked} onPress={() => setSelectedQuizId(option.id)} style={[styles.quizOption, { borderColor: selected ? '#2C8B57' : colors.border, backgroundColor: selected ? '#E5F7EC' : colors.surface }, showCorrect && { borderColor: colors.success, backgroundColor: colors.successSurface }, showWrong && { borderColor: '#E2A93B', backgroundColor: '#FFF3D5' }]}>
                  <Text style={styles.quizOptionEmoji}>{option.emoji}</Text><Text style={[styles.quizOptionText, { color: colors.text }]}>{option.label}</Text>
                  {selected && !quizChecked ? <Ionicons name="radio-button-on" size={22} color="#2C8B57" /> : null}
                  {showCorrect ? <Ionicons name="checkmark-circle" size={24} color={colors.success} /> : null}
                  {showWrong ? <Ionicons name="close-circle" size={24} color="#D59A25" /> : null}
                </Pressable>
              );
            })}
          </View>
          {quizChecked ? <View style={[styles.feedback, { backgroundColor: answerCorrect ? colors.successSurface : '#FFF3D5' }]}><Text style={styles.feedbackEmoji}>{answerCorrect ? '🎉' : '💡'}</Text><View style={{ flex: 1 }}><Text style={[styles.feedbackTitle, { color: colors.text }]}>{answerCorrect ? 'To‘g‘ri!' : 'Yaxshi urinish!'}</Text><Text style={[styles.feedbackText, { color: colors.muted }]}>{answerCorrect ? 'Ha, Do dan keyingi Do gacha bo‘lgan oq klavishlar.' : 'To‘g‘ri javob — Do dan Do gacha oq klavishlar.'}</Text></View></View> : null}
        </View>
      ) : null}

      {step === REWARD_STEP ? (
        <Animated.View style={[styles.rewardCard, { backgroundColor: colors.surface, borderColor: colors.border, transform: [{ scale: rewardScale }] }]}>
          <View style={styles.rewardBurst}><Text style={styles.rewardEmoji}>🎹</Text></View>
          <Text style={styles.rewardKicker}>DO MAJORNI TOPDING!</Text>
          <Text style={[styles.rewardTitle, { color: colors.text }]}>Barakalla!</Text>
          <View style={styles.rewardStars}>{[0, 1, 2].map((index) => <Ionicons key={index} name="star" size={38} color={index < rewardStars ? '#F2B01E' : colors.border} />)}</View>
          <Text style={[styles.rewardText, { color: colors.muted }]}>Do majorning oq klavishlarini, 7 pog‘onasini va Tonikasini bilib olding.</Text>
        </Animated.View>
      ) : null}

      <Pressable disabled={buttonDisabled} onPress={goForward} style={({ pressed }) => [styles.primaryButton, buttonDisabled && styles.primaryButtonDisabled, pressed && !buttonDisabled && styles.primaryButtonPressed]}>
        <Text style={styles.primaryButtonText}>{buttonLabel}</Text>
        {!buttonDisabled ? <Ionicons name={isFinalStep && completed && onNext ? 'arrow-forward' : 'chevron-forward'} size={21} color="#fff" /> : null}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { gap: 16, paddingBottom: 24 },
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navButton: { width: 44, height: 44, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  lessonBadge: { minHeight: 38, borderRadius: 14, backgroundColor: '#E5F7EC', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 6 },
  lessonBadgeText: { color: '#2C8B57', fontWeight: '900', fontSize: 12 },
  starBadge: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#FFF5D8', alignItems: 'center', justifyContent: 'center' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  progressDot: { width: 9, height: 9, borderRadius: 999 },
  progressDotCurrent: { width: 24 },
  hero: { alignItems: 'center', paddingVertical: 34, paddingHorizontal: 16 },
  heroIcon: { width: 105, height: 105, borderRadius: 34, backgroundColor: '#E5F7EC', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  heroEmoji: { fontSize: 54 },
  heroKicker: { color: '#2C8B57', fontSize: 11, fontWeight: '900', letterSpacing: 1.1, textAlign: 'center' },
  heroTitle: { color: '#282337', fontSize: 31, lineHeight: 37, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  heroText: { color: '#716A7D', fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: 9, maxWidth: 330 },
  card: { borderRadius: 25, borderWidth: 1, padding: 18, gap: 14 },
  stepLabel: { color: '#2C8B57', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  sectionTitle: { fontSize: 24, lineHeight: 30, fontWeight: '900' },
  sectionText: { fontSize: 14, lineHeight: 21 },
  sourceFrame: { height: 175, borderRadius: 18, backgroundColor: '#FAFBF8', borderWidth: 1, borderColor: '#E4EBE5', overflow: 'hidden', padding: 8 },
  sourceImage: { width: '100%', height: '100%' },
  noteStrip: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  noteChip: { minWidth: 48, paddingHorizontal: 10, height: 37, borderRadius: 12, backgroundColor: '#F0F3EF', alignItems: 'center', justifyContent: 'center' },
  noteChipDo: { backgroundColor: '#DDF4E6', borderWidth: 1, borderColor: '#2C8B57' },
  noteChipText: { color: '#5B5761', fontWeight: '800', fontSize: 12 },
  noteChipTextDo: { color: '#267A4D' },
  tipBox: { flexDirection: 'row', gap: 9, padding: 13, borderRadius: 16, backgroundColor: '#EEF8F1', alignItems: 'flex-start' },
  tipEmoji: { fontSize: 18 },
  tipText: { flex: 1, color: '#526657', fontSize: 12, lineHeight: 18, fontWeight: '700' },
  degreeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  degreeCard: { width: '30.5%', minHeight: 91, borderRadius: 17, backgroundColor: '#F3F5F3', alignItems: 'center', justifyContent: 'center', gap: 3, padding: 9 },
  degreeCardTonic: { backgroundColor: '#DDF4E6', borderWidth: 2, borderColor: '#2C8B57' },
  degreeRoman: { color: '#7C7781', fontSize: 11, fontWeight: '900' },
  degreeRomanTonic: { color: '#2C8B57' },
  degreeNote: { color: '#3D3943', fontSize: 18, fontWeight: '900' },
  degreeNoteTonic: { color: '#216F46' },
  tonicBadge: { marginTop: 3, color: '#2C8B57', fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  pathStatus: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderRadius: 17, backgroundColor: '#EEF8F1' },
  pathCounter: { width: 53, height: 53, borderRadius: 18, backgroundColor: '#2C8B57', alignItems: 'center', justifyContent: 'center' },
  pathCounterDone: { backgroundColor: '#16805A' },
  pathCounterText: { color: '#fff', fontSize: 14, fontWeight: '900' },
  pathStatusTitle: { color: '#2E3C32', fontWeight: '900', fontSize: 13 },
  pathStatusSub: { marginTop: 3, color: '#6C7B70', fontSize: 10, lineHeight: 15 },
  keyboard: { height: 225, borderRadius: 18, backgroundColor: '#34313B', padding: 8, position: 'relative', overflow: 'hidden' },
  whiteRow: { flex: 1, flexDirection: 'row', gap: 2 },
  whiteKey: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 7, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 14, borderWidth: 2, borderColor: '#E1E0E5' },
  whiteKeyActive: { backgroundColor: '#E4F8EB', borderColor: '#2C8B57', borderWidth: 3 },
  whiteKeyDone: { backgroundColor: '#D9F2E2', borderColor: '#78BE93' },
  whiteKeyText: { color: '#403B48', fontSize: 11, fontWeight: '900' },
  whiteKeyTextDone: { color: '#1E7145' },
  whiteKeyNumber: { position: 'absolute', bottom: 35, color: '#9A95A0', fontSize: 9, fontWeight: '800' },
  keyPressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  blackKey: { position: 'absolute', top: 8, width: '8.3%', height: 121, marginLeft: '-4.15%', borderBottomLeftRadius: 7, borderBottomRightRadius: 7, backgroundColor: '#24212A', borderWidth: 1, borderColor: '#17151B', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 12, zIndex: 5 },
  blackKeyPressed: { backgroundColor: '#7A3647' },
  blackKeyText: { color: '#8D8991', fontWeight: '900', fontSize: 13 },
  resetButton: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, padding: 9 },
  resetText: { color: '#2C8B57', fontSize: 12, fontWeight: '900' },
  quizIcon: { width: 61, height: 61, borderRadius: 20, backgroundColor: '#E5F7EC', alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  quizEmoji: { fontSize: 30 },
  quizTitle: { fontSize: 21, lineHeight: 28, textAlign: 'center', fontWeight: '900' },
  tonicOptions: { gap: 9 },
  tonicOption: { minHeight: 67, borderWidth: 2, borderRadius: 17, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  tonicDegree: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#E5F7EC', color: '#2C8B57', textAlign: 'center', textAlignVertical: 'center', fontWeight: '900', fontSize: 14 },
  tonicLabel: { flex: 1, fontSize: 16, fontWeight: '900' },
  quizOptions: { gap: 9 },
  quizOption: { minHeight: 65, borderWidth: 2, borderRadius: 17, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  quizOptionEmoji: { fontSize: 22 },
  quizOptionText: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '800' },
  feedback: { borderRadius: 17, padding: 13, flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  feedbackEmoji: { fontSize: 22 },
  feedbackTitle: { fontSize: 14, fontWeight: '900' },
  feedbackText: { marginTop: 3, fontSize: 11, lineHeight: 16 },
  rewardCard: { borderRadius: 28, borderWidth: 1, padding: 25, alignItems: 'center' },
  rewardBurst: { width: 103, height: 103, borderRadius: 35, backgroundColor: '#E5F7EC', alignItems: 'center', justifyContent: 'center' },
  rewardEmoji: { fontSize: 52 },
  rewardKicker: { marginTop: 17, color: '#2C8B57', fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  rewardTitle: { marginTop: 6, fontSize: 30, fontWeight: '900' },
  rewardStars: { flexDirection: 'row', gap: 4, marginTop: 12 },
  rewardText: { marginTop: 12, textAlign: 'center', fontSize: 13, lineHeight: 20 },
  primaryButton: { minHeight: 58, borderRadius: 19, backgroundColor: '#2C8B57', paddingHorizontal: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryButtonDisabled: { opacity: 0.42 },
  primaryButtonPressed: { opacity: 0.87, transform: [{ scale: 0.99 }] },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '900' },
});
