import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createObjective = mutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    quarter: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("objectives", {
      ...args,
      progress: 0,
      status: "active",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listObjectives = query({
  args: {
    userId: v.id("users"),
    quarter: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("objectives")
      .withIndex("by_user_quarter", (q) =>
        q.eq("userId", args.userId).eq("quarter", args.quarter)
      )
      .collect();
  },
});

export const updateObjectiveProgress = mutation({
  args: {
    objectiveId: v.id("objectives"),
    progress: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.objectiveId, {
      progress: args.progress,
      updatedAt: Date.now(),
    });
  },
});
