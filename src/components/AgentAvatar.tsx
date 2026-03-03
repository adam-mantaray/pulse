import React from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../design/theme';
import { Box, Text } from '../design/primitives';

interface AgentAvatarProps {
  name: string;
  isActive: boolean;

  onPress?: () => void;
}

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase();
}

export default function AgentAvatar({ name, isActive, onPress }: AgentAvatarProps) {
  const theme = useTheme<Theme>();

  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', marginHorizontal: 8 }}>
      <Box
        width={48}
        height={48}
        borderRadius="pill"
        backgroundColor="accentLight"
        alignItems="center"
        justifyContent="center"
      >
        <Text variant="subheading" color="accent">
          {getInitials(name)}
        </Text>
        {/* Status dot */}
        <Box
          position="absolute"
          bottom={0}
          right={0}
          width={14}
          height={14}
          borderRadius="pill"
          backgroundColor={isActive ? 'agentActive' : 'agentIdle'}
          borderWidth={2}
          borderColor="cardBackground"
        />
      </Box>
      <Text variant="bodySmall" color="textSecondary" style={{ fontSize: 11, marginTop: 4 }}>
        {name}
      </Text>
    </Pressable>
  );
}
