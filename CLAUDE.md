# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server (http://localhost:5173)
- `npx convex dev` — Convex backend; run in a second terminal. Regenerates `convex/_generated/` (never hand-edit it).
- `npm run build` — `tsc && vite build` (type errors block the build). `npx tsc --noEmit` is currently clean (it covers `src/` only, not `convex/` or `tests/`).
- `npm test` — Vitest (`vitest.config.mts`, `edge-runtime` environment). 67 tests in `tests/` run the real Convex functions in memory via `convex-test`, with fake logins (`t.withIdentity({ subject })`) and `fetch` stubbed, so they need no network, keys or deployment. Single file: `npx vitest run tests/access.test.ts`. `tests/helpers.ts` has `setup()` (a doctor and two patients) and factories. Vitest is pinned to 3.x because the project is on Vite 5.
- `npm run lint` — ESLint with `--max-warnings 0`. Currently fails with ~190 pre-existing problems in `src` (mostly `no-explicit-any`) and ~70 in `convex`.
- `npx convex dev --once` deploys the functions and runs Convex's own strict type check (stricter than the root `tsc`).

## Architecture

MediBuddy AI: a doctor/patient platform that turns recorded consultations into transcripts, structured medical data, reports, and clinical trial matches. Vite + React 18 + TypeScript SPA, Convex backend, Clerk auth, Tailwind + shadcn/Radix UI (`components.json`; `@/` alias → `src/`; `src/components/ui/` is shadcn-generated).

**Provider stack** (`src/main.tsx`): `ClerkProvider` → `ConvexProviderWithClerk` → `BrowserRouter` → `App`. Convex validates Clerk JWTs via `convex/auth.config.ts` (`CLERK_SIGNING_KEY` as issuer domain, applicationID `convex`).

**Roles & routing** (`src/App.tsx`, `src/components/wrappers/`): users choose a role at `/role-selection`. `DoctorRoute` / `PatientRoute` / `ProtectedRoute` each look up the Convex user (`users.getUserByToken`, keyed by Clerk `user.id`) and lazily create it with `users.createOrUpdateUser` if missing, then gate on role. Pages are in `src/pages/{doctor,patient}`.

**Backend pipeline** (`convex/`), tables in `schema.ts`: `audioRecordings`, `users`, `consultations`, `clinicalTrials`, `trialMatches`, `meetings`.
1. `meetings.ts` — appointments (patient requests, doctor approves); `consultations.ts` — consultation record per meeting, transcript, structured data, sharing with patient. Has duplicate-consultation cleanup helpers, so watch for double-creation bugs.
2. `audio.ts` — upload to Convex storage, then `performTranscription` action calls Groq Whisper (`whisper-large-v3-turbo`) via raw `fetch`.
3. `medicalEntityExtraction.ts` — LLM extraction of conditions/meds/vitals from the transcript (two entry points: `extractMedicalEntities`, which `audio.ts` schedules automatically after transcription, and `extractMedicalEntitiesWithGemini`, kept under its old name for the UI); `medicalReports.ts` — SOAP report generation. All LLM calls go through `convex/llm.ts`, a provider-neutral OpenAI-compatible client configured by `LLM_API_KEY`, `LLM_MODEL` and optional `LLM_BASE_URL` (defaults to OpenAI; Gemini works via its OpenAI-compatible endpoint). It retries with an adjusted request when a provider rejects `max_tokens`, `temperature` or `response_format`, and reads `reasoning_content` when `content` is empty. Don't name a specific provider in docs or code; the free provider used during development is deliberately not mentioned.
4. `clinicalTrials.ts` — queries ClinicalTrials.gov v2 API and caches into `clinicalTrials`.
5. `trialMatching.ts` — weighted scoring in the `WEIGHTS` constant (condition 40, age 15, medication 15, gender 10, comorbidity 10, location 5, allergy 5); writes `trialMatches`. `asi1.ts` — Fetch.ai ASI-1 chat completions for analysis/enhancement, with interactions stored for audit.
6. `notifications.ts` — patient-facing trial notifications and the consent state machine (`updatePatientConsent`, consent history).

**Access control** (`convex/authz.ts`): every public function checks the caller. Doctors can access all patients; patients only their own records. Queries use `can*` helpers and return empty (`null`/`[]`/`0`) when denied so pages don't crash before the auth token arrives; mutations/actions use `require*` helpers, which throw. Scheduled jobs run with no user, so the background pipeline (audio → transcription → extraction → matching) calls `*Internal` twins (`internalQuery`/`internalAction`) instead of the public `api.*` functions. When adding a server-to-server call, use the internal twin; when adding a public function, add a check. Test as a user with `npx convex run fn '{...}' --identity '{"subject":"<tokenIdentifier>"}'`.

