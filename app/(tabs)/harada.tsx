import React, { useRef, useState, useCallback } from 'react';
import {
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import BottomSheetComponent from '@gorhom/bottom-sheet';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useTheme } from '@shopify/restyle';
import { useRouter } from 'expo-router';
import { Theme } from '../../src/design/theme';
import { Box, Text, SafeArea, Button, Input, BottomSheet } from '../../src/design/primitives';
import FAB from '../../src/components/FAB';
import { useAuth } from '../../src/hooks/useAuth';
import { ArrowLeft } from 'lucide-react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = 8;
const CELL_GAP = 2;
const GRID_SIZE = SCREEN_WIDTH - GRID_PADDING * 2;
const CELL_SIZE = (GRID_SIZE - CELL_GAP * 8) / 9;

// Sub-goal colors (muted earth tones matching Pulse theme)
const SUB_COLORS = [
  '#2D5F3F', '#3A7D53', '#4A6B5E', '#5C6B4E',
  '#6B5C3F', '#8B6E4E', '#5C4A35', '#4A5A6B',
];

// Position map: which 3x3 block each sub-goal occupies
const BLOCK_POSITIONS: Array<{ row: number; col: number }> = [
  { row: 0, col: 0 },
  { row: 0, col: 1 },
  { row: 0, col: 2 },
  { row: 1, col: 0 },
  { row: 1, col: 2 },
  { row: 2, col: 0 },
  { row: 2, col: 1 },
  { row: 2, col: 2 },
];

// Within a 3x3 block, surrounding 8 cells are the actions
const ACTION_OFFSETS = [
  { r: 0, c: 0 },
  { r: 0, c: 1 },
  { r: 0, c: 2 },
  { r: 1, c: 0 },
  { r: 1, c: 2 },
  { r: 2, c: 0 },
  { r: 2, c: 1 },
  { r: 2, c: 2 },
];

const CENTER_OFFSETS = ACTION_OFFSETS;

type ChartData = {
  _id: Id<"haradaCharts">;
  mainGoal: string;
  subGoals: string[];
  actions: string[][];
  actionsDone?: boolean[][];
  isActive?: boolean;
  title: string;
};

