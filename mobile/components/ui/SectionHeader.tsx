import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

export function SectionHeader({ title, caption }: { title: string; caption?: string }) {
  return <View style={styles.wrap}><Text style={styles.title}>{title}</Text>{caption ? <Text style={styles.caption}>{caption}</Text> : null}</View>;
}
const styles = StyleSheet.create({ wrap: { gap: 4 }, title: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: colors.text }, caption: { fontSize: 14, lineHeight: 20, color: colors.muted } });
