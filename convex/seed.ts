import { action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

/**
 * Seed agent activity directly (no auth needed).
 * Run: npx convex run seed:seedAgentActivity
 */
export const seedAgentActivity = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const activities = [
      { agentName: "adam", action: "created", issueId: "MAN-75", issueTitle: "Implement habits screen", timestamp: now - 1 * 60 * 60 * 1000 },
      { agentName: "rami", action: "completed", issueId: "MAN-70", issueTitle: "Set up Convex schema", timestamp: now - 2 * 60 * 60 * 1000 },
      { agentName: "nadia", action: "commented", issueId: "MAN-68", issueTitle: "Found a bug in dashboard rendering", details: "The goals ring doesn't update in real-time", timestamp: now - 3 * 60 * 60 * 1000 },
      { agentName: "tarek", action: "moved", issueId: "MAN-72", issueTitle: "Implement dashboard screen", timestamp: now - 5 * 60 * 60 * 1000 },
      { agentName: "omar", action: "created", issueId: "MAN-76", issueTitle: "Write Pulse product spec v2", timestamp: now - 6 * 60 * 60 * 1000 },
      { agentName: "adam", action: "moved", issueId: "MAN-74", issueTitle: "Wire up Convex mutations", timestamp: now - 8 * 60 * 60 * 1000 },
      { agentName: "tarek", action: "completed", issueId: "MAN-69", issueTitle: "Expo project scaffold", timestamp: now - 12 * 60 * 60 * 1000 },
      { agentName: "nadia", action: "completed", issueId: "MAN-65", issueTitle: "Design system migration from Ledgerly", timestamp: now - 24 * 60 * 60 * 1000 },
    ];

    for (const activity of activities) {
      await ctx.db.insert("agentActivity", activity);
    }

    return { seeded: activities.length };
  },
});

/**
 * Full seed: creates user, habits, goals, agent activity.
 * Run: npx convex run seed:seedDemoData
 */
export const seedDemoData = action({
  args: {},
  handler: async (ctx): Promise<{ userId: string; message: string }> => {
    // Seed agent activity first (no deps)
    await ctx.runMutation(api.seed.seedAgentActivity, {});

    // Create Ahmed's test account
    let userId: string;
    try {
      const bcrypt = require("bcryptjs");
      const hash = await bcrypt.hash("pulse123", 10);
      userId = await ctx.runMutation(api.users.createUser, {
        email: "ahmed@mantaray.digital",
        name: "Ahmed",
        passwordHash: hash,
        timezone: "Africa/Cairo",
      });
    } catch {
      const existing = await ctx.runQuery(internal.users.getUserByEmail, {
        email: "ahmed@mantaray.digital",
      });
      if (!existing) throw new Error("Failed to create or find user");
      userId = existing._id;
    }

    // Create habits
    const habitDefs = [
      { name: "Gym", emoji: "🏋️", frequency: "daily" as const },
      { name: "Reflection", emoji: "🧘", frequency: "daily" as const },
      { name: "Reading", emoji: "📖", frequency: "daily" as const },
      { name: "Sleep before midnight", emoji: "💤", frequency: "daily" as const },
      { name: "Water (8 glasses)", emoji: "💧", frequency: "daily" as const },
    ];

    const habitIds: string[] = [];
    for (const h of habitDefs) {
      const id = await ctx.runMutation(api.habits.createHabit, {
        userId: userId as any,
        ...h,
      });
      habitIds.push(id as string);
    }

    // Mark first 3 habits complete for today
    const today = new Date().toISOString().split("T")[0];
    for (const habitId of habitIds.slice(0, 3)) {
      await ctx.runMutation(api.habits.completeHabit, {
        habitId: habitId as any,
        date: today,
      });
    }

    // Objectives for Q1-2026
    const quarter = "Q1-2026";
    const obj1Id = await ctx.runMutation(api.objectives.createObjective, {
      userId: userId as any,
      title: "Launch Pulse MVP",
      quarter,
    });
    const obj2Id = await ctx.runMutation(api.objectives.createObjective, {
      userId: userId as any,
      title: "Grow Mantaray Revenue",
      quarter,
    });

    // Key results for obj1
    const kr1a = await ctx.runMutation(api.keyResults.createKeyResult, {
      objectiveId: obj1Id as any,
      title: "App in TestFlight by April 15",
      manualTracking: true,
      targetValue: 100,
    });
    const kr1b = await ctx.runMutation(api.keyResults.createKeyResult, {
      objectiveId: obj1Id as any,
      title: "Agent integration working",
      manualTracking: true,
      targetValue: 8,
    });
    await ctx.runMutation(api.keyResults.createKeyResult, {
      objectiveId: obj1Id as any,
      title: "Ahmed uses it daily for 1 week",
      manualTracking: true,
      targetValue: 7,
    });

    // Key results for obj2
    const kr2a = await ctx.runMutation(api.keyResults.createKeyResult, {
      objectiveId: obj2Id as any,
      title: "Close 3 new agency clients",
      manualTracking: true,
      targetValue: 3,
    });
    await ctx.runMutation(api.keyResults.createKeyResult, {
      objectiveId: obj2Id as any,
      title: "Launch YallaPass beta",
      manualTracking: true,
      targetValue: 100,
    });

    // Set some progress on key results
    await ctx.runMutation(api.keyResults.updateKeyResultManual, {
      keyResultId: kr1a as any,
      currentValue: 40,
    });
    await ctx.runMutation(api.keyResults.updateKeyResultManual, {
      keyResultId: kr1b as any,
      currentValue: 3,
    });
    await ctx.runMutation(api.keyResults.updateKeyResultManual, {
      keyResultId: kr2a as any,
      currentValue: 1,
    });

    return { userId, message: "Seed complete ✅" };
  },
});
