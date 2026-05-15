import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Mic,
  Search,
  Calendar,
  Activity,
  CheckCircle2,
  FlaskConical,
  Clock,
  User,
  ChevronRight,
  Check,
  X,
  Filter,
} from "lucide-react";
import { cn, formatDate, formatTime, getStatusBadgeClass } from "../../lib/utils";
import ScheduleAppointmentModal from "./ScheduleAppointmentModal";
import type { Id } from "../../../convex/_generated/dataModel";

const isDemoMode =
  !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  !import.meta.env.VITE_CONVEX_URL;

interface AppointmentItem {
  _id: Id<"appointments">;
  patientName?: string;
  patientId: string;
  doctorId: string;
  title: string;
  scheduledAt: number;
  duration: number;
  appointmentType: "consultation" | "follow-up" | "check-up";
  status: "pending" | "approved" | "completed" | "cancelled";
  createdAt: number;
  notes?: string;
}

// Demo data
const DEMO_APPOINTMENTS = [
  {
    _id: "demo1" as unknown as Id<"appointments">,
    patientName: "Sarah Johnson",
    patientId: "patient1",
    doctorId: "doctor1",
    title: "Neurology Consultation",
    scheduledAt: Date.now() + 3600000,
    duration: 45,
    appointmentType: "consultation" as const,
    status: "pending" as const,
    createdAt: Date.now(),
  },
  {
    _id: "demo2" as unknown as Id<"appointments">,
    patientName: "Michael Chen",
    patientId: "patient2",
    doctorId: "doctor1",
    title: "Cardiology Follow-up",
    scheduledAt: Date.now() + 7200000,
    duration: 30,
    appointmentType: "follow-up" as const,
    status: "approved" as const,
    createdAt: Date.now(),
  },
  {
    _id: "demo3" as unknown as Id<"appointments">,
    patientName: "Emily Rodriguez",
    patientId: "patient3",
    doctorId: "doctor1",
    title: "General Check-up",
    scheduledAt: Date.now() + 14400000,
    duration: 30,
    appointmentType: "check-up" as const,
    status: "approved" as const,
    createdAt: Date.now(),
  },
];

const DEMO_PENDING_MATCHES = [
  {
    _id: "match1",
    patientId: "patient1",
    patientName: "Sarah Johnson",
    conditions: ["Chronic Migraine", "Hypertension"],
    trialCount: 5,
    appointmentId: "demo1",
  },
  {
    _id: "match2",
    patientId: "patient2",
    patientName: "Michael Chen",
    conditions: ["Type 2 Diabetes", "Coronary Artery Disease"],
    trialCount: 3,
    appointmentId: "demo2",
  },
];

export default function DoctorDashboard() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const authData = isDemoMode ? null : useAuth();
  const userId = isDemoMode ? "demo-doctor" : authData?.userId;

  const rawAppointments = isDemoMode
    ? DEMO_APPOINTMENTS
    : useQuery(api.appointments.getByDoctor, userId ? { doctorId: userId } : "skip") || [];
  const appointments = rawAppointments as AppointmentItem[];

  const updateStatus = isDemoMode ? null : useMutation(api.appointments.updateStatus);

  const filteredAppointments =
    statusFilter === "all"
      ? appointments
      : appointments.filter((a) => a.status === statusFilter);

  const activeCount = appointments.filter(
    (a) => a.status === "approved"
  ).length;
  const completedToday = appointments.filter(
    (a) =>
      a.status === "completed" &&
      new Date(a.createdAt).toDateString() === new Date().toDateString()
  ).length;

  const handleStatusUpdate = async (
    appointmentId: Id<"appointments">,
    status: "approved" | "cancelled"
  ) => {
    if (isDemoMode) return;
    if (updateStatus) {
      await updateStatus({ appointmentId, status });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Doctor Dashboard</h1>
        <p className="text-slate-500 mt-1">
          Manage consultations, review trial matches, and schedule appointments
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{activeCount}</p>
              <p className="text-sm text-slate-500">Active Consultations</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {completedToday}
              </p>
              <p className="text-sm text-slate-500">Completed Today</p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <FlaskConical className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {DEMO_PENDING_MATCHES.length}
              </p>
              <p className="text-sm text-slate-500">Pending Trial Matches</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/doctor/consultation"
          className="card group cursor-pointer hover:border-blue-200 hover:bg-blue-50/50"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">
                Start Consultation
              </h3>
              <p className="text-xs text-slate-500">Record and transcribe</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 ml-auto group-hover:text-blue-500 transition-colors" />
          </div>
        </Link>

        <div className="card group cursor-pointer hover:border-emerald-200 hover:bg-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">
                Review Trial Matches
              </h3>
              <p className="text-xs text-slate-500">
                {DEMO_PENDING_MATCHES.length} pending
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 ml-auto group-hover:text-emerald-500 transition-colors" />
          </div>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="card group cursor-pointer hover:border-violet-200 hover:bg-violet-50/50 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">
                Schedule Appointment
              </h3>
              <p className="text-xs text-slate-500">Book a new slot</p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 ml-auto group-hover:text-violet-500 transition-colors" />
          </div>
        </button>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-800">
              Upcoming Appointments
            </h2>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No appointments found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAppointments.slice(0, 5).map((apt) => (
                <div
                  key={apt._id.toString()}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(apt.patientName || "P")[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {apt.patientName || "Patient"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      {formatTime(apt.scheduledAt)} · {apt.duration}min ·{" "}
                      {apt.appointmentType}
                    </div>
                  </div>
                  <span className={cn("badge", getStatusBadgeClass(apt.status))}>
                    {apt.status}
                  </span>
                  {apt.status === "pending" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() =>
                          handleStatusUpdate(apt._id, "approved")
                        }
                        className="p-1 rounded-md hover:bg-emerald-100 text-emerald-600"
                        title="Approve"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() =>
                          handleStatusUpdate(apt._id, "cancelled")
                        }
                        className="p-1 rounded-md hover:bg-red-100 text-red-600"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Trial Matches */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Pending Trial Matches
          </h2>

          {DEMO_PENDING_MATCHES.length === 0 ? (
            <div className="text-center py-8">
              <FlaskConical className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No pending matches</p>
            </div>
          ) : (
            <div className="space-y-3">
              {DEMO_PENDING_MATCHES.map((match) => (
                <div
                  key={match._id}
                  className="p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                        {match.patientName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {match.patientName}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {match.conditions.map((c) => (
                            <span
                              key={c}
                              className="badge bg-red-50 text-red-600 border border-red-200"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-lg font-bold text-blue-600">
                        {match.trialCount}
                      </span>
                      <p className="text-xs text-slate-500">trials</p>
                    </div>
                  </div>
                  <button className="mt-3 btn-secondary text-xs w-full">
                    <Search className="w-3 h-3" />
                    Review Matches
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <ScheduleAppointmentModal
          onClose={() => setShowScheduleModal(false)}
        />
      )}
    </div>
  );
}
