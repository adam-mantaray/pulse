import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(),
    timezone: v.string(),
    createdAt: v.number(),
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
    targetValue: v.optional(v.number()),
    currentValue: v.optional(v.number()),
    progress: v.number(),
    linearProjectId: v.optional(v.string()),
    manualTracking: v.boolean(),
    dueDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
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
  }).index("by_agent", ["agentName", "timestamp"]),

  briefings: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("morning"), v.literal("evening")),
    date: v.string(),
    content: v.string(),
    createdAt: v.number(),
  }).index("by_date", ["date", "type"]),

  linearCache: defineTable({
    projectId: v.string(),
    totalTasks: v.number(),
    completedTasks: v.number(),
    inProgressTasks: v.number(),
    blockedTasks: v.number(),
    lastSynced: v.number(),
  }).index("by_project", ["projectId"]),
});
