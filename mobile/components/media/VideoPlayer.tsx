import { StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useTheme } from '@/context/ThemeContext';

export function VideoPlayer({ url, title }: { url: string; title?: string | null }) {
  const { colors } = useTheme();
  const player = useVideoPlayer(url);
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}
      <VideoView style={styles.video} player={player} nativeControls allowsFullscreen contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 10, gap: 10, borderWidth: 1, overflow: 'hidden' },
  title: { fontSize: 14, fontWeight: '800', paddingHorizontal: 4 },
  video: { width: '100%', height: 220, borderRadius: 14, backgroundColor: '#111827' },
});
