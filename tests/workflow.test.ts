import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { api } from "../convex/_generated/api";
import { addConsultation, addMatch, addTrial, setup, DAY } from "./helpers";

// Routes every outbound request. The language model, ASI-1 and ClinicalTrials.gov are faked,
// so these tests need no network and no API keys.
function mockNetwork(llm: (body: { messages: unknown[] }) => string) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.startsWith("https://llm.test")) {
      const body = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({ choices: [{ message: { content: llm(body) } }] }));
    }
    return new Response("unavailable", { status: 503 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  process.env.LLM_API_KEY = "test-key";
  process.env.LLM_MODEL = "test-model";
  process.env.LLM_BASE_URL = "https://llm.test/v1";
});
afterEach(() => vi.unstubAllGlobals());

describe("meetings", () => {
  test("a doctor can schedule, complete and delete an appointment; patients see it while upcoming", async () => {
    const app = await setup();
    const meeting = (await app.doctor.mutation(api.meetings.createMeeting, {
      doctorId: app.doctorId,
      patientId: app.patientId,
      title: "Follow-up",
      scheduledDate: Date.now() + 3 * DAY,
      duration: 30,
      type: "follow-up",
    }))!;
    const upcoming = await app.patient.query(api.meetings.getUpcomingMeetingsForPatient, {
      patientId: app.patientId,
    });
    expect(upcoming.map((m) => m._id)).toEqual([meeting._id]);
    expect(
      await app.doctor.query(api.meetings.getUpcomingMeetingsForDoctor, { doctorId: app.doctorId })
    ).toHaveLength(1);

    await app.doctor.mutation(api.meetings.updateMeetingStatus, {
      meetingId: meeting._id,
      status: "completed",
    });
    expect((await app.doctor.query(api.meetings.getMeetingById, { id: meeting._id }))?.status).toBe("completed");
    expect(
      await app.patient.query(api.meetings.getUpcomingMeetingsForPatient, { patientId: app.patientId })
    ).toEqual([]);

    await app.doctor.mutation(api.meetings.deleteMeeting, { meetingId: meeting._id });
    expect(await app.doctor.query(api.meetings.getMeetingById, { id: meeting._id })).toBeNull();
  });

  test("another patient cannot see or change the meeting", async () => {
    const app = await setup();
    const meeting = (await app.doctor.mutation(api.meetings.createMeeting, {
      doctorId: app.doctorId,
      patientId: app.patientId,
      scheduledDate: Date.now() + DAY,
    }))!;
    expect(await app.other.query(api.meetings.getMeetingById, { id: meeting._id })).toBeNull();
    await expect(
      app.other.mutation(api.meetings.deleteMeeting, { meetingId: meeting._id })
    ).rejects.toThrow("Not authorized");
  });
});

describe("sharing a consultation", () => {
  test("a report must exist before it can be shared, and sharing makes it visible to the patient", async () => {
    const app = await setup();
    const id = await app.doctor.mutation(api.consultations.create, {
      doctorId: app.doctorId,
      patientId: app.patientId,
    });
    await app.doctor.mutation(api.consultations.updateTranscription, {
      id,
      transcription: "Doctor: Hi\nPatient: Hello",
    });
    await app.doctor.mutation(api.consultations.complete, { id });
    await expect(
      app.doctor.mutation(api.consultations.shareWithPatient, { id, doctorId: app.doctorId })
    ).rejects.toThrow("report must be generated");

    await app.t.run(async (ctx) => ctx.db.patch(id, { medicalReport: "**S (Subjective):** x" }));
    expect(
      await app.patient.query(api.consultations.listSharedConsultationsForPatient, {
        patientId: app.patientId,
      })
    ).toEqual([]);
    await app.doctor.mutation(api.consultations.shareWithPatient, { id, doctorId: app.doctorId });
    const shared = await app.patient.query(api.consultations.listSharedConsultationsForPatient, {
      patientId: app.patientId,
    });
    expect(shared.map((c) => c._id)).toEqual([id]);
  });
});

