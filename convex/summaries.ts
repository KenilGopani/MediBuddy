import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const store = internalMutation({
  args: {
    appointmentId: v.string(),
    transcriptId: v.string(),
    patientId: v.string(),
    conditions: v.array(v.string()),
    medications: v.array(v.string()),
    symptoms: v.array(v.string()),
    allergies: v.array(v.string()),
    vitals: v.object({
      bloodPressure: v.optional(v.string()),
      heartRate: v.optional(v.string()),
      temperature: v.optional(v.string()),
      weight: v.optional(v.string()),
    }),
    doctorNotes: v.string(),
    rawSummaryJson: v.string(),
  },
  handler: async (ctx, args) => {
    const summaryId = await ctx.db.insert("medicalSummaries", {
      ...args,
      createdAt: Date.now(),
    });
    return summaryId;
  },
});

export const getByAppointment = query({
  args: { appointmentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("medicalSummaries")
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
      .query("medicalSummaries")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .order("desc")
      .collect();
  },
});
