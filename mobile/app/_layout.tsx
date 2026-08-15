import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AnimatedBrandIntro } from '@/components/brand/AnimatedBrandIntro';
import { BrandMark } from '@/components/brand/BrandMark';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CourseProvider } from '@/context/CourseContext';
import { colors } from '@/theme/colors';

function RootNavigator() {
  const { user, isLoading, sessionRestoreError, retrySessionRestore, logout } = useAuth();
  const [introDone, setIntroDone] = useState(false);
  const finishIntro = useCallback(() => setIntroDone(true), []);

  if (!introDone) {
    return <AnimatedBrandIntro onFinish={finishIntro} />;
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <BrandMark size={88} subtitle="Akkaunt tekshirilmoqda…" />
        <ActivityIndicator style={styles.spinner} color={colors.primary} />
      </View>
    );
  }

  if (sessionRestoreError && !user) {
    return (
      <View style={styles.loading}>
        <View style={styles.errorMark}><Ionicons name="cloud-offline-outline" size={38} color={colors.primary} /></View>
        <Text style={styles.errorTitle}>Sessiyani tiklab bo‘lmadi</Text>
        <Text style={styles.errorText}>{sessionRestoreError}</Text>
        <Pressable style={styles.retryButton} onPress={() => void retrySessionRestore()}>
          <Ionicons name="refresh" size={19} color="#fff" />
          <Text style={styles.retryText}>Qayta urinish</Text>
        </Pressable>
        <Pressable style={styles.logoutLink} onPress={() => void logout()}>
          <Text style={styles.logoutLinkText}>Boshqa akkaunt bilan kirish</Text>
        </Pressable>
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
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, paddingHorizontal: 28 },
  spinner: { marginTop: 20 },
  errorMark: { width: 82, height: 82, borderRadius: 27, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  errorTitle: { marginTop: 18, color: colors.text, fontSize: 21, fontWeight: '900', textAlign: 'center' },
  errorText: { marginTop: 7, color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  retryButton: { marginTop: 20, height: 52, minWidth: 190, paddingHorizontal: 22, borderRadius: 17, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  retryText: { color: '#fff', fontWeight: '900' },
  logoutLink: { marginTop: 12, padding: 10 },
  logoutLinkText: { color: colors.muted, fontWeight: '700' },
});
