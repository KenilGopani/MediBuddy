import { describe, expect, test } from "vitest";
import { api } from "../convex/_generated/api";
import { addConsultation, addMatch, addTrial, setup } from "./helpers";

describe("who can read what", () => {
  test("anonymous callers get nothing", async () => {
    const app = await setup();
    const consultationId = await addConsultation(app, { shared: true });
    expect(await app.anon.query(api.users.getAllPatients, {})).toEqual([]);
    expect(await app.anon.query(api.users.getById, { id: app.patientId })).toBeNull();
    expect(await app.anon.query(api.consultations.get, { id: consultationId })).toBeNull();
    expect(
      await app.anon.query(api.consultations.listForDoctor, { doctorId: app.doctorId })
    ).toEqual([]);
    expect(
      await app.anon.query(api.notifications.getPatientNotifications, { patientId: app.patientId })
    ).toEqual([]);
  });

  test("a patient sees only their own records", async () => {
    const app = await setup();
    const mine = await addConsultation(app, { patientId: app.patientId });
    const theirs = await addConsultation(app, { patientId: app.otherPatientId });
    expect(await app.patient.query(api.consultations.get, { id: mine })).not.toBeNull();
    expect(await app.patient.query(api.consultations.get, { id: theirs })).toBeNull();
    expect(
      await app.patient.query(api.consultations.listConsultationsForPatient, {
        patientId: app.otherPatientId,
      })
    ).toEqual([]);
    expect(await app.patient.query(api.users.getById, { id: app.otherPatientId })).toBeNull();
    expect(await app.patient.query(api.users.getAllPatients, {})).toEqual([]);
  });

  test("patients can look up doctors, but not other patients", async () => {
    const app = await setup();
    const doctor = await app.patient.query(api.users.getById, { id: app.doctorId });
    expect(doctor?.role).toBe("doctor");
    expect(await app.patient.query(api.users.getById, { id: app.otherPatientId })).toBeNull();
  });

  test("doctors can read every patient's records", async () => {
    const app = await setup();
    await addConsultation(app, { patientId: app.patientId });
    await addConsultation(app, { patientId: app.otherPatientId });
    expect(await app.doctor.query(api.users.getAllPatients, {})).toHaveLength(2);
    expect(
      await app.doctor.query(api.consultations.listForDoctor, { doctorId: app.doctorId })
    ).toHaveLength(2);
  });

  test("a doctor cannot list another doctor's consultations", async () => {
    const app = await setup();
    await addConsultation(app);
    const otherDoctorId = await app.t.run(async (ctx) =>
      ctx.db.insert("users", { name: "Dr. Two", tokenIdentifier: "user_doctor2", role: "doctor" })
    );
    const doctor2 = app.t.withIdentity({ subject: "user_doctor2" });
    expect(
      await doctor2.query(api.consultations.listForDoctor, { doctorId: app.doctorId })
    ).toEqual([]);
    expect(
      await doctor2.query(api.consultations.listForDoctor, { doctorId: otherDoctorId })
    ).toEqual([]);
  });

  test("consent-status listing is limited to the viewer's own matches for patients", async () => {
    const app = await setup();
    const trialId = await addTrial(app, "Trial", ["Asthma"]);
    const mine = await addConsultation(app, { patientId: app.patientId });
    const theirs = await addConsultation(app, { patientId: app.otherPatientId });
    await addMatch(app, mine, trialId, app.patientId);
    await addMatch(app, theirs, trialId, app.otherPatientId);
    const asPatient = await app.patient.query(api.notifications.getTrialsByConsentStatus, {
      consentStatus: "pending",
    });
    expect(asPatient).toHaveLength(1);
    expect(asPatient[0]?.match.patientId).toBe(app.patientId);
    expect(
      await app.doctor.query(api.notifications.getTrialsByConsentStatus, { consentStatus: "pending" })
    ).toHaveLength(2);
    expect(
      await app.anon.query(api.notifications.getTrialsByConsentStatus, { consentStatus: "pending" })
    ).toEqual([]);
  });
});

describe("who can change what", () => {
  test("only doctors can create consultations and upload audio", async () => {
    const app = await setup();
    const args = { doctorId: app.doctorId, patientId: app.patientId };
    await expect(app.anon.mutation(api.consultations.create, args)).rejects.toThrow("Not authenticated");
    await expect(app.patient.mutation(api.consultations.create, args)).rejects.toThrow("Not authorized");
    await expect(app.patient.mutation(api.audio.generateUploadUrl, {})).rejects.toThrow("Not authorized");
    await expect(app.doctor.mutation(api.consultations.create, args)).resolves.toBeTruthy();
  });

  test("patients cannot run AI actions or generate reports", async () => {
    const app = await setup();
    const consultationId = await addConsultation(app);
    await expect(
      app.patient.action(api.medicalReports.generateMedicalReport, { consultationId })
    ).rejects.toThrow("Not authorized");
    await expect(
      app.anon.action(api.medicalEntityExtraction.extractEntitiesFromTranscription, {
        transcription: "x",
      })
    ).rejects.toThrow("Not authenticated");
  });

  test("a meeting can only be created by its own doctor or requested by its own patient", async () => {
    const app = await setup();
    const base = { title: "Visit", scheduledDate: Date.now() + 86_400_000 };
    await expect(
      app.doctor.mutation(api.meetings.createMeeting, {
        ...base, doctorId: app.doctorId, patientId: app.patientId,
      })
    ).resolves.toBeTruthy();
    await expect(
      app.patient.mutation(api.meetings.createMeeting, {
        ...base, doctorId: app.doctorId, patientId: app.patientId,
      })
    ).resolves.toBeTruthy();
    await expect(
      app.other.mutation(api.meetings.createMeeting, {
        ...base, doctorId: app.doctorId, patientId: app.patientId,
      })
    ).rejects.toThrow("Not authorized");
    await expect(
      app.anon.mutation(api.meetings.createMeeting, {
        ...base, doctorId: app.doctorId, patientId: app.patientId,
      })
    ).rejects.toThrow("Not authenticated");
  });

  test("consent can only be changed by the match's own patient (or a doctor)", async () => {
    const app = await setup();
    const trialId = await addTrial(app, "Trial", ["Asthma"]);
    const consultationId = await addConsultation(app);
    const matchId = await addMatch(app, consultationId, trialId);
    const args = { matchId, consentStatus: "approved" as const };
    await expect(app.other.mutation(api.notifications.updatePatientConsent, args)).rejects.toThrow("Not authorized");
    await expect(app.anon.mutation(api.notifications.updatePatientConsent, args)).rejects.toThrow("Not authenticated");
    await expect(app.patient.mutation(api.notifications.updatePatientConsent, args)).resolves.not.toThrow();
  });
});
