import { useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { X, Calendar, Loader2 } from "lucide-react";

const isDemoMode = !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || !import.meta.env.VITE_CONVEX_URL;

const DEMO_PATIENTS = [
  { id: "patient1", name: "Sarah Johnson" },
  { id: "patient2", name: "Michael Chen" },
  { id: "patient3", name: "Emily Rodriguez" },
];

interface Props { onClose: () => void; }

export default function ScheduleAppointmentModal({ onClose }: Props) {
  const [patientId, setPatientId] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [type, setType] = useState<"consultation" | "follow-up" | "check-up">("consultation");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const authData = isDemoMode ? null : useAuth();
  const createAppointment = isDemoMode ? null : useMutation(api.appointments.create);
  const patients = isDemoMode ? DEMO_PATIENTS : (useQuery(api.users.getAllPatients) || []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!patientId) e.patientId = "Please select a patient";
    if (!title.trim()) e.title = "Title is required";
    if (!date) e.date = "Date is required";
    if (!time) e.time = "Time is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const scheduledAt = new Date(`${date}T${time}`).getTime();
      if (!isDemoMode && createAppointment && authData?.userId) {
        const patient = patients.find((p: any) => (p.id || p.clerkId) === patientId);
        await createAppointment({
          doctorId: authData.userId,
          patientId,
          doctorName: "Dr. You",
          patientName: patient?.name || "Patient",
          title,
          scheduledAt,
          duration,
          appointmentType: type,
          notes: notes || undefined,
        });
      }
      onClose();
    } catch (err) {
      console.error("Failed to create appointment:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" /> Schedule Appointment
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patient *</label>
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)} className="input">
              <option value="">Select a patient...</option>
              {patients.map((p: any) => <option key={p.id || p._id} value={p.id || p.clerkId}>{p.name}</option>)}
            </select>
            {errors.patientId && <p className="text-xs text-red-500 mt-1">{errors.patientId}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Cardiology Consultation" className="input" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date *</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
              {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Time *</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input" />
              {errors.time && <p className="text-xs text-red-500 mt-1">{errors.time}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Duration</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="input">
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as any)} className="input">
                <option value="consultation">Consultation</option>
                <option value="follow-up">Follow-up</option>
                <option value="check-up">Check-up</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Additional notes..." className="input resize-none" />
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-slate-100">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="btn-primary flex-1">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : "Schedule Appointment"}
          </button>
        </div>
      </div>
    </div>
  );
}
