import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/context/ThemeContext';

type Props = PropsWithChildren<{ scroll?: boolean; contentStyle?: ViewStyle }>;

export function Screen({ children, scroll = true, contentStyle }: Props) {
  const { colors } = useTheme();
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {scroll ? <ScrollView showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 16 },
});