function MandalaGrid({
  chart,
  onSubGoalPress,
}: {
  chart: ChartData;
  onSubGoalPress: (subGoalIndex: number) => void;
}) {
  const theme = useTheme<Theme>();
  const updateMainGoal = useMutation(api.harada.updateMainGoal);
  const updateSubGoal = useMutation(api.harada.updateSubGoal);
  const updateAction = useMutation(api.harada.updateAction);

  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const actionsDone = chart.actionsDone ?? Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => false));

  const handleCellPress = (key: string, currentValue: string, subGoalIndex?: number) => {
    // If tapping a sub-goal center cell in a surrounding block, navigate to drill-down
    if (key.startsWith('sub-') && !key.startsWith('sub-center-') && subGoalIndex !== undefined) {
      onSubGoalPress(subGoalIndex);
      return;
    }
    setEditingCell(key);
    setEditValue(currentValue);
  };

  const handleSave = useCallback(async () => {
    if (!editingCell) return;
    const val = editValue.trim();

    if (editingCell === 'main') {
      await updateMainGoal({ chartId: chart._id, mainGoal: val });
    } else if (editingCell.startsWith('sub-center-')) {
      const idx = parseInt(editingCell.split('-')[2]);
      await updateSubGoal({ chartId: chart._id, index: idx, value: val });
    } else if (editingCell.startsWith('action-')) {
      const parts = editingCell.split('-');
      const si = parseInt(parts[1]);
      const ai = parseInt(parts[2]);
      await updateAction({ chartId: chart._id, subGoalIndex: si, actionIndex: ai, value: val });
    }
    setEditingCell(null);
  }, [editingCell, editValue, chart._id]);

  const renderCell = (gridRow: number, gridCol: number) => {
    const blockRow = Math.floor(gridRow / 3);
    const blockCol = Math.floor(gridCol / 3);
    const localRow = gridRow % 3;
    const localCol = gridCol % 3;
    const isCenter = localRow === 1 && localCol === 1;

    let cellKey = '';
    let cellValue = '';
    let bgColor: string = theme.colors.cardBackground;
    let textColor: string = theme.colors.textPrimary;
    let isBold = false;
    let subGoalIdx: number | undefined;
    let isDone = false;

    if (blockRow === 1 && blockCol === 1) {
      // Center block: main goal + 8 sub-goals
      if (isCenter) {
        cellKey = 'main';
        cellValue = chart.mainGoal;
        bgColor = theme.colors.accent;
        textColor = '#FFFFFF';
        isBold = true;
      } else {
        const offsetIdx = CENTER_OFFSETS.findIndex(
          (o) => o.r === localRow && o.c === localCol
        );
        if (offsetIdx >= 0) {
          cellKey = `sub-center-${offsetIdx}`;
          cellValue = chart.subGoals[offsetIdx] || '';
          bgColor = SUB_COLORS[offsetIdx];
          textColor = '#FFFFFF';
          isBold = true;
        }
      }
    } else {
      // Surrounding blocks: sub-goal center + 8 actions
      let subIdx = -1;
      for (let i = 0; i < BLOCK_POSITIONS.length; i++) {
        if (BLOCK_POSITIONS[i].row === blockRow && BLOCK_POSITIONS[i].col === blockCol) {
          subIdx = i;
          break;
        }
      }

      if (subIdx >= 0) {
        if (isCenter) {
          cellKey = `sub-${subIdx}`;
          cellValue = chart.subGoals[subIdx] || '';
          bgColor = SUB_COLORS[subIdx];
          textColor = '#FFFFFF';
          isBold = true;
          subGoalIdx = subIdx;
        } else {
          const actionIdx = ACTION_OFFSETS.findIndex(
            (o) => o.r === localRow && o.c === localCol
          );
          if (actionIdx >= 0) {
            cellKey = `action-${subIdx}-${actionIdx}`;
            cellValue = chart.actions[subIdx]?.[actionIdx] || '';
            isDone = actionsDone[subIdx]?.[actionIdx] ?? false;
            bgColor = isDone
              ? `${SUB_COLORS[subIdx]}40`
              : `${SUB_COLORS[subIdx]}18`;
            textColor = isDone
              ? theme.colors.success
              : theme.colors.textPrimary;
          }
        }
      }
    }

    const isEditing = editingCell === cellKey;

    return (
      <Pressable
        key={`${gridRow}-${gridCol}`}
        onPress={() => handleCellPress(cellKey, cellValue, subGoalIdx)}
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          margin: CELL_GAP / 2,
          backgroundColor: bgColor,
          borderRadius: 4,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 2,
          borderWidth: isEditing ? 2 : 0,
          borderColor: theme.colors.accent,
        }}
      >
        {isEditing ? (
          <TextInput
            style={{
              width: '100%',
              height: '100%',
              textAlign: 'center',
              fontSize: isBold ? 8 : 7,
              fontFamily: isBold ? 'DMSans-Bold' : 'DMSans-Regular',
              color: textColor,
              padding: 1,
            }}
            value={editValue}
            onChangeText={setEditValue}
            onBlur={handleSave}
            onSubmitEditing={handleSave}
            autoFocus
            multiline
            blurOnSubmit
          />
        ) : (
          <Text
            style={{
              fontSize: isBold ? 8 : 7,
              fontFamily: isBold ? 'DMSans-Bold' : 'DMSans-Regular',
              color: textColor,
              textAlign: 'center',
              lineHeight: isBold ? 10 : 9,
              textDecorationLine: isDone && !isBold ? 'line-through' : 'none',
            }}
            numberOfLines={3}
          >
            {cellValue || (isBold ? 'Tap to set' : '')}
          </Text>
        )}
      </Pressable>
    );
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: GRID_PADDING }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
      >
        {Array.from({ length: 9 }).map((_, row) => (
          <Box key={row} flexDirection="row">
            {Array.from({ length: 9 }).map((_, col) => renderCell(row, col))}
          </Box>
        ))}
      </ScrollView>
    </ScrollView>
  );
}

