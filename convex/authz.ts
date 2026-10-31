// Access control helpers.
// Policy: doctors can access every patient's records (there is no doctor-patient
// assignment model yet); patients can only access their own records.
// Queries use the `can*` helpers and return empty results when access is denied, so a
// page that renders before the auth token arrives doesn't crash. Mutations and actions
// use the `require*` helpers, which throw.
import { ConvexError, v } from "convex/values";
import { internalQuery } from "./_generated/server";
import type { ActionCtx, MutationCtx, QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";

type DbCtx = QueryCtx | MutationCtx;

export async function currentUser(ctx: DbCtx): Promise<Doc<"users"> | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
    .unique();
}

// ---- boolean checks (for queries) ----

export async function isSignedIn(ctx: DbCtx): Promise<boolean> {
  return (await currentUser(ctx)) !== null;
}

export async function isDoctor(ctx: DbCtx): Promise<boolean> {
  return (await currentUser(ctx))?.role === "doctor";
}

export async function isSelfDoctor(ctx: DbCtx, doctorId: Id<"users">): Promise<boolean> {
  const user = await currentUser(ctx);
  return user?.role === "doctor" && user._id === doctorId;
}

export async function canAccessPatient(ctx: DbCtx, patientId: Id<"users">): Promise<boolean> {
  const user = await currentUser(ctx);
  return !!user && (user.role === "doctor" || user._id === patientId);
}

// Patients may also look up doctors (e.g. to show who their appointment is with).
export async function canViewUser(ctx: DbCtx, userId: Id<"users">): Promise<boolean> {
  const user = await currentUser(ctx);
  if (!user) return false;
  if (user.role === "doctor" || user._id === userId) return true;
  return (await ctx.db.get(userId))?.role === "doctor";
}

export async function canAccessConsultation(
  ctx: DbCtx,
  consultationId: Id<"consultations">
): Promise<boolean> {
  const user = await currentUser(ctx);
  if (!user) return false;
  if (user.role === "doctor") return true;
  return (await ctx.db.get(consultationId))?.patientId === user._id;
}

export async function canAccessMeeting(ctx: DbCtx, meetingId: Id<"meetings">): Promise<boolean> {
  const user = await currentUser(ctx);
  if (!user) return false;
  if (user.role === "doctor") return true;
  return (await ctx.db.get(meetingId))?.patientId === user._id;
}

export async function canAccessMatch(ctx: DbCtx, matchId: Id<"trialMatches">): Promise<boolean> {
  const user = await currentUser(ctx);
  if (!user) return false;
  if (user.role === "doctor") return true;
  return (await ctx.db.get(matchId))?.patientId === user._id;
}

// Doctors can play any recording; a patient only the recordings of their own visits
// that the doctor has shared with them.
export async function canAccessConsultationAudio(
  ctx: DbCtx,
  consultationId: Id<"consultations">
): Promise<boolean> {
  const user = await currentUser(ctx);
  if (!user) return false;
  if (user.role === "doctor") return true;
  const consultation = await ctx.db.get(consultationId);
  return consultation?.patientId === user._id && consultation.sharedWithPatient === true;
}

export async function canAccessAudioRecording(
  ctx: DbCtx,
  audioRecordingId: Id<"audioRecordings">
): Promise<boolean> {
  const recording = await ctx.db.get(audioRecordingId);
  return !!recording && (await canAccessConsultationAudio(ctx, recording.consultationId));
}

// ---- throwing checks (for mutations) ----

function deny(): never {
  throw new ConvexError("Not authorized");
}

export async function requireUser(ctx: DbCtx): Promise<Doc<"users">> {
  const user = await currentUser(ctx);
  if (!user) throw new ConvexError("Not authenticated");
  return user;
}

export async function requireDoctor(ctx: DbCtx): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (user.role !== "doctor") deny();
  return user;
}

export async function requirePatientAccess(ctx: DbCtx, patientId: Id<"users">): Promise<void> {
  await requireUser(ctx);
  if (!(await canAccessPatient(ctx, patientId))) deny();
}

export async function requireMeetingAccess(ctx: DbCtx, meetingId: Id<"meetings">): Promise<void> {
  await requireUser(ctx);
  if (!(await canAccessMeeting(ctx, meetingId))) deny();
}

export async function requireMatchAccess(ctx: DbCtx, matchId: Id<"trialMatches">): Promise<void> {
  await requireUser(ctx);
  if (!(await canAccessMatch(ctx, matchId))) deny();
}

// A meeting may be created by its doctor, or requested by its patient.
export async function requireMeetingParticipant(
  ctx: DbCtx,
  doctorId: Id<"users">,
  patientId: Id<"users">
): Promise<void> {
  const user = await requireUser(ctx);
  const ok = user.role === "doctor" ? user._id === doctorId : user._id === patientId;
  if (!ok) deny();
}

// ---- action checks (actions have no db, so they ask an internal query) ----

export const viewer = internalQuery({
  args: {},
  handler: async (ctx): Promise<Doc<"users"> | null> => currentUser(ctx),
});

export const consultationAccess = internalQuery({
  args: { consultationId: v.id("consultations") },
  handler: async (ctx, args): Promise<boolean> =>
    canAccessConsultation(ctx, args.consultationId),
});

export async function requireUserAction(ctx: ActionCtx): Promise<Doc<"users">> {
  const user: Doc<"users"> | null = await ctx.runQuery(internal.authz.viewer, {});
  if (!user) throw new ConvexError("Not authenticated");
  return user;
}

export async function requireDoctorAction(ctx: ActionCtx): Promise<Doc<"users">> {
  const user = await requireUserAction(ctx);
  if (user.role !== "doctor") deny();
  return user;
}

export async function requireConsultationAccessAction(
  ctx: ActionCtx,
  consultationId: Id<"consultations">
): Promise<void> {
  await requireUserAction(ctx);
  const ok: boolean = await ctx.runQuery(internal.authz.consultationAccess, {
    consultationId,
  });
  if (!ok) deny();
}
