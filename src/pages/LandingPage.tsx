import { Link } from "react-router-dom";
import {
  Stethoscope,
  Mic,
  FileText,
  Brain,
  FlaskConical,
  ShieldCheck,
  ArrowRight,
  Activity,
  Users,
  TrendingUp,
  Zap,
  Globe,
  Lock,
  ChevronRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center shadow-sm">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-800">
                Medi<span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-500">Buddy</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="btn-primary text-sm"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-emerald-50" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8 animate-fade-in">
              <Zap className="w-4 h-4" />
              AI-Powered Clinical Trial Matching
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight animate-fade-in-up">
              Empowering Doctors,{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500">
                Guiding Patients
              </span>
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              Automate clinical trial matching by transcribing doctor-patient
              conversations, extracting medical data, and connecting patients
              with relevant trials in real-time.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "200ms" }}>
              <Link
                to="/dashboard"
                className="btn-primary text-base px-8 py-3.5 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how-it-works"
                className="btn-secondary text-base px-8 py-3.5"
              >
                See How It Works
                <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Hero visual — Pipeline preview */}
          <div className="mt-20 max-w-5xl mx-auto animate-fade-in-up" style={{ animationDelay: "400ms" }}>
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-200/50 p-8 sm:p-10">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { icon: Mic, label: "Speech", color: "from-blue-500 to-blue-600", desc: "Record consultation" },
                  { icon: FileText, label: "Text", color: "from-violet-500 to-violet-600", desc: "AI transcription" },
                  { icon: Brain, label: "Medical Data", color: "from-amber-500 to-orange-500", desc: "Extract insights" },
                  { icon: FlaskConical, label: "Trial Match", color: "from-emerald-500 to-emerald-600", desc: "AI matching" },
                  { icon: ShieldCheck, label: "Consent", color: "from-rose-500 to-rose-600", desc: "Patient approval" },
                ].map((step, i) => (
                  <div key={step.label} className="relative">
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg mb-3`}>
                        <step.icon className="w-7 h-7 text-white" />
                      </div>
                      <span className="text-sm font-semibold text-slate-800">{step.label}</span>
                      <span className="text-xs text-slate-500 mt-0.5">{step.desc}</span>
                    </div>
                    {i < 4 && (
                      <div className="hidden md:block absolute top-7 -right-2 w-4 text-slate-300">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                stat: "80%",
                label: "of clinical trials face enrollment delays",
                icon: TrendingUp,
                color: "text-red-400",
              },
              {
                stat: "30%",
                label: "of trials cancelled due to insufficient enrollment",
                icon: Users,
                color: "text-amber-400",
              },
              {
                stat: "< 5%",
                label: "of patients are matched to eligible trials",
                icon: Activity,
                color: "text-blue-400",
              },
            ].map((item) => (
              <div
                key={item.stat}
                className="text-center p-6 rounded-xl bg-white/5 border border-white/10"
              >
                <item.icon className={`w-8 h-8 ${item.color} mx-auto mb-3`} />
                <div className="text-4xl font-bold text-white mb-2">
                  {item.stat}
                </div>
                <p className="text-slate-400 text-sm">{item.label}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-emerald-400 font-medium mt-8 text-lg">
            MediBuddy bridges the gap with AI-powered matching
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              How It Works
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              From consultation to clinical trial match in minutes, not months
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: Mic,
                title: "Record Consultation",
                desc: "Doctor records the patient consultation using our in-browser recorder. No additional hardware needed.",
                color: "from-blue-500 to-blue-600",
              },
              {
                step: "02",
                icon: Brain,
                title: "AI Transcription",
                desc: "Groq Whisper transcribes speech to text in real-time with medical-grade accuracy.",
                color: "from-violet-500 to-violet-600",
              },
              {
                step: "03",
                icon: FileText,
                title: "Extract Medical Data",
                desc: "Google Gemini AI extracts conditions, medications, symptoms, allergies, and vitals automatically.",
                color: "from-amber-500 to-orange-500",
              },
              {
                step: "04",
                icon: FlaskConical,
                title: "Match Trials",
                desc: "Our ASI-1 agent matches patients to the most relevant clinical trials based on their profile.",
                color: "from-emerald-500 to-emerald-600",
              },
            ].map((item) => (
              <div key={item.step} className="group">
                <div className="bg-white rounded-xl p-6 border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-sm font-bold text-slate-300">
                      {item.step}
                    </span>
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
              Built for Healthcare
            </h2>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Enterprise-grade features designed for clinical environments
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Real-time Processing",
                desc: "Live transcription and instant AI analysis as conversations happen.",
                color: "bg-blue-100 text-blue-600",
              },
              {
                icon: Lock,
                title: "HIPAA-Ready Architecture",
                desc: "Role-based access control, consent management, and full audit logging.",
                color: "bg-emerald-100 text-emerald-600",
              },
              {
                icon: Globe,
                title: "ASI-1 Trial Matching",
                desc: "Autonomous agent intelligence for finding the most relevant clinical trials.",
                color: "bg-violet-100 text-violet-600",
              },
              {
                icon: Activity,
                title: "Real-time Dashboard",
                desc: "Live updates for appointments, trial matches, and consent status changes.",
                color: "bg-amber-100 text-amber-600",
              },
              {
                icon: Users,
                title: "Role-Based Access",
                desc: "Separate doctor and patient dashboards with appropriate permissions.",
                color: "bg-rose-100 text-rose-600",
              },
              {
                icon: ShieldCheck,
                title: "Consent Management",
                desc: "Full informed consent workflow with data sharing transparency.",
                color: "bg-cyan-100 text-cyan-600",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex gap-4 p-6 rounded-xl hover:bg-slate-50 transition-colors"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center flex-shrink-0`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-emerald-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Clinical Trial Matching?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Join MediBuddy and start connecting patients with life-changing
            clinical trials through AI-powered automation.
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 bg-white text-blue-600 font-semibold rounded-lg px-8 py-3.5 shadow-lg hover:shadow-xl transition-all hover:bg-blue-50"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-emerald-400 flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold">MediBuddy</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
              <a href="#" className="hover:text-white transition-colors">Documentation</a>
            </div>
            <p className="text-sm text-slate-500">
              © 2025 MediBuddy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
