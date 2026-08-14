import { Image, StyleSheet, Text, View, type ImageStyle, type StyleProp, type ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';

type Props = {
  size?: number;
  showName?: boolean;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
};

const source = require('../../.generated/icon.png');

export function BrandMark({ size = 72, showName = true, subtitle, style }: Props) {
  const imageStyle: ImageStyle = { width: size, height: size, borderRadius: Math.round(size * 0.26) };

  return (
    <View style={[styles.wrap, style]}>
      <Image source={source} resizeMode="contain" style={imageStyle} />
      {showName ? <Text style={styles.name}>Solfedjio</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 6 },
  name: { color: colors.text, fontSize: 27, fontWeight: '900' },
  subtitle: { color: colors.muted, textAlign: 'center', fontSize: 13 },
});