function ChartListView({
  charts,
  onSelect,
  onCreate,
  onSetActive,
  onDelete,
}: {
  charts: ChartData[];
  onSelect: (chart: ChartData) => void;
  onCreate: () => void;
  onSetActive: (chartId: Id<"haradaCharts">) => void;
  onDelete: (chartId: Id<"haradaCharts">) => void;
}) {
  const handleLongPress = (chart: ChartData) => {
    const options: Array<{ text: string; style?: 'destructive' | 'cancel'; onPress?: () => void }> = [];
    if (!chart.isActive) {
      options.push({
        text: 'Set as Active',
        onPress: () => onSetActive(chart._id),
      });
    }
    options.push({
      text: 'Delete',
      style: 'destructive',
      onPress: () => {
        Alert.alert(
          'Delete Chart',
          `Are you sure you want to delete "${chart.title}"?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(chart._id) },
          ]
        );
      },
    });
    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert(chart.title, undefined, options);
  };

  return (
    <SafeArea edges={['top']}>
      <Box flex={1} backgroundColor="mainBackground">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <Box paddingHorizontal="xl" paddingTop="md" paddingBottom="md">
            <Text variant="heading" color="textPrimary">
              Vision
            </Text>
            <Text variant="bodySmall" color="textTertiary">
              Harada Method — Open Window 64
            </Text>
          </Box>

          <Box paddingHorizontal="xl">
            {charts.length === 0 ? (
              <Box
                backgroundColor="cardBackground"
                borderRadius="md"
                padding="xl"
                alignItems="center"
                borderWidth={1}
                borderColor="border"
              >
                <Text variant="subheading" color="textPrimary" style={{ textAlign: 'center' }}>
                  Create your first vision chart
                </Text>
                <Text
                  variant="bodySmall"
                  color="textTertiary"
                  style={{ textAlign: 'center', marginTop: 4 }}
                >
                  Break down your main goal into 8 sub-goals and 64 actionable steps
                </Text>
              </Box>
            ) : (
              charts.map((chart) => {
                const filledActions = chart.actions
                  .flat()
                  .filter((a) => a.length > 0).length;
                const filledSubGoals = chart.subGoals.filter((s) => s.length > 0).length;
                const actionsDone = chart.actionsDone ?? [];
                const doneCount = actionsDone.flat().filter(Boolean).length;

                return (
                  <Pressable
                    key={chart._id}
                    onPress={() => onSelect(chart)}
                    onLongPress={() => handleLongPress(chart)}
                  >
                    <Box
                      backgroundColor="cardBackground"
                      borderRadius="md"
                      padding="md"
                      borderWidth={1}
                      borderColor={chart.isActive ? 'accent' : 'border'}
                      marginBottom="m"
                    >
                      <Box flexDirection="row" alignItems="center" justifyContent="space-between">
                        <Box flex={1}>
                          <Text variant="subheading" color="textPrimary">
                            {chart.title}
                          </Text>
                        </Box>
                        {chart.isActive && (
                          <Box
                            backgroundColor="accentLight"
                            paddingHorizontal="s"
                            paddingVertical="xs"
                            borderRadius="sm"
                          >
                            <Text variant="bodySmall" color="accent" style={{ fontSize: 11 }}>
                              Active
                            </Text>
                          </Box>
                        )}
                      </Box>
                      <Text variant="bodySmall" color="accent" marginTop="xs" numberOfLines={1}>
                        {chart.mainGoal || 'No main goal set'}
                      </Text>
                      <Box flexDirection="row" marginTop="s" gap="md">
                        <Text variant="bodySmall" color="textTertiary" style={{ fontSize: 12 }}>
                          {filledSubGoals}/8 sub-goals
                        </Text>
                        <Text variant="bodySmall" color="textTertiary" style={{ fontSize: 12 }}>
                          {filledActions}/64 actions
                        </Text>
                        {doneCount > 0 && (
                          <Text variant="bodySmall" color="success" style={{ fontSize: 12 }}>
                            {doneCount} done
                          </Text>
                        )}
                      </Box>
                    </Box>
                  </Pressable>
                );
              })
            )}
          </Box>
        </ScrollView>
        <FAB onPress={onCreate} />
      </Box>
    </SafeArea>
  );
}

function ChartDetailView({
  chart,
  onBack,
}: {
  chart: ChartData;
  onBack: () => void;
}) {
  const theme = useTheme<Theme>();
  const router = useRouter();

  // Re-fetch for real-time updates
  const liveChart = useQuery(api.harada.get, { chartId: chart._id });
  const displayChart = liveChart ?? chart;

  const filledActions = displayChart.actions
    .flat()
    .filter((a: string) => a.length > 0).length;
  const actionsDone = (displayChart as ChartData).actionsDone ?? [];
  const doneCount = actionsDone.flat().filter(Boolean).length;

  const handleSubGoalPress = (subGoalIndex: number) => {
    router.push(`/harada/${chart._id}/subgoal/${subGoalIndex}`);
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
          <Pressable onPress={onBack} style={{ marginRight: 12, padding: 4 }}>
            <ArrowLeft size={24} color={theme.colors.textPrimary} />
          </Pressable>
          <Box flex={1}>
            <Text variant="heading" color="textPrimary" numberOfLines={1}>
              {displayChart.title}
            </Text>
            <Text variant="bodySmall" color="textTertiary">
              {doneCount}/64 done · {filledActions}/64 filled
            </Text>
          </Box>
        </Box>

        {/* Mandala Grid */}
        <Box flex={1}>
          <MandalaGrid
            chart={displayChart as ChartData}
            onSubGoalPress={handleSubGoalPress}
          />
        </Box>

        {/* Legend */}
        <Box
          paddingHorizontal="xl"
          paddingVertical="m"
          backgroundColor="cardBackground"
          borderTopWidth={1}
          borderColor="border"
        >
          <Text variant="label" marginBottom="xs">
            TAP SUB-GOAL TO DRILL DOWN · TAP ACTION TO EDIT
          </Text>
          <Box flexDirection="row" flexWrap="wrap" gap="s">
            <Box flexDirection="row" alignItems="center">
              <Box
                width={12}
                height={12}
                borderRadius="sm"
                backgroundColor="accent"
                marginRight="xs"
              />
              <Text variant="bodySmall" color="textTertiary" style={{ fontSize: 11 }}>
                Main Goal
              </Text>
            </Box>
            <Box flexDirection="row" alignItems="center">
              <Box
                width={12}
                height={12}
                borderRadius="sm"
                style={{ backgroundColor: SUB_COLORS[0] }}
                marginRight="xs"
              />
              <Text variant="bodySmall" color="textTertiary" style={{ fontSize: 11 }}>
                Sub-Goals
              </Text>
            </Box>
            <Box flexDirection="row" alignItems="center">
              <Box
                width={12}
                height={12}
                borderRadius="sm"
                style={{ backgroundColor: `${SUB_COLORS[0]}18` }}
                marginRight="xs"
                borderWidth={1}
                borderColor="border"
              />
              <Text variant="bodySmall" color="textTertiary" style={{ fontSize: 11 }}>
                Actions
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </SafeArea>
  );
}

export default function HaradaScreen() {
  const { userId } = useAuth();
  const typedUserId = userId as Id<"users"> | null;
  const sheetRef = useRef<BottomSheetComponent>(null);

  const charts = useQuery(
    api.harada.list,
    typedUserId ? { userId: typedUserId } : "skip"
  );
  const createChart = useMutation(api.harada.create);
  const setActiveMutation = useMutation(api.harada.setActive);
  const removeChart = useMutation(api.harada.remove);

  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newMainGoal, setNewMainGoal] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!newTitle.trim() || !typedUserId || creating) return;
    setCreating(true);
    try {
      const chartId = await createChart({
        userId: typedUserId,
        title: newTitle.trim(),
        mainGoal: newMainGoal.trim(),
      });
      const title = newTitle.trim();
      const mainGoal = newMainGoal.trim();
      setNewTitle('');
      setNewMainGoal('');
      sheetRef.current?.close();
      setSelectedChart({
        _id: chartId,
        title,
        mainGoal,
        subGoals: Array(8).fill(''),
        actions: Array(8).fill(null).map(() => Array(8).fill('')),
        actionsDone: Array(8).fill(null).map(() => Array(8).fill(false)),
        isActive: true,
      });
    } catch (e) {
      Alert.alert('Error', 'Could not create chart. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleSetActive = async (chartId: Id<"haradaCharts">) => {
    await setActiveMutation({ chartId });
  };

  const handleDelete = async (chartId: Id<"haradaCharts">) => {
    await removeChart({ chartId });
  };

  if (selectedChart) {
    return (
      <ChartDetailView
        chart={selectedChart}
        onBack={() => setSelectedChart(null)}
      />
    );
  }

  return (
    <>
      <ChartListView
        charts={(charts ?? []) as ChartData[]}
        onSelect={setSelectedChart}
        onCreate={() => {
          setNewTitle('');
          setNewMainGoal('');
          sheetRef.current?.snapToIndex(0);
        }}
        onSetActive={handleSetActive}
        onDelete={handleDelete}
      />
      <BottomSheet
        sheetRef={sheetRef}
        onClose={() => {}}
        snapPoints={['55%']}
      >
        <Box padding="xl" flex={1}>
          <Text variant="heading" marginBottom="md">
            New Vision Chart
          </Text>

          <Text variant="label" marginBottom="xs">CHART NAME</Text>
          <BottomSheetTextInput
            placeholder="e.g., Life Vision 2026"
            value={newTitle}
            onChangeText={setNewTitle}
            style={{
              borderWidth: 1,
              borderColor: '#D4CFC8',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontFamily: 'DMSans-Regular',
              fontSize: 16,
              color: '#2C2A26',
              backgroundColor: '#FFFFFF',
              marginBottom: 16,
            }}
          />

          <Text variant="label" marginBottom="xs">MAIN GOAL (CENTER)</Text>
          <BottomSheetTextInput
            placeholder="e.g., Build the life I want"
            value={newMainGoal}
            onChangeText={setNewMainGoal}
            style={{
              borderWidth: 1,
              borderColor: '#D4CFC8',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontFamily: 'DMSans-Regular',
              fontSize: 16,
              color: '#2C2A26',
              backgroundColor: '#FFFFFF',
              marginBottom: 24,
            }}
          />

          <Button
            label={creating ? 'Creating…' : 'Create Chart'}
            onPress={handleCreate}
            disabled={!newTitle.trim() || creating}
          />
        </Box>
      </BottomSheet>
    </>
  );
}
