import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { Home, Target, Activity, Calendar, MessageCircle, Grid3X3 } from 'lucide-react-native';
import { Theme } from '../../src/design/theme';

export default function TabLayout() {
  const theme = useTheme<Theme>();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.cardBackground,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontFamily: 'DMSans-Medium',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Goals',
          tabBarIcon: ({ color, size }) => <Target size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color, size }) => <Activity size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="harada"
        options={{
          title: 'Harada',
          tabBarIcon: ({ color, size }) => <Grid3X3 size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
