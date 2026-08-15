import { useEffect, useState } from 'react';
import { Redirect, type Href } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { BrandMark } from '@/components/brand/BrandMark';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { hasSeenOnboarding } from '@/services/app/preferences';

export default function Index() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [destination, setDestination] = useState<Href | null>(user ? '/(tabs)' : null);

  useEffect(() => {
    let mounted = true;

    if (user) {
      setDestination('/(tabs)');
      return () => {
        mounted = false;
      };
    }

    (async () => {
      const seen = await hasSeenOnboarding();
      if (mounted) setDestination(seen ? '/login' : '/onboarding');
    })();

    return () => {
      mounted = false;
    };
  }, [user]);

  if (!destination) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <BrandMark size={84} subtitle="Solfedjio yuklanmoqda…" />
      </View>
    );
  }

  return <Redirect href={destination} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
});
