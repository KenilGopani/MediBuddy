import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import LandingPage from "./pages/LandingPage";
import DoctorPage from "./pages/DoctorPage";
import PatientPage from "./pages/PatientPage";
import OnboardingPage from "./pages/OnboardingPage";
import LoadingSpinner from "./components/shared/LoadingSpinner";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const convexUrl = import.meta.env.VITE_CONVEX_URL;
const isDemoMode = !clerkPubKey || !convexUrl;

function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: "doctor" | "patient";
}) {
  if (isDemoMode) {
    return <>{children}</>;
  }

  const { isSignedIn, isLoaded, userId } = useAuth();
  const user = useQuery(api.users.getUser, userId ? { clerkId: userId } : "skip");

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  // If user hasn't completed onboarding
  if (user === null) {
    return <Navigate to="/onboarding" replace />;
  }

  // If user is loading
  if (user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Loading profile..." />
      </div>
    );
  }

  // Role check
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === "doctor" ? "/doctor" : "/patient"} replace />;
  }

  return <>{children}</>;
}

function RoleRedirect() {
  if (isDemoMode) {
    return <Navigate to="/doctor" replace />;
  }

  const { isSignedIn, isLoaded, userId } = useAuth();
  const user = useQuery(api.users.getUser, userId ? { clerkId: userId } : "skip");

  if (!isLoaded || user === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner text="Redirecting..." />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/" replace />;
  }

  if (user === null) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to={user.role === "doctor" ? "/doctor" : "/patient"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/dashboard" element={<RoleRedirect />} />
      <Route
        path="/doctor/*"
        element={
          <ProtectedRoute requiredRole="doctor">
            <DoctorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/*"
        element={
          <ProtectedRoute requiredRole="patient">
            <PatientPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
