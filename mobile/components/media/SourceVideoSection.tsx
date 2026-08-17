import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { VideoPlayer } from '@/components/media/VideoPlayer';
import { useTheme } from '@/context/ThemeContext';
import type { BlockAsset } from '@/types/content';

type Props = {
  videos: BlockAsset[];
  resolveUrl: (url: string) => string;
};

const COLLAPSED_COUNT = 1;

export function SourceVideoSection({ videos, resolveUrl }: Props) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (!videos.length) return null;

  const canCollapse = videos.length > 2;
  const visibleVideos = canCollapse && !expanded ? videos.slice(0, COLLAPSED_COUNT) : videos;
  const hiddenCount = videos.length - COLLAPSED_COUNT;

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={[styles.heading, { color: colors.primary }]}>VIDEO</Text>
        {videos.length > 1 ? <Text style={[styles.count, { color: colors.muted }]}>{videos.length} ta video</Text> : null}
      </View>

      <View style={styles.list}>
        {visibleVideos.map((asset) => (
          <VideoPlayer key={asset.id} url={resolveUrl(asset.url)} title={asset.caption} />
        ))}
      </View>

      {canCollapse ? (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          onPress={() => setExpanded((value) => !value)}
          style={[styles.toggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.primary} />
          <Text style={[styles.toggleText, { color: colors.primary }]}>
            {expanded ? 'Videolarni yig‘ish' : `Yana ${hiddenCount} ta videoni ko‘rsatish`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  heading: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  count: { fontSize: 11, fontWeight: '700' },
  list: { gap: 10 },
  toggle: { minHeight: 46, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 14 },
  toggleText: { fontSize: 12, fontWeight: '900' },
});
