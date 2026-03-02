import React from 'react';
import { Pressable } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { Theme } from '../design/theme';
import { Box, Text } from '../design/primitives';

interface Habit {
  _id: string;
  name: string;
  emoji: string;
  currentStreak: number;
}

interface HabitCardProps {
  habit: Habit;
  isCompleted: boolean;
  onComplete: () => void;
  variant?: 'mini' | 'full';
}

export default function HabitCard({
  habit,
  isCompleted,
  onComplete,
  variant = 'full',
}: HabitCardProps) {
  const theme = useTheme<Theme>();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.9, { damping: 4 }),
      withSpring(1.1, { damping: 4 }),
      withSpring(1, { damping: 8 })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete();
  };

  if (variant === 'mini') {
    return (
      <Pressable onPress={handlePress}>
        <Animated.View style={animatedStyle}>
          <Box
            backgroundColor={isCompleted ? 'success' : 'cardBackground'}
            borderRadius="md"
            padding="m"
            borderWidth={1}
            borderColor={isCompleted ? 'success' : 'border'}
            alignItems="center"
            width={80}
            marginRight="s"
          >
            <Text style={{ fontSize: 28 }}>{habit.emoji}</Text>
            <Text
              variant="bodySmall"
              color={isCompleted ? 'textOnAccent' : 'textSecondary'}
              numberOfLines={1}
              style={{ fontSize: 11, marginTop: 4 }}
            >
              {habit.name}
            </Text>
            {habit.currentStreak > 0 && (
              <Text
                variant="bodySmall"
                color={isCompleted ? 'textOnAccent' : 'streak'}
                style={{ fontSize: 10 }}
              >
                🔥 {habit.currentStreak}
              </Text>
            )}
          </Box>
        </Animated.View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={animatedStyle}>
        <Box
          backgroundColor={isCompleted ? 'success' : 'cardBackground'}
          borderRadius="md"
          padding="md"
          borderWidth={1}
          borderColor={isCompleted ? 'success' : 'border'}
          flexDirection="row"
          alignItems="center"
          marginBottom="m"
        >
          <Text style={{ fontSize: 36, marginRight: 12 }}>{habit.emoji}</Text>
          <Box flex={1}>
            <Text
              variant="subheading"
              color={isCompleted ? 'textOnAccent' : 'textPrimary'}
            >
              {habit.name}
            </Text>
            {habit.currentStreak > 0 && (
              <Text
                variant="bodySmall"
                color={isCompleted ? 'textOnAccent' : 'streak'}
              >
                🔥 {habit.currentStreak} day streak
              </Text>
            )}
          </Box>
          {isCompleted && (
            <Check size={24} color={theme.colors.textOnAccent} />
          )}
        </Box>
      </Animated.View>
    </Pressable>
  );
}
