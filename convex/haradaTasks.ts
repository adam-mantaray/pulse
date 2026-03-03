import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

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

export const getById = query({
  args: { taskId: v.id("haradaTasks") },
  handler: async (ctx, args) => ctx.db.get(args.taskId),
});

export const listPendingReview = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("haradaTasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "pending_review"))
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
    assignedAgentName: v.optional(v.string()),
    executionNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { taskId, ...fields } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (fields.title !== undefined) patch.title = fields.title;
    if (fields.notes !== undefined) patch.notes = fields.notes;
    if (fields.status !== undefined) patch.status = fields.status;
    if (fields.trackingType !== undefined) patch.trackingType = fields.trackingType;
    if (fields.assignedAgentName !== undefined) patch.assignedAgentName = fields.assignedAgentName;
    if (fields.executionNotes !== undefined) patch.executionNotes = fields.executionNotes;
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

// Called by agent HTTP endpoint when flesh-out plan is ready
export const receiveFleshOut = mutation({
  args: {
    taskId: v.id("haradaTasks"),
    plan: v.string(),
    agentName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      fleshOutPlan: args.plan,
      fleshOutAt: Date.now(),
      status: "pending_review",
      updatedAt: Date.now(),
    });
    return { status: "pending_review" };
  },
});

// Ahmed approves the plan
export const approve = mutation({
  args: { taskId: v.id("haradaTasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) throw new Error("Task not found");
    await ctx.db.patch(args.taskId, {
      approvedAt: Date.now(),
      status: "approved",
      updatedAt: Date.now(),
    });
    return { status: "approved" };
  },
});

// Called by agent when execution is complete
export const receiveComplete = mutation({
  args: {
    taskId: v.id("haradaTasks"),
    notes: v.string(),
    agentName: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      executionNotes: args.notes,
      completedAt: Date.now(),
      status: "done",
      updatedAt: Date.now(),
    });

    // Check if all tasks under this action are done → auto-mark action done
    const task = await ctx.db.get(args.taskId);
    if (task) {
      const siblings = await ctx.db
        .query("haradaTasks")
        .withIndex("by_chart_action", (q) =>
          q
            .eq("chartId", task.chartId)
            .eq("subGoalIndex", task.subGoalIndex)
            .eq("actionIndex", task.actionIndex)
        )
        .collect();

      const allDone = siblings.every((t) => t.status === "done");
      if (allDone && siblings.length > 0) {
        await ctx.runMutation(api.harada.autoCompleteAction, {
          chartId: task.chartId,
          subGoalIndex: task.subGoalIndex,
          actionIndex: task.actionIndex,
        });
      }
    }
    return { status: "done" };
  },
});

// Send task to agent for flesh-out or execution
export const sendToAgent = action({
  args: {
    taskId: v.id("haradaTasks"),
    agentName: v.string(),
    assignmentType: v.union(v.literal("flesh_out"), v.literal("execute")),
  },
  handler: async (ctx, args) => {
    const task = await ctx.runQuery(api.haradaTasks.getById, { taskId: args.taskId });
    if (!task) throw new Error("Task not found");
    const chart = await ctx.runQuery(api.harada.get, { chartId: task.chartId });
    if (!chart) throw new Error("Chart not found");

    const subGoalName = chart.subGoals[task.subGoalIndex] || `Sub-Goal ${task.subGoalIndex + 1}`;
    const actionText = chart.actions[task.subGoalIndex]?.[task.actionIndex] || `Action ${task.actionIndex + 1}`;

    let message: string;
    if (args.assignmentType === "flesh_out") {
      message = `📋 **Task for flesh-out:**\n\n**Vision:** ${chart.mainGoal}\n**Sub-Goal:** ${subGoalName}\n**Action:** ${actionText}\n**Task:** ${task.title}\n${task.notes ? `**Context:** ${task.notes}\n` : ""}\nPlease write a detailed plan/breakdown for this task. When done, call the Pulse API:\nPOST ${process.env.CONVEX_SITE_URL}/api/pulse/tasks/flesh-out\nBody: { "taskId": "${task._id}", "plan": "your markdown plan", "agentName": "${args.agentName}" }\nHeader: X-Pulse-Secret: <secret>`;
    } else {
      message = `⚡ **Task to execute:**\n\n**Vision:** ${chart.mainGoal}\n**Sub-Goal:** ${subGoalName}\n**Action:** ${actionText}\n**Task:** ${task.title}\n${task.fleshOutPlan ? `**Approved Plan:**\n${task.fleshOutPlan}\n` : ""}${task.notes ? `**Context:** ${task.notes}\n` : ""}\nExecute this task. When done, call:\nPOST ${process.env.CONVEX_SITE_URL}/api/pulse/tasks/complete\nBody: { "taskId": "${task._id}", "notes": "completion summary", "agentName": "${args.agentName}" }\nHeader: X-Pulse-Secret: <secret>`;
    }

    // Update task status
    await ctx.runMutation(api.haradaTasks.update, {
      taskId: args.taskId,
      assignedAgentName: args.agentName,
      status: args.assignmentType === "flesh_out" ? "fleshing_out" : "executing",
      trackingType: "agent",
    });

    // Send message to agent via agentMessages
    await ctx.runMutation(api.agentMessages.sendToAgent, {
      agentName: args.agentName,
      content: message,
      relatedTaskId: args.taskId,
    });

    return { sent: true };
  },
});
