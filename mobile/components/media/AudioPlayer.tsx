import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

function fallbackAudioTitle(url: string) {
  let decoded = url;
  try {
    decoded = decodeURIComponent(url);
  } catch {
    // Keep the original URL if it contains an invalid escape sequence.
  }

  const clean = decoded.split('?')[0] ?? decoded;
  const fileName = clean.split('/').filter(Boolean).pop() ?? clean;
  const numbered = fileName.match(/(?:audio|sound)?[\s_-]*(\d+)(?=\.[a-z0-9]+$|$)/i)
    ?? clean.match(/audio[^0-9]*(\d+)/i);

  return numbered ? `Audio ${Number(numbered[1])}` : 'Audio';
}

type StaffNote = {
  x: number;
  level: number;
};

const STAFF_SAMPLE_ONE: StaffNote[] = [
  { x: 10, level: 4 },
  { x: 29, level: 3 },
  { x: 48, level: 2 },
  { x: 67, level: 1 },
  { x: 86, level: 0 },
];

const STAFF_SAMPLE_TWO: StaffNote[] = [
  { x: 10, level: 4.5 },
  { x: 29, level: 3.5 },
  { x: 48, level: 2.5 },
  { x: 67, level: 1.5 },
  { x: 86, level: 0.5 },
];

function lessonFourStaffSequence(title: string): StaffNote[] | null {
  const normalized = title.toLowerCase();
  if (normalized.includes('1-namuna')) return STAFF_SAMPLE_ONE;
  if (normalized.includes('2-namuna')) return STAFF_SAMPLE_TWO;
  return null;
}

function AnimatedStaff({ sequence, progress }: { sequence: StaffNote[]; progress: number }) {
  const activeIndex = Math.min(
    sequence.length - 1,
    Math.max(0, Math.floor(Math.min(0.9999, progress) * sequence.length)),
  );

  return (
    <View style={styles.staffWrap}>
      <View style={styles.staffHeader}>
        <Text style={styles.staffCaption}>🎼 Hozir yangrayotgan nota</Text>
        <Text style={styles.staffCounter}>{activeIndex + 1}/{sequence.length}</Text>
      </View>
      <View style={styles.staff}>
        {[0, 1, 2, 3, 4].map((line) => (
          <View key={line} style={[styles.staffLine, { top: 14 + line * 12 }]} />
        ))}
        {sequence.map((note, index) => {
          const active = index === activeIndex;
          const played = index < activeIndex;
          const top = 8 + note.level * 12;
          return (
            <View
              key={`${note.x}-${note.level}`}
              style={[
                styles.staffNote,
                { left: `${note.x}%`, top },
                played && styles.staffNotePlayed,
                active && styles.staffNoteActive,
              ]}
            >
              <View style={[styles.staffStem, active && styles.staffStemActive]} />
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function AudioPlayer({ url, title }: { url: string; title?: string | null }) {
  const { colors } = useTheme();
  const player = useAudioPlayer(url, { updateInterval: 200 });
  const status = useAudioPlayerStatus(player);
  const displayTitle = title?.trim() || fallbackAudioTitle(url);

  const toggle = () => {
    if (status.playing) player.pause();
    else {
      if (status.duration > 0 && status.currentTime >= status.duration - 0.1) player.seekTo(0);
      player.play();
    }
  };

  const progress = status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;
  const staffSequence = lessonFourStaffSequence(displayTitle);

  return (
    <View style={[styles.shell, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.card}>
        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}><Ionicons name="musical-note" size={22} color={colors.primary} /></View>
        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.text }]}>{displayTitle}</Text>
          <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}><View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: colors.primary }]} /></View>
          <Text style={[styles.time, { color: colors.muted }]}>{formatTime(status.currentTime)} / {formatTime(status.duration)}</Text>
        </View>
        <Pressable style={[styles.play, { backgroundColor: colors.primary }]} onPress={toggle}>
          <Ionicons name={status.playing ? 'pause' : 'play'} size={20} color="#fff" />
        </Pressable>
        <Pressable style={[styles.replay, { backgroundColor: colors.primarySoft }]} onPress={() => { player.seekTo(0); player.play(); }}>
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </Pressable>
      </View>
      {staffSequence ? <AnimatedStaff sequence={staffSequence} progress={progress} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { borderRadius: 20, padding: 14, borderWidth: 1, gap: 11 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 6 },
  title: { fontWeight: '800', fontSize: 14 },
  track: { height: 5, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%' },
  time: { fontSize: 11 },
  play: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  replay: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  staffWrap: { borderRadius: 15, padding: 10, backgroundColor: '#FBF8FF' },
  staffHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  staffCaption: { color: '#655F75', fontSize: 10, fontWeight: '800' },
  staffCounter: { color: '#6C5CE7', fontSize: 10, fontWeight: '900' },
  staff: { height: 72, position: 'relative', marginHorizontal: 4 },
  staffLine: { position: 'absolute', left: 0, right: 0, height: 1.5, backgroundColor: '#8D879A' },
  staffNote: { position: 'absolute', width: 13, height: 10, marginLeft: -6, borderRadius: 7, backgroundColor: '#AAA4B5', transform: [{ rotate: '-14deg' }] },
  staffNotePlayed: { backgroundColor: '#9D8EF3' },
  staffNoteActive: { width: 17, height: 13, marginLeft: -8, marginTop: -2, borderRadius: 9, backgroundColor: '#6C5CE7', shadowColor: '#6C5CE7', shadowOpacity: 0.35, shadowRadius: 7, elevation: 5 },
  staffStem: { position: 'absolute', width: 2, height: 24, right: 0, bottom: 5, borderRadius: 2, backgroundColor: '#AAA4B5' },
  staffStemActive: { height: 28, backgroundColor: '#6C5CE7' },
});
