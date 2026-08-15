import { StyleSheet, Text, type StyleProp, type TextStyle } from 'react-native';

type Props = {
  size?: number;
  style?: StyleProp<TextStyle>;
};

export function BrandWordmark({ size = 30, style }: Props) {
  return (
    <Text style={[styles.word, { fontSize: size, lineHeight: Math.round(size * 1.12) }, style]}>
      <Text>Solfed</Text>
      <Text style={styles.accent}>j</Text>
      <Text>io</Text>
    </Text>
  );
}

const styles = StyleSheet.create({
  word: {
    color: '#20247E',
    fontWeight: '500',
    letterSpacing: -1.2,
  },
  accent: {
    color: '#1B9CF0',
  },
});
