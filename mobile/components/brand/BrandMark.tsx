import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  size?: number;
  showName?: boolean;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
};

const source = require('../../.generated/mark.png');

export function BrandMark({ size = 72, showName = true, subtitle, style }: Props) {
  const { colors } = useTheme();
  const imageBox = Math.round(size * 1.38);

  return (
    <View style={[styles.wrap, style]}>
      <View style={{ width: imageBox, height: imageBox, alignItems: 'center', justifyContent: 'center' }}>
        <Image source={source} resizeMode="contain" style={{ width: imageBox, height: imageBox }} />
      </View>
      {showName ? <BrandWordmark size={Math.max(22, Math.round(size * 0.38))} /> : null}
      {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 3 },
  subtitle: { textAlign: 'center', fontSize: 13, marginTop: 2 },
});
