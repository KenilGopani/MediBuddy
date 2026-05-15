import { useState } from "react";
import { Copy, Check, FileText } from "lucide-react";

interface TranscriptViewerProps {
  text: string;
  chunks?: { text: string; timestamp: number }[];
}

export default function TranscriptViewer({ text, chunks }: TranscriptViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!text) {
    return (
      <div className="card text-center py-12">
        <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">No transcript yet. Start recording to generate one.</p>
      </div>
    );
  }

  // Parse transcript into dialogue lines
  const lines = text.split(/(?=Doctor:|Patient:)/g).filter(Boolean);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Consultation Transcript
        </h3>
        <button
          onClick={handleCopy}
          className="btn-secondary text-xs px-3 py-1.5"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              Copy
            </>
          )}
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        {lines.map((line, i) => {
          const isDoctor = line.trim().startsWith("Doctor:");
          const content = line.replace(/^(Doctor:|Patient:)\s*/, "").trim();

          return (
            <div
              key={i}
              className={`flex gap-3 animate-fade-in`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isDoctor
                    ? "bg-blue-100 text-blue-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {isDoctor ? "Dr" : "Pt"}
              </div>
              <div className="flex-1">
                <span
                  className={`text-xs font-medium ${
                    isDoctor ? "text-blue-600" : "text-emerald-600"
                  }`}
                >
                  {isDoctor ? "Doctor" : "Patient"}
                </span>
                <p className="text-sm text-slate-700 mt-0.5 leading-relaxed">
                  {content}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
