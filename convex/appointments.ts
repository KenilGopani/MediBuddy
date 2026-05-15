import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
  args: {
    doctorId: v.string(),
    patientId: v.string(),
    doctorName: v.optional(v.string()),
    patientName: v.optional(v.string()),
    title: v.string(),
    scheduledAt: v.number(),
    duration: v.number(),
    appointmentType: v.union(
      v.literal("consultation"),
      v.literal("follow-up"),
      v.literal("check-up")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const appointmentId = await ctx.db.insert("appointments", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
    return appointmentId;
  },
});

export const getByDoctor = query({
  args: { doctorId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appointments")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .order("desc")
      .collect();
  },
});

export const getByPatient = query({
  args: { patientId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("appointments")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();
  },
});

export const updateStatus = mutation({
  args: {
    appointmentId: v.id("appointments"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.appointmentId, { status: args.status });
  },
});

export const getUpcoming = query({
  args: { doctorId: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .collect();

    return appointments
      .filter(
        (a) =>
          a.scheduledAt >= now - 86400000 &&
          (a.status === "pending" || a.status === "approved")
      )
      .sort((a, b) => a.scheduledAt - b.scheduledAt);
  },
});

export const getApprovedForDoctor = query({
  args: { doctorId: v.string() },
  handler: async (ctx, args) => {
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .collect();

    return appointments.filter((a) => a.status === "approved");
  },
});
