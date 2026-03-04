import React, { useRef, useCallback, useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@shopify/restyle';
import BottomSheetComponent from '@gorhom/bottom-sheet';
import { Theme } from '../../src/design/theme';
import { Box, Text, SafeArea, Button, BottomSheet } from '../../src/design/primitives';
import GoalRing from '../../src/components/GoalRing';
import HabitCard from '../../src/components/HabitCard';
import AgentAvatar from '../../src/components/AgentAvatar';
import FAB from '../../src/components/FAB';
import { Section } from '../../src/components/ErrorBoundary';
import { useAuth } from '../../src/hooks/useAuth';
import { useHabits } from '../../src/hooks/useHabits';
import { useGoals } from '../../src/hooks/useGoals';
import { Id } from '../../convex/_generated/dataModel';
import { useQuery as useConvexQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q}-${now.getFullYear()}`;
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function DashboardScreen() {
  const theme = useTheme<Theme>();
  const router = useRouter();
  const sheetRef = useRef<BottomSheetComponent>(null);
  const { userId, userName } = useAuth();
  const typedUserId = userId as Id<"users"> | null;
  const quarter = getQuarter();
  const { habits, completedHabitIds, completeHabit, isLoading: habitsLoading } = useHabits(typedUserId);
  const { objectives, isLoading: goalsLoading } = useGoals(typedUserId, quarter);
  const [refreshing, setRefreshing] = React.useState(false);
  const sprintSummary = useConvexQuery(api.linearSync.getSprintSummary);
  const registeredAgents = useConvexQuery(api.agents.list);
  const [selectedAgent, setSelectedAgent] = useState<typeof registeredAgents extends (infer T)[] | null | undefined ? T : never | null>(null);
  const agentSheetRef = useRef<BottomSheetComponent>(null);

  const handleAgentPress = useCallback((agent: NonNullable<typeof registeredAgents>[number]) => {
    setSelectedAgent(agent);
    agentSheetRef.current?.snapToIndex(0);
  }, []);
  const overallProgress = objectives.length > 0
    ? Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)
    : 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Convex handles real-time, just simulate refresh delay
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleFAB = () => {
    sheetRef.current?.snapToIndex(0);
  };

  const isLoading = habitsLoading || goalsLoading;

  return (
    <SafeArea edges={['top']}>
      <Box flex={1} backgroundColor="mainBackground">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.accent}
            />
          }
        >
          {/* Header */}
          <Box paddingHorizontal="xl" paddingTop="md" paddingBottom="s">
            <Text variant="heading" color="textPrimary">
              {getGreeting()}, {userName ?? 'Ahmed'}
            </Text>
            <Text variant="bodySmall" color="textTertiary">
              {formatDate()}
            </Text>
          </Box>

          {/* Goals Ring */}
          <Section label="GoalRing">
          <Box alignItems="center" paddingVertical="xl">
            <GoalRing
              progress={overallProgress}
              label={`${quarter.replace('-', ' ')} Goals`}
            />
          </Box>
          </Section>

          {/* Today's Habits */}
          <Section label="Habits">
          <Box paddingHorizontal="xl" marginBottom="md">
            <Text variant="label" marginBottom="m">
              TODAY'S HABITS
            </Text>
            {isLoading ? (
              <Text variant="bodySmall" color="textTertiary">Loading...</Text>
            ) : (habits ?? []).length === 0 ? (
              <Text variant="bodySmall" color="textTertiary">
                No habits yet. Tap + to create one.
              </Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {(habits ?? []).map((habit) => (
                  <HabitCard
                    key={habit._id}
                    habit={habit}
                    isCompleted={completedHabitIds.has(habit._id)}
                    onComplete={() => completeHabit(habit._id)}
                    variant="mini"
                  />
                ))}
              </ScrollView>
            )}
          </Box>
          </Section>

          {/* Active Sprint Card */}
          <Section label="SprintCard">
          <Box paddingHorizontal="xl" marginBottom="md">
            <Box
              backgroundColor="cardBackground"
              borderRadius="md"
              padding="md"
              borderWidth={1}
              borderColor="border"
            >
              <Text variant="label" marginBottom="s">
                CURRENT SPRINT
              </Text>
              <Text variant="subheading" color="textPrimary">
                {sprintSummary
                  ? `${sprintSummary.completedTasks} / ${sprintSummary.totalTasks} tasks done`
                  : 'Loading sprint...'}
              </Text>
              <Text variant="bodySmall" color="textTertiary" marginTop="xs">
                {sprintSummary
                  ? `${sprintSummary.inProgressTasks} in progress · ${sprintSummary.projectCount} project${sprintSummary.projectCount !== 1 ? 's' : ''}`
                  : 'Syncs from Linear every 5 minutes'}
              </Text>
            </Box>
          </Box>
          </Section>

          {/* Agent Status Bar */}
          <Section label="AgentTeam">
          <Box paddingHorizontal="xl" marginBottom="md">
            <Text variant="label" marginBottom="m">
              AGENT TEAM
            </Text>
            <Box flexDirection="row" justifyContent="center" flexWrap="wrap">
              {(registeredAgents ?? []).map((agent) => (
                <AgentAvatar
                  key={agent.agentId}
                  name={agent.name}
                  isActive={agent.status === 'active'}
                  onPress={() => handleAgentPress(agent)}
                />
              ))}
            </Box>
          </Box>
          </Section>

        </ScrollView>

        {/* FAB */}
        <FAB onPress={handleFAB} />

        {/* Bottom Sheet */}
        <BottomSheet
          sheetRef={sheetRef}
          onClose={() => {}}
          snapPoints={['35%']}
        >
          <Box padding="xl">
            <Text variant="heading" marginBottom="md">
              Quick Actions
            </Text>
            <Button
              label="New Goal"
              onPress={() => {
                sheetRef.current?.close();
                router.push('/(tabs)/goals');
              }}
            />
            <Box marginTop="m">
              <Button
                label="New Habit"
                variant="outline"
                onPress={() => {
                  sheetRef.current?.close();
                  router.push('/(tabs)/habits');
                }}
              />
            </Box>
          </Box>
        </BottomSheet>

        {/* Agent Detail Sheet */}
        <BottomSheet
          sheetRef={agentSheetRef}
          onClose={() => setSelectedAgent(null)}
          snapPoints={['40%']}
        >
          {selectedAgent && (
            <Box padding="xl">
              <Box flexDirection="row" alignItems="center" marginBottom="l">
                <Box
                  width={48}
                  height={48}
                  borderRadius="round"
                  backgroundColor="cardBackground"
                  alignItems="center"
                  justifyContent="center"
                  marginRight="m"
                >
                  <Text variant="heading">{selectedAgent.name?.charAt(0) ?? '?'}</Text>
                </Box>
                <Box flex={1}>
                  <Text variant="subheading">{selectedAgent.name}</Text>
                  <Text variant="bodySmall" color="textSecondary">{selectedAgent.agentId}</Text>
                </Box>
              </Box>
              <Box gap="s">
                <Box flexDirection="row" justifyContent="space-between" paddingVertical="s">
                  <Text variant="label" color="textSecondary">Status</Text>
                  <Text variant="body" color={selectedAgent.status === 'active' ? 'income' : 'textTertiary'}>
                    {selectedAgent.status ?? 'unknown'}
                  </Text>
                </Box>
                <Box flexDirection="row" justifyContent="space-between" paddingVertical="s">
                  <Text variant="label" color="textSecondary">Current Task</Text>
                  <Text variant="body" numberOfLines={1} style={{ maxWidth: '60%', textAlign: 'right' }}>
                    {(selectedAgent as any).currentTask ?? '—'}
                  </Text>
                </Box>
                <Box flexDirection="row" justifyContent="space-between" paddingVertical="s">
                  <Text variant="label" color="textSecondary">Last Seen</Text>
                  <Text variant="body" color="textSecondary">
                    {(selectedAgent as any).lastSeen
                      ? new Date((selectedAgent as any).lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </Text>
                </Box>
              </Box>
            </Box>
          )}
        </BottomSheet>
      </Box>
    </SafeArea>
  );
}
