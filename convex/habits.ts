import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const createHabit = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    emoji: v.string(),
    frequency: v.union(v.literal("daily"), v.literal("weekdays"), v.literal("custom")),
    customDays: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("habits", {
      ...args,
      currentStreak: 0,
      longestStreak: 0,
      freezesUsed: 0,
      isActive: true,
      createdAt: Date.now(),
    });
  },
});

export const listHabits = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});

export const completeHabit = mutation({
  args: {
    habitId: v.id("habits"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if already completed today
    const existing = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit_date", (q) =>
        q.eq("habitId", args.habitId).eq("date", args.date)
      )
      .first();

    if (existing) {
      // Toggle off - delete completion and decrement streak
      await ctx.db.delete(existing._id);
      const habit = await ctx.db.get(args.habitId);
      if (habit && habit.currentStreak > 0) {
        await ctx.db.patch(args.habitId, {
          currentStreak: habit.currentStreak - 1,
        });
      }
      return { completed: false };
    }

    // Record completion
    await ctx.db.insert("habitCompletions", {
      habitId: args.habitId,
      date: args.date,
      completedAt: Date.now(),
    });

    // Update streak
    const habit = await ctx.db.get(args.habitId);
    if (habit) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startOfYesterday = startOfToday.getTime() - 86400000;
      const startOfTodayTs = startOfToday.getTime();

      // Check if there is a completion for yesterday
      const yesterdayCompletion = await ctx.db
        .query("habitCompletions")
        .filter((q) =>
          q.and(
            q.eq(q.field("habitId"), args.habitId),
            q.gte(q.field("completedAt"), startOfYesterday),
            q.lt(q.field("completedAt"), startOfTodayTs)
          )
        )
        .first();

      const newStreak = yesterdayCompletion ? habit.currentStreak + 1 : 1;
      await ctx.db.patch(args.habitId, {
        currentStreak: newStreak,
        longestStreak: Math.max(habit.longestStreak, newStreak),
      });
    }

    return { completed: true };
  },
});

export const getHabitWithStreak = query({
  args: { habitId: v.id("habits") },
  handler: async (ctx, args) => {
    const habit = await ctx.db.get(args.habitId);
    if (!habit) return null;
    return habit;
  },
});

export const resetMissedStreaks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfYesterday = startOfToday.getTime() - 86400000;
    const startOfTodayTs = startOfToday.getTime();

    const habits = await ctx.db.query("habits").collect();
    for (const habit of habits) {
      if (habit.currentStreak === 0) continue;
      // Check if completed yesterday
      const yesterdayCompletion = await ctx.db
        .query("habitCompletions")
        .filter((q) =>
          q.and(
            q.eq(q.field("habitId"), habit._id),
            q.gte(q.field("completedAt"), startOfYesterday),
            q.lt(q.field("completedAt"), startOfTodayTs)
          )
        )
        .first();
      if (!yesterdayCompletion) {
        await ctx.db.patch(habit._id, { currentStreak: 0 });
      }
    }
  },
});
