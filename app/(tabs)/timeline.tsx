import React, { useState, useCallback } from 'react';
import { ScrollView, Pressable, RefreshControl } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { useQuery } from 'convex/react';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Theme } from '../../src/design/theme';
import { Box, Text, SafeArea } from '../../src/design/primitives';
import TimelineItem from '../../src/components/TimelineItem';

type TimeRange = 'today' | 'week' | 'month';
type AgentFilter = 'All' | 'Tarek' | 'Rami' | 'Nadia' | 'Adam';

const TIME_RANGES: Array<{ label: string; value: TimeRange }> = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
];

const AGENT_FILTERS: AgentFilter[] = ['All', 'Tarek', 'Rami', 'Nadia', 'Adam'];

// Map agent activity action to timeline status
function actionToStatus(action: string): 'done' | 'in_progress' | 'blocked' | 'upcoming' {
  switch (action) {
    case 'completed':
      return 'done';
    case 'moved':
    case 'commented':
    case 'created':
      return 'in_progress';
    default:
      return 'upcoming';
  }
}

function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function TimelineScreen() {
  const theme = useTheme<Theme>();
  const [timeRange, setTimeRange] = useState<TimeRange>('today');
  const [agentFilter, setAgentFilter] = useState<AgentFilter>('All');
  const [refreshing, setRefreshing] = useState(false);

  // Query agent activity from Convex
  const activities = useQuery(api.agentActivity.listActivities, {
    timeRange,
    agentFilter: agentFilter === 'All' ? undefined : agentFilter.toLowerCase(),
  });

  const syncLinear = useAction(api.linearSync.syncLinearProjects);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await syncLinear();
    } catch {
      // Linear sync may fail if key is not set
    }
    setRefreshing(false);
  }, [syncLinear]);

  return (
    <SafeArea edges={['top']}>
      <Box flex={1} backgroundColor="mainBackground">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
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
              Timeline
            </Text>
          </Box>

          {/* Segmented Control */}
          <Box
            flexDirection="row"
            marginHorizontal="xl"
            marginBottom="md"
            backgroundColor="secondaryBackground"
            borderRadius="sm"
            padding="xs"
          >
            {TIME_RANGES.map((range) => (
              <Pressable
                key={range.value}
                onPress={() => setTimeRange(range.value)}
                style={{ flex: 1 }}
              >
                <Box
                  paddingVertical="s"
                  borderRadius="sm"
                  backgroundColor={timeRange === range.value ? 'cardBackground' : 'transparent'}
                  alignItems="center"
                >
                  <Text
                    variant="bodySmall"
                    color={timeRange === range.value ? 'textPrimary' : 'textTertiary'}
                  >
                    {range.label}
                  </Text>
                </Box>
              </Pressable>
            ))}
          </Box>

          {/* Agent Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
          >
            {AGENT_FILTERS.map((agent) => (
              <Pressable key={agent} onPress={() => setAgentFilter(agent)}>
                <Box
                  paddingHorizontal="md"
                  paddingVertical="xs"
                  borderRadius="pill"
                  backgroundColor={agentFilter === agent ? 'accent' : 'secondaryBackground'}
                  marginRight="s"
                >
                  <Text
                    variant="bodySmall"
                    color={agentFilter === agent ? 'textOnAccent' : 'textSecondary'}
                  >
                    {agent}
                  </Text>
                </Box>
              </Pressable>
            ))}
          </ScrollView>

          {/* Timeline Items */}
          <Box paddingHorizontal="xl">
            {activities === undefined ? (
              <Box padding="xl" alignItems="center">
                <Text variant="bodySmall" color="textTertiary">Loading timeline...</Text>
              </Box>
            ) : activities.length === 0 ? (
              <Box
                backgroundColor="cardBackground"
                borderRadius="md"
                padding="xl"
                alignItems="center"
                borderWidth={1}
                borderColor="border"
              >
                <Text style={{ fontSize: 48, marginBottom: 12 }}>📋</Text>
                <Text variant="subheading" color="textPrimary" style={{ textAlign: 'center' }}>
                  No activity yet
                </Text>
                <Text variant="bodySmall" color="textTertiary" style={{ textAlign: 'center', marginTop: 4 }}>
                  Pull to refresh and sync from Linear
                </Text>
              </Box>
            ) : (
              activities.map((activity) => (
                <TimelineItem
                  key={activity._id}
                  title={`${activity.agentName} ${activity.action} ${activity.issueTitle}`}
                  agentName={activity.agentName}
                  status={actionToStatus(activity.action)}
                  timestamp={formatTimestamp(activity.timestamp)}
                />
              ))
            )}
          </Box>
        </ScrollView>
      </Box>
    </SafeArea>
  );
}
