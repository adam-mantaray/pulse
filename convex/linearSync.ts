import { action, internalAction, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Internal mutation to update linearCache
export const updateLinearCache = internalMutation({
  args: {
    projectId: v.string(),
    totalTasks: v.number(),
    completedTasks: v.number(),
    inProgressTasks: v.number(),
    blockedTasks: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("linearCache")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        lastSynced: Date.now(),
      });
    } else {
      await ctx.db.insert("linearCache", {
        ...args,
        lastSynced: Date.now(),
      });
    }
  },
});

// Internal mutation to update key result progress from Linear sync
export const updateKeyResultFromLinear = internalMutation({
  args: {
    linearProjectId: v.string(),
    progress: v.number(),
    completedTasks: v.number(),
    totalTasks: v.number(),
  },
  handler: async (ctx, args) => {
    // Find all key results linked to this Linear project
    const keyResults = await ctx.db
      .query("keyResults")
      .filter((q) => q.eq(q.field("linearProjectId"), args.linearProjectId))
      .collect();

    for (const kr of keyResults) {
      await ctx.db.patch(kr._id, {
        progress: args.progress,
        currentValue: args.completedTasks,
        targetValue: args.totalTasks,
        updatedAt: Date.now(),
      });
    }
  },
});

// Internal mutation to recalculate objective progress
export const recalculateObjectiveProgress = internalMutation({
  args: { objectiveId: v.id("objectives") },
  handler: async (ctx, args) => {
    const keyResults = await ctx.db
      .query("keyResults")
      .withIndex("by_objective", (q) => q.eq("objectiveId", args.objectiveId))
      .collect();

    if (keyResults.length === 0) return;

    const avgProgress =
      keyResults.reduce((sum, kr) => sum + kr.progress, 0) / keyResults.length;

    await ctx.db.patch(args.objectiveId, {
      progress: Math.round(avgProgress),
      updatedAt: Date.now(),
    });
  },
});

// Sync action that queries Linear GraphQL API
export const syncLinearProjects = internalAction({
  handler: async (ctx) => {
    const apiKey = process.env.LINEAR_API_KEY;
    if (!apiKey) {
      console.log("LINEAR_API_KEY not set, skipping sync");
      return;
    }

    const query = `
      query {
        team(id: "b4b8547a-0a2a-4414-9a98-4d7e148c5bb3") {
          projects {
            nodes {
              id
              name
              issues {
                nodes {
                  id
                  state {
                    name
                    type
                  }
                }
              }
            }
          }
        }
      }
    `;

    try {
      const response = await fetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      const projects = data?.data?.team?.projects?.nodes ?? [];

      for (const project of projects) {
        const issues = project.issues?.nodes ?? [];
        const totalTasks = issues.length;
        const completedTasks = issues.filter(
          (i: { state: { type: string } }) => i.state.type === "completed"
        ).length;
        const inProgressTasks = issues.filter(
          (i: { state: { type: string } }) => i.state.type === "started"
        ).length;
        const blockedTasks = issues.filter(
          (i: { state: { name: string } }) =>
            i.state.name.toLowerCase().includes("blocked")
        ).length;

        // Update cache
        await ctx.runMutation(internal.linearSync.updateLinearCache, {
          projectId: project.id,
          totalTasks,
          completedTasks,
          inProgressTasks,
          blockedTasks,
        });

        // Update linked key results
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        await ctx.runMutation(internal.linearSync.updateKeyResultFromLinear, {
          linearProjectId: project.id,
          progress,
          completedTasks,
          totalTasks,
        });
      }

      // Recalculate all active objective progress
      const objectives = await ctx.runQuery(
        internal.linearSync.getActiveObjectives,
        {}
      );
      for (const obj of objectives) {
        await ctx.runMutation(internal.linearSync.recalculateObjectiveProgress, {
          objectiveId: obj._id,
        });
      }
    } catch (error) {
      console.error("Linear sync failed:", error);
    }
  },
});

// Internal query to get active objectives for recalculation
import { internalQuery } from "./_generated/server";

export const getActiveObjectives = internalQuery({
  handler: async (ctx) => {
    return await ctx.db
      .query("objectives")
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();
  },
});

export const triggerSync = action({
  args: {},
  handler: async (ctx) => {
    await ctx.runAction(internal.linearSync.syncLinearProjects, {});
  },
});

export const getSprintSummary = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("linearCache").collect();
    const totalTasks = rows.reduce((s, r) => s + r.totalTasks, 0);
    const completedTasks = rows.reduce((s, r) => s + r.completedTasks, 0);
    const inProgressTasks = rows.reduce((s, r) => s + r.inProgressTasks, 0);
    const lastSynced = rows.length > 0 ? Math.max(...rows.map((r) => r.lastSynced)) : null;
    return { totalTasks, completedTasks, inProgressTasks, lastSynced, projectCount: rows.length };
  },
});
