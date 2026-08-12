import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { colors } from '@/theme/colors';

const items = [['person-circle-outline', 'Profil ma’lumotlari'], ['language-outline', 'Til'], ['notifications-outline', 'Bildirishnomalar'], ['download-outline', 'Yuklab olingan darslar'], ['help-circle-outline', 'Yordam'], ['information-circle-outline', 'Ilova haqida']] as const;

export default function ProfileScreen() {
  return <Screen><SectionHeader title="Profil" /><View style={styles.user}><View style={styles.avatar}><Text style={styles.avatarText}>A</Text></View><View><Text style={styles.name}>Anvar Axadjonov</Text><Text style={styles.meta}>Solfedjio · 1-sinf</Text></View></View><View style={styles.menu}>{items.map(([icon, label]) => <Pressable key={label} style={styles.item}><Ionicons name={icon} size={22} color={colors.primary} /><Text style={styles.itemText}>{label}</Text><Ionicons name="chevron-forward" size={18} color={colors.muted} /></Pressable>)}</View><Pressable style={styles.logout} onPress={() => router.replace('/login')}><Ionicons name="log-out-outline" size={20} color="#C2415D" /><Text style={styles.logoutText}>Chiqish</Text></Pressable></Screen>;
}
const styles = StyleSheet.create({ user: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: colors.border }, avatar: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#fff', fontWeight: '900', fontSize: 20 }, name: { fontSize: 18, fontWeight: '900', color: colors.text }, meta: { marginTop: 4, color: colors.muted, fontSize: 13 }, menu: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }, item: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }, itemText: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.text }, logout: { height: 54, borderRadius: 18, backgroundColor: '#FFF0F4', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, logoutText: { color: '#C2415D', fontWeight: '800' } });
