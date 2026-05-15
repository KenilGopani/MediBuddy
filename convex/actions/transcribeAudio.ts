"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { internal } from "../_generated/api";

const MOCK_TRANSCRIPT =
  "Doctor: Good morning, how are you feeling today? Patient: I've been having persistent headaches for the past two weeks, along with some dizziness and blurred vision. Doctor: I see. Have you noticed any other symptoms? Any nausea, sensitivity to light? Patient: Yes, some nausea, especially in the mornings. And I've been more tired than usual. Doctor: Are you currently taking any medications? Patient: I take lisinopril for high blood pressure and metformin for type 2 diabetes. I also have a seasonal allergy to pollen. Doctor: Let me check your vitals. Blood pressure is 145 over 92, heart rate 78, temperature 98.6. Your weight is 185 pounds. I'd like to run some additional tests. Given your symptoms, we should look into potential neurological causes. I'm going to refer you for an MRI and adjust your blood pressure medication. Patient: Should I be worried? Doctor: Let's not jump to conclusions. These symptoms could be related to your blood pressure. We'll start with the tests and go from there. I'm also prescribing sumatriptan for the headaches.";

export const transcribe = action({
  args: {
    audioBase64: v.string(),
    transcriptId: v.id("transcripts"),
    appointmentId: v.string(),
  },
  handler: async (ctx, args) => {
    const groqApiKey = process.env.GROQ_API_KEY;

    let transcriptText: string;

    if (!groqApiKey) {
      // Demo mode — return mock transcript
      console.log("GROQ_API_KEY not set, using demo mode");
      transcriptText = MOCK_TRANSCRIPT;
    } else {
      // Decode base64 to binary
      const binaryString = atob(args.audioBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Create form data for Groq API
      const blob = new Blob([bytes], { type: "audio/webm" });
      const formData = new FormData();
      formData.append("file", blob, "audio.webm");
      formData.append("model", "whisper-large-v3");
      formData.append("response_format", "text");

      // Call Groq Whisper API with retry logic
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await fetch(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${groqApiKey}`,
              },
              body: formData,
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
              `Groq API error (${response.status}): ${errorText}`
            );
          }

          transcriptText = await response.text();
          lastError = null;
          break;
        } catch (error) {
          lastError = error as Error;
          if (attempt < 2) {
            // Exponential backoff
            await new Promise((resolve) =>
              setTimeout(resolve, Math.pow(2, attempt) * 1000)
            );
          }
        }
      }

      if (lastError) {
        throw new Error(
          `Failed to transcribe after 3 attempts: ${lastError.message}`
        );
      }

      transcriptText = transcriptText!;
    }

    // Store chunk in transcript
    await ctx.runMutation(internal.transcripts.appendChunk, {
      transcriptId: args.transcriptId,
      text: transcriptText,
      timestamp: Date.now(),
    });

    return transcriptText;
  },
});
