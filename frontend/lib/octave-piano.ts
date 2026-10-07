const SCALE_STEPS = [0, 2, 4, 5, 7, 9, 11, 12] as const;

const NOTE_SPACING_SECONDS = 0.24;
const NOTE_DURATION_SECONDS = 0.5;

let audioContext: AudioContext | null = null;
let activeOscillators: OscillatorNode[] = [];
let cleanupTimer: ReturnType<typeof setTimeout> | null = null;

function midiToFrequency(midi: number) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function stopOctaveScale() {
  if (cleanupTimer) {
    clearTimeout(cleanupTimer);
    cleanupTimer = null;
  }

  activeOscillators.forEach((oscillator) => {
    try {
      oscillator.stop();
    } catch {
      // The oscillator may already have finished naturally.
    }
  });

  activeOscillators = [];
}

export async function playOctaveScale(octaveIndex: number, onEnded?: () => void) {
  if (typeof window === 'undefined') return;

  stopOctaveScale();

  audioContext ??= new AudioContext();
  const context = audioContext;

  if (context.state === 'suspended') {
    await context.resume();
  }

  const startAt = context.currentTime + 0.025;
  const baseMidi = 12 + octaveIndex * 12;

  SCALE_STEPS.forEach((semitone, noteIndex) => {
    const fundamental = midiToFrequency(baseMidi + semitone);
    const noteStart = startAt + noteIndex * NOTE_SPACING_SECONDS;
    const noteEnd = noteStart + NOTE_DURATION_SECONDS;

    [
      { ratio: 1, level: octaveIndex === 0 ? 0.15 : 0.12, type: 'triangle' as OscillatorType },
      { ratio: 2, level: 0.045, type: 'sine' as OscillatorType },
      { ratio: 3, level: 0.022, type: 'sine' as OscillatorType },
    ].forEach(({ ratio, level, type }) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(fundamental * ratio, noteStart);

      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(level, noteStart + 0.012);
      gain.gain.exponentialRampToValueAtTime(Math.max(level * 0.42, 0.0002), noteStart + 0.11);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(noteStart);
      oscillator.stop(noteEnd + 0.02);
      activeOscillators.push(oscillator);
    });
  });

  const durationMs = Math.ceil(
    ((SCALE_STEPS.length - 1) * NOTE_SPACING_SECONDS + NOTE_DURATION_SECONDS + 0.08) * 1000,
  );

  cleanupTimer = setTimeout(() => {
    activeOscillators = [];
    cleanupTimer = null;
    onEnded?.();
  }, durationMs);
}
