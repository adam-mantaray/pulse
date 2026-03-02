import { query } from "./_generated/server";
import { v } from "convex/values";

export const listActivities = query({
  args: {
    timeRange: v.union(v.literal("today"), v.literal("week"), v.literal("month")),
    agentFilter: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    let since: number;

    switch (args.timeRange) {
      case "today":
        since = now - 24 * 60 * 60 * 1000;
        break;
      case "week":
        since = now - 7 * 24 * 60 * 60 * 1000;
        break;
      case "month":
        since = now - 30 * 24 * 60 * 60 * 1000;
        break;
    }

    let query = ctx.db
      .query("agentActivity")
      .withIndex("by_timestamp")
      .order("desc");

    const results = await query.collect();

    let filtered = results.filter((a) => a.timestamp >= since);

    if (args.agentFilter) {
      filtered = filtered.filter(
        (a) => a.agentName.toLowerCase() === args.agentFilter
      );
    }

    return filtered;
  },
});
