# SmritiSaathi – Layer 8: Testing Strategy

## 1. Test Architecture
We employ a 3-tier testing strategy ensuring cognitive resilience, elder safety, and data isolation:

```
          / \
         /   \
        / E2E \       Playwright / Critical User Flows
       /-------\      (Emergency SOS, Game Complete, Auth Sync)
      /         \
     /Integration\    Supertest / Express API + In-Memory Tenant DB
    /-------------\   (401/403/404 Tenant Isolation, Rate Limiting)
   /   Unit Tests  \  Pure Functions (can() RBAC, Scoring, Audio, Logger)
  /-----------------\
```

## 2. Mocking Policy (Strictly Enforced)
- **What is NEVER Mocked**:
  - Our database queries and memory store.
  - Our `can()` authorization and multi-tenant isolation filters.
  - Our rate-limiting sliding window and error formatting.
- **What IS Mocked**:
  - Outbound third-party SMS/WhatsApp HTTP calls (Meta Cloud API, Twilio API).
  - Web speech synthesis browser audio playback.

## 3. Critical Flow Checklist
- **Unauthenticated API Access**: Returns `401 Unauthorized` with standard JSON envelope.
- **Cross-Tenant IDOR Attempt**: User from Org A attempting to access Org B resource receives `404 Not Found` (never 200 and never 403).
- **Role Permission Enforcement**: User with `Viewer` role attempting to delete family face receives `403 Forbidden`.
- **Wandering Breach SOS**: Simulated GPS coordinate outside safe radius accurately triggers alert state.
- **Rate Limit Trigger**: Exceeding 20 rapid requests triggers `429 Too Many Requests` with `Retry-After`.
