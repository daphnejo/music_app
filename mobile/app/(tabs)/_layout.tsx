import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '@/theme/colors';

const tabIcon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: string; size: number }) => <Ionicons name={name} color={color} size={size} />;

export default function TabsLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: '#9595AA', tabBarStyle: { height: 68, paddingTop: 7, paddingBottom: 9, borderTopColor: colors.border }, tabBarLabelStyle: { fontSize: 11, fontWeight: '700' } }}>
    <Tabs.Screen name="index" options={{ title: 'Bosh sahifa', tabBarIcon: tabIcon('home-outline') }} />
    <Tabs.Screen name="lessons" options={{ title: 'Darslar', tabBarIcon: tabIcon('book-outline') }} />
    <Tabs.Screen name="practice" options={{ title: 'Mashqlar', tabBarIcon: tabIcon('headset-outline') }} />
    <Tabs.Screen name="progress" options={{ title: 'Natijalar', tabBarIcon: tabIcon('stats-chart-outline') }} />
    <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: tabIcon('person-outline') }} />
  </Tabs>;
}
