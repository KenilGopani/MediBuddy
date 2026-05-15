import { Routes, Route } from "react-router-dom";
import Navbar from "../components/shared/Navbar";
import PatientDashboard from "../components/patient/PatientDashboard";
import ConsultationReport from "../components/patient/ConsultationReport";

export default function PatientPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route index element={<PatientDashboard />} />
          <Route path="reports" element={<ConsultationReport />} />
        </Routes>
      </main>
    </div>
  );
}
