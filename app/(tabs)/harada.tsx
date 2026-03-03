import React, { useRef, useState, useCallback } from 'react';
import {
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import BottomSheetComponent from '@gorhom/bottom-sheet';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { useTheme } from '@shopify/restyle';
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
// Layout: 3x3 grid of 3x3 blocks. Center block = main goal + 8 sub-goals.
// Surrounding 8 blocks = one per sub-goal with its 8 actions.
const BLOCK_POSITIONS: Array<{ row: number; col: number }> = [
  { row: 0, col: 0 }, // sub-goal 0 (top-left)
  { row: 0, col: 1 }, // sub-goal 1 (top-center)
  { row: 0, col: 2 }, // sub-goal 2 (top-right)
  { row: 1, col: 0 }, // sub-goal 3 (middle-left)
  // center block is the main goal (row:1, col:1)
  { row: 1, col: 2 }, // sub-goal 4 (middle-right)
  { row: 2, col: 0 }, // sub-goal 5 (bottom-left)
  { row: 2, col: 1 }, // sub-goal 6 (bottom-center)
  { row: 2, col: 2 }, // sub-goal 7 (bottom-right)
];

// Within a 3x3 block, the center cell is the sub-goal label,
// surrounding 8 cells are the actions (clockwise from top-left)
const ACTION_OFFSETS = [
  { r: 0, c: 0 }, // 0: top-left
  { r: 0, c: 1 }, // 1: top-center
  { r: 0, c: 2 }, // 2: top-right
  { r: 1, c: 0 }, // 3: middle-left
  // center = sub-goal
  { r: 1, c: 2 }, // 4: middle-right
  { r: 2, c: 0 }, // 5: bottom-left
  { r: 2, c: 1 }, // 6: bottom-center
  { r: 2, c: 2 }, // 7: bottom-right
];

// Same offsets for center block sub-goals
const CENTER_OFFSETS = ACTION_OFFSETS;

type ChartData = {
  _id: Id<"haradaCharts">;
  mainGoal: string;
  subGoals: string[];
  actions: string[][];
  title: string;
};

function MandalaGrid({ chart }: { chart: ChartData }) {
  const theme = useTheme<Theme>();
  const updateMainGoal = useMutation(api.harada.updateMainGoal);
  const updateSubGoal = useMutation(api.harada.updateSubGoal);
  const updateAction = useMutation(api.harada.updateAction);

  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleCellPress = (key: string, currentValue: string) => {
    setEditingCell(key);
    setEditValue(currentValue);
  };

  const handleSave = useCallback(async () => {
    if (!editingCell) return;
    const val = editValue.trim();

    if (editingCell === 'main') {
      await updateMainGoal({ chartId: chart._id, mainGoal: val });
    } else if (editingCell.startsWith('sub-')) {
      const idx = parseInt(editingCell.split('-')[1]);
      await updateSubGoal({ chartId: chart._id, index: idx, value: val });
    } else if (editingCell.startsWith('action-')) {
      const parts = editingCell.split('-');
      const si = parseInt(parts[1]);
      const ai = parseInt(parts[2]);
      await updateAction({ chartId: chart._id, subGoalIndex: si, actionIndex: ai, value: val });
    }
    setEditingCell(null);
  }, [editingCell, editValue, chart._id]);

  // Build the 9x9 grid
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
          cellKey = `sub-${offsetIdx}`;
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
        } else {
          const actionIdx = ACTION_OFFSETS.findIndex(
            (o) => o.r === localRow && o.c === localCol
          );
          if (actionIdx >= 0) {
            cellKey = `action-${subIdx}-${actionIdx}`;
            cellValue = chart.actions[subIdx]?.[actionIdx] || '';
            bgColor = `${SUB_COLORS[subIdx]}18`;
            textColor = theme.colors.textPrimary;
          }
        }
      }
    }

    const isEditing = editingCell === cellKey;

    return (
      <Pressable
        key={`${gridRow}-${gridCol}`}
        onPress={() => handleCellPress(cellKey, cellValue)}
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
}: {
  charts: ChartData[];
  onSelect: (chart: ChartData) => void;
  onCreate: () => void;
}) {
  return (
    <SafeArea edges={['top']}>
      <Box flex={1} backgroundColor="mainBackground">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <Box paddingHorizontal="xl" paddingTop="md" paddingBottom="md">
            <Text variant="heading" color="textPrimary">
              Harada Method
            </Text>
            <Text variant="bodySmall" color="textTertiary">
              Open Window 64 — Mandala Charts
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
                  No charts yet
                </Text>
                <Text
                  variant="bodySmall"
                  color="textTertiary"
                  style={{ textAlign: 'center', marginTop: 4 }}
                >
                  Create your first Harada mandala chart to break down your main goal into 64 actionable steps
                </Text>
              </Box>
            ) : (
              charts.map((chart) => {
                const filledActions = chart.actions
                  .flat()
                  .filter((a) => a.length > 0).length;
                const filledSubGoals = chart.subGoals.filter((s) => s.length > 0).length;

                return (
                  <Pressable key={chart._id} onPress={() => onSelect(chart)}>
                    <Box
                      backgroundColor="cardBackground"
                      borderRadius="md"
                      padding="md"
                      borderWidth={1}
                      borderColor="border"
                      marginBottom="m"
                    >
                      <Text variant="subheading" color="textPrimary">
                        {chart.title}
                      </Text>
                      <Text variant="bodySmall" color="accent" marginTop="xs">
                        {chart.mainGoal || 'No main goal set'}
                      </Text>
                      <Box flexDirection="row" marginTop="s" gap="md">
                        <Text variant="bodySmall" color="textTertiary" style={{ fontSize: 12 }}>
                          {filledSubGoals}/8 sub-goals
                        </Text>
                        <Text variant="bodySmall" color="textTertiary" style={{ fontSize: 12 }}>
                          {filledActions}/64 actions
                        </Text>
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

  // Re-fetch for real-time updates
  const liveChart = useQuery(api.harada.get, { chartId: chart._id });
  const displayChart = liveChart ?? chart;

  const filledActions = displayChart.actions
    .flat()
    .filter((a) => a.length > 0).length;

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
              {filledActions}/64 actions filled
            </Text>
          </Box>
        </Box>

        {/* Mandala Grid */}
        <Box flex={1}>
          <MandalaGrid chart={displayChart as ChartData} />
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
            TAP ANY CELL TO EDIT
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

  const [selectedChart, setSelectedChart] = useState<ChartData | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newMainGoal, setNewMainGoal] = useState('');

  const handleCreate = async () => {
    if (!newTitle.trim() || !typedUserId) return;
    const chartId = await createChart({
      userId: typedUserId,
      title: newTitle.trim(),
      mainGoal: newMainGoal.trim(),
    });
    setNewTitle('');
    setNewMainGoal('');
    sheetRef.current?.close();

    // Auto-open the new chart
    const newChart: ChartData = {
      _id: chartId,
      title: newTitle.trim(),
      mainGoal: newMainGoal.trim(),
      subGoals: Array(8).fill(''),
      actions: Array(8).fill(null).map(() => Array(8).fill('')),
    };
    setSelectedChart(newChart);
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
      />
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
              New Mandala Chart
            </Text>
            <Input
              label="CHART NAME"
              placeholder="e.g., Q1 2026 Goals"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <Box marginTop="md">
              <Input
                label="MAIN GOAL (CENTER)"
                placeholder="e.g., Ship Pulse MVP"
                value={newMainGoal}
                onChangeText={setNewMainGoal}
              />
            </Box>
            <Box marginTop="xl">
              <Button
                label="Create Chart"
                onPress={handleCreate}
                disabled={!newTitle.trim()}
              />
            </Box>
          </Box>
        </KeyboardAvoidingView>
      </BottomSheet>
    </>
  );
}
