import React, { useState, useCallback } from 'react';
import { ScrollView, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { useTheme } from '@shopify/restyle';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, ArrowRight, ChevronRight, Check } from 'lucide-react-native';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { Theme } from '../../../../src/design/theme';
import { Box, Text, SafeArea } from '../../../../src/design/primitives';
import ProgressBar from '../../../../src/components/ProgressBar';

const SUB_COLORS = [
  '#2D5F3F', '#3A7D53', '#4A6B5E', '#5C6B4E',
  '#6B5C3F', '#8B6E4E', '#5C4A35', '#4A5A6B',
];

export default function SubGoalDrillDown() {
  const { chartId, subGoalIndex: subGoalIndexStr } = useLocalSearchParams<{
    chartId: string;
    subGoalIndex: string;
  }>();
  const router = useRouter();
  const theme = useTheme<Theme>();

  const typedChartId = chartId as Id<"haradaCharts">;
  const [currentIndex, setCurrentIndex] = useState(parseInt(subGoalIndexStr ?? '0'));

  const chart = useQuery(api.harada.get, { chartId: typedChartId });
  const toggleActionDone = useMutation(api.harada.toggleActionDone);
  const updateSubGoal = useMutation(api.harada.updateSubGoal);
  const updateAction = useMutation(api.harada.updateAction);

  const [editingSubGoal, setEditingSubGoal] = useState(false);
  const [editSubGoalValue, setEditSubGoalValue] = useState('');
  const [editingAction, setEditingAction] = useState<number | null>(null);
  const [editActionValue, setEditActionValue] = useState('');

  if (!chart) {
    return (
      <SafeArea edges={['top']}>
        <Box flex={1} backgroundColor="mainBackground" justifyContent="center" alignItems="center">
          <Text variant="bodySmall" color="textTertiary">Loading...</Text>
        </Box>
      </SafeArea>
    );
  }

  const subGoalName = chart.subGoals[currentIndex] || `Sub-goal ${currentIndex + 1}`;
  const actions = chart.actions[currentIndex] ?? Array(8).fill('');
  const actionsDone = chart.actionsDone
    ? chart.actionsDone[currentIndex] ?? Array(8).fill(false)
    : Array(8).fill(false);

  const doneCount = actionsDone.filter(Boolean).length;
  const color = SUB_COLORS[currentIndex];

  const handleToggleDone = async (actionIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await toggleActionDone({
      chartId: typedChartId,
      subGoalIndex: currentIndex,
      actionIndex,
    });
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleNext = () => {
    if (currentIndex < 7) setCurrentIndex(currentIndex + 1);
  };

  const handleSaveSubGoal = useCallback(async () => {
    const val = editSubGoalValue.trim();
    await updateSubGoal({ chartId: typedChartId, index: currentIndex, value: val });
    setEditingSubGoal(false);
  }, [editSubGoalValue, currentIndex, typedChartId]);

  const handleSaveAction = useCallback(async () => {
    if (editingAction === null) return;
    const val = editActionValue.trim();
    await updateAction({
      chartId: typedChartId,
      subGoalIndex: currentIndex,
      actionIndex: editingAction,
      value: val,
    });
    setEditingAction(null);
  }, [editingAction, editActionValue, currentIndex, typedChartId]);

  const handleActionPress = (actionIndex: number) => {
    const actionText = actions[actionIndex];
    if (!actionText) {
      // Empty action: allow inline edit
      setEditingAction(actionIndex);
      setEditActionValue('');
      return;
    }
    // Navigate to action detail
    router.push(`/harada/${chartId}/action/${currentIndex}/${actionIndex}` as never);
  };

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
            {editingSubGoal ? (
              <TextInput
                style={{
                  fontFamily: 'Fraunces-SemiBold',
                  fontSize: 20,
                  lineHeight: 26,
                  color: theme.colors.textPrimary,
                  padding: 0,
                }}
                value={editSubGoalValue}
                onChangeText={setEditSubGoalValue}
                onBlur={handleSaveSubGoal}
                onSubmitEditing={handleSaveSubGoal}
                autoFocus
              />
            ) : (
              <Pressable onPress={() => {
                setEditingSubGoal(true);
                setEditSubGoalValue(chart.subGoals[currentIndex] || '');
              }}>
                <Text variant="heading" color="textPrimary" numberOfLines={1}>
                  {subGoalName}
                </Text>
              </Pressable>
            )}
            <Text variant="bodySmall" color="textTertiary">
              {doneCount}/8 done
            </Text>
          </Box>

          {/* Sub-goal color indicator */}
          <Box
            width={12}
            height={12}
            borderRadius="pill"
            style={{ backgroundColor: color }}
            marginLeft="s"
          />
        </Box>

        {/* Progress bar */}
        <Box paddingHorizontal="xl" paddingBottom="md">
          <ProgressBar progress={(doneCount / 8) * 100} />
        </Box>

        {/* Navigation arrows */}
        <Box
          flexDirection="row"
          justifyContent="space-between"
          paddingHorizontal="xl"
          paddingBottom="s"
        >
          <Pressable
            onPress={handlePrev}
            style={{ opacity: currentIndex > 0 ? 1 : 0.3, padding: 4 }}
            disabled={currentIndex === 0}
          >
            <Box flexDirection="row" alignItems="center">
              <ArrowLeft size={16} color={theme.colors.textTertiary} />
              <Text variant="bodySmall" color="textTertiary" style={{ marginLeft: 4 }}>
                {currentIndex > 0
                  ? chart.subGoals[currentIndex - 1] || `Sub-goal ${currentIndex}`
                  : ''}
              </Text>
            </Box>
          </Pressable>
          <Pressable
            onPress={handleNext}
            style={{ opacity: currentIndex < 7 ? 1 : 0.3, padding: 4 }}
            disabled={currentIndex === 7}
          >
            <Box flexDirection="row" alignItems="center">
              <Text variant="bodySmall" color="textTertiary" style={{ marginRight: 4 }}>
                {currentIndex < 7
                  ? chart.subGoals[currentIndex + 1] || `Sub-goal ${currentIndex + 2}`
                  : ''}
              </Text>
              <ArrowRight size={16} color={theme.colors.textTertiary} />
            </Box>
          </Pressable>
        </Box>

        {/* Action rows */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <Box paddingHorizontal="xl">
            {Array.from({ length: 8 }).map((_, actionIndex) => {
              const actionText = actions[actionIndex] || '';
              const isDone = actionsDone[actionIndex] ?? false;
              const isEditing = editingAction === actionIndex;

              return (
                <Pressable
                  key={actionIndex}
                  onPress={() => handleActionPress(actionIndex)}
                >
                  <Box
                    flexDirection="row"
                    alignItems="center"
                    backgroundColor="cardBackground"
                    borderRadius="md"
                    padding="md"
                    marginBottom="s"
                    borderWidth={1}
                    borderColor="border"
                    style={{ minHeight: 64 }}
                  >
                    {/* Checkbox */}
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation?.();
                        if (actionText) handleToggleDone(actionIndex);
                      }}
                      style={{ marginRight: 12 }}
                    >
                      <Box
                        width={28}
                        height={28}
                        borderRadius="pill"
                        borderWidth={2}
                        borderColor={isDone ? 'success' : 'border'}
                        backgroundColor={isDone ? 'success' : 'transparent'}
                        alignItems="center"
                        justifyContent="center"
                      >
                        {isDone && <Check size={16} color="#FFFFFF" />}
                      </Box>
                    </Pressable>

                    {/* Action text */}
                    <Box flex={1}>
                      {isEditing ? (
                        <TextInput
                          style={{
                            fontFamily: 'DMSans-Medium',
                            fontSize: 14,
                            color: theme.colors.textPrimary,
                            padding: 0,
                          }}
                          placeholder="Enter action..."
                          placeholderTextColor={theme.colors.textTertiary}
                          value={editActionValue}
                          onChangeText={setEditActionValue}
                          onBlur={handleSaveAction}
                          onSubmitEditing={handleSaveAction}
                          autoFocus
                        />
                      ) : (
                        <Text
                          variant="bodySmall"
                          color={isDone ? 'success' : actionText ? 'textPrimary' : 'textTertiary'}
                          style={{
                            textDecorationLine: isDone ? 'line-through' : 'none',
                            fontSize: 14,
                          }}
                        >
                          {actionText || `Action ${actionIndex + 1} — tap to set`}
                        </Text>
                      )}
                    </Box>

                    {/* Chevron (only for filled actions) */}
                    {actionText.length > 0 && !isEditing && (
                      <ChevronRight size={20} color={theme.colors.textTertiary} />
                    )}
                  </Box>
                </Pressable>
              );
            })}
          </Box>
        </ScrollView>
      </Box>
    </SafeArea>
  );
}
