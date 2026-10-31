/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import schema from "../convex/schema";
import type { Id } from "../convex/_generated/dataModel";

const modules = import.meta.glob("../convex/**/*.*s");

export const DAY = 86_400_000;

// Fresh in-memory Convex backend with one doctor and two patients.
export async function setup() {
  const t = convexTest(schema, modules);
  const make = (role: "doctor" | "patient", name: string, subject: string) =>
    t.run(async (ctx) =>
      ctx.db.insert("users", {
        name,
        email: `${subject}@test.example`,
        tokenIdentifier: subject,
        role,
        roleConfirmed: true,
      })
    );
  const doctorId = await make("doctor", "Dr. Test", "user_doctor");
  const patientId = await make("patient", "Pat One", "user_patient");
  const otherPatientId = await make("patient", "Pat Two", "user_other");
  return {
    t,
    doctorId,
    patientId,
    otherPatientId,
    doctor: t.withIdentity({ subject: "user_doctor" }),
    patient: t.withIdentity({ subject: "user_patient" }),
    other: t.withIdentity({ subject: "user_other" }),
    anon: t,
  };
}

export type App = Awaited<ReturnType<typeof setup>>;

// A completed consultation with a transcript, structured data and an optional shared flag.
export async function addConsultation(
  app: App,
  opts: { patientId?: Id<"users">; shared?: boolean; conditions?: string[] } = {}
) {
  const patientId = opts.patientId ?? app.patientId;
  return app.t.run(async (ctx) =>
    ctx.db.insert("consultations", {
      doctorId: app.doctorId,
      patientId,
      transcription: "Doctor: How are you?\nPatient: I have a cough.",
      structuredData: {
        conditions: (opts.conditions ?? ["Acute bronchitis"]).map((name) => ({
          name,
          severity: "moderate" as const,
        })),
        medications: ["Atorvastatin 20 mg"],
        allergies: [],
      },
      medicalReport: "**S (Subjective):** cough",
      sharedWithPatient: opts.shared ?? false,
      status: "completed",
      startTime: Date.now() - DAY,
      createdAt: Date.now() - DAY,
    })
  );
}

export async function addTrial(
  app: App,
  title: string,
  targetConditions: string[],
  overrides: Record<string, unknown> = {}
) {
  return app.t.run(async (ctx) =>
    ctx.db.insert("clinicalTrials", {
      title,
      description: `${title} study`,
      sponsor: "Test Sponsor",
      phase: "Phase 3",
      status: "recruiting",
      eligibilityCriteria: [],
      exclusionCriteria: [],
      location: "Boston, MA, USA",
      contactInfo: "trials@test.example",
      targetConditions,
      ...overrides,
    })
  );
}

export async function addMatch(
  app: App,
  consultationId: Id<"consultations">,
  trialId: Id<"clinicalTrials">,
  patientId: Id<"users"> = app.patientId
) {
  return app.t.run(async (ctx) =>
    ctx.db.insert("trialMatches", {
      patientId,
      trialId,
      consultationId,
      relevanceScore: 80,
      status: "pending",
      notificationStatus: "sent",
      consentStatus: "pending",
    })
  );
}
