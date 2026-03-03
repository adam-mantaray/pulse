import React, { useRef, useState } from 'react';
import { ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import BottomSheetComponent from '@gorhom/bottom-sheet';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { useTheme } from '@shopify/restyle';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { Theme } from '../../src/design/theme';
import { Box, Text, SafeArea, Button, Input, BottomSheet } from '../../src/design/primitives';
import ProgressBar from '../../src/components/ProgressBar';
import FAB from '../../src/components/FAB';
import { useAuth } from '../../src/hooks/useAuth';
import { useGoals } from '../../src/hooks/useGoals';

function getQuarterOptions(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const quarters: string[] = [];
  for (let q = 1; q <= 4; q++) {
    quarters.push(`Q${q}-${year}`);
  }
  quarters.push(`Q1-${year + 1}`);
  return quarters;
}

export default function GoalsScreen() {
  const theme = useTheme<Theme>();
  const sheetRef = useRef<BottomSheetComponent>(null);
  const { userId } = useAuth();
  const typedUserId = userId as Id<"users"> | null;

  const quarters = getQuarterOptions();
  const [selectedQuarter, setSelectedQuarter] = useState(() => {
    const now = new Date();
    const q = Math.ceil((now.getMonth() + 1) / 3);
    return `Q${q}-${now.getFullYear()}`;
  });

  const { objectives, createObjective, createKeyResult, isLoading } = useGoals(typedUserId, selectedQuarter);
  const [expandedObjective, setExpandedObjective] = useState<string | null>(null);
  const [sheetMode, setSheetMode] = useState<'objective' | 'keyResult'>('objective');
  const [newTitle, setNewTitle] = useState('');
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<Id<"objectives"> | null>(null);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    if (sheetMode === 'objective') {
      await createObjective(newTitle.trim());
    } else if (selectedObjectiveId) {
      await createKeyResult(selectedObjectiveId, newTitle.trim());
    }
    setNewTitle('');
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
          <Box paddingHorizontal="xl" paddingTop="md" paddingBottom="s">
            <Text variant="heading" color="textPrimary">
              Goals & OKRs
            </Text>
          </Box>

          {/* Quarter Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
          >
            {quarters.map((q) => (
              <Pressable key={q} onPress={() => setSelectedQuarter(q)}>
                <Box
                  paddingHorizontal="md"
                  paddingVertical="s"
                  borderRadius="pill"
                  backgroundColor={selectedQuarter === q ? 'accent' : 'secondaryBackground'}
                  marginRight="s"
                >
                  <Text
                    variant="bodySmall"
                    color={selectedQuarter === q ? 'textOnAccent' : 'textSecondary'}
                  >
                    {q}
                  </Text>
                </Box>
              </Pressable>
            ))}
          </ScrollView>

          {/* Objectives List */}
          <Box paddingHorizontal="xl">
            {isLoading ? (
              <Box padding="xl" alignItems="center">
                <Text variant="bodySmall" color="textTertiary">Loading goals...</Text>
              </Box>
            ) : objectives.length === 0 ? (
              <Box
                backgroundColor="cardBackground"
                borderRadius="md"
                padding="xl"
                alignItems="center"
                borderWidth={1}
                borderColor="border"
              >
                <Text variant="subheading" color="textPrimary" style={{ textAlign: 'center' }}>
                  No goals for {selectedQuarter}
                </Text>
                <Text variant="bodySmall" color="textTertiary" style={{ textAlign: 'center', marginTop: 4 }}>
                  Tap + to set your first objective
                </Text>
              </Box>
            ) : (
              objectives.map((objective) => (
                <ObjectiveCard
                  key={objective._id}
                  objective={objective}
                  isExpanded={expandedObjective === objective._id}
                  onToggle={() =>
                    setExpandedObjective(
                      expandedObjective === objective._id ? null : objective._id
                    )
                  }
                  onAddKeyResult={() => {
                    setSheetMode('keyResult');
                    setSelectedObjectiveId(objective._id);
                    setNewTitle('');
                    sheetRef.current?.snapToIndex(0);
                  }}
                />
              ))
            )}
          </Box>
        </ScrollView>

        {/* FAB */}
        <FAB
          onPress={() => {
            setSheetMode('objective');
            setNewTitle('');
            sheetRef.current?.snapToIndex(0);
          }}
        />

        {/* Create Bottom Sheet */}
        <BottomSheet
          sheetRef={sheetRef}
          onClose={() => {}}
          snapPoints={['40%']}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
          >
            <Box padding="xl">
              <Text variant="heading" marginBottom="md">
                {sheetMode === 'objective' ? 'New Objective' : 'New Key Result'}
              </Text>
              <Input
                label="TITLE"
                placeholder={sheetMode === 'objective' ? 'e.g., Launch Pulse MVP' : 'e.g., App in TestFlight by April'}
                value={newTitle}
                onChangeText={setNewTitle}
              />
              <Box marginTop="xl">
                <Button
                  label="Create"
                  onPress={handleCreate}
                  disabled={!newTitle.trim()}
                />
              </Box>
            </Box>
          </KeyboardAvoidingView>
        </BottomSheet>
      </Box>
    </SafeArea>
  );
}

