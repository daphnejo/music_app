import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

const items: Array<[keyof typeof Ionicons.glyphMap, string, string, Href]> = [
  ['person-circle-outline', 'Men haqimda', 'Ism va profil ma’lumotlari', '/profile-info'],
  ['contrast-outline', 'Ko‘rinish', 'Rang va ekran sozlamalari', '/appearance'],
  ['help-circle-outline', 'Yordam', 'Biror narsa tushunarsiz bo‘lsa', '/help'],
  ['information-circle-outline', 'D-Solfedjio haqida', 'Ilova haqida qisqacha', '/about'],
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const firstName = user?.fullName?.trim().split(/\s+/)[0] || 'Do‘stim';
  const initials = firstName.charAt(0).toUpperCase();

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  function confirmLogout() {
    Alert.alert(
      'Akkauntdan chiqish',
      'Haqiqatan ham chiqmoqchimisiz?',
      [
        { text: 'Yo‘q', style: 'cancel' },
        { text: 'Ha, chiqaman', style: 'destructive', onPress: () => void handleLogout() },
      ],
    );
  }

  return (
    <Screen>
      <View style={styles.heading}>
        <Text style={[styles.title, { color: colors.text }]}>Bu — men! 😊</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>D-Solfedjiodagi kichik musiqa sahifang.</Text>
      </View>

      <View style={[styles.user, { backgroundColor: colors.primary }]}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>Salom!</Text>
          <Text style={styles.name}>{firstName}</Text>
          <Text style={styles.meta}>Musiqa o‘rganuvchisi 🎵</Text>
        </View>
        <View style={styles.starBubble}><Ionicons name="star" size={24} color="#F4B51D" /></View>
      </View>

      <View style={styles.menu}>
        {items.map(([icon, label, caption, href]) => (
          <Pressable
            key={label}
            onPress={() => router.push(href)}
            style={[styles.item, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.itemIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name={icon} size={23} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemText, { color: colors.text }]}>{label}</Text>
              <Text style={[styles.itemCaption, { color: colors.muted }]}>{caption}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        ))}
      </View>

      <Pressable style={[styles.logout, { backgroundColor: colors.dangerSurface }]} onPress={confirmLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={[styles.logoutText, { color: colors.danger }]}>Akkauntdan chiqish</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { gap: 4, paddingTop: 4 },
  title: { fontSize: 29, lineHeight: 35, fontWeight: '900' },
  subtitle: { fontSize: 13, lineHeight: 19, fontWeight: '600' },
  user: { minHeight: 140, flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 30, padding: 19, overflow: 'hidden' },
  avatar: { width: 66, height: 66, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontWeight: '900', fontSize: 25 },
  hello: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '900', letterSpacing: 0.8 },
  name: { color: '#FFFFFF', fontSize: 25, lineHeight: 30, fontWeight: '900', marginTop: 2 },
  meta: { color: 'rgba(255,255,255,0.82)', marginTop: 4, fontSize: 12, fontWeight: '700' },
  starBubble: { width: 46, height: 46, borderRadius: 17, backgroundColor: '#FFF0AF', alignItems: 'center', justifyContent: 'center' },
  menu: { gap: 10 },
  item: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 23, borderWidth: 1 },
  itemIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 14, fontWeight: '900' },
  itemCaption: { fontSize: 11, lineHeight: 16, fontWeight: '600', marginTop: 2 },
  logout: { height: 56, borderRadius: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoutText: { fontWeight: '900', fontSize: 14 },
});
