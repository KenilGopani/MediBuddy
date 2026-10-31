import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { canAccessConsultation, requireDoctor, requireDoctorAction } from "./authz";
import { api, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { chatCompletion } from "./llm";

// Action to generate medical report using the configured LLM
export const generateMedicalReport = action({
  args: {
    consultationId: v.id("consultations"),
  },
  handler: async (ctx, args) => {
    await requireDoctorAction(ctx);
    // Get the consultation data
    const consultation = await ctx.runQuery(internal.consultations.getInternal, {
      id: args.consultationId,
    });

    if (!consultation) {
      throw new Error("Consultation not found");
    }

    if (!consultation.transcription) {
      throw new Error("No transcription available for this consultation");
    }

    try {
      // Prepare the prompt for SOAP format medical report
      const prompt = `
You are a medical professional creating a SOAP format medical report. Based on the consultation transcription below, generate ONLY the following sections with actual medical content:

**REQUIRED FORMAT - RESPOND EXACTLY AS SHOWN:**

**S (Subjective):**
[Extract and summarize patient's reported symptoms, complaints, medical history, and concerns from the transcription. Include chief complaint, history of present illness, and relevant past medical history.]

**O (Objective):**
[Document observable findings, vital signs, physical examination results, and any diagnostic test results mentioned in the transcription. If specific vitals aren't mentioned, note "Vital signs: [as documented]" or similar.]

**A (Assessment):**
[Provide medical diagnosis, clinical impression, and differential diagnoses based on the subjective and objective findings. Include severity and clinical reasoning.]

**P (Plan):**
[Detail treatment plan including medications prescribed, procedures recommended, lifestyle modifications, follow-up appointments, and patient education provided.]

**ICD-10 Codes:**
[List relevant ICD-10 diagnostic codes with descriptions for the primary and secondary diagnoses identified]

**IMPORTANT INSTRUCTIONS:**
- Use ONLY the exact section headers shown above with ** formatting
- Each section MUST contain actual medical content based on the transcription
- Do NOT include any introductory text, explanations, or additional sections
- Keep content concise but medically comprehensive
- Use professional medical terminology
- If information is not available in transcription, note appropriately (e.g., "Not documented in this consultation")

**Consultation Transcription:**
${consultation.transcription}

**Structured Medical Data:**
${consultation.structuredData ? JSON.stringify(consultation.structuredData, null, 2) : "No additional structured data"}
`;

      const generatedReport = await chatCompletion({
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        maxTokens: 4000,
      });

      if (!generatedReport) {
        throw new Error("No report generated from the AI model");
      }

      // Store the medical report
      await ctx.runMutation(api.medicalReports.storeMedicalReport, {
        consultationId: args.consultationId,
        reportContent: generatedReport,
        generatedAt: Date.now(),
      });

      return generatedReport;
    } catch (error) {
      console.error("Error generating medical report:", error);
      throw new Error(
        `Failed to generate medical report: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  },
});

// Mutation to store the generated medical report
export const storeMedicalReport = mutation({
  args: {
    consultationId: v.id("consultations"),
    reportContent: v.string(),
    generatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    await requireDoctor(ctx);
    // Update the consultation with the medical report
    await ctx.db.patch(args.consultationId, {
      medicalReport: args.reportContent,
      reportGeneratedAt: args.generatedAt,
      updatedAt: Date.now(),
    });

    return args.consultationId;
  },
});

// Query to get medical report for a consultation
export const getMedicalReport = query({
  args: {
    consultationId: v.id("consultations"),
  },
  handler: async (ctx, args) => {
    if (!(await canAccessConsultation(ctx, args.consultationId))) return null;
    const consultation = await ctx.db.get(args.consultationId);
    if (!consultation) {
      return null;
    }

    return {
      reportContent: consultation.medicalReport,
      generatedAt: consultation.reportGeneratedAt,
    };
  },
});
