import {
  Heart,
  Thermometer,
  Weight,
  Activity,
  Pill,
  AlertTriangle,
  Stethoscope,
  FileText,
  Download,
} from "lucide-react";

interface MedicalSummaryProps {
  summary: {
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
  };
}

export default function MedicalSummaryCard({ summary }: MedicalSummaryProps) {
  const handleExport = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Export button */}
      <div className="flex justify-end">
        <button onClick={handleExport} className="btn-secondary text-xs no-print">
          <Download className="w-3.5 h-3.5" />
          Export PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Conditions */}
        <div className="card">
          <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-red-500" />
            Conditions
          </h4>
          <div className="flex flex-wrap gap-2">
            {summary.conditions.map((c) => (
              <span
                key={c}
                className="badge bg-red-50 text-red-700 border border-red-200"
              >
                {c}
              </span>
            ))}
            {summary.conditions.length === 0 && (
              <span className="text-sm text-slate-400">None identified</span>
            )}
          </div>
        </div>

        {/* Medications */}
        <div className="card">
          <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <Pill className="w-4 h-4 text-blue-500" />
            Medications
          </h4>
          <div className="flex flex-wrap gap-2">
            {summary.medications.map((m) => (
              <span
                key={m}
                className="badge bg-blue-50 text-blue-700 border border-blue-200"
              >
                {m}
              </span>
            ))}
            {summary.medications.length === 0 && (
              <span className="text-sm text-slate-400">None mentioned</span>
            )}
          </div>
        </div>

        {/* Symptoms */}
        <div className="card">
          <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Symptoms
          </h4>
          <div className="flex flex-wrap gap-2">
            {summary.symptoms.map((s) => (
              <span
                key={s}
                className="badge bg-amber-50 text-amber-700 border border-amber-200"
              >
                {s}
              </span>
            ))}
            {summary.symptoms.length === 0 && (
              <span className="text-sm text-slate-400">None reported</span>
            )}
          </div>
        </div>

        {/* Allergies */}
        <div className="card">
          <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            Allergies
          </h4>
          <div className="flex flex-wrap gap-2">
            {summary.allergies.map((a) => (
              <span
                key={a}
                className="badge bg-yellow-50 text-yellow-700 border border-yellow-200"
              >
                {a}
              </span>
            ))}
            {summary.allergies.length === 0 && (
              <span className="text-sm text-slate-400">None known</span>
            )}
          </div>
        </div>
      </div>

      {/* Vitals */}
      <div className="card">
        <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          Vitals
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <Heart className="w-5 h-5 text-red-500 mx-auto mb-1" />
            <p className="text-xs text-slate-500">Blood Pressure</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              {summary.vitals.bloodPressure || "—"}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <Activity className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-xs text-slate-500">Heart Rate</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              {summary.vitals.heartRate || "—"}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <Thermometer className="w-5 h-5 text-amber-500 mx-auto mb-1" />
            <p className="text-xs text-slate-500">Temperature</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              {summary.vitals.temperature || "—"}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-center">
            <Weight className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-xs text-slate-500">Weight</p>
            <p className="text-sm font-semibold text-slate-800 mt-0.5">
              {summary.vitals.weight || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Doctor Notes */}
      <div className="card">
        <h4 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4 text-violet-500" />
          Doctor Notes
        </h4>
        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-lg p-4">
          {summary.doctorNotes || "No notes available."}
        </p>
      </div>
    </div>
  );
}
