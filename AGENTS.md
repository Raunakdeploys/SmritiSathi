# Project: SmritiSaathi (स्मृति साथी)

## What this product does
SmritiSaathi is an adaptive cognitive stimulation, personalized reminiscence therapy, and elder safety platform designed for seniors with Mild Cognitive Impairment (MCI) and Alzheimer's, and their family caregivers. It provides multi-turn AI memory companionship, interactive cognitive exercises, CareCompass live GPS geofencing with distress voice reassurance, and multi-tenant clinical caregiver portals.

## Stack (do not change without asking)
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS (v4)
- Backend: Modular Express Monolith (`server.ts` with `tsx`) + Firebase Admin SDK
- Database & Persistence: Firestore / Local JSON document store with multi-tenant org scoping
- Auth: Firebase Authentication + Google Sign-In with server-side Bearer ID token verification
- AI SDK: `@google/genai` (Gemini 2.5 Flash / Server-Side Gemini API with Google Search Grounding)
- Real-time & Safety: CareCompass GPS Telemetry Engine, Leaflet / Google Maps Overlays, WhatsApp alert dispatchers
- Hosting: Port 3000 container / Render / Cloud Run / Vercel

## Rules
- Never commit secrets. All secrets go in environment variables, documented in `.env.example`.
- Every new API endpoint needs: input validation, auth check, authorization check (`can(user, action, resource)`), standard error envelope.
- Every tenant resource must be scoped by `organization_id`. Cross-tenant queries must return 404 (IDOR prevention).
- Run lint, typecheck, and tests before saying a task is done.
- Ask before adding a new dependency.
- Prefer small, reviewable changes. One feature per branch.
- No custom password hashing; use verified identity providers.
- Every state must handle 4 states: loading, empty, error, success.
- Enforce WCAG 2.1 AA accessibility (labels, visible focus rings, keyboard nav, contrast).

## Commands
- Dev: `npm run dev`
- Test: `npm test`
- Lint/Typecheck: `npm run lint` (`tsc --noEmit`)
- Build: `npm run build`

## Architecture Decisions
See `/docs/decisions/` for the log of architectural decision records (ADRs) and why they were made.
- ADR 0001: Modular Monolith with React 19 and Express
- ADR 0002: Multi-Tenant RBAC Security Model
- ADR 0003: DPDP Act 2023 Compliance & Data Export

## Universal "Don't Fool Me" Verification Standard
Before declaring any task complete:
1. Run lint, typecheck and test suite, showing clean output.
2. List every file changed and why.
3. List anything skipped, stubbed, mocked or hard-coded.
4. List assumptions made that require user confirmation.
Do not describe work as complete if any check is failing or skipped.
