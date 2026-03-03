import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// List messages for a specific agent conversation
export const listByAgent = query({
  args: {
    agentName: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("agentMessages")
      .withIndex("by_agent", (q) => q.eq("agentName", args.agentName))
      .order("desc")
      .take(args.limit ?? 50);
    return messages.reverse();
  },
});

// List latest message per agent (for chat list preview)
export const listConversations = query({
  handler: async (ctx) => {
    // Dynamic: pull agent IDs from the agents table
    const registeredAgents = await ctx.db.query("agents").collect();
    const agents = registeredAgents.map((a) => a.agentId);
    const conversations = [];

    for (const agentName of agents) {
      const lastMessage = await ctx.db
        .query("agentMessages")
        .withIndex("by_agent", (q) => q.eq("agentName", agentName))
        .order("desc")
        .first();

      const unreadCount = lastMessage
        ? (
            await ctx.db
              .query("agentMessages")
              .withIndex("by_agent", (q) => q.eq("agentName", agentName))
              .filter((q) =>
                q.and(
                  q.eq(q.field("direction"), "inbound"),
                  q.eq(q.field("read"), false)
                )
              )
              .collect()
          ).length
        : 0;

      conversations.push({
        agentName,
        lastMessage: lastMessage?.content ?? null,
        lastTimestamp: lastMessage?.timestamp ?? 0,
        unread: unreadCount,
      });
    }

    return conversations.sort((a, b) => b.lastTimestamp - a.lastTimestamp);
  },
});

// Send a message from Ahmed to an agent
export const send = mutation({
  args: {
    agentName: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the first user (Ahmed) — single-user app for now
    const user = await ctx.db.query("users").first();
    if (!user) throw new Error("No user found");

    await ctx.db.insert("agentMessages", {
      userId: user._id,
      agentName: args.agentName,
      direction: "outbound",
      content: args.content,
      timestamp: Date.now(),
      read: true,
      delivered: false,
    });
  },
});

// Mark messages as read
export const markRead = mutation({
  args: { agentName: v.string() },
  handler: async (ctx, args) => {
    const unread = await ctx.db
      .query("agentMessages")
      .withIndex("by_agent", (q) => q.eq("agentName", args.agentName))
      .filter((q) =>
        q.and(
          q.eq(q.field("direction"), "inbound"),
          q.eq(q.field("read"), false)
        )
      )
      .collect();

    for (const msg of unread) {
      await ctx.db.patch(msg._id, { read: true });
    }
  },
});

// Poll for undelivered outbound messages (called by OpenClaw bridge)
export const pollOutbound = query({
  handler: async (ctx) => {
    const messages = await ctx.db
      .query("agentMessages")
      .filter((q) =>
        q.and(
          q.eq(q.field("direction"), "outbound"),
          q.neq(q.field("delivered"), true)
        )
      )
      .order("asc")
      .take(20);
    return messages;
  },
});

// Mark outbound messages as delivered
export const markDelivered = mutation({
  args: { messageIds: v.array(v.id("agentMessages")) },
  handler: async (ctx, args) => {
    for (const id of args.messageIds) {
      await ctx.db.patch(id, { delivered: true });
    }
  },
});

// Internal: agent writes inbound message
export const insertInbound = internalMutation({
  args: {
    userId: v.string(),
    agentName: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.query("users").first();
    if (!user) return;

    await ctx.db.insert("agentMessages", {
      userId: user._id,
      agentName: args.agentName,
      direction: "inbound",
      content: args.content,
      timestamp: Date.now(),
      read: false,
    });
  },
});
