import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const recordCompletion = mutation({
  args: {
    habitId: v.id("habits"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit_date", (q) =>
        q.eq("habitId", args.habitId).eq("date", args.date)
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("habitCompletions", {
      habitId: args.habitId,
      date: args.date,
      completedAt: Date.now(),
    });
  },
});

export const getCompletionsForDate = query({
  args: {
    habitIds: v.array(v.id("habits")),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const completions = [];
    for (const habitId of args.habitIds) {
      const completion = await ctx.db
        .query("habitCompletions")
        .withIndex("by_habit_date", (q) =>
          q.eq("habitId", habitId).eq("date", args.date)
        )
        .first();
      if (completion) {
        completions.push(completion);
      }
    }
    return completions;
  },
});

export const getCompletionsForHabit = query({
  args: { habitId: v.id("habits") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit_date", (q) => q.eq("habitId", args.habitId))
      .collect();
  },
});
