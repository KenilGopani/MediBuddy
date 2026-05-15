import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";

export const create = internalMutation({
  args: {
    appointmentId: v.string(),
    doctorId: v.string(),
    patientId: v.string(),
  },
  handler: async (ctx, args) => {
    const transcriptId = await ctx.db.insert("transcripts", {
      appointmentId: args.appointmentId,
      doctorId: args.doctorId,
      patientId: args.patientId,
      rawText: "",
      chunks: [],
      status: "recording",
      createdAt: Date.now(),
    });
    return transcriptId;
  },
});

export const appendChunk = internalMutation({
  args: {
    transcriptId: v.id("transcripts"),
    text: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const transcript = await ctx.db.get(args.transcriptId);
    if (!transcript) {
      throw new Error("Transcript not found");
    }

    const updatedChunks = [
      ...transcript.chunks,
      { text: args.text, timestamp: args.timestamp },
    ];

    const updatedRawText = transcript.rawText
      ? transcript.rawText + " " + args.text
      : args.text;

    await ctx.db.patch(args.transcriptId, {
      chunks: updatedChunks,
      rawText: updatedRawText,
    });
  },
});

export const complete = internalMutation({
  args: {
    transcriptId: v.id("transcripts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.transcriptId, { status: "complete" });
  },
});

export const getByAppointment = query({
  args: { appointmentId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("transcripts")
      .withIndex("by_appointmentId", (q) =>
        q.eq("appointmentId", args.appointmentId)
      )
      .first();
  },
});

// Public mutation for creating transcripts from client
export const createTranscript = internalMutation({
  args: {
    appointmentId: v.string(),
    doctorId: v.string(),
    patientId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("transcripts", {
      appointmentId: args.appointmentId,
      doctorId: args.doctorId,
      patientId: args.patientId,
      rawText: "",
      chunks: [],
      status: "recording",
      createdAt: Date.now(),
    });
  },
});
