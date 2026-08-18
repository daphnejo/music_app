import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

const NOTE_COUNT = 5;
const VISUAL_LEAD_SECONDS = 0.14;
const STATUS_INTERVAL_MS = 70;

const NOTE_TOPS = [62, 52, 42, 32, 22] as const;
const NOTE_LEFTS = ['8%', '27%', '46%', '65%', '84%'] as const;

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export function SynchronizedNotationPlayer({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const { colors } = useTheme();
  const player = useAudioPlayer(url, { updateInterval: STATUS_INTERVAL_MS });
  const status = useAudioPlayerStatus(player);

  const duration = status.duration > 0 ? status.duration : 0;
  const currentTime = Math.max(0, status.currentTime ?? 0);
  const syncTime = Math.min(duration || currentTime, currentTime + (status.playing ? VISUAL_LEAD_SECONDS : 0));
  const progress = duration > 0 ? Math.min(1, syncTime / duration) : 0;
  const activeIndex = duration > 0
    ? Math.min(NOTE_COUNT - 1, Math.floor(progress * NOTE_COUNT))
    : 0;

  const toggle = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    if (duration > 0 && currentTime >= duration - 0.08) player.seekTo(0);
    player.play();
  };

  const replay = () => {
    player.seekTo(0);
    player.play();
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
      <View style={styles.playerRow}>
        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}> 
          <Ionicons name="musical-note" size={22} color={colors.primary} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}> 
            <View style={[styles.fill, { width: `${Math.min(1, duration > 0 ? currentTime / duration : 0) * 100}%`, backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.time, { color: colors.muted }]}>{formatTime(currentTime)} / {formatTime(duration)}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={status.playing ? 'Pauza' : 'Audio ijro etish'} style={[styles.play, { backgroundColor: colors.primary }]} onPress={toggle}>
          <Ionicons name={status.playing ? 'pause' : 'play'} size={20} color="#fff" />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Boshidan ijro etish" style={[styles.replay, { backgroundColor: colors.primarySoft }]} onPress={replay}>
          <Ionicons name="refresh" size={18} color={colors.primary} />
        </Pressable>
      </View>

      <View style={[styles.notationCard, { backgroundColor: colors.surfaceAlt }]}> 
        <View style={styles.notationHeader}>
          <Text style={[styles.notationLabel, { color: colors.muted }]}>🎼 Hozir yangrayotgan nota</Text>
          <Text style={[styles.counter, { color: colors.primary }]}>{activeIndex + 1}/{NOTE_COUNT}</Text>
        </View>

        <View style={styles.staff}>
          {[0, 1, 2, 3, 4].map((line) => (
            <View key={line} style={[styles.staffLine, { top: 24 + line * 12, backgroundColor: colors.muted }]} />
          ))}

          {Array.from({ length: NOTE_COUNT }).map((_, index) => {
            const isActive = index === activeIndex;
            const hasPlayed = index < activeIndex;
            return (
              <View
                key={index}
                style={[
                  styles.noteWrap,
                  { left: NOTE_LEFTS[index], top: NOTE_TOPS[index] },
                  isActive && styles.noteWrapActive,
                ]}
              >
                <View
                  style={[
                    styles.noteHead,
                    {
                      backgroundColor: isActive
                        ? colors.primary
                        : hasPlayed
                          ? colors.primarySoft
                          : '#A8A3B2',
                    },
                  ]}
                />
                <View
                  style={[
                    styles.noteStem,
                    { backgroundColor: isActive ? colors.primary : '#A8A3B2' },
                  ]}
                />
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 13, gap: 12 },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 6 },
  title: { fontWeight: '800', fontSize: 14 },
  track: { height: 5, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%' },
  time: { fontSize: 11 },
  play: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  replay: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  notationCard: { borderRadius: 16, padding: 12 },
  notationHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  notationLabel: { fontSize: 10, fontWeight: '800' },
  counter: { fontSize: 10, fontWeight: '900' },
  staff: { height: 94, position: 'relative' },
  staffLine: { position: 'absolute', left: 0, right: 0, height: 1, opacity: 0.75 },
  noteWrap: { position: 'absolute', width: 20, height: 34 },
  noteWrapActive: { transform: [{ scale: 1.18 }] },
  noteHead: { position: 'absolute', left: 0, bottom: 0, width: 15, height: 11, borderRadius: 8, transform: [{ rotate: '-12deg' }] },
  noteStem: { position: 'absolute', width: 2, height: 27, left: 13, bottom: 6, borderRadius: 2 },
});
