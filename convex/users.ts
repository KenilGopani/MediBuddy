import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createOrGetUser = mutation({
  args: {
    clerkId: v.string(),
    role: v.union(v.literal("doctor"), v.literal("patient")),
    name: v.string(),
    email: v.string(),
    specialty: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      return existing._id;
    }

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      role: args.role,
      name: args.name,
      email: args.email,
      specialty: args.specialty,
      conditions: [],
      medications: [],
      allergies: [],
      createdAt: Date.now(),
    });

    return userId;
  },
});

export const getUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const getAllPatients = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "patient"))
      .collect();
  },
});

export const getAllDoctors = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "doctor"))
      .collect();
  },
});

export const updateProfile = mutation({
  args: {
    clerkId: v.string(),
    name: v.optional(v.string()),
    specialty: v.optional(v.string()),
    conditions: v.optional(v.array(v.string())),
    medications: v.optional(v.array(v.string())),
    allergies: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.specialty !== undefined) updates.specialty = args.specialty;
    if (args.conditions !== undefined) updates.conditions = args.conditions;
    if (args.medications !== undefined) updates.medications = args.medications;
    if (args.allergies !== undefined) updates.allergies = args.allergies;

    await ctx.db.patch(user._id, updates);
    return user._id;
  },
});
