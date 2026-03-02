import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createKeyResult = mutation({
  args: {
    objectiveId: v.id("objectives"),
    title: v.string(),
    targetValue: v.optional(v.number()),
    linearProjectId: v.optional(v.string()),
    manualTracking: v.boolean(),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("keyResults", {
      ...args,
      currentValue: 0,
      progress: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listKeyResults = query({
  args: { objectiveId: v.id("objectives") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("keyResults")
      .withIndex("by_objective", (q) => q.eq("objectiveId", args.objectiveId))
      .collect();
  },
});

export const updateKeyResultProgress = mutation({
  args: {
    keyResultId: v.id("keyResults"),
    progress: v.number(),
    completedTasks: v.optional(v.number()),
    totalTasks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {
      progress: args.progress,
      updatedAt: Date.now(),
    };
    if (args.completedTasks !== undefined) {
      patch.currentValue = args.completedTasks;
    }
    if (args.totalTasks !== undefined) {
      patch.targetValue = args.totalTasks;
    }
    await ctx.db.patch(args.keyResultId, patch);
  },
});

export const updateKeyResultManual = mutation({
  args: {
    keyResultId: v.id("keyResults"),
    currentValue: v.number(),
  },
  handler: async (ctx, args) => {
    const kr = await ctx.db.get(args.keyResultId);
    if (!kr || !kr.manualTracking) {
      throw new Error("Key result not found or not manually tracked");
    }
    const progress = kr.targetValue ? Math.min(100, (args.currentValue / kr.targetValue) * 100) : 0;
    await ctx.db.patch(args.keyResultId, {
      currentValue: args.currentValue,
      progress,
      updatedAt: Date.now(),
    });
  },
});
