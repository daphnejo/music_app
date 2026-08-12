import { StyleSheet, Text, View } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { colors } from '@/theme/colors';

export function VideoPlayer({ url, title }: { url: string; title?: string | null }) {
  const player = useVideoPlayer(url);
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <VideoView style={styles.video} player={player} nativeControls allowsFullscreen contentFit="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 20, padding: 10, gap: 10, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  title: { color: colors.text, fontSize: 14, fontWeight: '800', paddingHorizontal: 4 },
  video: { width: '100%', height: 220, borderRadius: 14, backgroundColor: '#111827' },
});
