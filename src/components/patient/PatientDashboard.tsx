import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  FlaskConical, Bell, Calendar, FileText, ShieldCheck, Stethoscope, Pill,
  AlertTriangle, Edit2, Save, X, Clock, User,
} from "lucide-react";
import { cn, formatDate, formatTime, getStatusBadgeClass } from "../../lib/utils";
import TrialSuggestions from "./TrialSuggestions";
import ConsentForm from "./ConsentForm";

const isDemoMode = !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || !import.meta.env.VITE_CONVEX_URL;

const DEMO_PROFILE = {
  conditions: ["Hypertension", "Type 2 Diabetes"],
  medications: ["Lisinopril", "Metformin"],
  allergies: ["Pollen"],
};

const DEMO_APPOINTMENTS = [
  { _id: "a1", doctorName: "Dr. Smith", title: "Neurology Consultation", scheduledAt: Date.now() + 86400000, duration: 45, appointmentType: "consultation", status: "approved" },
  { _id: "a2", doctorName: "Dr. Williams", title: "Follow-up Visit", scheduledAt: Date.now() + 172800000, duration: 30, appointmentType: "follow-up", status: "pending" },
];

const DEMO_TRIALS = [
  {
    trialId: "NCT05847231", title: "Efficacy of Erenumab in Chronic Migraine with Comorbid Hypertension",
    phase: "Phase 3", condition: "Chronic Migraine with Hypertension",
    eligibilitySummary: "Adults 18-65 with chronic migraine and comorbid hypertension.",
    relevanceScore: 92, rationale: "Patient has chronic migraine symptoms with comorbid hypertension.",
    sponsorName: "Novartis", location: "Mayo Clinic, MN", contactEmail: "trial@novartis.com",
  },
  {
    trialId: "NCT06291483", title: "SGLT2 Inhibitor Combination Therapy for T2D",
    phase: "Phase 2", condition: "Type 2 Diabetes with CV Risk",
    eligibilitySummary: "Adults with T2D on metformin with CV risk factors.",
    relevanceScore: 87, rationale: "Patient has T2D with elevated blood pressure as CV risk factor.",
    sponsorName: "AstraZeneca", location: "Johns Hopkins, MD", contactEmail: "trial@astrazeneca.com",
  },
];

export default function PatientDashboard() {
  const [editingProfile, setEditingProfile] = useState(false);
  const [profile, setProfile] = useState(DEMO_PROFILE);
  const [showConsent, setShowConsent] = useState<string | null>(null);
  const [view, setView] = useState<"dashboard" | "trials" | "consent">("dashboard");

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Patient Dashboard</h1>
        <p className="text-slate-500 mt-1">View your appointments, trial suggestions, and consent forms</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{DEMO_TRIALS.length}</p>
              <p className="text-sm text-slate-500">Active Trials</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">3</p>
              <p className="text-sm text-slate-500">Notifications</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{DEMO_APPOINTMENTS.length}</p>
              <p className="text-sm text-slate-500">Appointments This Week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button onClick={() => setView("trials")} className="card group cursor-pointer hover:border-emerald-200 text-left">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Medical Reports</h3>
              <p className="text-xs text-slate-500">View consultation summaries</p>
            </div>
          </div>
        </button>
        <button onClick={() => setView("consent")} className="card group cursor-pointer hover:border-blue-200 text-left">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">Consent Forms</h3>
              <p className="text-xs text-slate-500">Manage trial consents</p>
            </div>
          </div>
        </button>
      </div>

      {/* Main content based on view */}
      {view === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Medical Profile */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800">Medical Profile</h2>
              <button onClick={() => setEditingProfile(!editingProfile)}
                className="btn-secondary text-xs px-3 py-1.5">
                {editingProfile ? <><Save className="w-3 h-3" />Save</> : <><Edit2 className="w-3 h-3" />Edit</>}
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-red-500" /> Conditions
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {profile.conditions.map((c) => (
                    <span key={c} className="badge bg-red-50 text-red-700 border border-red-200">{c}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1.5">
                  <Pill className="w-3.5 h-3.5 text-blue-500" /> Medications
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {profile.medications.map((m) => (
                    <span key={m} className="badge bg-blue-50 text-blue-700 border border-blue-200">{m}</span>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-600 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" /> Allergies
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {profile.allergies.map((a) => (
                    <span key={a} className="badge bg-yellow-50 text-yellow-700 border border-yellow-200">{a}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Upcoming Appointments</h2>
            {DEMO_APPOINTMENTS.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {DEMO_APPOINTMENTS.map((apt) => (
                  <div key={apt._id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {(apt.doctorName || "D")[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800">{apt.doctorName}</p>
                      <p className="text-xs text-slate-500">{apt.title}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {formatDate(apt.scheduledAt)} · {formatTime(apt.scheduledAt)} · {apt.duration}min
                      </div>
                    </div>
                    <span className={cn("badge", getStatusBadgeClass(apt.status))}>{apt.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {view === "trials" && (
        <div>
          <button onClick={() => setView("dashboard")} className="btn-secondary text-sm mb-4">
            <X className="w-4 h-4" /> Back to Dashboard
          </button>
          <TrialSuggestions trials={DEMO_TRIALS} onConsent={(id) => setShowConsent(id)} />
        </div>
      )}

      {view === "consent" && (
        <div>
          <button onClick={() => setView("dashboard")} className="btn-secondary text-sm mb-4">
            <X className="w-4 h-4" /> Back to Dashboard
          </button>
          <ConsentForm />
        </div>
      )}

      {/* Trial Suggestions always on dashboard */}
      {view === "dashboard" && (
        <div>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Trial Suggestions</h2>
          <TrialSuggestions trials={DEMO_TRIALS.slice(0, 2)} onConsent={(id) => setShowConsent(id)} />
        </div>
      )}
    </div>
  );
}
