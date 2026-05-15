import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth, UserButton } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  Menu,
  X,
  Bell,
  Stethoscope,
  Activity,
  ChevronDown,
} from "lucide-react";
import { cn, getRelativeTime } from "../../lib/utils";

const isDemoMode =
  !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  !import.meta.env.VITE_CONVEX_URL;

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Auth state
  const authData = isDemoMode ? null : useAuth();
  const isSignedIn = isDemoMode ? true : authData?.isSignedIn;

  // Determine role from URL in demo mode, or from Convex
  const isDoctorRoute = location.pathname.startsWith("/doctor");
  const isPatientRoute = location.pathname.startsWith("/patient");

  const userId = isDemoMode ? null : authData?.userId;
  const user = !isDemoMode && userId
    ? useQuery(api.users.getUser, { clerkId: userId })
    : null;

  const role = isDemoMode
    ? isDoctorRoute
      ? "doctor"
      : "patient"
    : user?.role;

  // Close notifications on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isLandingPage = location.pathname === "/";
  if (isLandingPage) return null;

  const navLinks =
    role === "doctor"
      ? [
          { href: "/doctor", label: "Dashboard" },
          { href: "/doctor/consultation", label: "Consultation" },
        ]
      : [
          { href: "/patient", label: "Dashboard" },
          { href: "/patient/reports", label: "Reports" },
        ];

  const demoNotifications = [
    {
      id: 1,
      text: "New trial match found for Sarah Johnson",
      time: Date.now() - 300000,
    },
    {
      id: 2,
      text: "Appointment approved by Dr. Smith",
      time: Date.now() - 1800000,
    },
    {
      id: 3,
      text: "Patient consent received for NCT05847231",
      time: Date.now() - 7200000,
    },
  ];

  return (
    <nav className="sticky top-0 z-50 glass border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={role === "doctor" ? "/doctor" : "/patient"} className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-800">
              Medi<span className="gradient-text">Buddy</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === link.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Demo mode badge */}
            {isDemoMode && (
              <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                <Activity className="w-3 h-3" />
                Demo Mode
              </span>
            )}

            {/* Notifications */}
            {isSignedIn && (
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                  className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                    3
                  </span>
                </button>

                {notificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden animate-scale-in">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <h3 className="text-sm font-semibold text-slate-800">
                        Notifications
                      </h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {demoNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className="px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 cursor-pointer"
                        >
                          <p className="text-sm text-slate-700">{notif.text}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {getRelativeTime(notif.time)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 py-2 border-t border-slate-100">
                      <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Role badge */}
            {role && (
              <span
                className={cn(
                  "hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border",
                  role === "doctor"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                )}
              >
                {role === "doctor" ? "👨‍⚕️ Doctor" : "🧑‍🦰 Patient"}
              </span>
            )}

            {/* User menu */}
            {isDemoMode ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center text-white text-xs font-bold">
                  D
                </div>
                <div className="hidden sm:block">
                  <Link
                    to={isDoctorRoute ? "/patient" : "/doctor"}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5"
                  >
                    Switch to {isDoctorRoute ? "Patient" : "Doctor"}
                    <ChevronDown className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : (
              isSignedIn && <UserButton afterSignOutUrl="/" />
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  location.pathname === link.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {link.label}
              </Link>
            ))}
            {isDemoMode && (
              <Link
                to={isDoctorRoute ? "/patient" : "/doctor"}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50"
              >
                Switch to {isDoctorRoute ? "Patient" : "Doctor"} View
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
