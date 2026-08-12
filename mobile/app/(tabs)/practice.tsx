import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { practiceCategories } from '@/data/mock';
import { colors } from '@/theme/colors';

export default function PracticeScreen() {
  return <Screen><SectionHeader title="Mashqlar" caption="Qisqa mashqlar bilan bilimni mustahkamlang." /><View style={styles.grid}>{practiceCategories.map((item) => <Pressable key={item.id} style={styles.card}><View style={styles.icon}><Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={26} color={colors.primary} /></View><Text style={styles.title}>{item.title}</Text><Text style={styles.subtitle}>{item.subtitle}</Text></Pressable>)}</View></Screen>;
}
const styles = StyleSheet.create({ grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, card: { width: '48%', minHeight: 160, backgroundColor: colors.surface, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: colors.border }, icon: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }, title: { fontSize: 16, fontWeight: '800', color: colors.text }, subtitle: { fontSize: 12, lineHeight: 17, color: colors.muted, marginTop: 5 } });
