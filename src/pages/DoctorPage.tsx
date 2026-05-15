import { Routes, Route } from "react-router-dom";
import Navbar from "../components/shared/Navbar";
import DoctorDashboard from "../components/doctor/DoctorDashboard";
import StartConsultation from "../components/doctor/StartConsultation";

export default function DoctorPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route index element={<DoctorDashboard />} />
          <Route path="consultation" element={<StartConsultation />} />
        </Routes>
      </main>
    </div>
  );
}
