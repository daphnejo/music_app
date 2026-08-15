import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export function ProgressBar({ value }: { value: number }) {
  const { colors } = useTheme();
  const width = `${Math.max(0, Math.min(100, value))}%` as `${number}%`;
  return (
    <View style={[styles.track, { backgroundColor: colors.surfaceAlt }]}>
      <View style={[styles.fill, { width, backgroundColor: colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 8, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
});
