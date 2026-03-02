import React from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { ThemeProvider } from '../src/design/ThemeProvider';

const CONVEX_URL =
  process.env.EXPO_PUBLIC_CONVEX_URL ??
  'https://harmless-penguin-324.eu-west-1.convex.cloud';

const convex = new ConvexReactClient(CONVEX_URL);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexProvider client={convex}>
        <SafeAreaProvider>
          <ThemeProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="login" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </ThemeProvider>
        </SafeAreaProvider>
      </ConvexProvider>
    </GestureHandlerRootView>
  );
}
