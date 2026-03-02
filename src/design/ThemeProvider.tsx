import React, { useEffect } from 'react';
import { useColorScheme, ActivityIndicator, View } from 'react-native';
import { ThemeProvider as RestyleThemeProvider } from '@shopify/restyle';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import lightTheme, { darkTheme } from './theme';
import { useThemeStore } from '../stores/theme';

SplashScreen.preventAutoHideAsync();

interface Props {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: Props) {
  const systemColorScheme = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  const isLoaded = useThemeStore((s) => s.isLoaded);
  const restore = useThemeStore((s) => s.restore);

  const [fontsLoaded] = useFonts({
    'Fraunces-Regular': require('../../assets/fonts/Fraunces-Regular.ttf'),
    'Fraunces-Medium': require('../../assets/fonts/Fraunces-Medium.ttf'),
    'Fraunces-SemiBold': require('../../assets/fonts/Fraunces-SemiBold.ttf'),
    'Fraunces-Bold': require('../../assets/fonts/Fraunces-Bold.ttf'),
    'DMSans-Regular': require('../../assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium': require('../../assets/fonts/DMSans-Medium.ttf'),
    'DMSans-SemiBold': require('../../assets/fonts/DMSans-SemiBold.ttf'),
    'DMSans-Bold': require('../../assets/fonts/DMSans-Bold.ttf'),
  });

  useEffect(() => {
    restore();
  }, []);

  useEffect(() => {
    if (fontsLoaded && isLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoaded]);

  if (!fontsLoaded || !isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAF5EB' }}>
        <ActivityIndicator size="large" color="#2D5F3F" />
      </View>
    );
  }

  const isDark =
    mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');

  const activeTheme = isDark ? darkTheme : lightTheme;

  return (
    <RestyleThemeProvider theme={activeTheme}>
      {children}
    </RestyleThemeProvider>
  );
}
