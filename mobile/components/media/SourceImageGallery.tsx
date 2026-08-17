import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import type { BlockAsset } from '@/types/content';

type Props = {
  images: BlockAsset[];
  resolveUrl: (url: string) => string;
};

export function SourceImageGallery({ images, resolveUrl }: Props) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();

  if (!images.length) return null;

  const cardWidth = Math.min(380, Math.max(240, width - 56));
  const multiple = images.length > 1;

  if (!multiple) {
    const asset = images[0];
    return (
      <View style={[styles.singleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {asset.caption ? <Text style={[styles.caption, { color: colors.text }]}>{asset.caption}</Text> : null}
        <Image source={{ uri: resolveUrl(asset.url) }} style={styles.singleImage} contentFit="contain" cachePolicy="memory-disk" />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headingRow}>
        <Text style={[styles.heading, { color: colors.primary }]}>RASMLAR</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>Yon tomonga suring · {images.length} ta</Text>
      </View>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={cardWidth + 10}
        snapToAlignment="start"
        contentContainerStyle={styles.content}
      >
        {images.map((asset, index) => (
          <View
            key={asset.id}
            style={[
              styles.card,
              { width: cardWidth, backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View style={styles.cardTop}>
              {asset.caption ? (
                <Text numberOfLines={2} style={[styles.caption, styles.cardCaption, { color: colors.text }]}>{asset.caption}</Text>
              ) : (
                <Text style={[styles.caption, styles.cardCaption, { color: colors.muted }]}>Rasm {index + 1}</Text>
              )}
              <View style={[styles.counter, { backgroundColor: colors.primarySoft }]}>
                <Text style={[styles.counterText, { color: colors.primary }]}>{index + 1}/{images.length}</Text>
              </View>
            </View>
            <Image source={{ uri: resolveUrl(asset.url) }} style={styles.image} contentFit="contain" cachePolicy="memory-disk" />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 9, marginHorizontal: -2 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingHorizontal: 2 },
  heading: { fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  hint: { flex: 1, textAlign: 'right', fontSize: 11, fontWeight: '600' },
  content: { gap: 10, paddingRight: 12 },
  singleCard: { borderRadius: 20, padding: 10, gap: 8, borderWidth: 1 },
  singleImage: { width: '100%', height: 240, borderRadius: 14 },
  card: { borderRadius: 20, padding: 10, gap: 8, borderWidth: 1 },
  cardTop: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 3 },
  caption: { fontWeight: '800' },
  cardCaption: { flex: 1, fontSize: 13, lineHeight: 17 },
  counter: { minWidth: 42, height: 28, paddingHorizontal: 8, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  counterText: { fontSize: 11, fontWeight: '900' },
  image: { width: '100%', height: 230, borderRadius: 14 },
});
