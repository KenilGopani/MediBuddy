import { useState, useCallback, useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Loader2,
  FileText,
  Brain,
  FlaskConical,
  User,
  ChevronDown,
} from "lucide-react";
import { cn, formatDuration } from "../../lib/utils";
import { AudioRecorder } from "../../lib/audioRecorder";
import TranscriptViewer from "./TranscriptViewer";
import MedicalSummaryCard from "./MedicalSummaryCard";
import TrialMatchesPanel from "./TrialMatchesPanel";
import type { Id } from "../../../convex/_generated/dataModel";

const isDemoMode =
  !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  !import.meta.env.VITE_CONVEX_URL;

type ProcessingState =
  | "idle"
  | "recording"
  | "paused"
  | "transcribing"
  | "summarizing"
  | "matching"
  | "complete";

interface DemoSummary {
  conditions: string[];
  medications: string[];
  symptoms: string[];
  allergies: string[];
  vitals: {
    bloodPressure?: string;
    heartRate?: string;
    temperature?: string;
    weight?: string;
  };
  doctorNotes: string;
}

interface DemoTrial {
  trialId: string;
  title: string;
  phase: string;
  condition: string;
  eligibilitySummary: string;
  relevanceScore: number;
  rationale: string;
  sponsorName: string;
  location: string;
  contactEmail: string;
}

const DEMO_PATIENTS = [
  { id: "patient1", name: "Sarah Johnson" },
  { id: "patient2", name: "Michael Chen" },
  { id: "patient3", name: "Emily Rodriguez" },
];

