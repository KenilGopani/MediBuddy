import { FileText, Download, Printer } from "lucide-react";
import TranscriptViewer from "../doctor/TranscriptViewer";
import MedicalSummaryCard from "../doctor/MedicalSummaryCard";
import TrialMatchesPanel from "../doctor/TrialMatchesPanel";

const DEMO_TRANSCRIPT = "Doctor: Good morning, how are you feeling today? Patient: I've been having persistent headaches for the past two weeks, along with some dizziness and blurred vision. Doctor: I see. Have you noticed any other symptoms? Patient: Yes, some nausea, especially in the mornings. Doctor: Are you currently taking any medications? Patient: I take lisinopril for high blood pressure and metformin for type 2 diabetes. Doctor: Let me check your vitals. Blood pressure is 145 over 92, heart rate 78, temperature 98.6. I'm going to refer you for an MRI and prescribe sumatriptan for the headaches.";

const DEMO_SUMMARY = {
  conditions: ["Hypertension", "Type 2 Diabetes", "Chronic Migraine"],
  medications: ["Lisinopril", "Metformin", "Sumatriptan"],
  symptoms: ["Persistent headaches", "Dizziness", "Blurred vision", "Morning nausea"],
  allergies: ["Pollen (seasonal)"],
  vitals: { bloodPressure: "145/92 mmHg", heartRate: "78 bpm", temperature: "98.6°F", weight: "185 lbs" },
  doctorNotes: "Patient presents with persistent headaches. Referred for MRI. Prescribed sumatriptan.",
};

export default function ConsultationReport() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Consultation Report</h1>
          <p className="text-slate-500 mt-1">Review your latest consultation details</p>
        </div>
        <button onClick={() => window.print()} className="btn-secondary no-print">
          <Printer className="w-4 h-4" /> Print Report
        </button>
      </div>

      <div className="space-y-6">
        <TranscriptViewer text={DEMO_TRANSCRIPT} />
        <MedicalSummaryCard summary={DEMO_SUMMARY} />
      </div>
    </div>
  );
}
