// app/app/_layout.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Slot, usePathname, useRouter } from 'expo-router';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { loadLanguage } from '@/src/i18n';
import { AuthProvider, useAuth } from '@/src/context/AuthContext';
import { DataProvider } from '@/src/context/DataContext';
import Shell from '@/src/components/Shell';
import { colors } from '@/src/theme';

export { ErrorBoundary } from 'expo-router';

// Only prevent auto hide on native platforms to prevent web blank screen locks
if (Platform.OS !== 'web') {
  SplashScreen.preventAutoHideAsync().catch(() => {});
}

function RootNav() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && pathname !== '/login' && pathname !== '/register') {
      router.replace('/login' as any);
    }
  }, [loading, user, pathname]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Prevent flash of protected screen while redirecting to login
  if (!user && pathname !== '/login' && pathname !== '/register') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Auth screens (login, register) render without the main business shell
  if (!user || pathname === '/login' || pathname === '/register') {
    return <Slot />;
  }

  return (
    <Shell>
      <Slot />
    </Shell>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    loadLanguage();
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.title = 'BiLU ERP – Everything Your Business Needs';
    }
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'web' && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // On native mobile, wait for custom fonts. On web, render immediately with system CSS fallbacks!
  if (Platform.OS !== 'web' && !fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider style={{ flex: 1 }}>
      <AuthProvider>
        <DataProvider>
          <RootNav />
        </DataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    height: '100%',
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
