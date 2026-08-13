import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AudioContext, type GainNode, type OscillatorNode } from 'react-native-audio-api';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/theme/colors';

const WHITE_KEY_WIDTH = 44;
const WHITE_KEY_HEIGHT = 220;
const BLACK_KEY_WIDTH = 28;
const BLACK_KEY_HEIGHT = 132;
const WHITE_SEMITONES = [0, 2, 4, 5, 7, 9, 11, 12] as const;
const WHITE_LABELS = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'Lya', 'Si', 'Do'] as const;
const WHITE_NAMES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'] as const;
const BLACK_KEYS = [
  { semitone: 1, afterWhite: 0, label: 'Do♯', name: 'C♯' },
  { semitone: 3, afterWhite: 1, label: 'Re♯', name: 'D♯' },
  { semitone: 6, afterWhite: 3, label: 'Fa♯', name: 'F♯' },
  { semitone: 8, afterWhite: 4, label: 'Sol♯', name: 'G♯' },
  { semitone: 10, afterWhite: 5, label: 'Lya♯', name: 'A♯' },
] as const;

type PianoNote = {
  id: string;
  label: string;
  scientific: string;
  frequency: number;
};

type Voice = {
  oscillators: OscillatorNode[];
  envelope: GainNode;
};

function midiFrequency(midi: number) {
  return 440 * 2 ** ((midi - 69) / 12);
}

function midiFor(octave: number, semitone: number) {
  return 12 * (octave + 1) + semitone;
}

