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

export function AudioPlayer({ url, title }: { url: string; title?: string | null }) {
  const { colors } = useTheme();
  const player = useAudioPlayer(url, { updateInterval: 500 });
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

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 20, padding: 14, borderWidth: 1 },
  icon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 6 },
  title: { fontWeight: '800', fontSize: 14 },
  track: { height: 5, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%' },
  time: { fontSize: 11 },
  play: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  replay: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
