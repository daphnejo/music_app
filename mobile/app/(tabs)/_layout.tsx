import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

const tabIcon = (name: keyof typeof Ionicons.glyphMap) => ({ color, size }: { color: string; size: number }) => (
  <Ionicons name={name} color={color} size={size} />
);

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
          height: 76,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopWidth: 0,
          backgroundColor: colors.surface,
          elevation: 8,
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '900' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Uy', tabBarIcon: tabIcon('home') }} />
      <Tabs.Screen name="lessons" options={{ title: 'Darslar', tabBarIcon: tabIcon('musical-notes') }} />
      <Tabs.Screen name="profile" options={{ title: 'Men', tabBarIcon: tabIcon('happy') }} />

      {/* Bu ekranlar funksional sifatida saqlanadi, lekin 1–2-sinf o‘quvchisi uchun asosiy navigatsiyada ko‘rinmaydi. */}
      <Tabs.Screen name="practice" options={{ href: null }} />
      <Tabs.Screen name="progress" options={{ href: null }} />
    </Tabs>
  );
}
