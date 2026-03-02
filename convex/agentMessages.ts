import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const insertInbound = internalMutation({
  args: {
    userId: v.string(),
    agentName: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("agentMessages", {
      userId: args.userId as any, // Will be validated as Id<"users"> by Convex
      agentName: args.agentName,
      direction: "inbound",
      content: args.content,
      timestamp: Date.now(),
      read: false,
    });
  },
});
