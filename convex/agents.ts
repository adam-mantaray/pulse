import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// List all registered agents
export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("agents")
      .collect();
  },
});

// Get a single agent by agentId
export const get = query({
  args: { agentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();
  },
});

// Upsert agent — used by sync endpoint
export const upsert = mutation({
  args: {
    agentId: v.string(),
    name: v.string(),
    codename: v.string(),
    emoji: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        codename: args.codename,
        emoji: args.emoji,
        role: args.role,
        lastSeen: Date.now(),
      });
    } else {
      await ctx.db.insert("agents", {
        agentId: args.agentId,
        name: args.name,
        codename: args.codename,
        emoji: args.emoji,
        role: args.role,
        status: "idle",
        lastSeen: Date.now(),
      });
    }
  },
});

// Update agent status (called by agents or heartbeat)
export const updateStatus = mutation({
  args: {
    agentId: v.string(),
    status: v.union(v.literal("active"), v.literal("idle"), v.literal("offline")),
    currentTask: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db
      .query("agents")
      .withIndex("by_agentId", (q) => q.eq("agentId", args.agentId))
      .first();

    if (agent) {
      await ctx.db.patch(agent._id, {
        status: args.status,
        currentTask: args.currentTask,
        lastSeen: Date.now(),
      });
    }
  },
});

// Bulk sync — replace all agents from OpenClaw config
export const bulkSync = internalMutation({
  args: {
    agents: v.array(
      v.object({
        agentId: v.string(),
        name: v.string(),
        codename: v.string(),
        emoji: v.string(),
        role: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const agent of args.agents) {
      const existing = await ctx.db
        .query("agents")
        .withIndex("by_agentId", (q) => q.eq("agentId", agent.agentId))
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          name: agent.name,
          codename: agent.codename,
          emoji: agent.emoji,
          role: agent.role,
          lastSeen: Date.now(),
        });
      } else {
        await ctx.db.insert("agents", {
          ...agent,
          status: "idle",
          lastSeen: Date.now(),
        });
      }
    }
  },
});
