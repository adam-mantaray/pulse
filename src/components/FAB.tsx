import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Plus } from 'lucide-react-native';
import { Theme } from '../design/theme';

interface FABProps {
  onPress: () => void;
}

export default function FAB({ onPress }: FABProps) {
  const theme = useTheme<Theme>();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fab,
        {
          backgroundColor: theme.colors.accent,
          opacity: pressed ? 0.85 : 1,
          shadowColor: theme.colors.textPrimary,
        },
      ]}
    >
      <Plus size={28} color={theme.colors.textOnAccent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
});
