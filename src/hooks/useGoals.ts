import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export function useGoals(userId: Id<"users"> | null, quarter: string) {
  // objectives now includes nested keyResults and calculated progress
  const objectives = useQuery(
    api.objectives.listObjectives,
    userId ? { userId, quarter } : "skip"
  );

  const createObjectiveMutation = useMutation(api.objectives.createObjective);
  const createKeyResultMutation = useMutation(api.keyResults.createKeyResult);
  const updateManualMutation = useMutation(api.keyResults.updateKeyResultManual);

  const createObjective = async (title: string) => {
    if (!userId) return;
    return await createObjectiveMutation({ userId, title, quarter });
  };

  const createKeyResult = async (
    objectiveId: Id<"objectives">,
    title: string,
    options?: {
      targetValue?: number;
      linearProjectId?: string;
      dueDate?: number;
      trackingType?: 'numeric' | 'linear' | 'manual';
    }
  ) => {
    // Determine tracking type: explicit > inferred from options
    const trackingType = options?.trackingType
      ?? (options?.linearProjectId ? 'linear' as const : undefined)
      ?? (options?.targetValue ? 'numeric' as const : 'manual' as const);

    return await createKeyResultMutation({
      objectiveId,
      title,
      trackingType,
      manualTracking: trackingType === 'manual',
      targetValue: trackingType === 'numeric' ? (options?.targetValue ?? 100) : undefined,
      linearProjectId: options?.linearProjectId,
      dueDate: options?.dueDate,
    });
  };

  const updateManualProgress = async (
    keyResultId: Id<"keyResults">,
    currentValue: number
  ) => {
    return await updateManualMutation({ keyResultId, currentValue });
  };

  return {
    objectives: objectives ?? [],
    createObjective,
    createKeyResult,
    updateManualProgress,
    isLoading: objectives === undefined,
  };
}