export default function PianoScreen() {
  const [octave, setOctave] = useState(4);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(() => new Set());
  const [lastNote, setLastNote] = useState<PianoNote | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const voicesRef = useRef<Map<string, Voice>>(new Map());

  const ensureContext = async () => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
    return audioContextRef.current;
  };

  const markInactive = (id: string) => {
    setActiveNotes((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  };

  const releaseNote = (id: string, quick = false) => {
    const context = audioContextRef.current;
    const voice = voicesRef.current.get(id);
    if (!context || !voice) {
      markInactive(id);
      return;
    }

    const now = context.currentTime;
    const releaseEnd = now + (quick ? 0.035 : 0.18);
    voice.envelope.gain.cancelAndHoldAtTime(now);
    voice.envelope.gain.exponentialRampToValueAtTime(0.0001, releaseEnd);
    voice.oscillators.forEach((oscillator) => oscillator.stop(releaseEnd + 0.025));
    voicesRef.current.delete(id);
    markInactive(id);
  };

  const playNote = async (note: PianoNote) => {
    const context = await ensureContext();
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
    harmonicGain.gain.value = 0.12;

    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(0.34, now + 0.018);
    envelope.gain.exponentialRampToValueAtTime(0.14, now + 0.42);

    body.connect(envelope);
    harmonic.connect(harmonicGain);
    harmonicGain.connect(envelope);
    envelope.connect(context.destination);

    body.start(now);
    harmonic.start(now);
    voicesRef.current.set(note.id, { oscillators: [body, harmonic], envelope });
    setActiveNotes((current) => new Set(current).add(note.id));
    setLastNote(note);
  };

  const stopAll = () => {
    for (const id of [...voicesRef.current.keys()]) releaseNote(id, true);
  };

  const changeOctave = (next: number) => {
    if (next < 2 || next > 6 || next === octave) return;
    stopAll();
    setLastNote(null);
    setOctave(next);
  };

  useEffect(() => {
    return () => {
      const context = audioContextRef.current;
      if (context) {
        const stopAt = context.currentTime + 0.01;
        voicesRef.current.forEach((voice) => voice.oscillators.forEach((oscillator) => oscillator.stop(stopAt)));
        voicesRef.current.clear();
        void context.close();
      }
    };
  }, []);

  const whiteNotes = WHITE_SEMITONES.map((semitone, index): PianoNote => {
    const noteOctave = octave + (semitone === 12 ? 1 : 0);
    const midi = midiFor(octave, semitone);
    return {
      id: `${WHITE_NAMES[index]}${noteOctave}`,
      label: WHITE_LABELS[index],
      scientific: `${WHITE_NAMES[index]}${noteOctave}`,
      frequency: midiFrequency(midi),
    };
  });

  const blackNotes = BLACK_KEYS.map((key): PianoNote & { afterWhite: number } => ({
    id: `${key.name}${octave}`,
    label: key.label,
    scientific: `${key.name}${octave}`,
    frequency: midiFrequency(midiFor(octave, key.semitone)),
    afterWhite: key.afterWhite,
  }));

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>MUSIQA ASBOBI</Text>
          <Text style={styles.title}>Pianino</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.infoCard}>
        <View style={styles.noteBadge}>
          <Ionicons name="musical-notes" size={24} color={colors.primary} />
        </View>
        <View style={styles.infoBody}>
          <Text style={styles.infoLabel}>Hozirgi nota</Text>
          <Text style={styles.infoValue}>{lastNote ? `${lastNote.label} · ${lastNote.scientific}` : 'Klavishni bosing'}</Text>
          <Text style={styles.infoFrequency}>{lastNote ? `${lastNote.frequency.toFixed(1)} Hz` : 'Bosib tursangiz tovush davom etadi'}</Text>
        </View>
      </View>

      <View style={styles.controlsCard}>
        <Text style={styles.controlLabel}>Oktava</Text>
        <View style={styles.octaveControls}>
          <Pressable
            onPress={() => changeOctave(octave - 1)}
            disabled={octave <= 2}
            style={[styles.octaveButton, octave <= 2 && styles.disabledButton]}
          >
            <Ionicons name="remove" size={21} color={colors.primary} />
          </Pressable>
          <View style={styles.octaveValue}>
            <Text style={styles.octaveNumber}>{octave}</Text>
            <Text style={styles.octaveRange}>C{octave} – C{octave + 1}</Text>
          </View>
          <Pressable
            onPress={() => changeOctave(octave + 1)}
            disabled={octave >= 6}
            style={[styles.octaveButton, octave >= 6 && styles.disabledButton]}
          >
            <Ionicons name="add" size={21} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={styles.keyboardCard}>
        <Text style={styles.keyboardHint}>Klavishni bosib turing va qo‘yib yuboring</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.keyboardScroll}>
          <View style={styles.keyboard}>
            <View style={styles.whiteRow}>
              {whiteNotes.map((note) => {
                const active = activeNotes.has(note.id);
                return (
                  <Pressable
                    key={note.id}
                    onPressIn={() => void playNote(note)}
                    onPressOut={() => releaseNote(note.id)}
                    style={[styles.whiteKey, active && styles.whiteKeyActive]}
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
                  onPressIn={() => void playNote(note)}
                  onPressOut={() => releaseNote(note.id)}
                  style={[
                    styles.blackKey,
                    { left: (note.afterWhite + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2 },
                    active && styles.blackKeyActive,
                  ]}
                >
                  <Text style={styles.blackLabel}>{note.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <View style={styles.tipRow}>
        <Ionicons name="information-circle-outline" size={19} color={colors.muted} />
        <Text style={styles.tipText}>Bir nechta klavishni bir vaqtda bosib akkord ham chalishingiz mumkin.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  headerSpacer: { width: 42 },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 2 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 22, padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  noteBadge: { width: 52, height: 52, borderRadius: 17, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  infoBody: { flex: 1 },
  infoLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  infoValue: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 2 },
  infoFrequency: { color: colors.muted, fontSize: 11, marginTop: 3 },
  controlsCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  controlLabel: { color: colors.text, fontSize: 14, fontWeight: '800' },
  octaveControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  octaveButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2FF' },
  disabledButton: { opacity: 0.35 },
  octaveValue: { minWidth: 72, alignItems: 'center' },
  octaveNumber: { color: colors.text, fontSize: 18, fontWeight: '900' },
  octaveRange: { color: colors.muted, fontSize: 9, marginTop: 1 },
  keyboardCard: { backgroundColor: '#17172A', borderRadius: 24, paddingTop: 15, paddingBottom: 16, overflow: 'hidden' },
  keyboardHint: { color: '#C9C9D8', fontSize: 11, fontWeight: '700', paddingHorizontal: 16, marginBottom: 12 },
  keyboardScroll: { paddingHorizontal: 12 },
  keyboard: { width: WHITE_KEY_WIDTH * 8, height: WHITE_KEY_HEIGHT, position: 'relative' },
  whiteRow: { flexDirection: 'row', height: WHITE_KEY_HEIGHT },
  whiteKey: { width: WHITE_KEY_WIDTH, height: WHITE_KEY_HEIGHT, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D6D6E2', borderBottomLeftRadius: 7, borderBottomRightRadius: 7, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 13 },
  whiteKeyActive: { backgroundColor: '#C7D2FE' },
  whiteLabel: { color: colors.text, fontSize: 11, fontWeight: '900' },
  whiteScientific: { color: colors.muted, fontSize: 9, marginTop: 2, fontWeight: '700' },
  whiteLabelActive: { color: '#312E81' },
  blackKey: { position: 'absolute', top: 0, zIndex: 5, width: BLACK_KEY_WIDTH, height: BLACK_KEY_HEIGHT, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, backgroundColor: '#111118', borderWidth: 1, borderColor: '#333342', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10 },
  blackKeyActive: { backgroundColor: colors.primary, borderColor: '#818CF8' },
  blackLabel: { color: '#FFFFFF', fontSize: 8, fontWeight: '800', transform: [{ rotate: '-90deg' }] },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 4 },
  tipText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 16 },
});
