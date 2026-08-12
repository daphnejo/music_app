import type { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';

type Props = PropsWithChildren<{ scroll?: boolean; contentStyle?: ViewStyle }>;

export function Screen({ children, scroll = true, contentStyle }: Props) {
  const content = <View style={[styles.content, contentStyle]}>{children}</View>;
  return <SafeAreaView style={styles.safe} edges={['top']}>{scroll ? <ScrollView showsVerticalScrollIndicator={false}>{content}</ScrollView> : content}</SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.background }, content: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 16 } });
