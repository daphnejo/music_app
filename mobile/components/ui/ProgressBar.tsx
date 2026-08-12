import { StyleSheet, View } from 'react-native';
import { colors } from '@/theme/colors';

export function ProgressBar({ value }: { value: number }) {
  const width = `${Math.max(0, Math.min(100, value))}%` as `${number}%`;
  return <View style={styles.track}><View style={[styles.fill, { width }]} /></View>;
}
const styles = StyleSheet.create({ track: { height: 8, borderRadius: 999, backgroundColor: '#E7E8F5', overflow: 'hidden' }, fill: { height: '100%', borderRadius: 999, backgroundColor: colors.primary } });