// Sub-component for objective cards
interface ObjectiveCardProps {
  objective: {
    _id: Id<"objectives">;
    title: string;
    progress: number;
    status: string;
  };
  isExpanded: boolean;
  onToggle: () => void;
  onAddKeyResult: () => void;
}

function ObjectiveCard({ objective, isExpanded, onToggle, onAddKeyResult }: ObjectiveCardProps) {
  const theme = useTheme<Theme>();

  // Query key results for this objective
  const keyResults = useQuery(api.keyResults.listKeyResults, {
    objectiveId: objective._id,
  });

  return (
    <Box
      backgroundColor="cardBackground"
      borderRadius="md"
      borderWidth={1}
      borderColor="border"
      marginBottom="m"
      overflow="hidden"
    >
      {/* Objective Header */}
      <Pressable onPress={onToggle}>
        <Box padding="md" flexDirection="row" alignItems="center">
          {isExpanded ? (
            <ChevronDown size={20} color={theme.colors.textTertiary} />
          ) : (
            <ChevronRight size={20} color={theme.colors.textTertiary} />
          )}
          <Box flex={1} marginLeft="s">
            <Text variant="subheading" color="textPrimary">
              {objective.title}
            </Text>
            <Box marginTop="s">
              <ProgressBar progress={objective.progress} />
            </Box>
          </Box>
          <Text variant="bodySmall" color="accent" marginLeft="s">
            {Math.round(objective.progress)}%
          </Text>
        </Box>
      </Pressable>

      {/* Expanded Key Results */}
      {isExpanded && (
        <Box paddingHorizontal="md" paddingBottom="md">
          {keyResults === undefined ? (
            <Text variant="bodySmall" color="textTertiary" marginLeft="xl">
              Loading...
            </Text>
          ) : keyResults.length === 0 ? (
            <Text variant="bodySmall" color="textTertiary" marginLeft="xl">
              No key results yet
            </Text>
          ) : (
            keyResults.map((kr) => (
              <Box
                key={kr._id}
                marginLeft="xl"
                marginTop="s"
                padding="m"
                backgroundColor="secondaryBackground"
                borderRadius="sm"
              >
                <Text variant="bodySmall" color="textPrimary">
                  {kr.title}
                </Text>
                <Box marginTop="xs" flexDirection="row" alignItems="center">
                  <Box flex={1}>
                    <ProgressBar progress={kr.progress} height={4} />
                  </Box>
                  <Text variant="bodySmall" color="textTertiary" marginLeft="s" style={{ fontSize: 11 }}>
                    {Math.round(kr.progress)}%
                  </Text>
                </Box>
              </Box>
            ))
          )}
          <Pressable onPress={onAddKeyResult}>
            <Box marginLeft="xl" marginTop="m">
              <Text variant="bodySmall" color="accent">
                + Add Key Result
              </Text>
            </Box>
          </Pressable>
        </Box>
      )}
    </Box>
  );
}
