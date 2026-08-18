import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { AudioPlayer } from '@/components/media/AudioPlayer';
import { useStars } from '@/context/StarsContext';
import { useTheme } from '@/context/ThemeContext';
import type { BlockAsset } from '@/types/content';

type LessonThreePageProps = {
  noteAudios: BlockAsset[];
  melodyAudios: BlockAsset[];
  completed: boolean;
  saving: boolean;
  onBack: () => void;
  onNext?: () => void;
  onComplete: () => void;
  onOpenPiano: () => void;
  resolveUrl: (url: string) => string;
};

const NOTES = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'Lya', 'Si'] as const;
const QUIZ_STEP = 5;
const REWARD_STEP = 6;
const TOTAL_STEPS = 7;

const QUIZ_OPTIONS = [
  { id: 're', label: 'Re', emoji: '🎵', correct: true },
  { id: 'fa', label: 'Fa', emoji: '🎶', correct: false },
  { id: 'si', label: 'Si', emoji: '✨', correct: false },
];

function NoteSoundButton({ label, url, index }: { label: string; url?: string; index: number }) {
  const { colors } = useTheme();
  const player = useAudioPlayer(url ?? null);
  const status = useAudioPlayerStatus(player);
  const playable = !!url;

  const play = () => {
    if (!playable) return;
    if (status.duration > 0 && status.currentTime >= status.duration - 0.05) player.seekTo(0);
    else player.seekTo(0);
    player.play();
  };

  const palette = [
    ['#EEE9FF', '#6C5CE7'],
    ['#E3F4FF', '#2483C5'],
    ['#FFF1BE', '#A66A00'],
    ['#DFF7EC', '#16805A'],
    ['#FFE7EE', '#C14E70'],
    ['#E9E4FF', '#7459D9'],
    ['#E8F7FF', '#237FAF'],
  ][index % 7];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} notasini eshitish`}
      accessibilityState={{ disabled: !playable }}
      disabled={!playable}
      onPress={play}
      style={({ pressed }) => [
        styles.noteButton,
        { backgroundColor: palette[0], borderColor: status.playing ? palette[1] : colors.border },
        pressed && playable && styles.pressed,
        !playable && styles.noteDisabled,
      ]}
    >
      <View style={[styles.noteCircle, { backgroundColor: palette[1] }]}>
        <Ionicons name={status.playing ? 'volume-high' : 'musical-note'} size={18} color="#FFFFFF" />
      </View>
      <Text style={styles.noteLabel}>{label}</Text>
    </Pressable>
  );
}

export function LessonThreePage({
  noteAudios,
  melodyAudios,
  completed,
  saving,
  onBack,
  onNext,
  onComplete,
  onOpenPiano,
  resolveUrl,
}: LessonThreePageProps) {
  const { colors } = useTheme();
  const { awardLessonStars } = useStars();
  const [step, setStep] = useState(0);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [rewardStars, setRewardStars] = useState<2 | 3>(3);
  const rewardScale = useRef(new Animated.Value(0.84)).current;
  const isFinalStep = step === REWARD_STEP;

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
    const stars: 2 | 3 = selected?.correct ? 3 : 2;
    setRewardStars(stars);
    awardLessonStars(3, stars);
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

        <View style={styles.lessonBadge}>
          <Ionicons name="musical-note" size={16} color="#A66A00" />
          <Text style={styles.lessonBadgeText}>3-DARS</Text>
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
              { backgroundColor: index <= step ? '#C27A00' : colors.border },
              index === step && styles.progressDotCurrent,
            ]}
          />
        ))}
      </View>

      {step === 0 ? (
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroEmoji}>🎹</Text>
          </View>
          <Text style={styles.heroKicker}>KEL, CHALIB KO‘RAMIZ 🎵</Text>
          <Text style={styles.heroTitle}>Klaviatura bilan tanishamiz</Text>
          <Text style={styles.heroText}>Oq va qora klavishlar ichida notalar yashiringan. Ularni birga topamiz!</Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={[styles.keyboardInfoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>BILIB OLAMIZ</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Klaviatura nima?</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Klaviatura — musiqa cholg‘usidagi tartib bilan joylashgan oq va qora klavishlar majmui.</Text>

          <View style={styles.miniKeyboard}>
            {Array.from({ length: 7 }).map((_, index) => (
              <View key={index} style={[styles.whiteMiniKey, index === 0 && styles.whiteMiniKeyFirst]}>
                <Text style={styles.whiteMiniLabel}>{NOTES[index]}</Text>
              </View>
            ))}
            {[0, 1, 3, 4, 5].map((afterWhite) => (
              <View
                key={afterWhite}
                style={[styles.blackMiniKey, { left: `${((afterWhite + 1) / 7) * 100 - 4}%` }]}
              />
            ))}
          </View>

          <View style={styles.tipBox}>
            <Text style={styles.tipEmoji}>👀</Text>
            <Text style={styles.tipText}>Oq klavishlarda nota nomlarini ko‘ryapsan. Qora klavishlar esa ularning orasida turadi.</Text>
          </View>
        </View>
      ) : null}

      {step === 2 ? (
        <View style={[styles.notesCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>TINGLAB KO‘R</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>7 ta nota 🎶</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Har bir nota tugmasini bosib, uning tovushini eshit.</Text>

          <View style={styles.notesGrid}>
            {NOTES.map((note, index) => (
              <NoteSoundButton
                key={note}
                label={note}
                index={index}
                url={noteAudios[index] ? resolveUrl(noteAudios[index].url) : undefined}
              />
            ))}
          </View>

          <View style={styles.orderPill}>
            <Text style={styles.orderText}>Do → Re → Mi → Fa → Sol → Lya → Si</Text>
          </View>
        </View>
      ) : null}

      {step === 3 ? (
        <View style={[styles.octaveCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <Text style={styles.stepLabel}>OKTAVALAR</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Notalar yana takrorlanadi</Text>
          <Text style={[styles.sectionText, { color: colors.muted }]}>Klaviaturada bir xil nota nomlari turli balandliklarda qayta uchraydi. Bu guruhlar oktava deb ataladi.</Text>

          <View style={styles.octaveRow}>
            <View style={[styles.octaveChip, { backgroundColor: '#EEE9FF' }]}>
              <Text style={styles.octaveEmoji}>⬇️</Text>
              <Text style={styles.octaveTitle}>Kichik</Text>
            </View>
            <View style={[styles.octaveChip, styles.octaveChipMain]}>
              <Text style={styles.octaveEmoji}>🎹</Text>
              <Text style={styles.octaveTitle}>1-oktava</Text>
            </View>
            <View style={[styles.octaveChip, { backgroundColor: '#DFF7EC' }]}>
              <Text style={styles.octaveEmoji}>⬆️</Text>
              <Text style={styles.octaveTitle}>2-oktava</Text>
            </View>
          </View>

          {melodyAudios[0] ? (
            <View style={styles.melodyWrap}>
              <Text style={styles.melodyLabel}>Kuydan namuna 🎧</Text>
              <AudioPlayer url={resolveUrl(melodyAudios[0].url)} title="Kuyni tingla" />
            </View>
          ) : null}
        </View>
      ) : null}

      {step === 4 ? (
        <View style={styles.practiceCard}>
          <View style={styles.practicePiano}><Text style={styles.practicePianoEmoji}>🎹</Text></View>
          <Text style={styles.practiceKicker}>ENDI O‘ZING CHAL!</Text>
          <Text style={styles.practiceTitle}>Do → Re → Mi → Fa → Sol</Text>
          <Text style={styles.practiceText}>Pianinoni ochib, shu beshta notani ketma-ket bosib ko‘r.</Text>

          <Pressable onPress={onOpenPiano} style={({ pressed }) => [styles.pianoButton, pressed && styles.pressed]}>
            <Ionicons name="musical-notes" size={22} color="#FFFFFF" />
            <Text style={styles.pianoButtonText}>Pianinoni ochish</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.practiceTip}>
            <Text style={styles.practiceTipText}>Pianinodan qaytgach, pastdagi “Davom etish”ni bos.</Text>
          </View>
        </View>
      ) : null}

      {step === QUIZ_STEP ? (
        <View style={[styles.quizCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.quizIcon}><Text style={styles.quizEmoji}>🎵</Text></View>
          <Text style={styles.stepLabel}>MINI SAVOL</Text>
          <Text style={[styles.quizTitle, { color: colors.text }]}>Do notasidan keyin qaysi nota keladi?</Text>

          <View style={styles.quizOptions}>
            {QUIZ_OPTIONS.map((option) => {
              const selected = selectedQuizId === option.id;
              const showCorrect = quizChecked && option.correct;
              const showWrong = quizChecked && selected && !option.correct;
              const surface = showCorrect
                ? { backgroundColor: colors.successSurface, borderColor: colors.success }
                : showWrong
                  ? { backgroundColor: '#FFF3D5', borderColor: '#E2A93B' }
                  : selected
                    ? { backgroundColor: '#FFF1BE', borderColor: '#C27A00' }
                    : { backgroundColor: colors.surface, borderColor: colors.border };

              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ selected, disabled: quizChecked }}
                  disabled={quizChecked}
                  onPress={() => chooseQuizOption(option.id)}
                  style={({ pressed }) => [styles.quizOption, surface, pressed && !quizChecked && styles.pressed]}
                >
                  <Text style={styles.quizOptionEmoji}>{option.emoji}</Text>
                  <Text style={[styles.quizOptionText, { color: colors.text }]}>{option.label}</Text>
                  {selected && !quizChecked ? (
                    <View style={styles.selectedBadge}>
                      <Ionicons name="radio-button-on" size={20} color="#C27A00" />
                      <Text style={styles.selectedText}>Tanlandi</Text>
                    </View>
                  ) : null}
                  {showCorrect ? <Ionicons name="checkmark-circle" size={25} color={colors.success} /> : null}
                  {showWrong ? <Ionicons name="close-circle" size={25} color="#D59A25" /> : null}
                </Pressable>
              );
            })}
          </View>

          {quizChecked ? (
            <View style={[styles.feedback, { backgroundColor: answerCorrect ? colors.successSurface : '#FFF3D5' }]}> 
              <Text style={styles.feedbackEmoji}>{answerCorrect ? '🎉' : '💡'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.feedbackTitle, { color: colors.text }]}>{answerCorrect ? 'To‘g‘ri!' : 'Yaxshi urinish!'}</Text>
                <Text style={[styles.feedbackText, { color: colors.muted }]}>
                  {answerCorrect
                    ? 'Do dan keyin Re keladi. Sen 3 yulduz olding!'
                    : 'To‘g‘ri javob — Re. Keyingi safar 3 yulduzni olasan!'}
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
            <Text style={[styles.rewardTitle, { color: colors.text }]}>{rewardStars === 3 ? 'Ajoyib!' : 'Barakalla!'}</Text>
            <Text style={[styles.rewardText, { color: colors.muted }]}>Klaviatura va nota tartibini bilib olding!</Text>
            <View style={styles.starsRow}>
              {[0, 1, 2].map((star) => (
                <Ionicons key={star} name={star < rewardStars ? 'star' : 'star-outline'} size={40} color={star < rewardStars ? '#F2B01E' : '#B9B2C7'} />
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
          { backgroundColor: isFinalStep ? colors.success : '#C27A00' },
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
  lessonBadge: { minHeight: 38, paddingHorizontal: 14, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF1BE' },
  lessonBadgeText: { color: '#A66A00', fontSize: 12, fontWeight: '900', letterSpacing: 0.6 },
  starBadge: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  progressDots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  progressDot: { width: 20, height: 7, borderRadius: 999 },
  progressDotCurrent: { width: 34 },
  hero: { minHeight: 410, borderRadius: 32, padding: 26, justifyContent: 'center', backgroundColor: '#C27A00' },
  heroIcon: { width: 82, height: 82, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  heroEmoji: { fontSize: 45 },
  heroKicker: { color: 'rgba(255,255,255,0.78)', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: '#FFFFFF', fontSize: 33, lineHeight: 39, fontWeight: '900', marginTop: 9 },
  heroText: { color: 'rgba(255,255,255,0.9)', fontSize: 17, lineHeight: 25, fontWeight: '700', marginTop: 12 },
  stepLabel: { color: '#A66A00', fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  keyboardInfoCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  sectionTitle: { fontSize: 29, lineHeight: 35, fontWeight: '900', marginTop: 7 },
  sectionText: { fontSize: 16, lineHeight: 24, fontWeight: '600', marginTop: 9 },
  miniKeyboard: { height: 155, borderRadius: 20, marginTop: 22, flexDirection: 'row', overflow: 'hidden', borderWidth: 2, borderColor: '#332E3D', position: 'relative' },
  whiteMiniKey: { flex: 1, backgroundColor: '#FFFFFF', borderLeftWidth: 1, borderLeftColor: '#A9A3B7', justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 12 },
  whiteMiniKeyFirst: { borderLeftWidth: 0 },
  whiteMiniLabel: { color: '#302B3D', fontSize: 11, fontWeight: '900' },
  blackMiniKey: { position: 'absolute', top: 0, width: '8%', height: 91, backgroundColor: '#302B3D', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, zIndex: 2 },
  tipBox: { marginTop: 17, borderRadius: 18, padding: 12, backgroundColor: '#FFF1BE', flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipEmoji: { fontSize: 24 },
  tipText: { flex: 1, color: '#6D5315', fontSize: 11, lineHeight: 17, fontWeight: '700' },
  notesCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  notesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 20 },
  noteButton: { width: '30.5%', minHeight: 82, borderRadius: 21, padding: 10, borderWidth: 2, alignItems: 'center', justifyContent: 'center', gap: 7 },
  noteCircle: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  noteLabel: { color: '#302B3D', fontSize: 15, fontWeight: '900' },
  noteDisabled: { opacity: 0.45 },
  orderPill: { marginTop: 18, borderRadius: 18, paddingVertical: 13, paddingHorizontal: 10, backgroundColor: '#FFF4CE', alignItems: 'center' },
  orderText: { color: '#785613', fontSize: 12, fontWeight: '900' },
  octaveCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  octaveRow: { flexDirection: 'row', gap: 9, marginTop: 22 },
  octaveChip: { flex: 1, minHeight: 100, borderRadius: 22, alignItems: 'center', justifyContent: 'center', padding: 9 },
  octaveChipMain: { backgroundColor: '#FFF1BE', borderWidth: 2, borderColor: '#E4B14E' },
  octaveEmoji: { fontSize: 28 },
  octaveTitle: { color: '#302B3D', fontSize: 12, fontWeight: '900', textAlign: 'center', marginTop: 7 },
  melodyWrap: { marginTop: 18, gap: 8 },
  melodyLabel: { color: '#A66A00', fontSize: 11, fontWeight: '900', letterSpacing: 0.6 },
  practiceCard: { minHeight: 410, borderRadius: 32, padding: 25, justifyContent: 'center', alignItems: 'center', backgroundColor: '#2F2B3E' },
  practicePiano: { width: 88, height: 88, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF15' },
  practicePianoEmoji: { fontSize: 48 },
  practiceKicker: { color: '#FFD76A', fontSize: 11, fontWeight: '900', letterSpacing: 0.9, marginTop: 20 },
  practiceTitle: { color: '#FFFFFF', fontSize: 27, lineHeight: 34, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  practiceText: { color: '#D9D4E3', fontSize: 15, lineHeight: 22, fontWeight: '600', textAlign: 'center', marginTop: 9 },
  pianoButton: { marginTop: 24, width: '100%', minHeight: 58, borderRadius: 20, backgroundColor: '#C27A00', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, paddingHorizontal: 16 },
  pianoButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '900', flex: 1, textAlign: 'center' },
  practiceTip: { marginTop: 15, borderRadius: 16, padding: 11, backgroundColor: '#FFFFFF10' },
  practiceTipText: { color: '#CFC9D9', fontSize: 11, lineHeight: 17, fontWeight: '700', textAlign: 'center' },
  quizCard: { minHeight: 410, borderRadius: 32, padding: 20, borderWidth: 1, justifyContent: 'center' },
  quizIcon: { width: 68, height: 68, borderRadius: 24, backgroundColor: '#FFF1BE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  quizEmoji: { fontSize: 37 },
  quizTitle: { fontSize: 28, lineHeight: 34, fontWeight: '900', marginTop: 7, marginBottom: 18 },
  quizOptions: { gap: 9 },
  quizOption: { minHeight: 68, borderRadius: 20, borderWidth: 1.5, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  quizOptionEmoji: { fontSize: 28 },
  quizOptionText: { flex: 1, fontSize: 17, fontWeight: '900' },
  selectedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  selectedText: { color: '#A66A00', fontSize: 10, fontWeight: '900' },
  feedback: { marginTop: 13, borderRadius: 19, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  feedbackEmoji: { fontSize: 27 },
  feedbackTitle: { fontSize: 15, fontWeight: '900' },
  feedbackText: { fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: 2 },
  rewardCard: { minHeight: 410, borderRadius: 32, padding: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF4CE' },
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
