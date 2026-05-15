import { useState } from "react";
import { FlaskConical, MapPin, Mail, Building2, ChevronDown, ChevronUp, Check, X, Filter } from "lucide-react";
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
  isDoctor?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onConsent?: (id: string) => void;
  onDecline?: (id: string) => void;
}

function ScoreCircle({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#3b82f6" : score >= 40 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative w-14 h-14 flex-shrink-0">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="24" fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle cx="28" cy="28" r="24" fill="none" strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 150.8} 150.8`} style={{ stroke: color }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("text-sm font-bold", getRelevanceColor(score))}>{score}</span>
      </div>
    </div>
  );
}

export default function TrialMatchesPanel({ trials, isDoctor = false }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [minScore, setMinScore] = useState(0);
  const [actioned, setActioned] = useState<Record<string, string>>({});

  const filtered = trials.filter((t) => t.relevanceScore >= minScore);

  if (trials.length === 0) {
    return (
      <div className="card text-center py-12">
        <FlaskConical className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No trial matches yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-sm text-slate-600">Min. relevance:</span>
        <input type="range" min={0} max={100} value={minScore}
          onChange={(e) => setMinScore(Number(e.target.value))}
          className="w-32 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
        <span className="text-sm font-medium text-slate-700">{minScore}%</span>
        <span className="text-xs text-slate-400 ml-2">({filtered.length}/{trials.length})</span>
      </div>

      {filtered.map((t) => (
        <div key={t.trialId} className="card hover:shadow-lg transition-shadow">
          <div className="flex items-start gap-4">
            <ScoreCircle score={t.relevanceScore} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm leading-snug">{t.title}</h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs font-mono text-slate-400">{t.trialId}</span>
                    <span className={cn("badge border", getPhaseBadgeColor(t.phase))}>{t.phase}</span>
                    <span className="badge bg-slate-50 text-slate-600 border border-slate-200">{t.condition}</span>
                  </div>
                </div>
                {actioned[t.trialId] && (
                  <span className={cn("badge", actioned[t.trialId] === "approved" || actioned[t.trialId] === "consented" ? "badge-approved" : "badge-cancelled")}>
                    {actioned[t.trialId]}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-2"><span className="font-medium">Eligibility:</span> {t.eligibilitySummary}</p>
              <button onClick={() => setExpanded(expanded === t.trialId ? null : t.trialId)}
                className="flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                {expanded === t.trialId ? <><ChevronUp className="w-3 h-3" />Hide rationale</> : <><ChevronDown className="w-3 h-3" />Why this matches</>}
              </button>
              {expanded === t.trialId && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg text-xs text-blue-800 leading-relaxed animate-fade-in">{t.rationale}</div>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{t.sponsorName}</span>
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{t.location}</span>
                <a href={`mailto:${t.contactEmail}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                  <Mail className="w-3 h-3" />{t.contactEmail}
                </a>
              </div>
              {!actioned[t.trialId] && (
                <div className="flex gap-2 mt-4">
                  {isDoctor ? (
                    <>
                      <button onClick={() => setActioned(p => ({...p, [t.trialId]: "approved"}))} className="btn-success text-xs px-3 py-1.5"><Check className="w-3.5 h-3.5" />Approve</button>
                      <button onClick={() => setActioned(p => ({...p, [t.trialId]: "rejected"}))} className="btn-secondary text-xs px-3 py-1.5 text-red-600 hover:bg-red-50"><X className="w-3.5 h-3.5" />Reject</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setActioned(p => ({...p, [t.trialId]: "consented"}))} className="btn-success text-xs px-3 py-1.5"><Check className="w-3.5 h-3.5" />I Consent</button>
                      <button onClick={() => setActioned(p => ({...p, [t.trialId]: "declined"}))} className="btn-secondary text-xs px-3 py-1.5 text-red-600 hover:bg-red-50"><X className="w-3.5 h-3.5" />Decline</button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
