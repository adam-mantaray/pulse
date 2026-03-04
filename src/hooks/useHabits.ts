import { useMemo, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { analytics, EVENTS } from '../lib/analytics';

export function useHabits(userId: Id<"users"> | null) {
  const habits = useQuery(
    api.habits.listWithContext,
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

  const completedHabitIds = useMemo(() => {
    if (!todayCompletions) return new Set<string>();
    return new Set(todayCompletions.map((c) => c.habitId));
  }, [todayCompletions]);

  const MILESTONES = [3, 7, 14, 30, 100];

  const completeHabit = useCallback(async (habitId: Id<"habits">) => {
    const result = await completeHabitMutation({ habitId, date: today });
    const habit = (habits ?? []).find((h) => h._id === habitId);
    if (habit && !completedHabitIds.has(habitId)) {
      analytics.capture(EVENTS.HABIT_TRACKED, {
        habitId: habit._id,
        habitName: habit.name,
      });
      const newStreak = (habit.currentStreak ?? 0) + 1;
      if (MILESTONES.includes(newStreak)) {
        analytics.capture(EVENTS.STREAK_MILESTONE, {
          habitId: habit._id,
          streak: newStreak,
        });
      }
    }
    return result;
  }, [completeHabitMutation, habits, completedHabitIds, today]);

  return {
    habits: habits ?? [],
    todayCompletions: todayCompletions ?? [],
    completedHabitIds,
    completeHabit,
    isLoading: habits === undefined,
  };
}
