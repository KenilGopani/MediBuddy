import { useQuery } from "convex/react";
import { Mic } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface ConsultationAudioPlayerProps {
  consultationId: Id<"consultations">;
}

// Plays back the recording of a visit. Renders nothing when there is no recording,
// or when the signed-in user isn't allowed to hear it.
export default function ConsultationAudioPlayer({
  consultationId,
}: ConsultationAudioPlayerProps) {
  const recordings = useQuery(api.audio.getAudioRecordingsForConsultation, {
    consultationId,
  });
  const recording = recordings?.find((r) => r.status === "completed");
  const url = useQuery(
    api.audio.generateAudioUrl,
    recording ? { audioRecordingId: recording._id } : "skip"
  );

  if (!recording || !url) return null;

  const minutes = recording.duration ? Math.floor(recording.duration / 60) : 0;
  const seconds = recording.duration ? Math.round(recording.duration % 60) : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2 font-bold">
        <Mic className="h-4 w-4 text-primary" aria-hidden />
        <span>Visit recording</span>
        {recording.duration ? (
          <span className="text-sm font-normal text-muted-foreground">
            {minutes}:{String(seconds).padStart(2, "0")}
          </span>
        ) : null}
      </div>
      <audio
        src={url}
        controls
        preload="metadata"
        className="w-full"
        aria-label="Visit recording"
      />
    </div>
  );
}
