import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type Props = {
  size?: number;
  style?: StyleProp<TextStyle>;
};

export function BrandWordmark({ size = 30, style }: Props) {
  const { isDark } = useTheme();
  return (
    <Text style={[styles.word, { color: isDark ? '#F0F2FF' : '#20247E', fontSize: size, lineHeight: Math.round(size * 1.12) }, style]}>
      <Text>Solfed</Text>
      <Text style={styles.accent}>j</Text>
      <Text>io</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  word: {
    fontWeight: '500',
    letterSpacing: -1.2,
  },
  accent: {
    color: '#1B9CF0',
  },
});
