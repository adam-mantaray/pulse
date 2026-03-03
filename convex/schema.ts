import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(),
    timezone: v.string(),
    createdAt: v.number(),
    activeHaradaChartId: v.optional(v.id("haradaCharts")),
  }).index("by_email", ["email"]),

  objectives: defineTable({
    userId: v.id("users"),
    title: v.string(),
    quarter: v.string(),
    progress: v.number(),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("archived")),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user_quarter", ["userId", "quarter"]),

  keyResults: defineTable({
    objectiveId: v.id("objectives"),
    title: v.string(),
    trackingType: v.optional(
      v.union(
        v.literal("numeric"),
        v.literal("linear"),
        v.literal("manual"),
      )
    ),
    targetValue: v.optional(v.number()),
    currentValue: v.optional(v.number()),
    progress: v.number(),
    linearProjectId: v.optional(v.string()),
    manualTracking: v.optional(v.boolean()),
    dueDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    haradaChartId: v.optional(v.id("haradaCharts")),
    haradaSubGoalIndex: v.optional(v.number()),
    haradaActionIndex: v.optional(v.number()),
  }).index("by_objective", ["objectiveId"]),

  habits: defineTable({
    userId: v.id("users"),
    name: v.string(),
    emoji: v.string(),
    frequency: v.union(v.literal("daily"), v.literal("weekdays"), v.literal("custom")),
    customDays: v.optional(v.array(v.number())),
    currentStreak: v.number(),
    longestStreak: v.number(),
    freezesUsed: v.number(),
    isActive: v.boolean(),
    createdAt: v.number(),
    haradaChartId: v.optional(v.id("haradaCharts")),
    haradaSubGoalIndex: v.optional(v.number()),
    promotedFromActionIndex: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  habitCompletions: defineTable({
    habitId: v.id("habits"),
    date: v.string(),
    completedAt: v.number(),
  }).index("by_habit_date", ["habitId", "date"]),

  agentActivity: defineTable({
    agentName: v.string(),
    action: v.string(),
    issueId: v.string(),
    issueTitle: v.string(),
    details: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]),

  agentMessages: defineTable({
    userId: v.id("users"),
    agentName: v.string(),
    direction: v.union(v.literal("outbound"), v.literal("inbound")),
    content: v.string(),
    timestamp: v.number(),
    read: v.boolean(),
    delivered: v.optional(v.boolean()),
    relatedTaskId: v.optional(v.id("haradaTasks")),
  }).index("by_agent", ["agentName", "timestamp"]),

  briefings: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("morning"), v.literal("evening")),
    date: v.string(),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_date", ["date", "type"]),

  agents: defineTable({
    agentId: v.string(),
    name: v.string(),
    codename: v.string(),
    emoji: v.string(),
    role: v.string(),
    status: v.union(v.literal("active"), v.literal("idle"), v.literal("offline")),
    currentTask: v.optional(v.string()),
    lastSeen: v.number(),
  }).index("by_agentId", ["agentId"]),

  haradaCharts: defineTable({
    userId: v.id("users"),
    title: v.string(),
    mainGoal: v.string(),
    subGoals: v.array(v.string()),
    actions: v.array(v.array(v.string())),
    actionsDone: v.optional(v.array(v.array(v.boolean()))),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_user", ["userId"])
    .index("by_user_active", ["userId", "isActive"]),

  haradaTasks: defineTable({
    userId: v.id("users"),
    chartId: v.id("haradaCharts"),
    subGoalIndex: v.number(),
    actionIndex: v.number(),
    title: v.string(),
    notes: v.optional(v.string()),
    trackingType: v.union(
      v.literal("manual"),
      v.literal("linear"),
      v.literal("agent"),
    ),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("fleshing_out"),
      v.literal("pending_review"),
      v.literal("approved"),
      v.literal("executing"),
      v.literal("done"),
    ),
    linearIssueId: v.optional(v.string()),
    assignedAgentName: v.optional(v.string()),
    fleshOutPlan: v.optional(v.string()),
    fleshOutAt: v.optional(v.number()),
    approvedAt: v.optional(v.number()),
    executionNotes: v.optional(v.string()),
    completedAt: v.optional(v.number()),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_chart_action", ["chartId", "subGoalIndex", "actionIndex"])
    .index("by_user", ["userId"])
    .index("by_agent_status", ["assignedAgentName", "status"]),

  linearCache: defineTable({
    projectId: v.string(),
    totalTasks: v.number(),
    completedTasks: v.number(),
    inProgressTasks: v.number(),
    blockedTasks: v.number(),
    lastSynced: v.number(),
  }).index("by_project", ["projectId"]),
});
