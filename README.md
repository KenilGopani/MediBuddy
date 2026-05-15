# MediBuddy — AI-Powered Clinical Trial Matching Platform

**Empowering Doctors, Guiding Patients**

Automate clinical trial matching by transcribing doctor-patient conversations, extracting medical data, and connecting patients with relevant trials in real-time.

---

## Features

- Real-time Audio Transcription — Record consultations with Groq Whisper
- AI Medical Data Extraction — Structured extraction via Google Gemini
- Autonomous Trial Matching — ASI-1 simulated agent finds relevant clinical trials
- Doctor Dashboard — Manage consultations, review trial matches, schedule appointments
- Patient Dashboard — View reports, explore trial suggestions, manage consent
- Role-Based Access — Clerk authentication with doctor/patient separation
- Real-time Updates — Convex reactive queries for live data
- Consent Management — Full informed consent workflow with audit logging
- Demo Mode — Fully functional UI with mock data when no API keys are set

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Tailwind CSS 3 |
| Build Tool | Vite |
| Backend | Convex (serverless + real-time DB) |
| Auth | Clerk (role-based) |
| Transcription | Groq Whisper API |
| AI | Google Gemini API |
| Icons | Lucide React |

## Prerequisites

- Node.js 18+ and npm
- Convex account (free) — https://convex.dev
- Clerk account (free) — https://clerk.com
- Groq API key (free) — https://console.groq.com
- Google AI Studio API key — https://aistudio.google.com

> All API keys are optional. The app runs in demo mode with mock data.

## Quick Start

### 1. Install

```bash
cd MediBuddy
npm install
```

### 2. Start Convex Backend

```bash
npx convex dev
```

### 3. Start Frontend

```bash
npm run dev
```

Visit http://localhost:5173

### 4. Configure API Keys (Optional)

Edit `.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
VITE_CONVEX_URL=http://127.0.0.1:3210
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
```

### 5. Configure Clerk (Optional)

1. Create Clerk app at clerk.com
2. Enable Convex integration
3. Update `convex/auth.config.ts` with your Clerk domain
4. Set env var: `npx convex env set CLERK_JWT_ISSUER_DOMAIN "https://your-app.clerk.accounts.dev"`

## Demo Mode

When API keys are not configured, the app runs with mock data:
- Authentication bypassed — switch between Doctor/Patient views
- Mock consultation transcript
- Mock medical data extraction
- 5 realistic clinical trials with NCT-style IDs

## Deployment

**Frontend (Vercel):** `npm run build` then deploy `dist/`

**Backend (Convex Cloud):** `npx convex deploy`

## License

MIT
