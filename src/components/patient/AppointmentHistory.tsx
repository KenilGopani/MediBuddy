import { Calendar, Clock, FileText } from "lucide-react";
import { cn, formatDate, formatTime, getStatusBadgeClass } from "../../lib/utils";

const DEMO_HISTORY = [
  { _id: "h1", title: "Neurology Consultation", doctorName: "Dr. Smith", scheduledAt: Date.now() - 604800000, duration: 45, status: "completed", appointmentType: "consultation" },
  { _id: "h2", title: "Cardiology Follow-up", doctorName: "Dr. Williams", scheduledAt: Date.now() - 1209600000, duration: 30, status: "completed", appointmentType: "follow-up" },
  { _id: "h3", title: "General Check-up", doctorName: "Dr. Patel", scheduledAt: Date.now() - 2592000000, duration: 30, status: "completed", appointmentType: "check-up" },
];

export default function AppointmentHistory() {
  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-slate-800 mb-4">Appointment History</h2>
      {DEMO_HISTORY.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No past appointments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {DEMO_HISTORY.map((apt) => (
            <div key={apt._id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {apt.doctorName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{apt.title}</p>
                <p className="text-xs text-slate-500">{apt.doctorName}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {formatDate(apt.scheduledAt)} · {apt.duration}min · {apt.appointmentType}
                </div>
              </div>
              <span className={cn("badge", getStatusBadgeClass(apt.status))}>{apt.status}</span>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
