# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server (http://localhost:5173)
- `npx convex dev` — Convex backend; run in a second terminal. Regenerates `convex/_generated/` (never hand-edit it).
- `npm run build` — `tsc ; vite build`. The `;` means type errors do NOT block the bundle, so run `npx tsc --noEmit` yourself to check types.
- `npm run lint` — ESLint with `--max-warnings 0`. Currently fails with ~190 pre-existing problems (mostly `no-explicit-any`); `npx tsc --noEmit` currently reports 12 pre-existing errors (e.g. `className` passed to an icon-like component in `patient/notifications.tsx`, `patient/reports.tsx`).
- No test runner is configured. Verify changes with `tsc`, lint, and by running the app.

## Architecture

MediBuddy AI: a doctor/patient platform that turns recorded consultations into transcripts, structured medical data, reports, and clinical trial matches. Vite + React 18 + TypeScript SPA, Convex backend, Clerk auth, Tailwind + shadcn/Radix UI (`components.json`; `@/` alias → `src/`; `src/components/ui/` is shadcn-generated).

**Provider stack** (`src/main.tsx`): `ClerkProvider` → `ConvexProviderWithClerk` → `BrowserRouter` → `App`. Convex validates Clerk JWTs via `convex/auth.config.ts` (`CLERK_SIGNING_KEY` as issuer domain, applicationID `convex`).

**Roles & routing** (`src/App.tsx`, `src/components/wrappers/`): users choose a role at `/role-selection`. `DoctorRoute` / `PatientRoute` / `ProtectedRoute` each look up the Convex user (`users.getUserByToken`, keyed by Clerk `user.id`) and lazily create it with `users.createOrUpdateUser` if missing, then gate on role. Pages are in `src/pages/{doctor,patient}`.

**Backend pipeline** (`convex/`), tables in `schema.ts`: `audioRecordings`, `users`, `consultations`, `clinicalTrials`, `trialMatches`, `meetings`.
1. `meetings.ts` — appointments (patient requests, doctor approves); `consultations.ts` — consultation record per meeting, transcript, structured data, sharing with patient. Has duplicate-consultation cleanup helpers, so watch for double-creation bugs.
2. `audio.ts` — upload to Convex storage, then `performTranscription` action calls Groq Whisper (`whisper-large-v3-turbo`) via raw `fetch`.
3. `medicalEntityExtraction.ts` — LLM extraction of conditions/meds/vitals from the transcript (ASI1 path and a Gemini path, `extractMedicalEntitiesWithGemini`); `medicalReports.ts` — report generation.
4. `clinicalTrials.ts` — queries ClinicalTrials.gov v2 API and caches into `clinicalTrials`.
5. `trialMatching.ts` — weighted scoring in the `WEIGHTS` constant (condition 40, age 15, medication 15, gender 10, comorbidity 10, location 5, allergy 5); writes `trialMatches`. `asi1.ts` — Fetch.ai ASI-1 chat completions for analysis/enhancement, with interactions stored for audit.
6. `notifications.ts` — patient-facing trial notifications and the consent state machine (`updatePatientConsent`, consent history).

**Client agent system** (`src/agents/`): `initializeAgentSystem(convex)` is called from `App.tsx`. It sets up doctor/patient/ASI1 agents that exchange messages through `communication.ts`, which is an in-memory queue and registry (not persistent, lost on reload).

## Environment

Copy `.env.example` to `.env.local`; `.env*` is gitignored except the example.

- Client (`VITE_`): `VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY` (app throws without it). Used only by unused libs: `VITE_GOOGLE_GEMINI_API_KEY`, `VITE_GROQ_API_KEY`, `VITE_SUPABASE_*`.
- Convex env (set with `npx convex env set`, not `.env`): `CLERK_SIGNING_KEY`, `GROQ_API_KEY`, `GOOGLE_GEMINI_API_KEY`, `OPENAI_API_KEY`, `ASI1_API_KEY`, `ASI1_BASE_URL`, `ASI1_MODEL`.

## Known repo issues (don't "fix" unprompted; mention when relevant)

- **Uncommitted rewrite**: the working tree is a large rewrite of the last commits. HEAD has a different, older structure (`convex/appointments.ts`, `summaries.ts`, `src/components/doctor/*`, ...) that is deleted in the working tree. Don't treat `git show HEAD:` or `git log` file contents as current.
- `src/lib/gemini.ts`, `src/lib/groq.ts`, `src/lib/supabase.ts` are not imported anywhere (leftover code), so `@supabase/supabase-js` and `groq-sdk` are effectively unused. The README's "Groq → Gemini → ASI-1" description is the original design; actual LLM calls happen in `convex/` actions.
- `tsconfig.json` has `strict: false` (and `tsconfig.app.json` is `strict: true` but unreferenced), so expect loose typing and many `as any`.
- `tempo.config.json` and the `types:supabase` script are scaffold leftovers.
- Sensitive medical data: avoid logging transcripts/PII and keep the patient-consent gating in `notifications.ts` intact.

## Working guidelines

Bias toward caution over speed; use judgment for trivial tasks.

1. **Think before coding.** State assumptions explicitly. If multiple interpretations exist, present them rather than picking silently. If something is unclear, stop, name it, and ask. Push back if a simpler approach exists.
2. **Simplicity first.** Minimum code that solves the problem. No unrequested features, no single-use abstractions, no speculative configurability, no error handling for impossible cases.
3. **Surgical changes.** Touch only what the request requires; match existing style; don't refactor or reformat adjacent code. Remove only the imports/variables your change orphaned. Mention unrelated dead code instead of deleting it. Every changed line should trace to the request.
4. **Goal-driven execution.** Turn tasks into verifiable goals (e.g. "fix the bug" → reproduce it, then make it pass; "refactor" → checks pass before and after). For multi-step work, state a short plan with a verify step for each item. With no test suite here, the verify step is usually `npx tsc --noEmit`, lint, or exercising the flow in the running app.
