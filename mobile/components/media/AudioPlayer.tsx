import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

export function AudioPlayer({ url, title }: { url: string; title?: string | null }) {
  const player = useAudioPlayer(url, { updateInterval: 500 });
  const status = useAudioPlayerStatus(player);

  const toggle = () => {
    if (status.playing) player.pause();
    else {
      if (status.duration > 0 && status.currentTime >= status.duration - 0.1) player.seekTo(0);
      player.play();
    }
  };

  const progress = status.duration > 0 ? Math.min(1, status.currentTime / status.duration) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.icon}><Ionicons name="musical-note" size={22} color={colors.primary} /></View>
      <View style={styles.body}>
        <Text style={styles.title}>{title || 'Audio misol'}</Text>
        <View style={styles.track}><View style={[styles.fill, { width: `${progress * 100}%` }]} /></View>
        <Text style={styles.time}>{formatTime(status.currentTime)} / {formatTime(status.duration)}</Text>
      </View>
      <Pressable style={styles.play} onPress={toggle}>
        <Ionicons name={status.playing ? 'pause' : 'play'} size={20} color="#fff" />
      </Pressable>
      <Pressable style={styles.replay} onPress={() => { player.seekTo(0); player.play(); }}>
        <Ionicons name="refresh" size={18} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: colors.border },
  icon: { width: 40, height: 40, borderRadius: 13, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 6 },
  title: { color: colors.text, fontWeight: '800', fontSize: 14 },
  track: { height: 5, borderRadius: 999, backgroundColor: '#E7E9F3', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.primary },
  time: { color: colors.muted, fontSize: 11 },
  play: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  replay: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
});
