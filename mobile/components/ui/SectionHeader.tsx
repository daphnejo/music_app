import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export function SectionHeader({ title, caption }: { title: string; caption?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {caption ? <Text style={[styles.caption, { color: colors.muted }]}>{caption}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 4 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  caption: { fontSize: 14, lineHeight: 20 },
});