export default function StartConsultation() {
  const [selectedPatient, setSelectedPatient] = useState("");
  const [processingState, setProcessingState] = useState<ProcessingState>("idle");
  const [duration, setDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<"transcript" | "summary" | "trials">("transcript");
  const [transcriptText, setTranscriptText] = useState("");
  const [summaryData, setSummaryData] = useState<DemoSummary | null>(null);
  const [trialData, setTrialData] = useState<DemoTrial[]>([]);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<AudioRecorder | null>(null);

  const authData = isDemoMode ? null : useAuth();
  const userId = isDemoMode ? "demo-doctor" : authData?.userId;

  // Convex hooks (only used in non-demo mode)
  const transcribeAction = isDemoMode ? null : useAction(api.actions.transcribeAudio.transcribe);
  const summarizeAction = isDemoMode ? null : useAction(api.actions.summarize.summarize);
  const matchAction = isDemoMode ? null : useAction(api.actions.matchTrials.matchTrials);

  const patients = isDemoMode
    ? DEMO_PATIENTS
    : useQuery(api.users.getAllPatients) || [];

  const startRecording = useCallback(async () => {
    if (!selectedPatient) {
      setError("Please select a patient first");
      return;
    }

    setError(null);
    setTranscriptText("");
    setSummaryData(null);
    setTrialData([]);

    const recorder = new AudioRecorder();
    recorderRef.current = recorder;

    recorder.onDurationUpdate = (secs) => setDuration(secs);

    recorder.onChunk = async (base64) => {
      // In demo mode, we'll process after stopping
      if (!isDemoMode && transcribeAction) {
        try {
          // In real mode, send to Groq for transcription
          // For now, just log
          console.log("Audio chunk received, length:", base64.length);
        } catch (err) {
          console.error("Transcription error:", err);
        }
      }
    };

    recorder.onError = (err) => {
      setError(err.message);
      setProcessingState("idle");
    };

    try {
      await recorder.start();
      setProcessingState("recording");
    } catch {
      setError("Could not access microphone. Please check permissions.");
    }
  }, [selectedPatient, transcribeAction]);

  const pauseRecording = useCallback(() => {
    recorderRef.current?.pause();
    setProcessingState("paused");
  }, []);

  const resumeRecording = useCallback(() => {
    recorderRef.current?.resume();
    setProcessingState("recording");
  }, []);

  const stopRecording = useCallback(async () => {
    recorderRef.current?.stop();
    setProcessingState("transcribing");

    // Simulate the AI pipeline
    // In real mode, the transcription would have been happening incrementally
    // For demo, we simulate the full pipeline

    try {
      // Step 1: Transcription
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const mockTranscript =
        "Doctor: Good morning, how are you feeling today? Patient: I've been having persistent headaches for the past two weeks, along with some dizziness and blurred vision. Doctor: I see. Have you noticed any other symptoms? Any nausea, sensitivity to light? Patient: Yes, some nausea, especially in the mornings. And I've been more tired than usual. Doctor: Are you currently taking any medications? Patient: I take lisinopril for high blood pressure and metformin for type 2 diabetes. I also have a seasonal allergy to pollen. Doctor: Let me check your vitals. Blood pressure is 145 over 92, heart rate 78, temperature 98.6. Your weight is 185 pounds. I'd like to run some additional tests. Given your symptoms, we should look into potential neurological causes. I'm going to refer you for an MRI and adjust your blood pressure medication. Patient: Should I be worried? Doctor: Let's not jump to conclusions. These symptoms could be related to your blood pressure. We'll start with the tests and go from there. I'm also prescribing sumatriptan for the headaches.";
      setTranscriptText(mockTranscript);

      // Step 2: Summarization
      setProcessingState("summarizing");
      await new Promise((resolve) => setTimeout(resolve, 2500));
      const mockSummary: DemoSummary = {
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
      setSummaryData(mockSummary);
      setActiveTab("summary");

      // Step 3: Trial Matching
      setProcessingState("matching");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const mockTrials: DemoTrial[] = [
        {
          trialId: "NCT05847231",
          title: "Efficacy of Erenumab in Chronic Migraine with Comorbid Hypertension",
          phase: "Phase 3",
          condition: "Chronic Migraine with Hypertension",
          eligibilitySummary: "Adults 18-65 with chronic migraine (≥15 headache days/month) and comorbid hypertension.",
          relevanceScore: 92,
          rationale: "Patient has chronic migraine symptoms with comorbid hypertension (145/92 mmHg). Erenumab has shown efficacy in reducing migraine frequency without cardiovascular side effects.",
          sponsorName: "Novartis Pharmaceuticals",
          location: "Mayo Clinic, Rochester, MN",
          contactEmail: "migraine.trial@novartis.com",
        },
        {
          trialId: "NCT06291483",
          title: "SGLT2 Inhibitor Combination Therapy for Type 2 Diabetes with CV Risk",
          phase: "Phase 2",
          condition: "Type 2 Diabetes with CV Risk",
          eligibilitySummary: "Adults with T2D on metformin, HbA1c 7.0-10.0%, with ≥1 CV risk factor.",
          relevanceScore: 87,
          rationale: "Patient has T2D managed with metformin and elevated blood pressure as a CV risk factor. SGLT2 inhibitors provide dual cardiorenal protection.",
          sponsorName: "AstraZeneca",
          location: "Johns Hopkins, Baltimore, MD",
          contactEmail: "diabetes.research@astrazeneca.com",
        },
        {
          trialId: "NCT05392067",
          title: "Novel ARNI for Resistant Hypertension",
          phase: "Phase 3",
          condition: "Resistant Hypertension",
          eligibilitySummary: "Adults with BP ≥140/90 despite ≥2 antihypertensive agents.",
          relevanceScore: 78,
          rationale: "Patient's BP remains elevated at 145/92 despite lisinopril therapy, suggesting possible resistant hypertension.",
          sponsorName: "Merck & Co.",
          location: "Cleveland Clinic, OH",
          contactEmail: "hypertension.study@merck.com",
        },
        {
          trialId: "NCT06183920",
          title: "Digital Therapeutics for Migraine with Biomarker Tracking",
          phase: "Phase 2",
          condition: "Chronic Migraine",
          eligibilitySummary: "Adults 18-60 with episodic or chronic migraine. Must own smartphone.",
          relevanceScore: 71,
          rationale: "Patient experiences persistent headaches with dizziness and nausea. Digital therapeutics could complement pharmacological treatment.",
          sponsorName: "Biogen Digital Health",
          location: "Stanford Medical Center, CA",
          contactEmail: "digital.migraine@biogen.com",
        },
        {
          trialId: "NCT05628104",
          title: "AI-Guided Treatment for Diabetes-Hypertension Comorbidity",
          phase: "Phase 4",
          condition: "T2D with Hypertension",
          eligibilitySummary: "Adults with both T2D and hypertension, stable medication ≥3 months.",
          relevanceScore: 65,
          rationale: "Patient has dual diagnosis of T2D and hypertension. This trial optimizes medication dosing for both conditions.",
          sponsorName: "Roche Diagnostics",
          location: "Mount Sinai Hospital, NY",
          contactEmail: "integrated.care@roche.com",
        },
      ];
      setTrialData(mockTrials);
      setActiveTab("trials");

      setProcessingState("complete");
    } catch (err) {
      setError("An error occurred during processing. Please try again.");
      setProcessingState("idle");
    }
  }, []);

  const isProcessing = ["transcribing", "summarizing", "matching"].includes(
    processingState
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Start Consultation
        </h1>
        <p className="text-slate-500 mt-1">
          Record, transcribe, and analyze patient consultations
        </p>
      </div>

      {/* Patient Selection */}
      <div className="card">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Patient
        </label>
        <div className="relative">
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            disabled={processingState !== "idle"}
            className="input appearance-none pr-10"
          >
            <option value="">Choose a patient...</option>
            {patients.map((p: { id?: string; _id?: unknown; clerkId?: string; name: string }) => (
              <option key={p.id || (p._id as string)} value={p.id || p.clerkId || ""}>
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Recording Controls */}
      <div className="card">
        <div className="flex flex-col items-center py-8">
          {/* Mic Button */}
          <div className="relative mb-6">
            {processingState === "recording" && (
              <>
                <div className="absolute inset-0 rounded-full bg-red-400/20 animate-ping" style={{ animationDuration: "2s" }} />
                <div className="absolute -inset-3 rounded-full bg-red-400/10 animate-pulse-recording" />
              </>
            )}
            <button
              onClick={
                processingState === "idle"
                  ? startRecording
                  : processingState === "recording"
                    ? pauseRecording
                    : processingState === "paused"
                      ? resumeRecording
                      : undefined
              }
              disabled={isProcessing || processingState === "complete"}
              className={cn(
                "relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg",
                processingState === "idle" &&
                  "bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:shadow-xl hover:scale-105",
                processingState === "recording" &&
                  "bg-gradient-to-br from-red-500 to-red-600",
                processingState === "paused" &&
                  "bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700",
                (isProcessing || processingState === "complete") &&
                  "bg-slate-300 cursor-not-allowed"
              )}
            >
              {processingState === "idle" && <Mic className="w-8 h-8 text-white" />}
              {processingState === "recording" && <Pause className="w-8 h-8 text-white" />}
              {processingState === "paused" && <Play className="w-8 h-8 text-white" />}
              {isProcessing && <Loader2 className="w-8 h-8 text-white animate-spin" />}
              {processingState === "complete" && <MicOff className="w-8 h-8 text-white" />}
            </button>
          </div>

          {/* Timer */}
          {(processingState === "recording" || processingState === "paused") && (
            <div className="text-center mb-4">
              <span className="text-3xl font-mono font-bold text-slate-800">
                {formatDuration(duration)}
              </span>
              <p className="text-sm text-slate-500 mt-1">
                {processingState === "recording"
                  ? "Recording..."
                  : "Paused"}
              </p>
            </div>
          )}

          {/* Waveform */}
          {processingState === "recording" && (
            <div className="flex items-center gap-1 h-8 mb-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          )}

          {/* Status Message */}
          <div className="text-center">
            {processingState === "idle" && (
              <p className="text-sm text-slate-500">
                Click the microphone to start recording
              </p>
            )}
            {processingState === "recording" && (
              <button
                onClick={stopRecording}
                className="btn-danger px-6"
              >
                <Square className="w-4 h-4" />
                Stop Recording
              </button>
            )}
            {processingState === "paused" && (
              <div className="flex gap-3">
                <button onClick={resumeRecording} className="btn-primary px-6">
                  <Play className="w-4 h-4" />
                  Resume
                </button>
                <button onClick={stopRecording} className="btn-danger px-6">
                  <Square className="w-4 h-4" />
                  Stop
                </button>
              </div>
            )}
            {processingState === "transcribing" && (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">
                  Transcribing audio with Groq Whisper...
                </span>
              </div>
            )}
            {processingState === "summarizing" && (
              <div className="flex items-center gap-2 text-violet-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">
                  Extracting medical data with Gemini AI...
                </span>
              </div>
            )}
            {processingState === "matching" && (
              <div className="flex items-center gap-2 text-emerald-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">
                  ASI-1 Agent matching clinical trials...
                </span>
              </div>
            )}
            {processingState === "complete" && (
              <p className="text-sm text-emerald-600 font-medium">
                ✓ Processing complete — review results below
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Processing Pipeline Visualization */}
      {processingState !== "idle" && (
        <div className="card">
          <div className="flex items-center justify-between">
            {[
              { key: "transcribing", icon: FileText, label: "Transcription", color: "blue" },
              { key: "summarizing", icon: Brain, label: "Medical Summary", color: "violet" },
              { key: "matching", icon: FlaskConical, label: "Trial Matching", color: "emerald" },
            ].map((step, i) => {
              const steps: ProcessingState[] = ["transcribing", "summarizing", "matching"];
              const currentIndex = steps.indexOf(processingState);
              const stepIndex = i;
              const isActive = processingState === step.key;
              const isCompleted = processingState === "complete" || stepIndex < currentIndex;

              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                        isCompleted && `bg-${step.color}-500 text-white`,
                        isActive && `bg-${step.color}-100 text-${step.color}-600 ring-2 ring-${step.color}-500`,
                        !isCompleted && !isActive && "bg-slate-100 text-slate-400"
                      )}
                    >
                      {isCompleted ? (
                        <span className="text-white font-bold text-sm">✓</span>
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <step.icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={cn(
                      "text-xs font-medium mt-1.5",
                      isActive || isCompleted ? "text-slate-700" : "text-slate-400"
                    )}>
                      {step.label}
                    </span>
                  </div>
                  {i < 2 && (
                    <div className={cn(
                      "h-0.5 w-full mx-2 rounded",
                      isCompleted ? "bg-emerald-400" : "bg-slate-200"
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Results Tabs */}
      {(transcriptText || summaryData || trialData.length > 0) && (
        <div>
          {/* Tab Bar */}
          <div className="flex border-b border-slate-200 mb-0">
            {[
              { key: "transcript", label: "Transcript", icon: FileText },
              { key: "summary", label: "Medical Summary", icon: Brain },
              { key: "trials", label: "Trial Matches", icon: FlaskConical },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.key === "trials" && trialData.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">
                    {trialData.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === "transcript" && (
              <TranscriptViewer text={transcriptText} />
            )}
            {activeTab === "summary" && summaryData && (
              <MedicalSummaryCard summary={summaryData} />
            )}
            {activeTab === "trials" && trialData.length > 0 && (
              <TrialMatchesPanel trials={trialData} isDoctor={true} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