describe("visit recordings", () => {
  async function withRecording(shared: boolean) {
    const app = await setup();
    const consultationId = await addConsultation(app, { shared });
    const storageId = await app.t.run(async (ctx) => ctx.storage.store(new Blob(["audio bytes"])));
    const recordingId = await app.t.run(async (ctx) =>
      ctx.db.insert("audioRecordings", {
        consultationId,
        fileId: storageId,
        fileName: "visit.m4a",
        fileType: "audio/mp4",
        fileSize: 11,
        status: "completed",
        uploadTime: Date.now(),
        createdAt: Date.now(),
      })
    );
    return { app, consultationId, recordingId };
  }

  test("doctors can always play a recording", async () => {
    const { app, consultationId, recordingId } = await withRecording(false);
    expect(await app.doctor.query(api.audio.getAudioRecordingsForConsultation, { consultationId })).toHaveLength(1);
    expect(await app.doctor.query(api.audio.generateAudioUrl, { audioRecordingId: recordingId })).toBeTruthy();
  });

  test("a patient can play a recording only after the doctor shares the visit", async () => {
    const unshared = await withRecording(false);
    expect(
      await unshared.app.patient.query(api.audio.getAudioRecordingsForConsultation, {
        consultationId: unshared.consultationId,
      })
    ).toEqual([]);
    expect(
      await unshared.app.patient.query(api.audio.generateAudioUrl, { audioRecordingId: unshared.recordingId })
    ).toBeNull();

    const shared = await withRecording(true);
    expect(
      await shared.app.patient.query(api.audio.getAudioRecordingsForConsultation, {
        consultationId: shared.consultationId,
      })
    ).toHaveLength(1);
    expect(
      await shared.app.patient.query(api.audio.generateAudioUrl, { audioRecordingId: shared.recordingId })
    ).toBeTruthy();
  });

  test("other patients and anonymous callers can never play it", async () => {
    const { app, consultationId, recordingId } = await withRecording(true);
    for (const who of [app.other, app.anon]) {
      expect(await who.query(api.audio.getAudioRecordingsForConsultation, { consultationId })).toEqual([]);
      expect(await who.query(api.audio.generateAudioUrl, { audioRecordingId: recordingId })).toBeNull();
    }
  });
});

describe("trial consent", () => {
  test("the patient's decision is saved with a history entry, and can be read back", async () => {
    const app = await setup();
    const trialId = await addTrial(app, "Trial", ["Asthma"]);
    const matchId = await addMatch(app, await addConsultation(app), trialId);
    await app.patient.mutation(api.notifications.updatePatientConsent, {
      matchId,
      consentStatus: "approved",
      patientResponse: "Happy to take part",
    });
    const notifications = await app.patient.query(api.notifications.getPatientNotifications, {
      patientId: app.patientId,
    });
    expect(notifications[0]).toMatchObject({ consentStatus: "approved" });
    const history = await app.patient.query(api.notifications.getConsentHistory, { matchId });
    expect(history?.length).toBeGreaterThan(0);
    expect(JSON.stringify(history)).toContain("approved");
  });

  test("viewing a notification marks it viewed and lowers the unread count", async () => {
    const app = await setup();
    const trialId = await addTrial(app, "Trial", ["Asthma"]);
    const matchId = await addMatch(app, await addConsultation(app), trialId);
    const count = () =>
      app.patient.query(api.notifications.getUnreadNotificationCount, { patientId: app.patientId });
    expect(await count()).toBe(1);
    await app.patient.mutation(api.notifications.markNotificationViewed, { notificationId: matchId });
    expect(await count()).toBe(0);
  });
});

describe("trial matching", () => {
  async function match(conditionNames: string[], trialConditions: string[][]) {
    const app = await setup();
    // Age and gender fit every trial, so only the condition decides whether a trial matches.
    // Without the condition requirement, these points alone would clear the 50-point cutoff.
    await app.t.run(async (ctx) => ctx.db.patch(app.patientId, { age: 40, gender: "female" }));
    const consultationId = await addConsultation(app, { conditions: conditionNames });
    for (const [i, targets] of trialConditions.entries()) {
      await addTrial(app, `Trial ${i}`, targets, { ageRange: { min: 18, max: 90 } });
    }
    await app.doctor.action(api.trialMatching.findMatchingTrials, { consultationId });
    const matches = await app.doctor.query(api.trialMatching.listMatchesForConsultation, { consultationId });
    const trials = await app.doctor.query(api.trialMatching.listActiveTrials, {});
    return matches.map((m) => trials.find((t) => t._id === m.trialId)!.targetConditions[0]);
  }

  test("a trial for an unrelated condition is not matched", async () => {
    expect(await match(["Acute bronchitis"], [["Breast Cancer"], ["Migraine"]])).toEqual([]);
  });

  test("a trial for the patient's condition is matched, including by abbreviation", async () => {
    expect(await match(["Chronic obstructive pulmonary disease"], [["COPD"], ["Migraine"]])).toEqual(["COPD"]);
  });

  test("only the relevant trials are matched when several exist", async () => {
    expect(
      (await match(["Type 2 diabetes mellitus", "Hypertension"], [["Type 2 Diabetes"], ["Hypertension"], ["Asthma"]])).sort()
    ).toEqual(["Hypertension", "Type 2 Diabetes"]);
  });

  test("patients cannot trigger matching", async () => {
    const app = await setup();
    const consultationId = await addConsultation(app);
    await expect(
      app.patient.action(api.trialMatching.findMatchingTrials, { consultationId })
    ).rejects.toThrow("Not authorized");
  });
});

