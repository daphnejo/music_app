import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { BackHeader } from '@/components/ui/BackHeader';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/theme/colors';

export default function LanguageScreen() {
  return (
    <Screen>
      <BackHeader title="Til" caption="Ilova interfeysi tili" />
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.icon}><Ionicons name="language-outline" size={22} color={colors.primary} /></View>
          <View style={styles.body}>
            <Text style={styles.title}>O‘zbek tili</Text>
            <Text style={styles.caption}>Ilovaning qo‘llab-quvvatlanadigan interfeys tili</Text>
          </View>
          <Ionicons name="checkmark-circle" size={24} color="#2DAA74" />
        </View>
      </View>
      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
        <Text style={styles.noteText}>Hozirgi versiyada interfeys O‘zbek tilida ishlaydi. Mavjud bo‘lmagan tillar tanlanadigan qilib ko‘rsatilmaydi.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  title: { color: colors.text, fontWeight: '900', fontSize: 15 },
  caption: { color: colors.muted, marginTop: 3, fontSize: 12, lineHeight: 17 },
  note: { flexDirection: 'row', gap: 10, backgroundColor: '#EEF2FF', borderRadius: 18, padding: 14 },
  noteText: { flex: 1, color: colors.text, lineHeight: 20, fontSize: 13 },
});
