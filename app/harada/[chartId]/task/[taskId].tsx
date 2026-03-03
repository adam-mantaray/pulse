import React, { useState } from 'react';
import {
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useAction } from 'convex/react';
import { useTheme } from '@shopify/restyle';
import * as Haptics from 'expo-haptics';
import {
  ArrowLeft,
  Check,
  X,
  Send,
  RotateCcw,
} from 'lucide-react-native';
import { api } from '../../../../convex/_generated/api';
import { Id } from '../../../../convex/_generated/dataModel';
import { Theme } from '../../../../src/design/theme';
import { Box, Text, SafeArea, Button } from '../../../../src/design/primitives';
import { AGENTS, getAgent } from '../../../../src/lib/agents';

type TaskStatus = 'todo' | 'in_progress' | 'fleshing_out' | 'pending_review' | 'approved' | 'executing' | 'done';

export default function TaskDetailScreen() {
  const { taskId } = useLocalSearchParams<{
    chartId: string;
    taskId: string;
  }>();
  const router = useRouter();
  const theme = useTheme<Theme>();

  const typedTaskId = taskId as Id<"haradaTasks">;
  const task = useQuery(api.haradaTasks.getById, { taskId: typedTaskId });

  const updateTask = useMutation(api.haradaTasks.update);
  const markDone = useMutation(api.haradaTasks.markDone);
  const approveTask = useMutation(api.haradaTasks.approve);
  const sendToAgentAction = useAction(api.haradaTasks.sendToAgent);

  // Local state
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [assignmentType, setAssignmentType] = useState<'flesh_out' | 'execute'>('flesh_out');
  const [isSending, setIsSending] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  if (!task) {
    return (
      <SafeArea edges={['top']}>
        <Box flex={1} backgroundColor="mainBackground" justifyContent="center" alignItems="center">
          <ActivityIndicator color={theme.colors.accent} />
        </Box>
      </SafeArea>
    );
  }

  const status: TaskStatus = task.status;
  const agent = task.assignedAgentName ? getAgent(task.assignedAgentName) : null;

  const handleSendToAgent = async () => {
    if (!selectedAgent) return;
    setIsSending(true);
    try {
      await sendToAgentAction({
        taskId: typedTaskId,
        agentName: selectedAgent,
        assignmentType,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Error', 'Failed to send task to agent.');
    } finally {
      setIsSending(false);
    }
  };

  const handleApproveAndExecute = async () => {
    setIsApproving(true);
    try {
      await approveTask({ taskId: typedTaskId });
      // Now send execute instruction to the same agent
      if (task.assignedAgentName) {
        await sendToAgentAction({
          taskId: typedTaskId,
          agentName: task.assignedAgentName,
          assignmentType: 'execute',
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      Alert.alert('Error', 'Failed to approve task.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!feedbackText.trim() || !task.assignedAgentName) return;
    setIsSendingFeedback(true);
    try {
      // Send feedback message to the agent, then reset to fleshing_out
      await sendToAgentAction({
        taskId: typedTaskId,
        agentName: task.assignedAgentName,
        assignmentType: 'flesh_out',
      });
      setShowFeedback(false);
      setFeedbackText('');
    } catch (e) {
      Alert.alert('Error', 'Failed to send feedback.');
    } finally {
      setIsSendingFeedback(false);
    }
  };

  const handleReject = async () => {
    await updateTask({ taskId: typedTaskId, status: 'todo' });
  };

  const handleCancel = async () => {
    await updateTask({ taskId: typedTaskId, status: 'todo' });
  };

  const handleMarkDone = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await markDone({ taskId: typedTaskId });
  };

  const handleReopen = async () => {
    await updateTask({ taskId: typedTaskId, status: 'todo' });
  };

  const handleSaveTitle = async () => {
    if (titleDraft.trim() && titleDraft.trim() !== task.title) {
      await updateTask({ taskId: typedTaskId, title: titleDraft.trim() });
    }
    setEditingTitle(false);
  };

  const handleSaveNotes = async () => {
    if (notesDraft !== (task.notes ?? '')) {
      await updateTask({ taskId: typedTaskId, notes: notesDraft });
    }
    setEditingNotes(false);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
            <Text variant="label" color="textTertiary">
              SUB-TASK
            </Text>
          </Box>
          {/* Status badge */}
          <Box
            backgroundColor={status === 'done' ? 'success' : status === 'pending_review' ? 'warning' : 'accentLight'}
            paddingHorizontal="s"
            paddingVertical="xs"
            borderRadius="sm"
          >
            <Text
              variant="bodySmall"
              color={status === 'done' ? 'textOnAccent' : status === 'pending_review' ? 'textOnAccent' : 'accent'}
              style={{ fontSize: 11 }}
            >
              {status.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </Box>
        </Box>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
        >
          {/* Title */}
          <Box paddingHorizontal="xl" paddingTop="md">
            {editingTitle ? (
              <TextInput
                style={{
                  fontFamily: 'Fraunces-SemiBold',
                  fontSize: 20,
                  lineHeight: 26,
                  color: theme.colors.textPrimary,
                  borderBottomWidth: 2,
                  borderBottomColor: theme.colors.accent,
                  paddingBottom: 4,
                }}
                value={titleDraft}
                onChangeText={setTitleDraft}
                onSubmitEditing={handleSaveTitle}
                onBlur={handleSaveTitle}
                autoFocus
                returnKeyType="done"
              />
            ) : (
              <Pressable
                onPress={() => {
                  if (status === 'todo') {
                    setTitleDraft(task.title);
                    setEditingTitle(true);
                  }
                }}
              >
                <Text variant="heading" color="textPrimary">
                  {task.title}
                </Text>
              </Pressable>
            )}
          </Box>

          {/* ────── STATE 1: Todo ────── */}
          {status === 'todo' && (
            <Box paddingHorizontal="xl" paddingTop="md">
              {/* Notes */}
              <Box marginBottom="md">
                <Text variant="label" marginBottom="xs">
                  NOTES
                </Text>
                {editingNotes ? (
                  <Box
                    backgroundColor="cardBackground"
                    borderRadius="md"
                    padding="m"
                    borderWidth={1}
                    borderColor="accent"
                  >
                    <TextInput
                      style={{
                        fontFamily: 'DMSans-Regular',
                        fontSize: 14,
                        color: theme.colors.textPrimary,
                        minHeight: 80,
                        textAlignVertical: 'top',
                      }}
                      multiline
                      value={notesDraft}
                      onChangeText={setNotesDraft}
                      placeholder="Add context for this task..."
                      placeholderTextColor={theme.colors.textTertiary}
                      onBlur={handleSaveNotes}
                      autoFocus
                    />
                  </Box>
                ) : (
                  <Pressable
                    onPress={() => {
                      setNotesDraft(task.notes ?? '');
                      setEditingNotes(true);
                    }}
                  >
                    <Box
                      backgroundColor="cardBackground"
                      borderRadius="md"
                      padding="m"
                      borderWidth={1}
                      borderColor="border"
                    >
                      <Text variant="bodySmall" color={task.notes ? 'textPrimary' : 'textTertiary'}>
                        {task.notes || 'Tap to add notes...'}
                      </Text>
                    </Box>
                  </Pressable>
                )}
              </Box>

              {/* Assign to agent */}
              <Text variant="label" marginBottom="s">
                ASSIGN TO AGENT
              </Text>
              <Box flexDirection="row" flexWrap="wrap" marginBottom="md">
                {AGENTS.map((a) => (
                  <Pressable
                    key={a.id}
                    onPress={() => setSelectedAgent(selectedAgent === a.id ? null : a.id)}
                    style={{ marginRight: 8, marginBottom: 8 }}
                  >
                    <Box
                      flexDirection="row"
                      alignItems="center"
                      backgroundColor={selectedAgent === a.id ? 'accentLight' : 'cardBackground'}
                      borderRadius="pill"
                      paddingHorizontal="m"
                      paddingVertical="s"
                      borderWidth={selectedAgent === a.id ? 1.5 : 1}
                      borderColor={selectedAgent === a.id ? 'accent' : 'border'}
                    >
                      <Text style={{ fontSize: 16, marginRight: 6 }}>{a.emoji}</Text>
                      <Box>
                        <Text
                          variant="bodySmall"
                          color={selectedAgent === a.id ? 'accent' : 'textPrimary'}
                          style={{ fontSize: 13, lineHeight: 16 }}
                        >
                          {a.name}
                        </Text>
                        <Text variant="bodySmall" color="textTertiary" style={{ fontSize: 10, lineHeight: 12 }}>
                          {a.role}
                        </Text>
                      </Box>
                    </Box>
                  </Pressable>
                ))}
              </Box>

              {/* Assignment type toggle */}
              <Text variant="label" marginBottom="s">
                ASSIGNMENT TYPE
              </Text>
              <Box flexDirection="row" marginBottom="xl">
                <Pressable
                  onPress={() => setAssignmentType('flesh_out')}
                  style={{ flex: 1, marginRight: 8 }}
                >
                  <Box
                    backgroundColor={assignmentType === 'flesh_out' ? 'accentLight' : 'cardBackground'}
                    borderRadius="md"
                    padding="m"
                    borderWidth={assignmentType === 'flesh_out' ? 1.5 : 1}
                    borderColor={assignmentType === 'flesh_out' ? 'accent' : 'border'}
                    alignItems="center"
                  >
                    <Text style={{ fontSize: 20, marginBottom: 4 }}>📋</Text>
                    <Text
                      variant="bodySmall"
                      color={assignmentType === 'flesh_out' ? 'accent' : 'textPrimary'}
                      style={{ fontSize: 13 }}
                    >
                      Flesh Out
                    </Text>
                    <Text variant="bodySmall" color="textTertiary" style={{ fontSize: 10, textAlign: 'center' }}>
                      Write a plan first
                    </Text>
                  </Box>
                </Pressable>
                <Pressable
                  onPress={() => setAssignmentType('execute')}
                  style={{ flex: 1 }}
                >
                  <Box
                    backgroundColor={assignmentType === 'execute' ? 'accentLight' : 'cardBackground'}
                    borderRadius="md"
                    padding="m"
                    borderWidth={assignmentType === 'execute' ? 1.5 : 1}
                    borderColor={assignmentType === 'execute' ? 'accent' : 'border'}
                    alignItems="center"
                  >
                    <Text style={{ fontSize: 20, marginBottom: 4 }}>⚡</Text>
                    <Text
                      variant="bodySmall"
                      color={assignmentType === 'execute' ? 'accent' : 'textPrimary'}
                      style={{ fontSize: 13 }}
                    >
                      Execute Directly
                    </Text>
                    <Text variant="bodySmall" color="textTertiary" style={{ fontSize: 10, textAlign: 'center' }}>
                      Skip planning
                    </Text>
                  </Box>
                </Pressable>
              </Box>

              {/* Action buttons */}
              <Button
                label={isSending ? 'Sending...' : 'Send to Agent'}
                onPress={handleSendToAgent}
                disabled={!selectedAgent || isSending}
              />
              <Box marginTop="s">
                <Button
                  label="Mark Done Manually"
                  variant="outline"
                  onPress={handleMarkDone}
                />
              </Box>
            </Box>
          )}

          {/* ────── STATE 2: Fleshing Out ────── */}
          {status === 'fleshing_out' && agent && (
            <Box paddingHorizontal="xl" paddingTop="xl">
              <Box
                backgroundColor="cardBackground"
                borderRadius="md"
                padding="xl"
                borderWidth={1}
                borderColor="border"
                alignItems="center"
              >
                <Text style={{ fontSize: 32, marginBottom: 12 }}>{agent.emoji}</Text>
                <Text variant="subheading" color="textPrimary" style={{ textAlign: 'center' }}>
                  {agent.name} is writing the plan...
                </Text>
                <Box marginTop="md">
                  <ActivityIndicator color={theme.colors.accent} />
                </Box>
                {task.updatedAt && (
                  <Text variant="bodySmall" color="textTertiary" style={{ marginTop: 12, fontSize: 12 }}>
                    Updated {formatTime(task.updatedAt)}
                  </Text>
                )}
              </Box>
              <Box marginTop="xl">
                <Button
                  label="Cancel"
                  variant="outline"
                  onPress={handleCancel}
                />
              </Box>
            </Box>
          )}

          {/* ────── STATE 3: Pending Review ────── */}
          {status === 'pending_review' && agent && (
            <Box paddingHorizontal="xl" paddingTop="md">
              <Box flexDirection="row" alignItems="center" marginBottom="md">
                <Text style={{ fontSize: 20, marginRight: 8 }}>{agent.emoji}</Text>
                <Text variant="subheading" color="textPrimary">
                  {agent.name} — Plan ready for review
                </Text>
              </Box>

              {/* Plan card */}
              <Box
                backgroundColor="cardBackground"
                borderRadius="md"
                padding="md"
                borderWidth={1}
                borderColor="border"
                marginBottom="md"
              >
                <Text
                  variant="bodySmall"
                  color="textPrimary"
                  style={{ fontFamily: 'DMSans-Regular', fontSize: 14, lineHeight: 22 }}
                >
                  {task.fleshOutPlan ?? 'No plan content.'}
                </Text>
                {task.fleshOutAt && (
                  <Text variant="bodySmall" color="textTertiary" style={{ marginTop: 8, fontSize: 11 }}>
                    Submitted {formatTime(task.fleshOutAt)}
                  </Text>
                )}
              </Box>

              {/* Approve button */}
              <Button
                label={isApproving ? 'Approving...' : 'Approve & Execute'}
                onPress={handleApproveAndExecute}
                disabled={isApproving}
              />

              {/* Request changes */}
              <Box marginTop="s">
                {showFeedback ? (
                  <Box
                    backgroundColor="cardBackground"
                    borderRadius="md"
                    padding="m"
                    borderWidth={1}
                    borderColor="accent"
                  >
                    <TextInput
                      style={{
                        fontFamily: 'DMSans-Regular',
                        fontSize: 14,
                        color: theme.colors.textPrimary,
                        minHeight: 60,
                        textAlignVertical: 'top',
                      }}
                      multiline
                      value={feedbackText}
                      onChangeText={setFeedbackText}
                      placeholder="What changes do you need?"
                      placeholderTextColor={theme.colors.textTertiary}
                      autoFocus
                    />
                    <Box flexDirection="row" justifyContent="flex-end" marginTop="s">
                      <Pressable
                        onPress={() => { setShowFeedback(false); setFeedbackText(''); }}
                        style={{ marginRight: 12, padding: 8 }}
                      >
                        <X size={20} color={theme.colors.textTertiary} />
                      </Pressable>
                      <Pressable
                        onPress={handleRequestChanges}
                        disabled={!feedbackText.trim() || isSendingFeedback}
                        style={{ padding: 8 }}
                      >
                        <Send
                          size={20}
                          color={feedbackText.trim() ? theme.colors.accent : theme.colors.textTertiary}
                        />
                      </Pressable>
                    </Box>
                  </Box>
                ) : (
                  <Button
                    label="Request Changes"
                    variant="outline"
                    onPress={() => setShowFeedback(true)}
                  />
                )}
              </Box>

              {/* Reject */}
              <Box marginTop="s">
                <Button
                  label="Reject"
                  variant="danger"
                  onPress={() => {
                    Alert.alert('Reject Plan', 'Discard this plan and return to todo?', [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Reject', style: 'destructive', onPress: handleReject },
                    ]);
                  }}
                />
              </Box>
            </Box>
          )}

          {/* ────── STATE 4: Approved / Executing ────── */}
          {(status === 'approved' || status === 'executing') && agent && (
            <Box paddingHorizontal="xl" paddingTop="xl">
              <Box
                backgroundColor="cardBackground"
                borderRadius="md"
                padding="xl"
                borderWidth={1}
                borderColor="border"
                alignItems="center"
              >
                <Text style={{ fontSize: 32, marginBottom: 12 }}>{agent.emoji}</Text>
                <Text variant="subheading" color="textPrimary" style={{ textAlign: 'center' }}>
                  {agent.name} is executing this...
                </Text>
                <Box marginTop="md">
                  <ActivityIndicator color={theme.colors.accent} />
                </Box>
                {task.updatedAt && (
                  <Text variant="bodySmall" color="textTertiary" style={{ marginTop: 12, fontSize: 12 }}>
                    Updated {formatTime(task.updatedAt)}
                  </Text>
                )}
              </Box>

              {/* Execution notes if any */}
              {task.executionNotes && (
                <Box marginTop="md">
                  <Text variant="label" marginBottom="xs">
                    PROGRESS
                  </Text>
                  <Box
                    backgroundColor="cardBackground"
                    borderRadius="md"
                    padding="m"
                    borderWidth={1}
                    borderColor="border"
                  >
                    <Text variant="bodySmall" color="textPrimary">
                      {task.executionNotes}
                    </Text>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {/* ────── STATE 5: Done ────── */}
          {status === 'done' && (
            <Box paddingHorizontal="xl" paddingTop="xl">
              <Box
                backgroundColor="cardBackground"
                borderRadius="md"
                padding="xl"
                borderWidth={1}
                borderColor="success"
                alignItems="center"
              >
                <Box
                  width={48}
                  height={48}
                  borderRadius="pill"
                  backgroundColor="success"
                  alignItems="center"
                  justifyContent="center"
                  marginBottom="m"
                >
                  <Check size={28} color="#FFFFFF" />
                </Box>
                <Text variant="subheading" color="textPrimary">
                  Task Complete
                </Text>
                {agent && (
                  <Text variant="bodySmall" color="textTertiary" style={{ marginTop: 4 }}>
                    Completed by {agent.name}
                  </Text>
                )}
                {task.completedAt && (
                  <Text variant="bodySmall" color="textTertiary" style={{ marginTop: 4, fontSize: 12 }}>
                    {formatTime(task.completedAt)}
                  </Text>
                )}
              </Box>

              {/* Completion notes */}
              {task.executionNotes && (
                <Box marginTop="md">
                  <Text variant="label" marginBottom="xs">
                    COMPLETION SUMMARY
                  </Text>
                  <Box
                    backgroundColor="cardBackground"
                    borderRadius="md"
                    padding="m"
                    borderWidth={1}
                    borderColor="border"
                  >
                    <Text variant="bodySmall" color="textPrimary" style={{ lineHeight: 20 }}>
                      {task.executionNotes}
                    </Text>
                  </Box>
                </Box>
              )}

              {/* Reopen */}
              <Box marginTop="xl">
                <Pressable onPress={handleReopen}>
                  <Box flexDirection="row" alignItems="center" justifyContent="center">
                    <RotateCcw size={14} color={theme.colors.textTertiary} />
                    <Text variant="bodySmall" color="textTertiary" style={{ marginLeft: 6 }}>
                      Reopen task
                    </Text>
                  </Box>
                </Pressable>
              </Box>
            </Box>
          )}
        </ScrollView>
      </Box>
    </SafeArea>
  );
}
