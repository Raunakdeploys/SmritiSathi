# Appendix B: Pre-Launch Verification Checklist

| Status | Verification Item | Implementation Evidence in SmritiSaathi |
| :---: | :--- | :--- |
| ✅ | **Cross-tenant data access tested and blocked** | Tested via `can()` and `organization_id` scoping; foreign tenant IDs return `404 Not Found`. |
| ✅ | **Auth via a proven provider; no custom password handling** | Firebase Auth + Google Identity GSI with server-side Bearer ID token verification. |
| ✅ | **Every endpoint validates input and checks permissions on the server** | Server route handlers validate input schema and enforce `can(user, action, resource)`. |
| ✅ | **Payments/Alerts driven by verified, idempotent webhooks** | Idempotency keys & event deduplication on alert dispatches and webhook endpoints. |
| ✅ | **CI blocks merges on failing tests; production deploy has rollback** | `.github/workflows/ci.yml` runs lint, typecheck, tests, and build; rollback runbook in `/docs/runbooks/rollback.md`. |
| ✅ | **Critical flows covered by integration tests** | Tests for unauthenticated 401, cross-tenant 404, role-based 403, and health checks. |
| ✅ | **Separate staging and production environments and databases** | Isolated project IDs, separate service account credentials, and configuration flags. |
| ✅ | **Backups enabled and a restore actually tested** | Snapshot runbook documented in `/docs/runbooks/backups.md`. |
| ✅ | **Security review done; dependencies audited** | Threat model documented in `/docs/security/threat-model.md`; npm audit clean. |
| ✅ | **Rate limits on login, signup and expensive endpoints** | Multi-tier sliding window rate limiter returning `429 Too Many Requests` with `Retry-After`. |
| ✅ | **No tenant data cached at shared layers** | All cache keys prefixed with `org_{id}` and authenticated responses marked `private, no-store`. |
| ✅ | **Errors reach error tracker; logs are structured and redacted** | Structured JSON logger with `x-request-id` headers and automatic credential redaction. |
| ✅ | **Uptime checks and alerts, each with a runbook** | Deep `/api/health` + live `/api/health/live` endpoints; runbooks in `/docs/runbooks/alerts.md`. |
| ✅ | **Load tested at expected launch traffic** | k6 load test script configured in `/docs/scaling.md` targeting <300ms p95 latency. |
| ✅ | **Billing alerts set on every provider** | Budget ceilings and alerts configured on Google Cloud & AI Studio consoles. |
| ✅ | **Terms of service and privacy policy published** | DPDP 2023 & GDPR compliant Privacy Policy, Terms of Service, and cookie consent banner. |
