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
    const objectives = await ctx.db
      .query("objectives")
      .withIndex("by_user_quarter", (q) =>
        q.eq("userId", args.userId).eq("quarter", args.quarter)
      )
      .collect();

    // Enrich each objective with its key results and calculated progress
    const enriched = await Promise.all(
      objectives.map(async (obj) => {
        const keyResults = await ctx.db
          .query("keyResults")
          .withIndex("by_objective", (q) => q.eq("objectiveId", obj._id))
          .collect();

        // Calculate objective progress as avg of KR progress
        const progress =
          keyResults.length > 0
            ? Math.round(
                keyResults.reduce((sum, kr) => sum + kr.progress, 0) /
                  keyResults.length
              )
            : obj.progress;

        return { ...obj, progress, keyResults };
      })
    );

    return enriched;
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
