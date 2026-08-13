import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CourseProvider } from '@/context/CourseContext';
import { colors } from '@/theme/colors';

function RootNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <View style={styles.brandMark}><Ionicons name="musical-notes" size={40} color="#fff" /></View>
        <Text style={styles.brand}>Solfedjio</Text>
        <Text style={styles.loadingText}>Akkaunt tekshirilmoqda…</Text>
        <ActivityIndicator style={styles.spinner} color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background }, animation: 'fade_from_bottom' }}>
      <Stack.Screen name="index" />

      <Stack.Protected guard={!user}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
      </Stack.Protected>

      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="lessons/[id]" />
        <Stack.Screen name="blocks/[id]" />
        <Stack.Screen name="piano" />
        <Stack.Screen name="profile-info" />
        <Stack.Screen name="change-password" />
        <Stack.Screen name="language" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="help" />
        <Stack.Screen name="about" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <CourseProvider>
            <RootNavigator />
          </CourseProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, paddingHorizontal: 24 },
  brandMark: { width: 82, height: 82, borderRadius: 27, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  brand: { marginTop: 16, color: colors.text, fontSize: 27, fontWeight: '900' },
  loadingText: { marginTop: 6, color: colors.muted, fontSize: 13 },
  spinner: { marginTop: 20 },
});
