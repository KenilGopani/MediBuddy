/// <reference types="vite/client" />
import { describe, expect, test } from "vitest";
import { api, internal } from "../convex/_generated/api";
import { setup } from "./helpers";

describe("demo data", () => {
  test("seeding needs a doctor account", async () => {
    const { convexTest } = await import("convex-test");
    const schema = (await import("../convex/schema")).default;
    const empty = convexTest(schema, import.meta.glob("../convex/**/*.*s"));
    await expect(empty.mutation(internal.seed.seedDemoData, {})).rejects.toThrow("No doctor account found");
  });

  test("creates patients, consultations, trials and matches for the doctor and the signed-in patient", async () => {
    const app = await setup();
    await app.t.mutation(internal.seed.seedDemoData, {});

    const patients = await app.doctor.query(api.users.getAllPatients, {});
    expect(patients).toHaveLength(2 + 10); // the two test patients plus ten demo patients

    const consultations = await app.doctor.query(api.consultations.listForDoctor, { doctorId: app.doctorId });
    expect(consultations).toHaveLength(14 + 2); // demo patients + the first signed-in patient
    expect(consultations.every((c) => c.status === "completed" && c.medicalReport && c.transcription)).toBe(true);

    expect(await app.doctor.query(api.trialMatching.listActiveTrials, {})).toHaveLength(11);

    // the signed-in patient can see their own shared reports and trial notifications
    const mine = await app.patient.query(api.consultations.listSharedConsultationsForPatient, {
      patientId: app.patientId,
    });
    expect(mine).toHaveLength(2);
    const notifications = await app.patient.query(api.notifications.getPatientNotifications, {
      patientId: app.patientId,
    });
    expect(notifications).toHaveLength(2);
    expect(await app.patient.query(api.meetings.getUpcomingMeetingsForPatient, { patientId: app.patientId })).toHaveLength(2);

    // the doctor has appointments and matches waiting for review
    expect(
      (await app.doctor.query(api.meetings.getUpcomingMeetingsForDoctor, { doctorId: app.doctorId })).length
    ).toBeGreaterThan(10);
    expect((await app.doctor.query(api.trialMatching.listMatchesAwaitingReview, {})).length).toBeGreaterThan(3);
  });

  test("every transcript line is spoken by 'Doctor' or 'Patient' (the audio script relies on it)", async () => {
    const app = await setup();
    await app.t.mutation(internal.seed.seedDemoData, {});
    const consultations = await app.doctor.query(api.consultations.listForDoctor, { doctorId: app.doctorId });
    for (const c of consultations) {
      for (const line of c.transcription!.split("\n")) {
        expect(line).toMatch(/^(Doctor|Patient): \S/);
      }
    }
  });

  test("seeded trial matches only use trials whose condition fits the patient", async () => {
    const app = await setup();
    await app.t.mutation(internal.seed.seedDemoData, {});
    const trials = await app.doctor.query(api.trialMatching.listActiveTrials, {});
    const patients = await app.doctor.query(api.users.getAllPatients, {});
    const { conditionsMatch } = await import("../convex/conditionMatching");
    for (const p of patients) {
      const matches = await app.doctor.query(api.trialMatching.listMatchesForPatient, { patientId: p._id });
      for (const m of matches) {
        const trial = trials.find((t) => t._id === m.trialId)!;
        const fits = trial.targetConditions.some((target) =>
          (p.conditions ?? []).some((c) => conditionsMatch(c.name, target))
        );
        expect(fits, `${p.name} matched to "${trial.title}"`).toBe(true);
      }
    }
  });

  test("seeding twice does not duplicate, and reset removes everything it created", async () => {
    const app = await setup();
    await app.t.mutation(internal.seed.seedDemoData, {});
    await app.t.mutation(internal.seed.seedDemoData, {});
    expect(await app.doctor.query(api.users.getAllPatients, {})).toHaveLength(12);

    await app.t.mutation(internal.seed.resetDemoData, {});
    expect(await app.doctor.query(api.users.getAllPatients, {})).toHaveLength(2);
    expect(await app.doctor.query(api.consultations.listForDoctor, { doctorId: app.doctorId })).toEqual([]);
    expect(await app.doctor.query(api.trialMatching.listActiveTrials, {})).toEqual([]);
    expect(await app.doctor.query(api.meetings.getMeetingsForDoctor, { doctorId: app.doctorId })).toEqual([]);
  });

  test("audio can be attached to seeded consultations, after which none need audio", async () => {
    const app = await setup();
    await app.t.mutation(internal.seed.seedDemoData, {});
    const needing = await app.t.query(internal.seed.consultationsNeedingAudio, {});
    expect(needing).toHaveLength(16);

    for (const item of needing) {
      const storageId = await app.t.run(async (ctx) => ctx.storage.store(new Blob(["x"])));
      await app.t.mutation(internal.seed.attachAudio, {
        consultationId: item.consultationId,
        storageId,
        fileName: "visit.m4a",
        fileType: "audio/mp4",
        fileSize: 1,
        duration: 30,
      });
    }
    expect(await app.t.query(internal.seed.consultationsNeedingAudio, {})).toEqual([]);

    const first = needing[0].consultationId;
    const recordings = await app.doctor.query(api.audio.getAudioRecordingsForConsultation, { consultationId: first });
    expect(recordings[0]).toMatchObject({ status: "completed", duration: 30 });

    // resetting also deletes the recordings
    await app.t.mutation(internal.seed.resetDemoData, {});
    expect(await app.t.run(async (ctx) => ctx.db.query("audioRecordings").collect())).toEqual([]);
  });

  test("doctor-as-patient consultations can be cleaned up", async () => {
    const app = await setup();
    await app.t.run(async (ctx) =>
      ctx.db.insert("consultations", {
        doctorId: app.doctorId, patientId: app.doctorId, status: "active", startTime: Date.now(),
      })
    );
    expect(await app.t.mutation(internal.seed.removeSelfConsultations, {})).toEqual({ removed: 1 });
  });
});
