import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listForAction = query({
  args: {
    chartId: v.id("haradaCharts"),
    subGoalIndex: v.number(),
    actionIndex: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("haradaTasks")
      .withIndex("by_chart_action", (q) =>
        q
          .eq("chartId", args.chartId)
          .eq("subGoalIndex", args.subGoalIndex)
          .eq("actionIndex", args.actionIndex)
      )
      .collect();
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    chartId: v.id("haradaCharts"),
    subGoalIndex: v.number(),
    actionIndex: v.number(),
    title: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Determine sort order: append after existing tasks
    const existing = await ctx.db
      .query("haradaTasks")
      .withIndex("by_chart_action", (q) =>
        q
          .eq("chartId", args.chartId)
          .eq("subGoalIndex", args.subGoalIndex)
          .eq("actionIndex", args.actionIndex)
      )
      .collect();

    const maxSort = existing.reduce(
      (max, t) => Math.max(max, t.sortOrder),
      -1
    );

    const now = Date.now();
    return await ctx.db.insert("haradaTasks", {
      userId: args.userId,
      chartId: args.chartId,
      subGoalIndex: args.subGoalIndex,
      actionIndex: args.actionIndex,
      title: args.title,
      notes: args.notes,
      trackingType: "manual",
      status: "todo",
      sortOrder: maxSort + 1,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    taskId: v.id("haradaTasks"),
    title: v.optional(v.string()),
    notes: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("todo"),
        v.literal("in_progress"),
        v.literal("fleshing_out"),
        v.literal("pending_review"),
        v.literal("approved"),
        v.literal("executing"),
        v.literal("done"),
      )
    ),
    trackingType: v.optional(
      v.union(
        v.literal("manual"),
        v.literal("linear"),
        v.literal("agent"),
      )
    ),
  },
  handler: async (ctx, args) => {
    const { taskId, ...fields } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (fields.title !== undefined) patch.title = fields.title;
    if (fields.notes !== undefined) patch.notes = fields.notes;
    if (fields.status !== undefined) patch.status = fields.status;
    if (fields.trackingType !== undefined) patch.trackingType = fields.trackingType;
    await ctx.db.patch(taskId, patch);
  },
});

export const remove = mutation({
  args: { taskId: v.id("haradaTasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.taskId);
  },
});

export const markDone = mutation({
  args: { taskId: v.id("haradaTasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");

    await ctx.db.patch(args.taskId, {
      status: "done",
      completedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Check if all tasks under this action are done
    const siblings = await ctx.db
      .query("haradaTasks")
      .withIndex("by_chart_action", (q) =>
        q
          .eq("chartId", task.chartId)
          .eq("subGoalIndex", task.subGoalIndex)
          .eq("actionIndex", task.actionIndex)
      )
      .collect();

    const allDone = siblings.every(
      (t) => t._id.toString() === args.taskId.toString() ? true : t.status === "done"
    );

    if (allDone && siblings.length > 0) {
      // Auto-mark the parent action as done
      const chart = await ctx.db.get(task.chartId);
      if (chart) {
        const actionsDone = chart.actionsDone
          ? chart.actionsDone.map((row) => [...row])
          : Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => false));

        actionsDone[task.subGoalIndex][task.actionIndex] = true;
        await ctx.db.patch(task.chartId, {
          actionsDone,
          updatedAt: Date.now(),
        });
      }
    }
  },
});
