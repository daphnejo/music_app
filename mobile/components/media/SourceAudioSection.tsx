import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AudioPlayer } from '@/components/media/AudioPlayer';
import { useTheme } from '@/context/ThemeContext';
import type { BlockAsset } from '@/types/content';

type Props = {
  audios: BlockAsset[];
  resolveUrl: (url: string) => string;
};

const COLLAPSED_COUNT = 3;

export function SourceAudioSection({ audios, resolveUrl }: Props) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (!audios.length) return null;

  const canCollapse = audios.length > COLLAPSED_COUNT;
  const visibleAudios = canCollapse && !expanded ? audios.slice(0, COLLAPSED_COUNT) : audios;
  const hiddenCount = audios.length - COLLAPSED_COUNT;

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <Text style={[styles.heading, { color: colors.primary }]}>TINGLASH</Text>
        {audios.length > 1 ? <Text style={[styles.count, { color: colors.muted }]}>{audios.length} ta audio</Text> : null}
      </View>

      <View style={styles.list}>
        {visibleAudios.map((asset) => (
          <AudioPlayer key={asset.id} url={resolveUrl(asset.url)} title={asset.caption} />
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
            {expanded ? 'Audioni yig‘ish' : `Yana ${hiddenCount} ta audioni ko‘rsatish`}
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
