import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ThemeProvider } from '../src/design/ThemeProvider';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { useAuth } from '../src/hooks/useAuth';
import { initSentry, Sentry } from '../src/lib/sentry';
import { setAnalyticsClient } from '../src/lib/analytics';

// Init Sentry before anything else renders
initSentry();

const CONVEX_URL =
  process.env.EXPO_PUBLIC_CONVEX_URL ??
  'https://harmless-penguin-324.eu-west-1.convex.cloud';

const convex = new ConvexReactClient(CONVEX_URL);

function AuthGate({ children }: { children: React.ReactNode }) {
  const { userId, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === 'login';
    if (!userId && !inAuthGroup) {
      router.replace('/login');
    } else if (userId && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [userId, isLoading, segments]);

  return <>{children}</>;
}

function AnalyticsCapture() {
  const posthog = usePostHog();
  useEffect(() => {
    if (posthog) setAnalyticsClient(posthog);
  }, [posthog]);
  return null;
}

function RootLayoutInner() {
  return (
    <ErrorBoundary label="Root">
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PostHogProvider
          apiKey="phc_XZ4P0qOPRt9HxN4mGaVIS69DN9F5IvJIzoSHGTAweDs"
          options={{ host: 'https://us.i.posthog.com' }}
        >
          <AnalyticsCapture />
          <ConvexProvider client={convex}>
            <SafeAreaProvider>
              <ThemeProvider>
                <AuthGate>
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="login" />
                    <Stack.Screen name="(tabs)" />
                  </Stack>
                </AuthGate>
              </ThemeProvider>
            </SafeAreaProvider>
          </ConvexProvider>
        </PostHogProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export default Sentry.wrap(RootLayoutInner);
