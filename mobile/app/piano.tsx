import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/theme/colors';

const WHITE_KEYS = [
  { id: 'C4', label: 'Do', semitone: 0 },
  { id: 'D4', label: 'Re', semitone: 2 },
  { id: 'E4', label: 'Mi', semitone: 4 },
  { id: 'F4', label: 'Fa', semitone: 5 },
  { id: 'G4', label: 'Sol', semitone: 7 },
  { id: 'A4', label: 'Lya', semitone: 9 },
  { id: 'B4', label: 'Si', semitone: 11 },
  { id: 'C5', label: 'Do', semitone: 12 },
] as const;

const BLACK_KEYS = [
  { id: 'Cs4', label: 'Do♯', semitone: 1, afterWhite: 0 },
  { id: 'Ds4', label: 'Re♯', semitone: 3, afterWhite: 1 },
  { id: 'Fs4', label: 'Fa♯', semitone: 6, afterWhite: 3 },
  { id: 'Gs4', label: 'Sol♯', semitone: 8, afterWhite: 4 },
  { id: 'As4', label: 'Lya♯', semitone: 10, afterWhite: 5 },
] as const;

type PianoNote = {
  id: string;
  label: string;
  scientific: string;
  frequency: number;
};

type RuntimeAudioContext = {
  state: string;
  currentTime: number;
  destination: unknown;
  resume: () => Promise<void>;
  close: () => Promise<void>;
  createGain: () => any;
  createOscillator: () => any;
};

type Voice = {
  oscillators: any[];
  envelope: any;
};

