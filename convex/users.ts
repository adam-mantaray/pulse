import { mutation, query, action, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";

export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(),
    timezone: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) {
      throw new Error("User with this email already exists");
    }
    return await ctx.db.insert("users", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const authenticateUser = action({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args): Promise<{ userId: string; name: string } | null> => {
    const user = await ctx.runQuery(internal.users.getUserByEmail, { email: args.email });
    if (!user) return null;

    const bcrypt = require("bcryptjs");
    const valid = await bcrypt.compare(args.password, user.passwordHash);
    if (!valid) return null;

    return { userId: user._id, name: user.name };
  },
});
