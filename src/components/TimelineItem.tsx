import React from 'react';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../design/theme';
import { Box, Text } from '../design/primitives';

type TimelineStatus = 'done' | 'in_progress' | 'blocked' | 'upcoming';

interface TimelineItemProps {
  title: string;
  agentName: string;
  status: TimelineStatus;
  projectLabel?: string;
  timestamp?: string;
}

function getStatusColor(status: TimelineStatus): keyof Theme['colors'] {
  switch (status) {
    case 'done':
      return 'success';
    case 'in_progress':
      return 'accent';
    case 'blocked':
      return 'danger';
    case 'upcoming':
      return 'textTertiary';
  }
}

function getStatusLabel(status: TimelineStatus): string {
  switch (status) {
    case 'done':
      return 'Done';
    case 'in_progress':
      return 'In Progress';
    case 'blocked':
      return 'Blocked';
    case 'upcoming':
      return 'Upcoming';
  }
}

export default function TimelineItem({
  title,
  agentName,
  status,
  projectLabel,
  timestamp,
}: TimelineItemProps) {
  const theme = useTheme<Theme>();
  const statusColor = getStatusColor(status);

  return (
    <Box
      flexDirection="row"
      marginBottom="m"
    >
      {/* Left border indicator */}
      <Box
        width={4}
        borderRadius="pill"
        backgroundColor={statusColor}
        marginRight="m"
      />
      {/* Content */}
      <Box
        flex={1}
        backgroundColor="cardBackground"
        borderRadius="md"
        padding="md"
        borderWidth={1}
        borderColor="border"
      >
        <Text variant="subheading" color="textPrimary" numberOfLines={2}>
          {title}
        </Text>
        <Box flexDirection="row" alignItems="center" marginTop="xs">
          <Text variant="bodySmall" color="textTertiary">
            {agentName}
          </Text>
          <Box
            marginLeft="s"
            paddingHorizontal="s"
            paddingVertical="xs"
            borderRadius="sm"
            backgroundColor={statusColor}
          >
            <Text
              variant="bodySmall"
              color="textOnAccent"
              style={{ fontSize: 10 }}
            >
              {getStatusLabel(status)}
            </Text>
          </Box>
          {projectLabel && (
            <Text variant="bodySmall" color="textTertiary" marginLeft="s">
              {projectLabel}
            </Text>
          )}
        </Box>
        {timestamp && (
          <Text variant="bodySmall" color="textTertiary" marginTop="xs" style={{ fontSize: 11 }}>
            {timestamp}
          </Text>
        )}
      </Box>
    </Box>
  );
}
