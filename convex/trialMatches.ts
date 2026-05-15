import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

export const store = internalMutation({
  args: {
    appointmentId: v.string(),
    patientId: v.string(),
    summaryId: v.string(),
    trials: v.array(
      v.object({
        trialId: v.string(),
        title: v.string(),
        phase: v.string(),
        condition: v.string(),
        eligibilitySummary: v.string(),
        relevanceScore: v.number(),
        rationale: v.string(),
        sponsorName: v.string(),
        location: v.string(),
        contactEmail: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const matchId = await ctx.db.insert("trialMatches", {
      ...args,
      status: "pending",
      createdAt: Date.now(),
    });
    return matchId;
  },
});

export const getByAppointment = query({
  args: { appointmentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trialMatches")
      .withIndex("by_appointmentId", (q) =>
        q.eq("appointmentId", args.appointmentId)
      )
      .first();
  },
});

export const getByPatient = query({
  args: { patientId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("trialMatches")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();
  },
});

export const updateStatus = mutation({
  args: {
    matchId: v.id("trialMatches"),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("rejected")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.matchId, { status: args.status });
  },
});

export const getPendingForDoctor = query({
  args: { doctorId: v.string() },
  handler: async (ctx, args) => {
    // Get all appointments for this doctor
    const appointments = await ctx.db
      .query("appointments")
      .withIndex("by_doctorId", (q) => q.eq("doctorId", args.doctorId))
      .collect();

    const appointmentIds = appointments.map((a) => a._id.toString());

    // Get all pending trial matches for those appointments
    const allMatches = await ctx.db
      .query("trialMatches")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    return allMatches.filter((m) => appointmentIds.includes(m.appointmentId));
  },
});
