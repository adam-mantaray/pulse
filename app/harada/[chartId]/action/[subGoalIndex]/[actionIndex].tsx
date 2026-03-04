import React, { useRef, useState } from 'react';
import {
  ScrollView,
  Pressable,
  Alert,
  TextInput,
} from 'react-native';
import BottomSheetComponent from '@gorhom/bottom-sheet';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { useTheme } from '@shopify/restyle';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Check, Plus, ChevronRight } from 'lucide-react-native';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';
import { Theme } from '../../../../../src/design/theme';
import { Box, Text, SafeArea, Button, Input, BottomSheet } from '../../../../../src/design/primitives';
import { useAuth } from '../../../../../src/hooks/useAuth';
import { analytics, EVENTS } from '../../../../../src/lib/analytics';

const FREQUENCY_OPTIONS: Array<{ label: string; value: 'daily' | 'weekdays' | 'custom' }> = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekdays', value: 'weekdays' },
  { label: 'Custom', value: 'custom' },
];

const KR_TRACKING_TYPES: Array<{ label: string; value: 'numeric' | 'manual' }> = [
  { label: 'Numeric target', value: 'numeric' },
  { label: 'Manual check-off', value: 'manual' },
];

export default function ActionDetailScreen() {
  const {
    chartId,
    subGoalIndex: sgStr,
    actionIndex: aiStr,
  } = useLocalSearchParams<{
    chartId: string;
    subGoalIndex: string;
    actionIndex: string;
  }>();
  const router = useRouter();
  const theme = useTheme<Theme>();
  const { userId } = useAuth();
  const typedUserId = userId as Id<"users"> | null;

  const typedChartId = chartId as Id<"haradaCharts">;
  const subGoalIndex = parseInt(sgStr ?? '0');
  const actionIndex = parseInt(aiStr ?? '0');

  const chart = useQuery(api.harada.get, { chartId: typedChartId });
  const tasks = useQuery(api.haradaTasks.listForAction, {
    chartId: typedChartId,
    subGoalIndex,
    actionIndex,
  });
  const toggleActionDone = useMutation(api.harada.toggleActionDone);
  const createTask = useMutation(api.haradaTasks.create);
  const markTaskDone = useMutation(api.haradaTasks.markDone);
  const removeTask = useMutation(api.haradaTasks.remove);
  const createHabitFromHarada = useMutation(api.habits.createFromHarada);
  const createKRFromHarada = useMutation(api.keyResults.createFromHarada);

  // Bottom sheet refs
  const habitSheetRef = useRef<BottomSheetComponent>(null);
  const krSheetRef = useRef<BottomSheetComponent>(null);

  // New task input
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);

  // Habit promote state
  const [habitName, setHabitName] = useState('');
  const [habitEmoji, setHabitEmoji] = useState('');
  const [habitFrequency, setHabitFrequency] = useState<'daily' | 'weekdays' | 'custom'>('daily');

  // KR promote state
  const [krTitle, setKRTitle] = useState('');
  const [krTrackingType, setKRTrackingType] = useState<'numeric' | 'manual'>('manual');
  const [krTargetValue, setKRTargetValue] = useState('');
  const [krObjectiveId, setKRObjectiveId] = useState<Id<"objectives"> | null>(null);

  // Objectives for KR promote
  const now = new Date();
  const currentQuarter = `Q${Math.ceil((now.getMonth() + 1) / 3)}-${now.getFullYear()}`;
  const objectives = useQuery(
    api.objectives.listObjectives,
    typedUserId ? { userId: typedUserId, quarter: currentQuarter } : "skip"
  );

  if (!chart) {
    return (
      <SafeArea edges={['top']}>
        <Box flex={1} backgroundColor="mainBackground" justifyContent="center" alignItems="center">
          <Text variant="bodySmall" color="textTertiary">Loading...</Text>
        </Box>
      </SafeArea>
    );
  }

  const subGoalName = chart.subGoals[subGoalIndex] || `Sub-goal ${subGoalIndex + 1}`;
  const actionText = chart.actions[subGoalIndex]?.[actionIndex] || '';
  const actionsDone = chart.actionsDone
    ? chart.actionsDone[subGoalIndex]?.[actionIndex] ?? false
    : false;

  const handleToggleDone = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleActionDone({
      chartId: typedChartId,
      subGoalIndex,
      actionIndex,
    });
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim() || !typedUserId) return;
    await createTask({
      userId: typedUserId,
      chartId: typedChartId,
      subGoalIndex,
      actionIndex,
      title: newTaskTitle.trim(),
    });
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const handleTaskDone = async (taskId: Id<"haradaTasks">) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await markTaskDone({ taskId });
  };

  const handleDeleteTask = (taskId: Id<"haradaTasks">, title: string) => {
    Alert.alert('Delete Task', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeTask({ taskId }) },
    ]);
  };

  const handlePromoteToHabit = () => {
    setHabitName(actionText);
    setHabitEmoji('');
    setHabitFrequency('daily');
    habitSheetRef.current?.snapToIndex(0);
  };

  const handleCreateHabit = async () => {
    if (!habitName.trim() || !typedUserId) return;
    await createHabitFromHarada({
      userId: typedUserId,
      name: habitName.trim(),
      emoji: habitEmoji.trim() || '🎯',
      frequency: habitFrequency,
      haradaChartId: typedChartId,
      haradaSubGoalIndex: subGoalIndex,
      promotedFromActionIndex: actionIndex,
    });
    habitSheetRef.current?.close();
    Alert.alert('Habit Created', `"${habitName.trim()}" added to your habits.`);
  };

  const handlePromoteToKR = () => {
    setKRTitle(actionText);
    setKRTrackingType('manual');
    setKRTargetValue('');
    setKRObjectiveId(objectives?.[0]?._id ?? null);
    krSheetRef.current?.snapToIndex(0);
  };

  const handleCreateKR = async () => {
    if (!krTitle.trim() || !krObjectiveId) return;
    await createKRFromHarada({
      objectiveId: krObjectiveId,
      title: krTitle.trim(),
      trackingType: krTrackingType,
      targetValue: krTrackingType === 'numeric' && krTargetValue
        ? parseFloat(krTargetValue)
        : undefined,
      haradaChartId: typedChartId,
      haradaSubGoalIndex: subGoalIndex,
      haradaActionIndex: actionIndex,
    });
    krSheetRef.current?.close();
    Alert.alert('Key Result Created', `"${krTitle.trim()}" added to your OKRs.`);
  };

  const handleFocus = () => {
    analytics.capture(EVENTS.POMODORO_STARTED, { actionIndex, subGoalIndex });
    Alert.alert('Coming Soon', 'Pomodoro timer is coming in Phase C.');
  };

  const sortedTasks = [...(tasks ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const doneTasks = sortedTasks.filter((t) => t.status === 'done');
  const activeTasks = sortedTasks.filter((t) => t.status !== 'done');

  return (
    <SafeArea edges={['top']}>
      <Box flex={1} backgroundColor="mainBackground">
        {/* Header */}
        <Box
          flexDirection="row"
          alignItems="center"
          paddingHorizontal="xl"
          paddingTop="md"
          paddingBottom="s"
        >
          <Pressable onPress={() => router.back()} style={{ marginRight: 12, padding: 4 }}>
            <ArrowLeft size={24} color={theme.colors.textPrimary} />
          </Pressable>
          <Box flex={1}>
            <Text variant="bodySmall" color="textTertiary" numberOfLines={1}>
              {subGoalName}
            </Text>
            <Text variant="heading" color="textPrimary" numberOfLines={2}>
              {actionText || `Action ${actionIndex + 1}`}
            </Text>
          </Box>

          {/* Done toggle */}
          <Pressable onPress={handleToggleDone} style={{ padding: 4 }}>
            <Box
              width={32}
              height={32}
              borderRadius="pill"
              borderWidth={2}
              borderColor={actionsDone ? 'success' : 'border'}
              backgroundColor={actionsDone ? 'success' : 'transparent'}
              alignItems="center"
              justifyContent="center"
            >
              {actionsDone && <Check size={18} color="#FFFFFF" />}
            </Box>
          </Pressable>
        </Box>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Sub-tasks section */}
          <Box paddingHorizontal="xl" paddingTop="md">
            <Text variant="label" marginBottom="s">
              SUB-TASKS
            </Text>

            {/* Active tasks */}
            {activeTasks.map((task) => (
              <Pressable
                key={task._id}
                onPress={() => router.push(`/harada/${chartId}/task/${task._id}` as never)}
                onLongPress={() => handleDeleteTask(task._id, task.title)}
              >
                <Box
                  flexDirection="row"
                  alignItems="center"
                  backgroundColor="cardBackground"
                  borderRadius="md"
                  padding="m"
                  marginBottom="xs"
                  borderWidth={1}
                  borderColor={task.status === 'pending_review' ? 'warning' : 'border'}
                >
                  <Pressable onPress={() => handleTaskDone(task._id)} style={{ marginRight: 10 }}>
                    <Box
                      width={24}
                      height={24}
                      borderRadius="pill"
                      borderWidth={2}
                      borderColor="border"
                      alignItems="center"
                      justifyContent="center"
                    />
                  </Pressable>
                  <Box flex={1}>
                    <Text variant="bodySmall" color="textPrimary">
                      {task.title}
                    </Text>
                    {task.assignedAgentName && (
                      <Text variant="bodySmall" color="textTertiary" style={{ fontSize: 11 }}>
                        Assigned to {task.assignedAgentName}
                      </Text>
                    )}
                  </Box>
                  {task.status !== 'todo' && task.status !== 'done' && (
                    <Box
                      backgroundColor={task.status === 'pending_review' ? 'warning' : 'accentLight'}
                      paddingHorizontal="xs"
                      paddingVertical="xs"
                      borderRadius="sm"
                      marginRight="xs"
                    >
                      <Text
                        variant="bodySmall"
                        color={task.status === 'pending_review' ? 'textOnAccent' : 'accent'}
                        style={{ fontSize: 10 }}
                      >
                        {task.status.replace(/_/g, ' ')}
                      </Text>
                    </Box>
                  )}
                  <ChevronRight size={16} color={theme.colors.textTertiary} />
                </Box>
              </Pressable>
            ))}

            {/* Done tasks */}
            {doneTasks.map((task) => (
              <Pressable
                key={task._id}
                onPress={() => router.push(`/harada/${chartId}/task/${task._id}` as never)}
                onLongPress={() => handleDeleteTask(task._id, task.title)}
              >
                <Box
                  flexDirection="row"
                  alignItems="center"
                  backgroundColor="cardBackground"
                  borderRadius="md"
                  padding="m"
                  marginBottom="xs"
                  borderWidth={1}
                  borderColor="border"
                  style={{ opacity: 0.6 }}
                >
                  <Box
                    width={24}
                    height={24}
                    borderRadius="pill"
                    borderWidth={2}
                    borderColor="success"
                    backgroundColor="success"
                    alignItems="center"
                    justifyContent="center"
                    marginRight="s"
                  >
                    <Check size={14} color="#FFFFFF" />
                  </Box>
                  <Box flex={1}>
                    <Text
                      variant="bodySmall"
                      color="textTertiary"
                      style={{ textDecorationLine: 'line-through' }}
                    >
                      {task.title}
                    </Text>
                  </Box>
                  <ChevronRight size={16} color={theme.colors.textTertiary} />
                </Box>
              </Pressable>
            ))}

            {/* Add task row */}
            {isAddingTask ? (
              <Box
                flexDirection="row"
                alignItems="center"
                backgroundColor="cardBackground"
                borderRadius="md"
                padding="m"
                marginBottom="xs"
                borderWidth={1}
                borderColor="accent"
              >
                <TextInput
                  style={{
                    flex: 1,
                    fontFamily: 'DMSans-Medium',
                    fontSize: 14,
                    color: theme.colors.textPrimary,
                    padding: 0,
                  }}
                  placeholder="Task title..."
                  placeholderTextColor={theme.colors.textTertiary}
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                  onSubmitEditing={handleAddTask}
                  onBlur={() => {
                    if (!newTaskTitle.trim()) setIsAddingTask(false);
                  }}
                  autoFocus
                  returnKeyType="done"
                />
              </Box>
            ) : (
              <Pressable onPress={() => setIsAddingTask(true)}>
                <Box
                  flexDirection="row"
                  alignItems="center"
                  padding="m"
                  marginBottom="xs"
                >
                  <Plus size={18} color={theme.colors.accent} />
                  <Text variant="bodySmall" color="accent" style={{ marginLeft: 8 }}>
                    Add task
                  </Text>
                </Box>
              </Pressable>
            )}
          </Box>

          {/* Promote section */}
          <Box paddingHorizontal="xl" paddingTop="xl">
            <Text variant="label" marginBottom="s">
              PROMOTE
            </Text>

            <Pressable onPress={handlePromoteToHabit}>
              <Box
                backgroundColor="cardBackground"
                borderRadius="md"
                padding="md"
                marginBottom="s"
                borderWidth={1}
                borderColor="border"
                flexDirection="row"
                alignItems="center"
              >
                <Text style={{ fontSize: 20, marginRight: 12 }}>{'🏃'}</Text>
                <Box flex={1}>
                  <Text variant="subheading" color="textPrimary">
                    Make this a Habit
                  </Text>
                  <Text variant="bodySmall" color="textTertiary" style={{ fontSize: 12 }}>
                    Track daily behavior linked to this action
                  </Text>
                </Box>
              </Box>
            </Pressable>

            <Pressable onPress={handlePromoteToKR}>
              <Box
                backgroundColor="cardBackground"
                borderRadius="md"
                padding="md"
                marginBottom="s"
                borderWidth={1}
                borderColor="border"
                flexDirection="row"
                alignItems="center"
              >
                <Text style={{ fontSize: 20, marginRight: 12 }}>{'🎯'}</Text>
                <Box flex={1}>
                  <Text variant="subheading" color="textPrimary">
                    Make this a Key Result
                  </Text>
                  <Text variant="bodySmall" color="textTertiary" style={{ fontSize: 12 }}>
                    Set a measurable quarterly target
                  </Text>
                </Box>
              </Box>
            </Pressable>

            <Pressable onPress={handleFocus}>
              <Box
                backgroundColor="cardBackground"
                borderRadius="md"
                padding="md"
                marginBottom="s"
                borderWidth={1}
                borderColor="border"
                flexDirection="row"
                alignItems="center"
              >
                <Text style={{ fontSize: 20, marginRight: 12 }}>{'🍅'}</Text>
                <Box flex={1}>
                  <Text variant="subheading" color="textPrimary">
                    Focus on this
                  </Text>
                  <Text variant="bodySmall" color="textTertiary" style={{ fontSize: 12 }}>
                    Start a pomodoro session
                  </Text>
                </Box>
              </Box>
            </Pressable>
          </Box>
        </ScrollView>

        {/* Habit Promote Bottom Sheet */}
        <BottomSheet
          sheetRef={habitSheetRef}
          onClose={() => {}}
          snapPoints={['60%']}
        >
            <Box padding="xl">
              <Text variant="heading" marginBottom="md">
                Create Habit
              </Text>

              <Input
                label="HABIT NAME"
                placeholder="e.g., Morning workout"
                value={habitName}
                onChangeText={setHabitName}
              />

              <Box marginTop="md">
                <Input
                  label="EMOJI (optional — defaults to 🎯)"
                  placeholder="e.g., 🏋️"
                  value={habitEmoji}
                  onChangeText={setHabitEmoji}
                />
              </Box>

              <Box marginTop="md">
                <Text variant="label" marginBottom="s">
                  FREQUENCY
                </Text>
                <Box flexDirection="row">
                  {FREQUENCY_OPTIONS.map((freq) => (
                    <Box key={freq.value} marginRight="s">
                      <Button
                        label={freq.label}
                        variant={habitFrequency === freq.value ? 'primary' : 'outline'}
                        onPress={() => setHabitFrequency(freq.value)}
                      />
                    </Box>
                  ))}
                </Box>
              </Box>

              <Box marginTop="xl">
                <Button
                  label="Create Habit"
                  onPress={handleCreateHabit}
                  disabled={!habitName.trim()}
                />
              </Box>
            </Box>

        </BottomSheet>

        {/* KR Promote Bottom Sheet */}
        <BottomSheet
          sheetRef={krSheetRef}
          onClose={() => {}}
          snapPoints={['70%']}
        >
            <ScrollView>
              <Box padding="xl">
                <Text variant="heading" marginBottom="md">
                  Create Key Result
                </Text>

                <Input
                  label="KEY RESULT TITLE"
                  placeholder="e.g., Run 100km this quarter"
                  value={krTitle}
                  onChangeText={setKRTitle}
                />

                {/* Objective selector */}
                <Box marginTop="md">
                  <Text variant="label" marginBottom="s">
                    OBJECTIVE
                  </Text>
                  {(objectives ?? []).length === 0 ? (
                    <Text variant="bodySmall" color="textTertiary">
                      No objectives for {currentQuarter}. Create one in Goals first.
                    </Text>
                  ) : (
                    (objectives ?? []).map((obj) => (
                      <Pressable
                        key={obj._id}
                        onPress={() => setKRObjectiveId(obj._id)}
                      >
                        <Box
                          backgroundColor={
                            krObjectiveId === obj._id ? 'accentLight' : 'secondaryBackground'
                          }
                          borderRadius="sm"
                          padding="m"
                          marginBottom="xs"
                          borderWidth={krObjectiveId === obj._id ? 1 : 0}
                          borderColor="accent"
                        >
                          <Text
                            variant="bodySmall"
                            color={krObjectiveId === obj._id ? 'accent' : 'textPrimary'}
                          >
                            {obj.title}
                          </Text>
                        </Box>
                      </Pressable>
                    ))
                  )}
                </Box>

                {/* Tracking type */}
                <Box marginTop="md">
                  <Text variant="label" marginBottom="s">
                    TRACKING
                  </Text>
                  <Box flexDirection="row">
                    {KR_TRACKING_TYPES.map((tt) => (
                      <Box key={tt.value} marginRight="s">
                        <Button
                          label={tt.label}
                          variant={krTrackingType === tt.value ? 'primary' : 'outline'}
                          onPress={() => setKRTrackingType(tt.value)}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>

                {/* Target value (numeric only) */}
                {krTrackingType === 'numeric' && (
                  <Box marginTop="md">
                    <Input
                      label="TARGET VALUE"
                      placeholder="e.g., 100"
                      value={krTargetValue}
                      onChangeText={setKRTargetValue}
                    />
                  </Box>
                )}

                <Box marginTop="xl">
                  <Button
                    label="Create Key Result"
                    onPress={handleCreateKR}
                    disabled={!krTitle.trim() || !krObjectiveId}
                  />
                </Box>
              </Box>
            </ScrollView>

        </BottomSheet>
      </Box>
    </SafeArea>
  );
}
