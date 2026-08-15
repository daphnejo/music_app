import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export function LoadingState({ text = 'Yuklanmoqda…' }: { text?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.primary} />
      <Text style={[styles.text, { color: colors.muted }]}>{text}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.state}>
      <Text style={[styles.errorTitle, { color: colors.text }]}>Ma’lumot yuklanmadi</Text>
      <Text style={[styles.text, { color: colors.muted }]}>{message}</Text>
      {onRetry ? (
        <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={onRetry}>
          <Text style={styles.buttonText}>Qayta urinish</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  state: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 36, paddingHorizontal: 20 },
  text: { textAlign: 'center', lineHeight: 20 },
  errorTitle: { fontWeight: '900', fontSize: 16 },
  button: { marginTop: 4, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  buttonText: { color: '#fff', fontWeight: '800' },
});
