"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

const MOCK_TRIALS = [
  {
    trialId: "NCT05847231",
    title:
      "Efficacy of Erenumab in Chronic Migraine with Comorbid Hypertension",
    phase: "Phase 3",
    condition: "Chronic Migraine with Hypertension",
    eligibilitySummary:
      "Adults 18-65 with chronic migraine (≥15 headache days/month) and comorbid hypertension. Must be on stable antihypertensive therapy.",
    relevanceScore: 92,
    rationale:
      "Patient has chronic migraine symptoms with comorbid hypertension (145/92 mmHg). Currently on lisinopril for BP management. Erenumab (anti-CGRP) has shown efficacy in reducing migraine frequency without cardiovascular side effects.",
    sponsorName: "Novartis Pharmaceuticals",
    location: "Mayo Clinic, Rochester, MN",
    contactEmail: "migraine.trial@novartis.com",
  },
  {
    trialId: "NCT06291483",
    title:
      "SGLT2 Inhibitor Combination Therapy for Type 2 Diabetes with Cardiovascular Risk",
    phase: "Phase 2",
    condition: "Type 2 Diabetes with CV Risk",
    eligibilitySummary:
      "Adults with T2D on metformin monotherapy, HbA1c 7.0-10.0%, with at least one cardiovascular risk factor (hypertension, obesity, dyslipidemia).",
    relevanceScore: 87,
    rationale:
      "Patient has Type 2 Diabetes managed with metformin and elevated blood pressure as a CV risk factor. SGLT2 inhibitors provide dual cardiorenal protection alongside glycemic control.",
    sponsorName: "AstraZeneca",
    location: "Johns Hopkins Medical Center, Baltimore, MD",
    contactEmail: "diabetes.research@astrazeneca.com",
  },
  {
    trialId: "NCT05392067",
    title:
      "Novel Angiotensin Receptor-Neprilysin Inhibitor for Resistant Hypertension",
    phase: "Phase 3",
    condition: "Resistant Hypertension",
    eligibilitySummary:
      "Adults with BP ≥140/90 despite treatment with ≥2 antihypertensive agents including a diuretic. Exclusion: secondary hypertension, eGFR <30.",
    relevanceScore: 78,
    rationale:
      "Patient's blood pressure remains elevated at 145/92 despite lisinopril therapy, suggesting possible resistant hypertension. ARNI therapy may provide superior BP reduction.",
    sponsorName: "Merck & Co.",
    location: "Cleveland Clinic, Cleveland, OH",
    contactEmail: "hypertension.study@merck.com",
  },
  {
    trialId: "NCT06183920",
    title:
      "Digital Therapeutics for Migraine Management with Real-time Biomarker Tracking",
    phase: "Phase 2",
    condition: "Episodic and Chronic Migraine",
    eligibilitySummary:
      "Adults 18-60 with episodic or chronic migraine. Must own a smartphone. Excludes patients with medication overuse headache.",
    relevanceScore: 71,
    rationale:
      "Patient experiences persistent headaches with associated symptoms (dizziness, nausea). A digital therapeutic approach could complement pharmacological treatment with real-time symptom tracking.",
    sponsorName: "Biogen Digital Health",
    location: "Stanford Medical Center, Palo Alto, CA",
    contactEmail: "digital.migraine@biogen.com",
  },
  {
    trialId: "NCT05628104",
    title:
      "Integrated Care Model for Diabetes-Hypertension Comorbidity: AI-Guided Treatment Optimization",
    phase: "Phase 4",
    condition: "Type 2 Diabetes with Hypertension",
    eligibilitySummary:
      "Adults with both T2D and hypertension, on stable medication for ≥3 months. HbA1c <9.0%, BP <180/110.",
    relevanceScore: 65,
    rationale:
      "Patient has dual diagnosis of T2D and hypertension, both requiring ongoing management. This trial uses AI-guided algorithms to optimize medication dosing for both conditions simultaneously.",
    sponsorName: "Roche Diagnostics",
    location: "Mount Sinai Hospital, New York, NY",
    contactEmail: "integrated.care@roche.com",
  },
];

export const matchTrials = action({
  args: {
    summaryJson: v.string(),
    appointmentId: v.string(),
    patientId: v.string(),
    summaryId: v.string(),
  },
  handler: async (ctx, args) => {
    const geminiApiKey = process.env.GEMINI_API_KEY;

    let trials: typeof MOCK_TRIALS;

    if (!geminiApiKey) {
      // Demo mode
      console.log("GEMINI_API_KEY not set, using demo trial matches");
      trials = MOCK_TRIALS;
    } else {
      const prompt = `You are an autonomous clinical trial matching agent (ASI-1). Given this patient's medical profile, find and return the top 5 most relevant clinical trials.

Patient Medical Profile:
${args.summaryJson}

Return ONLY a valid JSON array where each item has these exact fields:
{
  "trialId": string (generate a realistic NCT-style ID like "NCT05847231"),
  "title": string (realistic clinical trial title),
  "phase": string ("Phase 1", "Phase 2", "Phase 3", or "Phase 4"),
  "condition": string (target condition),
  "eligibilitySummary": string (key eligibility criteria),
  "relevanceScore": number (0-100, how relevant to this patient),
  "rationale": string (detailed explanation of why this trial matches the patient),
  "sponsorName": string (realistic pharmaceutical company),
  "location": string (realistic US medical center),
  "contactEmail": string (realistic contact email)
}

Make the trials medically appropriate and realistic. Return ONLY the JSON array, no markdown, no code blocks.`;

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
                  temperature: 0.3,
                  maxOutputTokens: 4096,
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

          const cleanedText = responseText
            .replace(/```json\s*/g, "")
            .replace(/```\s*/g, "")
            .trim();

          trials = JSON.parse(cleanedText);
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
          `Failed to match trials after 3 attempts: ${lastError.message}`
        );
      }

      trials = trials!;
    }

    // Store in trialMatches table
    await ctx.runMutation(internal.trialMatches.store, {
      appointmentId: args.appointmentId,
      patientId: args.patientId,
      summaryId: args.summaryId,
      trials: trials.map((t) => ({
        trialId: t.trialId,
        title: t.title,
        phase: t.phase,
        condition: t.condition,
        eligibilitySummary: t.eligibilitySummary,
        relevanceScore: t.relevanceScore,
        rationale: t.rationale,
        sponsorName: t.sponsorName,
        location: t.location,
        contactEmail: t.contactEmail,
      })),
    });

    return trials;
  },
});
