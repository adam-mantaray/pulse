import React, { useRef, useState } from 'react';
import { ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import BottomSheetComponent from '@gorhom/bottom-sheet';
import { Box, Text, SafeArea, Button, Input, BottomSheet } from '../../src/design/primitives';
import HabitCard from '../../src/components/HabitCard';
import FAB from '../../src/components/FAB';
import { useAuth } from '../../src/hooks/useAuth';
import { useHabits } from '../../src/hooks/useHabits';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

const FREQUENCY_OPTIONS: Array<{ label: string; value: 'daily' | 'weekdays' | 'custom' }> = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekdays', value: 'weekdays' },
  { label: 'Custom', value: 'custom' },
];

export default function HabitsScreen() {
  const sheetRef = useRef<BottomSheetComponent>(null);
  const { userId } = useAuth();
  const typedUserId = userId as Id<"users"> | null;
  const { habits, completedHabitIds, completeHabit, isLoading } = useHabits(typedUserId);
  const createHabitMutation = useMutation(api.habits.createHabit);

  const [newName, setNewName] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState<'daily' | 'weekdays' | 'custom'>('daily');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleCreateHabit = async () => {
    if (!newName.trim() || !typedUserId) return;
    await createHabitMutation({
      userId: typedUserId,
      name: newName.trim(),
      emoji: '',
      frequency: selectedFrequency,
    });
    setNewName('');
    setSelectedFrequency('daily');
    sheetRef.current?.close();
  };

  return (
    <SafeArea edges={['top']}>
      <Box flex={1} backgroundColor="mainBackground">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Header */}
          <Box paddingHorizontal="xl" paddingTop="md" paddingBottom="md">
            <Text variant="heading" color="textPrimary">
              Habits
            </Text>
            <Text variant="bodySmall" color="textTertiary">
              {today}
            </Text>
          </Box>

          {/* Habits List */}
          <Box paddingHorizontal="xl">
            {isLoading ? (
              <Box padding="xl" alignItems="center">
                <Text variant="bodySmall" color="textTertiary">Loading habits...</Text>
              </Box>
            ) : habits.length === 0 ? (
              <Box
                backgroundColor="cardBackground"
                borderRadius="md"
                padding="xl"
                alignItems="center"
                borderWidth={1}
                borderColor="border"
              >
                <Text variant="subheading" color="textPrimary" style={{ textAlign: 'center' }}>
                  No habits yet
                </Text>
                <Text variant="bodySmall" color="textTertiary" style={{ textAlign: 'center', marginTop: 4 }}>
                  Tap the + button to create your first habit
                </Text>
              </Box>
            ) : (
              habits.map((habit) => (
                <HabitCard
                  key={habit._id}
                  habit={habit}
                  isCompleted={completedHabitIds.has(habit._id)}
                  onComplete={() => completeHabit(habit._id)}
                  variant="full"
                  subGoalLabel={'subGoalLabel' in habit ? (habit as { subGoalLabel: string | null }).subGoalLabel : null}
                />
              ))
            )}
          </Box>
        </ScrollView>

        {/* FAB */}
        <FAB onPress={() => sheetRef.current?.snapToIndex(0)} />

        {/* Create Habit Bottom Sheet */}
        <BottomSheet
          sheetRef={sheetRef}
          onClose={() => {}}
          snapPoints={['50%']}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <Box padding="xl">
              <Text variant="heading" marginBottom="md">
                New Habit
              </Text>

              {/* Name Input */}
              <Input
                label="HABIT NAME"
                placeholder="e.g., Morning workout"
                value={newName}
                onChangeText={setNewName}
              />

              {/* Frequency Selector */}
              <Box marginTop="md">
                <Text variant="label" marginBottom="s">
                  FREQUENCY
                </Text>
                <Box flexDirection="row">
                  {FREQUENCY_OPTIONS.map((freq) => (
                    <Box key={freq.value} marginRight="s">
                      <Button
                        label={freq.label}
                        variant={selectedFrequency === freq.value ? 'primary' : 'outline'}
                        onPress={() => setSelectedFrequency(freq.value)}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>

              {/* Create Button */}
              <Box marginTop="xl">
                <Button
                  label="Create Habit"
                  onPress={handleCreateHabit}
                  disabled={!newName.trim()}
                />
              </Box>
            </Box>
          </KeyboardAvoidingView>
        </BottomSheet>
      </Box>
    </SafeArea>
  );
}
