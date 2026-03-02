import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAction } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Box, Text, SafeArea, Button, Input } from '../src/design/primitives';
import { useAuth } from '../src/hooks/useAuth';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const authenticateUser = useAction(api.users.authenticateUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter email and password');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await authenticateUser({
        email: email.trim().toLowerCase(),
        password,
      });

      if (result) {
        await login(result.userId, result.name);
        router.replace('/(tabs)');
      } else {
        setError('Invalid email or password');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeArea>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <Box
          flex={1}
          backgroundColor="mainBackground"
          justifyContent="center"
          paddingHorizontal="xl"
        >
          {/* Wordmark */}
          <Box alignItems="center" marginBottom="3xl">
            <Text variant="displayLarge" color="accent">
              Pulse
            </Text>
            <Text variant="bodySmall" color="textTertiary" marginTop="s">
              Your command center
            </Text>
          </Box>

          {/* Login Form */}
          <Box>
            <Input
              label="EMAIL"
              placeholder="ahmed@mantaray.digital"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Box marginTop="md">
              <Input
                label="PASSWORD"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </Box>

            {error ? (
              <Text variant="bodySmall" color="danger" marginTop="m">
                {error}
              </Text>
            ) : null}

            <Box marginTop="xl">
              <Button
                label={isLoading ? 'Signing in...' : 'Sign In'}
                onPress={handleLogin}
                disabled={isLoading}
              />
            </Box>
          </Box>
        </Box>
      </KeyboardAvoidingView>
    </SafeArea>
  );
}
