import { useEffect, useState } from 'react';
import { Redirect, type Href } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { hasSeenOnboarding } from '@/services/app/preferences';
import { colors } from '@/theme/colors';

export default function Index() {
  const { user } = useAuth();
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
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={destination} />;
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
