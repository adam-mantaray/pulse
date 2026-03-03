import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import { useQuery } from 'convex/react';
import { Home, Target, Activity, Grid3X3 } from 'lucide-react-native';
import { Theme } from '../../src/design/theme';
import { api } from '../../convex/_generated/api';
import { useAuth } from '../../src/hooks/useAuth';
import { Id } from '../../convex/_generated/dataModel';

export default function TabLayout() {
  const theme = useTheme<Theme>();
  const { userId } = useAuth();
  const typedUserId = userId as Id<"users"> | null;

  const pendingReview = useQuery(
    api.haradaTasks.listPendingReview,
    typedUserId ? { userId: typedUserId } : "skip"
  );
  const pendingCount = pendingReview?.length ?? 0;

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
          title: 'Vision',
          tabBarIcon: ({ color, size }) => <Grid3X3 size={size} color={color} />,
          tabBarBadge: pendingCount > 0 ? pendingCount : undefined,
          tabBarBadgeStyle: pendingCount > 0 ? {
            backgroundColor: theme.colors.danger,
            fontSize: 10,
            fontFamily: 'DMSans-SemiBold',
          } : undefined,
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
