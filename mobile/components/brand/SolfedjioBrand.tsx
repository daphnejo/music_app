import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

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
        source={require('../../assets/icon.png')}
        style={{ width: size, height: size, borderRadius: Math.round(size * 0.23) }}
        resizeMode="contain"
      />
      {showName ? <Text style={[styles.name, compact && styles.nameCompact]}>Solfedjio</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: 8 },
  compact: { flexDirection: 'row', gap: 9 },
  name: { color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -0.6 },
  nameCompact: { fontSize: 20 },
});
