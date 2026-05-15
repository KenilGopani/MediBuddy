"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

const MOCK_SUMMARY = {
  conditions: ["Hypertension", "Type 2 Diabetes", "Chronic Migraine"],
  medications: ["Lisinopril", "Metformin", "Sumatriptan"],
  symptoms: [
    "Persistent headaches",
    "Dizziness",
    "Blurred vision",
    "Morning nausea",
    "Fatigue",
  ],
  allergies: ["Pollen (seasonal)"],
  vitals: {
    bloodPressure: "145/92 mmHg",
    heartRate: "78 bpm",
    temperature: "98.6°F",
    weight: "185 lbs",
  },
  doctorNotes:
    "Patient presents with persistent headaches (2 weeks), dizziness, and blurred vision. Elevated BP at 145/92. Referred for MRI to rule out neurological causes. Adjusting blood pressure medication. Prescribed sumatriptan for headache management. Follow-up in 2 weeks after test results.",
};

export const summarize = action({
  args: {
    transcriptText: v.string(),
    appointmentId: v.string(),
    transcriptId: v.string(),
    patientId: v.string(),
  },
  handler: async (ctx, args) => {
    const geminiApiKey = process.env.GEMINI_API_KEY;

    let summaryData: typeof MOCK_SUMMARY;

    if (!geminiApiKey) {
      // Demo mode
      console.log("GEMINI_API_KEY not set, using demo mode");
      summaryData = MOCK_SUMMARY;
    } else {
      const prompt = `You are a medical data extractor. From the following doctor-patient consultation transcript, extract and return ONLY a valid JSON object with these exact fields:
{
  "conditions": string[] (diagnosed or discussed conditions),
  "medications": string[] (current and newly prescribed),
  "symptoms": string[] (reported symptoms),
  "allergies": string[] (known allergies),
  "vitals": {
    "bloodPressure": string,
    "heartRate": string,
    "temperature": string,
    "weight": string
  },
  "doctorNotes": string (brief clinical summary)
}

Return ONLY the JSON, no markdown formatting, no code blocks, no explanations.

Transcript:
${args.transcriptText}`;

      let lastError: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                  temperature: 0.1,
                  maxOutputTokens: 2048,
                },
              }),
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Gemini API error (${response.status}): ${errorText}`
            );
          }

          const data = await response.json();
          const responseText =
            data.candidates?.[0]?.content?.parts?.[0]?.text || "";

          // Clean up response — remove markdown code blocks if present
          const cleanedText = responseText
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "")
            .trim();

          summaryData = JSON.parse(cleanedText);
          lastError = null;
          break;
        } catch (error) {
          lastError = error as Error;
          if (attempt < 2) {
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, attempt) * 1000)
            );
          }
        }
      }

      if (lastError) {
        throw new Error(
          `Failed to summarize after 3 attempts: ${lastError.message}`
        );
      }

      summaryData = summaryData!;
    }

    // Store in medicalSummaries table
    const summaryId = await ctx.runMutation(internal.summaries.store, {
      appointmentId: args.appointmentId,
      transcriptId: args.transcriptId,
      patientId: args.patientId,
      conditions: summaryData.conditions || [],
      medications: summaryData.medications || [],
      symptoms: summaryData.symptoms || [],
      allergies: summaryData.allergies || [],
      vitals: {
        bloodPressure: summaryData.vitals?.bloodPressure,
        heartRate: summaryData.vitals?.heartRate,
        temperature: summaryData.vitals?.temperature,
        weight: summaryData.vitals?.weight,
      },
      doctorNotes: summaryData.doctorNotes || "",
      rawSummaryJson: JSON.stringify(summaryData),
    });

    return { summaryId: summaryId.toString(), summaryData };
  },
});
