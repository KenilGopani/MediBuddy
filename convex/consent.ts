import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const grantConsent = mutation({
  args: {
    patientId: v.string(),
    trialMatchId: v.string(),
    trialId: v.string(),
    trialTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if consent already exists
    const existing = await ctx.db
      .query("consentRecords")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .collect();

    const existingConsent = existing.find(
      (c) => c.trialId === args.trialId && c.trialMatchId === args.trialMatchId
    );

    if (existingConsent) {
      await ctx.db.patch(existingConsent._id, {
        status: "consented",
        sharedWithSponsor: true,
        timestamp: Date.now(),
      });
    } else {
      await ctx.db.insert("consentRecords", {
        patientId: args.patientId,
        trialMatchId: args.trialMatchId,
        trialId: args.trialId,
        trialTitle: args.trialTitle,
        status: "consented",
        timestamp: Date.now(),
        sharedWithSponsor: true,
      });
    }

    // Audit log
    await ctx.db.insert("auditLogs", {
      userId: args.patientId,
      action: "CONSENT_GRANTED",
      details: `Patient consented to trial ${args.trialId}: ${args.trialTitle || "Unknown trial"}`,
      timestamp: Date.now(),
    });
  },
});

export const declineConsent = mutation({
  args: {
    patientId: v.string(),
    trialMatchId: v.string(),
    trialId: v.string(),
    trialTitle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("consentRecords")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .collect();

    const existingConsent = existing.find(
      (c) => c.trialId === args.trialId && c.trialMatchId === args.trialMatchId
    );

    if (existingConsent) {
      await ctx.db.patch(existingConsent._id, {
        status: "declined",
        sharedWithSponsor: false,
        timestamp: Date.now(),
      });
    } else {
      await ctx.db.insert("consentRecords", {
        patientId: args.patientId,
        trialMatchId: args.trialMatchId,
        trialId: args.trialId,
        trialTitle: args.trialTitle,
        status: "declined",
        timestamp: Date.now(),
        sharedWithSponsor: false,
      });
    }

    // Audit log
    await ctx.db.insert("auditLogs", {
      userId: args.patientId,
      action: "CONSENT_DECLINED",
      details: `Patient declined trial ${args.trialId}: ${args.trialTitle || "Unknown trial"}`,
      timestamp: Date.now(),
    });
  },
});

export const getByPatient = query({
  args: { patientId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("consentRecords")
      .withIndex("by_patientId", (q) => q.eq("patientId", args.patientId))
      .collect();
  },
});

export const getAuditLogs = query({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.userId) {
      return await ctx.db
        .query("auditLogs")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId!))
        .order("desc")
        .take(50);
    }
    return await ctx.db.query("auditLogs").order("desc").take(50);
  },
});