function midiFrequency(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function midiFor(octave: number, semitone: number) {
  return 12 * (octave + 1) + semitone;
}

export default function PianoScreen() {
  const { width } = useWindowDimensions();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [octave, setOctave] = useState(4);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(() => new Set());
  const [lastNote, setLastNote] = useState<PianoNote | null>(null);
  const [audioUnavailable, setAudioUnavailable] = useState(false);
  const audioContextRef = useRef<RuntimeAudioContext | null>(null);
  const voicesRef = useRef<Map<string, Voice>>(new Map());

  const keyboardWidth = Math.max(300, width - 32);
  const keyboardHeight = Math.max(240, Math.min(320, keyboardWidth * 0.82));
  const whiteKeyWidth = keyboardWidth / WHITE_KEYS.length;
  const blackKeyWidth = Math.max(24, whiteKeyWidth * 0.62);
  const blackKeyHeight = keyboardHeight * 0.6;

  const whiteNotes = useMemo(
    () =>
      WHITE_KEYS.map((key, index): PianoNote => {
        const noteOctave = octave + (key.semitone === 12 ? 1 : 0);
        const letter = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'][index];
        return {
          id: `${letter}${noteOctave}`,
          label: key.label,
          scientific: `${letter}${noteOctave}`,
          frequency: midiFrequency(midiFor(octave, key.semitone)),
        };
      }),
    [octave],
  );

  const blackNotes = useMemo(
    () =>
      BLACK_KEYS.map((key): PianoNote & { afterWhite: number } => ({
        id: `${key.id.slice(0, -1)}${octave}`,
        label: key.label,
        scientific: `${key.label.replace('Do', 'C').replace('Re', 'D').replace('Fa', 'F').replace('Sol', 'G').replace('Lya', 'A')}${octave}`,
        frequency: midiFrequency(midiFor(octave, key.semitone)),
        afterWhite: key.afterWhite,
      })),
    [octave],
  );

  const ensureContext = useCallback(async (): Promise<RuntimeAudioContext | null> => {
    if (audioUnavailable) return null;
    if (audioContextRef.current) {
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
      return audioContextRef.current;
    }

    try {
      // react-native-audio-api is a custom native module. Loading it lazily keeps
      // Expo Go from crashing while still enabling sound in a development build.
      const audioApi = require('react-native-audio-api') as {
        AudioContext: new () => RuntimeAudioContext;
      };
      const context = new audioApi.AudioContext();
      if (context.state === 'suspended') await context.resume();
      audioContextRef.current = context;
      return context;
    } catch {
      setAudioUnavailable(true);
      return null;
    }
  }, [audioUnavailable]);

  const releaseNote = useCallback((id: string, quick = false) => {
    const context = audioContextRef.current;
    const voice = voicesRef.current.get(id);
    if (!context || !voice) {
      setActiveNotes((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      return;
    }

    const now = context.currentTime;
    const end = now + (quick ? 0.04 : 0.14);
    try {
      voice.envelope.gain.cancelAndHoldAtTime(now);
      voice.envelope.gain.exponentialRampToValueAtTime(0.0001, end);
      voice.oscillators.forEach((oscillator) => oscillator.stop(end + 0.03));
    } catch {
      // The note may already have naturally stopped.
    }
    voicesRef.current.delete(id);
    setActiveNotes((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }, []);

  const playNote = useCallback(
    async (note: PianoNote) => {
      setLastNote(note);
      setActiveNotes((current) => new Set(current).add(note.id));

      const context = await ensureContext();
      if (!context) return;
      if (voicesRef.current.has(note.id)) releaseNote(note.id, true);

      const now = context.currentTime;
      const envelope = context.createGain();
      const body = context.createOscillator();
      const harmonic = context.createOscillator();
      const harmonicGain = context.createGain();

      body.type = 'triangle';
      body.frequency.value = note.frequency;
      harmonic.type = 'sine';
      harmonic.frequency.value = note.frequency * 2;
      harmonicGain.gain.value = 0.1;

      envelope.gain.setValueAtTime(0.0001, now);
      envelope.gain.exponentialRampToValueAtTime(0.42, now + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.18, now + 0.22);
      envelope.gain.exponentialRampToValueAtTime(0.04, now + 1.6);
      envelope.gain.exponentialRampToValueAtTime(0.00012, now + 4.8);

      body.connect(envelope);
      harmonic.connect(harmonicGain);
      harmonicGain.connect(envelope);
      envelope.connect(context.destination);
      body.start(now);
      harmonic.start(now);
      voicesRef.current.set(note.id, { oscillators: [body, harmonic], envelope });
    },
    [ensureContext, releaseNote],
  );

  const changeOctave = (next: number) => {
    if (next < 2 || next > 6 || next === octave) return;
    for (const id of [...voicesRef.current.keys()]) releaseNote(id, true);
    setActiveNotes(new Set());
    setLastNote(null);
    setOctave(next);
  };

  useEffect(() => {
    return () => {
      const context = audioContextRef.current;
      if (!context) return;
      for (const voice of voicesRef.current.values()) {
        try {
          voice.oscillators.forEach((oscillator) => oscillator.stop(context.currentTime + 0.01));
        } catch {
          // no-op
        }
      }
      voicesRef.current.clear();
      void context.close();
    };
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>MUSIQA BILAN O‘YNAYMIZ</Text>
            <Text style={styles.title}>Pianino 🎹</Text>
          </View>
        </View>

        {audioUnavailable ? (
          <View style={styles.audioNotice}>
            <View style={styles.audioNoticeIcon}>
              <Ionicons name="volume-mute" size={23} color="#9A6900" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.audioNoticeTitle}>Hozircha ovozsiz rejim</Text>
              <Text style={styles.audioNoticeText}>Expo Go pianinoning maxsus audio modulini qo‘llamaydi. Klavishlar ishlaydi; ovoz development build’da yoqiladi.</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <View style={styles.noteBadge}>
            <Ionicons name="musical-note" size={27} color={colors.primary} />
          </View>
          <View style={styles.infoBody}>
            <Text style={styles.infoLabel}>BOSGAN NOTANG</Text>
            <Text style={styles.infoValue}>{lastNote ? `${lastNote.label} · ${lastNote.scientific}` : 'Bir klavishni bos 🎵'}</Text>
            <Text style={styles.infoFrequency}>{lastNote ? `${lastNote.frequency.toFixed(1)} Hz` : 'Do, Re, Mi, Fa, Sol, Lya, Si'}</Text>
          </View>
        </View>

        <View style={styles.controlsCard}>
          <View>
            <Text style={styles.controlLabel}>Oktava</Text>
            <Text style={styles.rotationHint}>Past yoki balandroq tovushlarni sinab ko‘r.</Text>
          </View>
          <View style={styles.octaveControls}>
            <Pressable onPress={() => changeOctave(octave - 1)} disabled={octave <= 2} style={[styles.octaveButton, octave <= 2 && styles.disabledButton]}>
              <Ionicons name="remove" size={21} color={colors.primary} />
            </Pressable>
            <View style={styles.octaveValue}>
              <Text style={styles.octaveNumber}>{octave}</Text>
              <Text style={styles.octaveRange}>C{octave} – C{octave + 1}</Text>
            </View>
            <Pressable onPress={() => changeOctave(octave + 1)} disabled={octave >= 6} style={[styles.octaveButton, octave >= 6 && styles.disabledButton]}>
              <Ionicons name="add" size={21} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.keyboardCard}>
          <Text style={styles.keyboardHint}>Klavishlarni bosib ko‘r 👇</Text>
          <View style={[styles.keyboard, { width: keyboardWidth, height: keyboardHeight }]}>
            <View style={styles.whiteRow}>
              {whiteNotes.map((note) => {
                const active = activeNotes.has(note.id);
                return (
                  <Pressable
                    key={note.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${note.label} notasi`}
                    onPressIn={() => void playNote(note)}
                    onPressOut={() => releaseNote(note.id)}
                    style={[
                      styles.whiteKey,
                      { width: whiteKeyWidth, height: keyboardHeight },
                      active && styles.whiteKeyActive,
                    ]}
                  >
                    <Text style={[styles.whiteLabel, active && styles.whiteLabelActive]}>{note.label}</Text>
                    <Text style={[styles.whiteScientific, active && styles.whiteLabelActive]}>{note.scientific}</Text>
                  </Pressable>
                );
              })}
            </View>

            {blackNotes.map((note) => {
              const active = activeNotes.has(note.id);
              return (
                <Pressable
                  key={note.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${note.label} notasi`}
                  onPressIn={() => void playNote(note)}
                  onPressOut={() => releaseNote(note.id)}
                  style={[
                    styles.blackKey,
                    {
                      left: (note.afterWhite + 1) * whiteKeyWidth - blackKeyWidth / 2,
                      width: blackKeyWidth,
                      height: blackKeyHeight,
                    },
                    active && styles.blackKeyActive,
                  ]}
                >
                  <Text style={styles.blackLabel}>{note.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.tipRow}>
          <Ionicons name="sparkles-outline" size={19} color={colors.primary} />
          <Text style={styles.tipText}>Vazifa: Do → Re → Mi → Fa → Sol ketma-ketligini bosib ko‘r!</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1 },
    content: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 30, gap: 14 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    backButton: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    headerText: { flex: 1 },
    eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    title: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 2 },
    audioNotice: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 22, backgroundColor: '#FFF1B9' },
    audioNoticeIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: '#FFE27A', alignItems: 'center', justifyContent: 'center' },
    audioNoticeTitle: { color: '#55400B', fontSize: 14, fontWeight: '900' },
    audioNoticeText: { color: '#745F28', fontSize: 11, lineHeight: 16, fontWeight: '600', marginTop: 3 },
    infoCard: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 24, padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    noteBadge: { width: 56, height: 56, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    infoBody: { flex: 1 },
    infoLabel: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
    infoValue: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 3 },
    infoFrequency: { color: colors.muted, fontSize: 11, marginTop: 3, fontWeight: '600' },
    controlsCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: 14, backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border },
    controlLabel: { color: colors.text, fontSize: 14, fontWeight: '900' },
    rotationHint: { maxWidth: 180, color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 },
    octaveControls: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    octaveButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
    disabledButton: { opacity: 0.35 },
    octaveValue: { minWidth: 62, alignItems: 'center' },
    octaveNumber: { color: colors.text, fontSize: 18, fontWeight: '900' },
    octaveRange: { color: colors.muted, fontSize: 9, marginTop: 1 },
    keyboardCard: { backgroundColor: '#17172A', borderRadius: 28, paddingTop: 14, paddingBottom: 12, overflow: 'hidden' },
    keyboardHint: { color: '#E0E0EA', fontSize: 12, fontWeight: '800', paddingHorizontal: 16, marginBottom: 10 },
    keyboard: { alignSelf: 'center', position: 'relative' },
    whiteRow: { flexDirection: 'row' },
    whiteKey: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D6D6E2', borderBottomLeftRadius: 7, borderBottomRightRadius: 7, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 14 },
    whiteKeyActive: { backgroundColor: '#D9D3FF' },
    whiteLabel: { color: '#17172A', fontSize: 11, fontWeight: '900' },
    whiteScientific: { color: '#74748A', fontSize: 9, marginTop: 2, fontWeight: '700' },
    whiteLabelActive: { color: '#5138C6' },
    blackKey: { position: 'absolute', top: 0, zIndex: 5, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: '#111118', borderWidth: 1, borderColor: '#333342', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 12 },
    blackKeyActive: { backgroundColor: colors.primary, borderColor: '#A69BFF' },
    blackLabel: { color: '#FFFFFF', fontSize: 8, fontWeight: '900', transform: [{ rotate: '-90deg' }] },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 14, borderRadius: 20, backgroundColor: colors.primarySoft },
    tipText: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  });
}
