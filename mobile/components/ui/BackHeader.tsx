import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

export function BackHeader({ title, caption }: { title: string; caption?: string }) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="Orqaga" onPress={() => router.back()} style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {caption ? <Text style={styles.caption}>{caption}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  back: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  title: { color: colors.text, fontSize: 22, fontWeight: '900' },
  caption: { marginTop: 2, color: colors.muted, fontSize: 12 },
});
