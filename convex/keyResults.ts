import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createKeyResult = mutation({
  args: {
    objectiveId: v.id("objectives"),
    title: v.string(),
    targetValue: v.optional(v.number()),
    linearProjectId: v.optional(v.string()),
    manualTracking: v.optional(v.boolean()),
    trackingType: v.optional(
      v.union(v.literal("numeric"), v.literal("linear"), v.literal("manual"))
    ),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("keyResults", {
      objectiveId: args.objectiveId,
      title: args.title,
      trackingType: args.trackingType,
      targetValue: args.targetValue,
      currentValue: 0,
      progress: 0,
      linearProjectId: args.linearProjectId,
      manualTracking: args.manualTracking,
      dueDate: args.dueDate,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const createFromHarada = mutation({
  args: {
    objectiveId: v.id("objectives"),
    title: v.string(),
    trackingType: v.union(
      v.literal("numeric"),
      v.literal("linear"),
      v.literal("manual"),
    ),
    targetValue: v.optional(v.number()),
    haradaChartId: v.id("haradaCharts"),
    haradaSubGoalIndex: v.number(),
    haradaActionIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("keyResults", {
      objectiveId: args.objectiveId,
      title: args.title,
      trackingType: args.trackingType,
      targetValue: args.targetValue,
      currentValue: 0,
      progress: 0,
      haradaChartId: args.haradaChartId,
      haradaSubGoalIndex: args.haradaSubGoalIndex,
      haradaActionIndex: args.haradaActionIndex,
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
    const kr = await ctx.db.get(args.keyResultId);
    if (!kr) throw new Error("Key result not found");

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

    // Auto-complete linked Harada action when KR hits 100%
    if (
      args.progress >= 100 &&
      kr.haradaChartId &&
      kr.haradaSubGoalIndex !== undefined &&
      kr.haradaActionIndex !== undefined
    ) {
      const chart = await ctx.db.get(kr.haradaChartId);
      if (chart) {
        const actionsDone = chart.actionsDone
          ? chart.actionsDone.map((row) => [...row])
          : Array.from({ length: 8 }, () =>
              Array.from({ length: 8 }, () => false)
            );
        actionsDone[kr.haradaSubGoalIndex][kr.haradaActionIndex] = true;
        await ctx.db.patch(kr.haradaChartId, {
          actionsDone,
          updatedAt: Date.now(),
        });
      }
    }
  },
});

export const updateKeyResultManual = mutation({
  args: {
    keyResultId: v.id("keyResults"),
    currentValue: v.number(),
  },
  handler: async (ctx, args) => {
    const kr = await ctx.db.get(args.keyResultId);
    if (!kr) throw new Error("Key result not found");

    // Support both legacy manualTracking and new trackingType
    const isManual = kr.trackingType === "manual" || kr.manualTracking;
    if (!isManual) {
      throw new Error("Key result is not manually tracked");
    }

    const progress = kr.targetValue
      ? Math.min(100, (args.currentValue / kr.targetValue) * 100)
      : 0;

    await ctx.db.patch(args.keyResultId, {
      currentValue: args.currentValue,
      progress,
      updatedAt: Date.now(),
    });

    // Auto-complete linked Harada action when KR hits 100%
    if (
      progress >= 100 &&
      kr.haradaChartId &&
      kr.haradaSubGoalIndex !== undefined &&
      kr.haradaActionIndex !== undefined
    ) {
      const chart = await ctx.db.get(kr.haradaChartId);
      if (chart) {
        const actionsDone = chart.actionsDone
          ? chart.actionsDone.map((row) => [...row])
          : Array.from({ length: 8 }, () =>
              Array.from({ length: 8 }, () => false)
            );
        actionsDone[kr.haradaSubGoalIndex][kr.haradaActionIndex] = true;
        await ctx.db.patch(kr.haradaChartId, {
          actionsDone,
          updatedAt: Date.now(),
        });
      }
    }
  },
});

// Toggle manual KR done/undone (for KRs with trackingType "manual" and no numeric target)
export const toggleManualDone = mutation({
  args: {
    keyResultId: v.id("keyResults"),
  },
  handler: async (ctx, args) => {
    const kr = await ctx.db.get(args.keyResultId);
    if (!kr) throw new Error("Key result not found");

    const newProgress = kr.progress >= 100 ? 0 : 100;

    await ctx.db.patch(args.keyResultId, {
      progress: newProgress,
      updatedAt: Date.now(),
    });

    // Auto-complete linked Harada action when KR hits 100%
    if (
      newProgress >= 100 &&
      kr.haradaChartId &&
      kr.haradaSubGoalIndex !== undefined &&
      kr.haradaActionIndex !== undefined
    ) {
      const chart = await ctx.db.get(kr.haradaChartId);
      if (chart) {
        const actionsDone = chart.actionsDone
          ? chart.actionsDone.map((row) => [...row])
          : Array.from({ length: 8 }, () =>
              Array.from({ length: 8 }, () => false)
            );
        actionsDone[kr.haradaSubGoalIndex][kr.haradaActionIndex] = true;
        await ctx.db.patch(kr.haradaChartId, {
          actionsDone,
          updatedAt: Date.now(),
        });
      }
    }

    return newProgress >= 100;
  },
});