describe("AI features", () => {
  const entities = {
    conditions: [{ name: "Acute bronchitis", severity: "moderate" }],
    medications: ["Atorvastatin 20 mg"],
    allergies: ["Sulfa drugs"],
    symptoms: ["Cough"],
    labResults: {},
    comorbidities: [],
    vitals: { Temperature: "38.4" },
  };

  test("extraction saves structured data and then matches trials", async () => {
    const fetchMock = mockNetwork(() => JSON.stringify(entities));
    const app = await setup();
    await addTrial(app, "Bronchitis study", ["Acute bronchitis"]);
    await addTrial(app, "Unrelated study", ["Migraine"]);
    const consultationId = await app.doctor.mutation(api.consultations.create, {
      doctorId: app.doctorId,
      patientId: app.patientId,
    });
    await app.doctor.mutation(api.consultations.updateTranscription, {
      id: consultationId,
      transcription: "Doctor: What is wrong?\nPatient: A cough. I take atorvastatin. Allergic to sulfa.",
    });

    await app.doctor.action(api.medicalEntityExtraction.extractMedicalEntities, { consultationId });

    const consultation = await app.doctor.query(api.consultations.get, { id: consultationId });
    expect(consultation?.structuredData?.conditions[0]?.name.toLowerCase()).toBe("acute bronchitis");
    expect(consultation?.structuredData?.allergies.map((a) => a.toLowerCase())).toEqual(["sulfa drugs"]);
    const matches = await app.doctor.query(api.trialMatching.listMatchesForConsultation, { consultationId });
    expect(matches).toHaveLength(1);
    // the prompt sent to the model contains the transcript
    const llmCall = fetchMock.mock.calls.find((c) => String(c[0]).startsWith("https://llm.test"));
    const sent = JSON.parse(String(llmCall?.[1]?.body));
    expect(JSON.stringify(sent.messages)).toContain("atorvastatin");
  });

  test("extraction still succeeds when the optional ASI-1 and ClinicalTrials.gov services are down", async () => {
    mockNetwork(() => JSON.stringify(entities));
    const app = await setup();
    const consultationId = await addConsultation(app);
    await expect(
      app.doctor.action(api.medicalEntityExtraction.extractMedicalEntities, { consultationId })
    ).resolves.toBeTruthy();
  });

  test("a model that wraps its JSON in text and code fences is handled", async () => {
    mockNetwork(() => "Sure! Here it is:\n```json\n" + JSON.stringify(entities) + "\n```");
    const app = await setup();
    const result = await app.doctor.action(api.medicalEntityExtraction.extractEntitiesFromTranscription, {
      transcription: "Doctor: x\nPatient: y",
    });
    expect(result.medications.map((m: string) => m.toLowerCase())).toEqual(["atorvastatin 20 mg"]);
  });

  test("extraction reports a clear error when the model call fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("invalid api key", { status: 401 })));
    const app = await setup();
    const consultationId = await addConsultation(app);
    await expect(
      app.doctor.action(api.medicalEntityExtraction.extractMedicalEntities, { consultationId })
    ).rejects.toThrow(/LLM API error: 401/);
    // the action retries with exponential backoff (about 7s) before giving up
  }, 30_000);

  test("a report is generated, saved on the consultation, and can then be shared", async () => {
    const report =
      "**S (Subjective):**\nCough.\n\n**O (Objective):**\nTemp 38.4.\n\n**A (Assessment):**\nBronchitis.\n\n**P (Plan):**\nRest.";
    mockNetwork(() => report);
    const app = await setup();
    const consultationId = await addConsultation(app);
    await app.t.run(async (ctx) => ctx.db.patch(consultationId, { medicalReport: undefined }));

    await app.doctor.action(api.medicalReports.generateMedicalReport, { consultationId });
    const saved = await app.doctor.query(api.medicalReports.getMedicalReport, { consultationId });
    expect(saved?.reportContent).toBe(report);

    await app.doctor.mutation(api.consultations.shareWithPatient, { id: consultationId, doctorId: app.doctorId });
    const patientView = await app.patient.query(api.medicalReports.getMedicalReport, { consultationId });
    expect(patientView?.reportContent).toBe(report);
    expect(await app.other.query(api.medicalReports.getMedicalReport, { consultationId })).toBeNull();
  });
});
