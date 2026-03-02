import React, { useState } from 'react';
import { TextInput, TextInputProps, StyleSheet } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../theme';
import Box from './Box';
import Text from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export default function Input({ label, error, ...rest }: InputProps) {
  const theme = useTheme<Theme>();
  const [focused, setFocused] = useState(false);

  return (
    <Box>
      {label && (
        <Text variant="label" marginBottom="xs">
          {label}
        </Text>
      )}
      <Box
        borderWidth={1.5}
        borderColor={error ? 'expense' : focused ? 'accent' : 'border'}
        borderRadius="md"
        paddingHorizontal="md"
        paddingVertical="m"
        backgroundColor="cardBackground"
      >
        <TextInput
          style={[
            styles.input,
            {
              fontFamily: 'DMSans-Regular',
              fontSize: theme.spacing.md,
              color: theme.colors.textPrimary,
            },
          ]}
          placeholderTextColor={theme.colors.textTertiary}
          onFocus={(e) => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
          {...rest}
        />
      </Box>
      {error && (
        <Text variant="bodySmall" color="expense" marginTop="xs">
          {error}
        </Text>
      )}
    </Box>
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 0,
    margin: 0,
  },
});
