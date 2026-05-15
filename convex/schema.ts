import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    role: v.union(v.literal("doctor"), v.literal("patient")),
    name: v.string(),
    email: v.string(),
    specialty: v.optional(v.string()),
    conditions: v.optional(v.array(v.string())),
    medications: v.optional(v.array(v.string())),
    allergies: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_role", ["role"]),

  appointments: defineTable({
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
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_doctorId", ["doctorId"])
    .index("by_patientId", ["patientId"])
    .index("by_status", ["status"]),

  transcripts: defineTable({
    appointmentId: v.string(),
    doctorId: v.string(),
    patientId: v.string(),
    rawText: v.string(),
    chunks: v.array(
      v.object({
        text: v.string(),
        timestamp: v.number(),
      })
    ),
    status: v.union(v.literal("recording"), v.literal("complete")),
    createdAt: v.number(),
  }).index("by_appointmentId", ["appointmentId"]),

  medicalSummaries: defineTable({
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
    createdAt: v.number(),
  })
    .index("by_appointmentId", ["appointmentId"])
    .index("by_patientId", ["patientId"]),

  trialMatches: defineTable({
    appointmentId: v.string(),
    patientId: v.string(),
    summaryId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("rejected")
    ),
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
    createdAt: v.number(),
  })
    .index("by_appointmentId", ["appointmentId"])
    .index("by_patientId", ["patientId"])
    .index("by_status", ["status"]),

  consentRecords: defineTable({
    patientId: v.string(),
    trialMatchId: v.string(),
    trialId: v.string(),
    trialTitle: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("consented"),
      v.literal("declined")
    ),
    timestamp: v.number(),
    sharedWithSponsor: v.boolean(),
  })
    .index("by_patientId", ["patientId"])
    .index("by_trialMatchId", ["trialMatchId"]),

  auditLogs: defineTable({
    userId: v.string(),
    action: v.string(),
    details: v.string(),
    timestamp: v.number(),
  }).index("by_userId", ["userId"]),
});
