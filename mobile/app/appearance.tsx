import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BackHeader } from '@/components/ui/BackHeader';
import { Screen } from '@/components/ui/Screen';
import { useTheme } from '@/context/ThemeContext';
import type { ThemePreference } from '@/services/app/preferences';

const options: Array<{
  value: ThemePreference;
  title: string;
  caption: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { value: 'system', title: 'Tizim bo‘yicha', caption: 'Telefonning Light/Dark sozlamasiga avtomatik moslashadi', icon: 'phone-portrait-outline' },
  { value: 'light', title: 'Yorug‘', caption: 'Doim yorug‘ interfeys ishlaydi', icon: 'sunny-outline' },
  { value: 'dark', title: 'Qorong‘i', caption: 'Doim qorong‘i interfeys ishlaydi', icon: 'moon-outline' },
];

export default function AppearanceScreen() {
  const { colors, preference, resolvedTheme, setPreference } = useTheme();

  return (
    <Screen>
      <BackHeader title="Ko‘rinish" caption="Ilovaning rang rejimini tanlang" />

      <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.previewIcon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={resolvedTheme === 'dark' ? 'moon' : 'sunny'} size={25} color={colors.primary} />
        </View>
        <View style={styles.previewBody}>
          <Text style={[styles.previewTitle, { color: colors.text }]}>Hozir: {resolvedTheme === 'dark' ? 'Qorong‘i' : 'Yorug‘'}</Text>
          <Text style={[styles.previewText, { color: colors.muted }]}>O‘zgarish darhol butun ilovaga qo‘llanadi.</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {options.map((option, index) => {
          const selected = preference === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => void setPreference(option.value)}
              style={[
                styles.row,
                { borderBottomColor: colors.border },
                index === options.length - 1 && styles.rowLast,
              ]}
            >
              <View style={[styles.icon, { backgroundColor: selected ? colors.primarySoft : colors.surfaceAlt }]}>
                <Ionicons name={option.icon} size={23} color={selected ? colors.primary : colors.muted} />
              </View>
              <View style={styles.body}>
                <Text style={[styles.title, { color: colors.text }]}>{option.title}</Text>
                <Text style={[styles.caption, { color: colors.muted }]}>{option.caption}</Text>
              </View>
              <Ionicons
                name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                size={25}
                color={selected ? colors.primary : colors.muted}
              />
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  preview: { flexDirection: 'row', alignItems: 'center', gap: 13, borderRadius: 22, borderWidth: 1, padding: 16 },
  previewIcon: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  previewBody: { flex: 1 },
  previewTitle: { fontSize: 15, fontWeight: '900' },
  previewText: { marginTop: 4, fontSize: 12, lineHeight: 17 },
  card: { borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  row: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 15, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLast: { borderBottomWidth: 0 },
  icon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: '900' },
  caption: { marginTop: 3, fontSize: 11, lineHeight: 16 },
});
