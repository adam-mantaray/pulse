import React from 'react';
import { Pressable, PressableProps, ViewStyle } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../theme';
import Text from './Text';

type ButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: ButtonVariant;
}

export default function Button({
  label,
  variant = 'primary',
  ...rest
}: ButtonProps) {
  const theme = useTheme<Theme>();

  const variantConfig = theme.buttonVariants[variant] ?? {};
  const defaults = theme.buttonVariants.defaults;

  const merged = { ...defaults, ...variantConfig } as Record<string, unknown>;

  const resolvedStyle: ViewStyle = {
    backgroundColor: merged.backgroundColor
      ? theme.colors[merged.backgroundColor as keyof Theme['colors']]
      : undefined,
    borderRadius: merged.borderRadius
      ? theme.borderRadii[merged.borderRadius as keyof Theme['borderRadii']]
      : undefined,
    paddingVertical: merged.paddingVertical
      ? theme.spacing[merged.paddingVertical as keyof Theme['spacing']]
      : undefined,
    paddingHorizontal: merged.paddingHorizontal
      ? theme.spacing[merged.paddingHorizontal as keyof Theme['spacing']]
      : undefined,
    borderWidth: merged.borderWidth as number | undefined,
    borderColor: merged.borderColor
      ? theme.colors[merged.borderColor as keyof Theme['colors']]
      : undefined,
    alignItems: 'center',
  };

  const textColor =
    variant === 'outline' || variant === 'ghost'
      ? 'accent'
      : variant === 'danger'
        ? 'expense'
        : 'textOnAccent';

  return (
    <Pressable
      style={({ pressed }) => [resolvedStyle, { opacity: pressed ? 0.85 : 1 }]}
      {...rest}
    >
      <Text variant="button" color={textColor}>
        {label}
      </Text>
    </Pressable>
  );
}
