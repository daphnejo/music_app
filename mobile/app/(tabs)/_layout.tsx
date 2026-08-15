import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

const tabIcon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: string; size: number }) => <Ionicons name={name} color={color} size={size} />;

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          height: 68,
          paddingTop: 7,
          paddingBottom: 9,
          borderTopColor: colors.border,
          backgroundColor: colors.surface,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Bosh sahifa', tabBarIcon: tabIcon('home-outline') }} />
      <Tabs.Screen name="lessons" options={{ title: 'Darslar', tabBarIcon: tabIcon('book-outline') }} />
      <Tabs.Screen name="practice" options={{ title: 'Mashqlar', tabBarIcon: tabIcon('headset-outline') }} />
      <Tabs.Screen name="progress" options={{ title: 'Natijalar', tabBarIcon: tabIcon('stats-chart-outline') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarIcon: tabIcon('person-outline') }} />
    </Tabs>
  );
}
