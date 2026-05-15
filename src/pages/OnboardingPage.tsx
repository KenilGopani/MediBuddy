import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Stethoscope, User, ArrowRight, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";

const isDemoMode =
  !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  !import.meta.env.VITE_CONVEX_URL;

export default function OnboardingPage() {
  const [selectedRole, setSelectedRole] = useState<"doctor" | "patient" | null>(null);
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const authData = isDemoMode ? null : useAuth();
  const userData = isDemoMode ? null : useUser();
  const createUser = isDemoMode ? null : useMutation(api.users.createOrGetUser);

  const handleSubmit = async () => {
    if (!selectedRole) return;

    if (isDemoMode) {
      navigate(selectedRole === "doctor" ? "/doctor" : "/patient");
      return;
    }

    setLoading(true);
    try {
      if (createUser && authData?.userId && userData?.user) {
        await createUser({
          clerkId: authData.userId,
          role: selectedRole,
          name: userData.user.fullName || userData.user.firstName || "User",
          email: userData.user.primaryEmailAddress?.emailAddress || "",
          specialty: selectedRole === "doctor" ? specialty : undefined,
        });
      }
      navigate(selectedRole === "doctor" ? "/doctor" : "/patient");
    } catch (error) {
      console.error("Failed to create user:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg mx-auto mb-4">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome to MediBuddy
          </h1>
          <p className="text-slate-600 mt-1">Choose your role to get started</p>
        </div>

        {/* Role Selection */}
        <div className="space-y-4 mb-6">
          <button
            onClick={() => setSelectedRole("doctor")}
            className={cn(
              "w-full p-5 rounded-xl border-2 transition-all duration-200 text-left flex items-start gap-4",
              selectedRole === "doctor"
                ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
                : "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/50"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
              selectedRole === "doctor" ? "bg-blue-500 text-white" : "bg-blue-100 text-blue-600"
            )}>
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-lg">
                I'm a Doctor
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                Record consultations, review trial matches, manage patient appointments
              </p>
            </div>
          </button>

          <button
            onClick={() => setSelectedRole("patient")}
            className={cn(
              "w-full p-5 rounded-xl border-2 transition-all duration-200 text-left flex items-start gap-4",
              selectedRole === "patient"
                ? "border-emerald-500 bg-emerald-50 shadow-md shadow-emerald-100"
                : "border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
              selectedRole === "patient" ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-600"
            )}>
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 text-lg">
                I'm a Patient
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                View consultation reports, explore trial suggestions, manage consent
              </p>
            </div>
          </button>
        </div>

        {/* Specialty input for doctors */}
        {selectedRole === "doctor" && (
          <div className="mb-6 animate-fade-in">
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Medical Specialty
            </label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder="e.g., Cardiology, Neurology, General Practice"
              className="input"
            />
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!selectedRole || loading}
          className={cn(
            "w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2",
            selectedRole
              ? "bg-gradient-to-r from-blue-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 shadow-lg hover:shadow-xl"
              : "bg-slate-300 cursor-not-allowed"
          )}
        >
          {loading ? (
            <>
              <Sparkles className="w-5 h-5 animate-spin" />
              Setting up your account...
            </>
          ) : (
            <>
              Continue to Dashboard
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
