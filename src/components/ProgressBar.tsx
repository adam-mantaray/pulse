import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../design/theme';

interface ProgressBarProps {
  progress: number;
  color?: keyof Theme['colors'];
  height?: number;
}

export default function ProgressBar({
  progress,
  color = 'accent',
  height = 8,
}: ProgressBarProps) {
  const theme = useTheme<Theme>();
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(progress, 100), { duration: 600 });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
    height,
    backgroundColor: theme.colors[color],
    borderRadius: height / 2,
  }));

  return (
    <View
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
          backgroundColor: theme.colors.border,
        },
      ]}
    >
      <Animated.View style={animatedStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
});
