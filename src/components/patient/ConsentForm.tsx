import { useState } from "react";
import { ShieldCheck, AlertTriangle, Check, X, FileText } from "lucide-react";
import { cn } from "../../lib/utils";

interface ConsentItem {
  id: string;
  trialId: string;
  trialTitle: string;
  status: "pending" | "consented" | "declined";
  timestamp: number;
  dataShared: string[];
}

const DEMO_CONSENTS: ConsentItem[] = [
  {
    id: "c1", trialId: "NCT05847231", trialTitle: "Efficacy of Erenumab in Chronic Migraine",
    status: "pending", timestamp: Date.now() - 3600000,
    dataShared: ["Age, Gender", "Medical conditions", "Current medications", "Relevant vitals"],
  },
  {
    id: "c2", trialId: "NCT06291483", trialTitle: "SGLT2 Inhibitor Combination Therapy for T2D",
    status: "consented", timestamp: Date.now() - 86400000,
    dataShared: ["Age, Gender", "Diabetes history", "Current medications", "HbA1c levels"],
  },
];

export default function ConsentForm() {
  const [consents, setConsents] = useState(DEMO_CONSENTS);
  const [activeConsent, setActiveConsent] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const handleGrant = (id: string) => {
    setConsents(prev => prev.map(c => c.id === id ? { ...c, status: "consented" as const } : c));
    setActiveConsent(null);
    setAcknowledged(false);
  };

  const handleDecline = (id: string) => {
    setConsents(prev => prev.map(c => c.id === id ? { ...c, status: "declined" as const } : c));
    setActiveConsent(null);
    setAcknowledged(false);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-blue-600" /> Consent Management
      </h2>

      {consents.map((consent) => (
        <div key={consent.id} className="card">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-800 text-sm">{consent.trialTitle}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{consent.trialId}</p>
            </div>
            <span className={cn("badge", consent.status === "consented" ? "badge-approved" : consent.status === "declined" ? "badge-cancelled" : "badge-pending")}>
              {consent.status}
            </span>
          </div>

          {consent.status === "pending" && activeConsent !== consent.id && (
            <button onClick={() => setActiveConsent(consent.id)} className="btn-primary text-xs mt-4">
              <FileText className="w-3.5 h-3.5" /> Review & Sign
            </button>
          )}

          {activeConsent === consent.id && (
            <div className="mt-4 space-y-4 animate-fade-in">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Data Sharing Notice</p>
                    <p className="text-xs text-amber-700 mt-1">The following de-identified data will be shared with the trial sponsor:</p>
                    <ul className="mt-2 space-y-1">
                      {consent.dataShared.map((item) => (
                        <li key={item} className="text-xs text-amber-700 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-amber-500" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-xs text-slate-700">
                  I understand my de-identified data will be shared with the trial sponsor for eligibility assessment purposes.
                </span>
              </label>

              <div className="flex gap-2">
                <button onClick={() => handleGrant(consent.id)} disabled={!acknowledged}
                  className={cn("btn-success text-xs px-4", !acknowledged && "opacity-50 cursor-not-allowed")}>
                  <Check className="w-3.5 h-3.5" /> Grant Consent
                </button>
                <button onClick={() => handleDecline(consent.id)}
                  className="btn-secondary text-xs px-4 text-red-600 hover:bg-red-50">
                  <X className="w-3.5 h-3.5" /> Decline
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
