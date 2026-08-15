import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { AudioContext, type GainNode, type OscillatorNode } from 'react-native-audio-api';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeColors } from '@/theme/colors';

const WHITE_KEY_HEIGHT = 220;
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

type BlackPianoNote = PianoNote & { afterWhite: number };

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

function mapHasValue(map: Map<number, string>, value: string) {
  for (const current of map.values()) {
    if (current === value) return true;
  }
  return false;
}

export default function PianoScreen() {
  const { width: screenWidth } = useWindowDimensions();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [octave, setOctave] = useState(4);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(() => new Set());
  const [lastNote, setLastNote] = useState<PianoNote | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const voicesRef = useRef<Map<string, Voice>>(new Map());
  const pointerNotesRef = useRef<Map<number, string>>(new Map());

  const keyboardWidth = Math.max(224, Math.min(440, screenWidth - 64));
  const whiteKeyWidth = keyboardWidth / WHITE_SEMITONES.length;
  const blackKeyWidth = Math.max(18, whiteKeyWidth * 0.64);

  const whiteNotes = useMemo(
    () =>
      WHITE_SEMITONES.map((semitone, index): PianoNote => {
        const noteOctave = octave + (semitone === 12 ? 1 : 0);
        const midi = midiFor(octave, semitone);
        return {
          id: `${WHITE_NAMES[index]}${noteOctave}`,
          label: WHITE_LABELS[index],
          scientific: `${WHITE_NAMES[index]}${noteOctave}`,
          frequency: midiFrequency(midi),
        };
      }),
    [octave],
  );

  const blackNotes = useMemo(
    () =>
      BLACK_KEYS.map(
        (key): BlackPianoNote => ({
          id: `${key.name}${octave}`,
          label: key.label,
          scientific: `${key.name}${octave}`,
          frequency: midiFrequency(midiFor(octave, key.semitone)),
          afterWhite: key.afterWhite,
        }),
      ),
    [octave],
  );

  const ensureContext = useCallback(async () => {
    if (!audioContextRef.current) audioContextRef.current = new AudioContext();
    if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
    return audioContextRef.current;
  }, []);

  const markInactive = useCallback((id: string) => {
    setActiveNotes((current) => {
      if (!current.has(id)) return current;
      const next = new Set(current);
      next.delete(id);
      return next;
    });
  }, []);

  const releaseNote = useCallback(
    (id: string, quick = false) => {
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
    },
    [markInactive],
  );

  const playNote = useCallback(
    async (note: PianoNote) => {
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
    },
    [ensureContext, releaseNote],
  );

  const noteAt = useCallback(
    (x: number, y: number): PianoNote | null => {
      if (x < 0 || y < 0 || x >= keyboardWidth || y > WHITE_KEY_HEIGHT) return null;

      if (y <= BLACK_KEY_HEIGHT) {
        for (const note of blackNotes) {
          const left = (note.afterWhite + 1) * whiteKeyWidth - blackKeyWidth / 2;
          if (x >= left && x <= left + blackKeyWidth) return note;
        }
      }

      const whiteIndex = Math.floor(x / whiteKeyWidth);
      return whiteNotes[whiteIndex] ?? null;
    },
    [blackKeyWidth, blackNotes, keyboardWidth, whiteKeyWidth, whiteNotes],
  );

  const releasePointer = useCallback(
    (pointerId: number) => {
      const noteId = pointerNotesRef.current.get(pointerId);
      if (!noteId) return;

      pointerNotesRef.current.delete(pointerId);
      if (!mapHasValue(pointerNotesRef.current, noteId)) releaseNote(noteId);
    },
    [releaseNote],
  );

  const pressPointer = useCallback(
    (pointerId: number, x: number, y: number) => {
      const note = noteAt(x, y);
      const previousId = pointerNotesRef.current.get(pointerId);

      if (previousId === note?.id) return;

      if (previousId) {
        pointerNotesRef.current.delete(pointerId);
        if (!mapHasValue(pointerNotesRef.current, previousId)) releaseNote(previousId, true);
      }

      if (!note) return;

      const alreadyHeld = mapHasValue(pointerNotesRef.current, note.id);
      pointerNotesRef.current.set(pointerId, note.id);
      if (!alreadyHeld) void playNote(note);
    },
    [noteAt, playNote, releaseNote],
  );

  const keyboardGesture = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .maxPointers(10)
        .shouldCancelWhenOutside(false)
        .runOnJS(true)
        .onTouchesDown((event) => {
          for (const touch of event.changedTouches) pressPointer(touch.id, touch.x, touch.y);
        })
        .onTouchesMove((event) => {
          for (const touch of event.changedTouches) pressPointer(touch.id, touch.x, touch.y);
        })
        .onTouchesUp((event) => {
          for (const touch of event.changedTouches) releasePointer(touch.id);
        })
        .onTouchesCancelled((event) => {
          for (const touch of event.changedTouches) releasePointer(touch.id);
        }),
    [pressPointer, releasePointer],
  );

  const stopAll = useCallback(() => {
    pointerNotesRef.current.clear();
    for (const id of [...voicesRef.current.keys()]) releaseNote(id, true);
  }, [releaseNote]);

  const changeOctave = (next: number) => {
    if (next < 2 || next > 6 || next === octave) return;
    stopAll();
    setLastNote(null);
    setOctave(next);
  };

  useEffect(() => {
    return () => {
      pointerNotesRef.current.clear();
      const context = audioContextRef.current;
      if (context) {
        const stopAt = context.currentTime + 0.01;
        voicesRef.current.forEach((voice) => voice.oscillators.forEach((oscillator) => oscillator.stop(stopAt)));
        voicesRef.current.clear();
        void context.close();
      }
    };
  }, []);

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
        <View style={styles.keyboardSurface}>
          <GestureDetector gesture={keyboardGesture}>
            <View style={[styles.keyboard, { width: keyboardWidth }]}>
              <View pointerEvents="none" style={styles.whiteRow}>
                {whiteNotes.map((note) => {
                  const active = activeNotes.has(note.id);
                  return (
                    <View
                      key={note.id}
                      style={[styles.whiteKey, { width: whiteKeyWidth }, active && styles.whiteKeyActive]}
                    >
                      <Text style={[styles.whiteLabel, active && styles.whiteLabelActive]}>{note.label}</Text>
                      <Text style={[styles.whiteScientific, active && styles.whiteLabelActive]}>{note.scientific}</Text>
                    </View>
                  );
                })}
              </View>

              {blackNotes.map((note) => {
                const active = activeNotes.has(note.id);
                return (
                  <View
                    pointerEvents="none"
                    key={note.id}
                    style={[
                      styles.blackKey,
                      {
                        left: (note.afterWhite + 1) * whiteKeyWidth - blackKeyWidth / 2,
                        width: blackKeyWidth,
                      },
                      active && styles.blackKeyActive,
                    ]}
                  >
                    <Text style={styles.blackLabel}>{note.label}</Text>
                  </View>
                );
              })}
            </View>
          </GestureDetector>
        </View>
      </View>

      <View style={styles.tipRow}>
        <Ionicons name="information-circle-outline" size={19} color={colors.muted} />
        <Text style={styles.tipText}>Bir nechta klavishni bir vaqtda bosib akkord ham chalishingiz mumkin.</Text>
      </View>
    </Screen>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    headerText: { flex: 1 },
    headerSpacer: { width: 42 },
    eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
    title: { color: colors.text, fontSize: 28, fontWeight: '900', marginTop: 2 },
    infoCard: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 22, padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    noteBadge: { width: 52, height: 52, borderRadius: 17, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
    infoBody: { flex: 1 },
    infoLabel: { color: colors.muted, fontSize: 11, fontWeight: '700' },
    infoValue: { color: colors.text, fontSize: 19, fontWeight: '900', marginTop: 2 },
    infoFrequency: { color: colors.muted, fontSize: 11, marginTop: 3 },
    controlsCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 13, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
    controlLabel: { color: colors.text, fontSize: 14, fontWeight: '800' },
    octaveControls: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    octaveButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
    disabledButton: { opacity: 0.35 },
    octaveValue: { minWidth: 72, alignItems: 'center' },
    octaveNumber: { color: colors.text, fontSize: 18, fontWeight: '900' },
    octaveRange: { color: colors.muted, fontSize: 9, marginTop: 1 },
    keyboardCard: { backgroundColor: '#17172A', borderRadius: 24, paddingTop: 15, paddingBottom: 16, overflow: 'hidden' },
    keyboardHint: { color: '#C9C9D8', fontSize: 11, fontWeight: '700', paddingHorizontal: 16, marginBottom: 12 },
    keyboardSurface: { alignItems: 'center', paddingHorizontal: 12 },
    keyboard: { height: WHITE_KEY_HEIGHT, position: 'relative' },
    whiteRow: { flexDirection: 'row', height: WHITE_KEY_HEIGHT },
    whiteKey: { height: WHITE_KEY_HEIGHT, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D6D6E2', borderBottomLeftRadius: 7, borderBottomRightRadius: 7, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 13 },
    whiteKeyActive: { backgroundColor: '#C7D2FE' },
    whiteLabel: { color: '#17172A', fontSize: 11, fontWeight: '900' },
    whiteScientific: { color: '#74748A', fontSize: 9, marginTop: 2, fontWeight: '700' },
    whiteLabelActive: { color: '#312E81' },
    blackKey: { position: 'absolute', top: 0, zIndex: 5, height: BLACK_KEY_HEIGHT, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, backgroundColor: '#111118', borderWidth: 1, borderColor: '#333342', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10 },
    blackKeyActive: { backgroundColor: colors.primary, borderColor: '#818CF8' },
    blackLabel: { color: '#FFFFFF', fontSize: 8, fontWeight: '800', transform: [{ rotate: '-90deg' }] },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingHorizontal: 4 },
    tipText: { flex: 1, color: colors.muted, fontSize: 11, lineHeight: 16 },
  });
}
