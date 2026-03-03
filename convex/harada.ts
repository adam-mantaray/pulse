import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Helper: returns 8x8 false array for lazy initialization
function emptyActionsDone(): boolean[][] {
  return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => false));
}

// List all charts for a user
export const list = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("haradaCharts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

// Get a single chart
export const get = query({
  args: { chartId: v.id("haradaCharts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chartId);
  },
});

// Get active chart for user
export const getActive = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("haradaCharts")
      .withIndex("by_user_active", (q) =>
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .first();
  },
});

// Get chart with computed progress stats
export const getWithProgress = query({
  args: { chartId: v.id("haradaCharts") },
  handler: async (ctx, args) => {
    const chart = await ctx.db.get(args.chartId);
    if (!chart) return null;

    const actionsDone = chart.actionsDone ?? emptyActionsDone();
    let actionsFilledCount = 0;
    let actionsDoneCount = 0;
    const subGoalProgress: number[] = [];

    for (let sg = 0; sg < 8; sg++) {
      let sgDone = 0;
      for (let a = 0; a < 8; a++) {
        if (chart.actions[sg]?.[a]?.length > 0) actionsFilledCount++;
        if (actionsDone[sg]?.[a]) {
          actionsDoneCount++;
          sgDone++;
        }
      }
      subGoalProgress.push(sgDone);
    }

    return {
      chart,
      actionsFilledCount,
      actionsDoneCount,
      subGoalProgress,
    };
  },
});

// Create a new chart
export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    mainGoal: v.string(),
  },
  handler: async (ctx, args) => {
    const emptyActions = Array.from({ length: 8 }, () =>
      Array.from({ length: 8 }, () => "")
    );

    // Deactivate all existing charts for this user
    const existing = await ctx.db
      .query("haradaCharts")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const chart of existing) {
      if (chart.isActive) {
        await ctx.db.patch(chart._id, { isActive: false });
      }
    }

    const chartId = await ctx.db.insert("haradaCharts", {
      userId: args.userId,
      title: args.title,
      mainGoal: args.mainGoal,
      subGoals: Array(8).fill(""),
      actions: emptyActions,
      actionsDone: emptyActionsDone(),
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update user's active chart pointer
    await ctx.db.patch(args.userId, { activeHaradaChartId: chartId });

    return chartId;
  },
});

// Set one chart as active, deactivate all others
export const setActive = mutation({
  args: {
    chartId: v.id("haradaCharts"),
  },
  handler: async (ctx, args) => {
    const chart = await ctx.db.get(args.chartId);
    if (!chart) throw new Error("Chart not found");

    // Deactivate all charts for this user
    const userCharts = await ctx.db
      .query("haradaCharts")
      .withIndex("by_user", (q) => q.eq("userId", chart.userId))
      .collect();
    for (const c of userCharts) {
      if (c.isActive) {
        await ctx.db.patch(c._id, { isActive: false });
      }
    }

    // Activate this chart
    await ctx.db.patch(args.chartId, { isActive: true, updatedAt: Date.now() });

    // Update user's active chart pointer
    await ctx.db.patch(chart.userId, { activeHaradaChartId: args.chartId });
  },
});

// Toggle actionsDone[subGoalIndex][actionIndex]
export const toggleActionDone = mutation({
  args: {
    chartId: v.id("haradaCharts"),
    subGoalIndex: v.number(),
    actionIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const chart = await ctx.db.get(args.chartId);
    if (!chart) throw new Error("Chart not found");

    // Lazy-initialize actionsDone
    const actionsDone = chart.actionsDone
      ? chart.actionsDone.map((row) => [...row])
      : emptyActionsDone();

    const newState = !actionsDone[args.subGoalIndex][args.actionIndex];
    actionsDone[args.subGoalIndex][args.actionIndex] = newState;

    await ctx.db.patch(args.chartId, {
      actionsDone,
      updatedAt: Date.now(),
    });

    return newState;
  },
});

// Auto-complete an action (called when linked KR hits 100%)
export const autoCompleteAction = mutation({
  args: {
    chartId: v.id("haradaCharts"),
    subGoalIndex: v.number(),
    actionIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const chart = await ctx.db.get(args.chartId);
    if (!chart) return;

    const actionsDone = chart.actionsDone
      ? chart.actionsDone.map((row) => [...row])
      : emptyActionsDone();

    actionsDone[args.subGoalIndex][args.actionIndex] = true;

    await ctx.db.patch(args.chartId, {
      actionsDone,
      updatedAt: Date.now(),
    });
  },
});

// Update main goal
export const updateMainGoal = mutation({
  args: {
    chartId: v.id("haradaCharts"),
    mainGoal: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.chartId, {
      mainGoal: args.mainGoal,
      updatedAt: Date.now(),
    });
  },
});

// Update a sub-goal
export const updateSubGoal = mutation({
  args: {
    chartId: v.id("haradaCharts"),
    index: v.number(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const chart = await ctx.db.get(args.chartId);
    if (!chart) throw new Error("Chart not found");
    const subGoals = [...chart.subGoals];
    subGoals[args.index] = args.value;
    await ctx.db.patch(args.chartId, {
      subGoals,
      updatedAt: Date.now(),
    });
  },
});

// Update an action cell
export const updateAction = mutation({
  args: {
    chartId: v.id("haradaCharts"),
    subGoalIndex: v.number(),
    actionIndex: v.number(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const chart = await ctx.db.get(args.chartId);
    if (!chart) throw new Error("Chart not found");
    const actions = chart.actions.map((row) => [...row]);
    actions[args.subGoalIndex][args.actionIndex] = args.value;
    await ctx.db.patch(args.chartId, {
      actions,
      updatedAt: Date.now(),
    });
  },
});

// Delete a chart — cascades to haradaTasks
export const remove = mutation({
  args: { chartId: v.id("haradaCharts") },
  handler: async (ctx, args) => {
    // Cascade-delete all tasks belonging to this chart
    const tasks = await ctx.db
      .query("haradaTasks")
      .filter((q) => q.eq(q.field("chartId"), args.chartId))
      .collect();
    for (const task of tasks) {
      await ctx.db.delete(task._id);
    }
    await ctx.db.delete(args.chartId);
  },
});