**Demo data**: `npx convex run seed:seedDemoData` (needs a signed-in doctor; creates 10 fictional patients, 11 trials, 14 consultations, and attaches 2 more consultations to the first signed-in patient), then `python3 scripts/seed_audio.py` (macOS only: speaks each seeded transcript with `say`, uploads it to Convex storage and links it as the consultation's recording). `seed:resetDemoData` removes all of it including audio files; `seed:cleanupSince '{"since": <ms>}'` deletes non-seed records created after a timestamp; `seed:removeSelfConsultations` deletes doctor-as-patient consultations. Seeded transcripts must keep the `Doctor:` / `Patient:` line format for the audio script.

**Trial matching**: a trial needs at least one condition match (`conditionsMatch` in `convex/conditionMatching.ts`, which uses `CONDITION_SYNONYMS` for abbreviations like COPD/CKD/RA; short terms match whole words only) and a total score of 50+. Location is NOT scored: `WEIGHTS.LOCATION_MATCH` exists but no function uses it, so don't claim location matching in copy. The local match runs even if the ClinicalTrials.gov or ASI-1 steps fail.

**Client agent system** (`src/agents/`): `initializeAgentSystem(convex)` is called from `App.tsx`. It sets up doctor/patient/ASI1 agents that exchange messages through `communication.ts`, which is an in-memory queue and registry (not persistent, lost on reload).

## Environment

Copy `.env.example` to `.env.local`; `.env*` is gitignored except the example.

- Client (`VITE_`): `VITE_CONVEX_URL`, `VITE_CLERK_PUBLISHABLE_KEY` (app throws without it). Never put API keys in `VITE_` variables; they end up in the browser bundle.
- Convex env (set with `npx convex env set`, not `.env`): `CLERK_SIGNING_KEY` (the Clerk Frontend API URL, despite the name), `GROQ_API_KEY`, `LLM_API_KEY`, `LLM_MODEL`, `LLM_BASE_URL`, `ASI1_API_KEY`, `ASI1_BASE_URL`, `ASI1_MODEL`.

## Known repo issues (don't "fix" unprompted; mention when relevant)

- **Uncommitted rewrite**: if the working tree is still uncommitted, HEAD has a different, older structure (`convex/appointments.ts`, `summaries.ts`, `src/components/doctor/*`, ...). Don't treat `git show HEAD:` or `git log` file contents as current.
- `tsconfig.json` has `strict: false` (and `tsconfig.app.json` is `strict: true` but unreferenced), so expect loose typing and many `as any`.
- `src/components/ui/` is shadcn-generated but is NOT tracked in git history and only contains the components in use; add others with the shadcn CLI as needed. A `<Toaster />` must stay mounted in `App.tsx` or every `toast()` is invisible.
- Several public backend functions have no caller in the UI (for example `consultations.complete`, `meetings.updateMeetingStatus`, `notifications.getConsentHistory`). They form the API surface and are covered by tests, so don't treat them as dead code.
- `convex/_generated/` was regenerated by newer `convex`; `@clerk/clerk-react` must stay recent enough that its `useAuth` type satisfies Convex's `UseAuth` (a type-only mismatch broke `tsc` once).
- Sensitive medical data: avoid logging transcripts/PII and keep the patient-consent gating in `notifications.ts` intact. The app is a prototype with no privacy review; any doctor can see every patient.

## Working guidelines

Bias toward caution over speed; use judgment for trivial tasks.

1. **Think before coding.** State assumptions explicitly. If multiple interpretations exist, present them rather than picking silently. If something is unclear, stop, name it, and ask. Push back if a simpler approach exists.
2. **Simplicity first.** Minimum code that solves the problem. No unrequested features, no single-use abstractions, no speculative configurability, no error handling for impossible cases.
3. **Surgical changes.** Touch only what the request requires; match existing style; don't refactor or reformat adjacent code. Remove only the imports/variables your change orphaned. Mention unrelated dead code instead of deleting it. Every changed line should trace to the request.
4. **Goal-driven execution.** Turn tasks into verifiable goals (e.g. "fix the bug" → reproduce it, then make it pass; "refactor" → checks pass before and after). For multi-step work, state a short plan with a verify step for each item. The usual verify steps are `npm test`, `npx tsc --noEmit`, and `npx convex dev --once` for backend changes. When fixing a bug, add a test that fails without the fix (check by reverting the fix).
