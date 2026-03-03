import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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

// Create a new chart
export const create = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    mainGoal: v.string(),
  },
  handler: async (ctx, args) => {
    const emptyActions = Array(8).fill(null).map(() => Array(8).fill(""));
    return await ctx.db.insert("haradaCharts", {
      userId: args.userId,
      title: args.title,
      mainGoal: args.mainGoal,
      subGoals: Array(8).fill(""),
      actions: emptyActions,
      createdAt: Date.now(),
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

// Delete a chart
export const remove = mutation({
  args: { chartId: v.id("haradaCharts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.chartId);
  },
});
