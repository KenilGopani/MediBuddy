import { useState } from "react";
import { FlaskConical, MapPin, Building2, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { cn, getRelevanceColor, getPhaseBadgeColor } from "../../lib/utils";

interface Trial {
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

interface Props {
  trials: Trial[];
  onConsent?: (trialId: string) => void;
}

export default function TrialSuggestions({ trials, onConsent }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actioned, setActioned] = useState<Record<string, string>>({});

  if (trials.length === 0) {
    return (
      <div className="card text-center py-12">
        <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No trial suggestions yet.</p>
        <p className="text-xs text-slate-400 mt-1">Complete a consultation to receive matches.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {trials.map((trial) => {
        const scoreColor = trial.relevanceScore >= 80 ? "#10b981" : trial.relevanceScore >= 60 ? "#3b82f6" : "#f59e0b";
        return (
          <div key={trial.trialId} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="relative w-14 h-14 flex-shrink-0">
                <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                  <circle cx="28" cy="28" r="24" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                  <circle cx="28" cy="28" r="24" fill="none" strokeWidth="4" strokeLinecap="round"
                    strokeDasharray={`${(trial.relevanceScore / 100) * 150.8} 150.8`} style={{ stroke: scoreColor }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={cn("text-sm font-bold", getRelevanceColor(trial.relevanceScore))}>{trial.relevanceScore}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-800 text-sm">{trial.title}</h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs font-mono text-slate-400">{trial.trialId}</span>
                  <span className={cn("badge border", getPhaseBadgeColor(trial.phase))}>{trial.phase}</span>
                  <span className="badge bg-slate-50 text-slate-600 border border-slate-200">{trial.condition}</span>
                </div>
                <p className="text-xs text-slate-600 mt-2"><span className="font-medium">Eligibility:</span> {trial.eligibilitySummary}</p>
                
                <button onClick={() => setExpanded(expanded === trial.trialId ? null : trial.trialId)}
                  className="flex items-center gap-1 mt-2 text-xs text-blue-600 font-medium">
                  {expanded === trial.trialId ? <><ChevronUp className="w-3 h-3" />Hide</>: <><ChevronDown className="w-3 h-3" />Why you match</>}
                </button>
                {expanded === trial.trialId && (
                  <div className="mt-2 p-3 bg-emerald-50 rounded-lg text-xs text-emerald-800 animate-fade-in">{trial.rationale}</div>
                )}

                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{trial.sponsorName}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{trial.location}</span>
                </div>

                {!actioned[trial.trialId] ? (
                  <div className="flex gap-2 mt-4">
                    <button onClick={() => { setActioned(p => ({...p, [trial.trialId]: "consented"})); onConsent?.(trial.trialId); }}
                      className="btn-success text-xs px-4 py-1.5">
                      <Check className="w-3.5 h-3.5" /> I Consent
                    </button>
                    <button onClick={() => setActioned(p => ({...p, [trial.trialId]: "declined"}))}
                      className="btn-secondary text-xs px-4 py-1.5 text-red-600 hover:bg-red-50">
                      <X className="w-3.5 h-3.5" /> Decline
                    </button>
                  </div>
                ) : (
                  <span className={cn("badge mt-3", actioned[trial.trialId] === "consented" ? "badge-approved" : "badge-cancelled")}>
                    {actioned[trial.trialId]}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
