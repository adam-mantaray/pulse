import { useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

export function useHabits(userId: Id<"users"> | null) {
  const habits = useQuery(
    api.habits.listHabits,
    userId ? { userId } : "skip"
  );

  const habitIds = useMemo(
    () => (habits ?? []).map((h) => h._id),
    [habits]
  );

  const today = new Date().toISOString().split('T')[0];

  const todayCompletions = useQuery(
    api.habitCompletions.getCompletionsForDate,
    habitIds.length > 0 ? { habitIds, date: today } : "skip"
  );

  const completeHabitMutation = useMutation(api.habits.completeHabit);

  const completeHabit = async (habitId: Id<"habits">) => {
    return await completeHabitMutation({ habitId, date: today });
  };

  const completedHabitIds = useMemo(() => {
    if (!todayCompletions) return new Set<string>();
    return new Set(todayCompletions.map((c) => c.habitId));
  }, [todayCompletions]);

  return {
    habits: habits ?? [],
    todayCompletions: todayCompletions ?? [],
    completedHabitIds,
    completeHabit,
    isLoading: habits === undefined,
  };
}
