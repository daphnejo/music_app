import { Image, StyleSheet, View } from 'react-native';
import { BrandWordmark } from '@/components/brand/BrandWordmark';

type Props = {
  size?: number;
  showName?: boolean;
  compact?: boolean;
};

export function SolfedjioBrand({ size = 76, showName = false, compact = false }: Props) {
  return (
    <View style={[styles.wrap, compact && styles.compact]}>
      <Image
        accessibilityLabel="Solfedjio logotipi"
        source={require('../../.generated/mark.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
      {showName ? <BrandWordmark size={compact ? 20 : 27} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  compact: { flexDirection: 'row', gap: 9 },
});
