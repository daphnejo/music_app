import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

export function LoadingState({ text = 'Yuklanmoqda…' }: { text?: string }) {
  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.primary} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.state}>
      <Text style={styles.errorTitle}>Ma’lumot yuklanmadi</Text>
      <Text style={styles.text}>{message}</Text>
      {onRetry ? (
        <Pressable style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Qayta urinish</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  state: { alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 36, paddingHorizontal: 20 },
  text: { color: colors.muted, textAlign: 'center', lineHeight: 20 },
  errorTitle: { color: colors.text, fontWeight: '900', fontSize: 16 },
  button: { marginTop: 4, backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14 },
  buttonText: { color: '#fff', fontWeight: '800' },
});
