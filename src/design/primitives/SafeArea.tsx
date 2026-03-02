import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../theme';

interface SafeAreaProps {
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export default function SafeArea({ children, edges }: SafeAreaProps) {
  const theme = useTheme<Theme>();

  return (
    <SafeAreaView
      edges={edges}
      style={{ flex: 1, backgroundColor: theme.colors.mainBackground }}
    >
      {children}
    </SafeAreaView>
  );
}
