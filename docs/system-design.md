# SmritiSaathi – Layer 1: System Design

## 1. Problem Statement
Dementia, Alzheimer's disease, and Mild Cognitive Impairment (MCI) affect over 55 million seniors worldwide (with over 8.8 million in India alone). Seniors experience memory loss, temporal disorientation, and terrifying wandering episodes, while family caregivers suffer chronic burnout, hyper-vigilance, and constant anxiety. Existing solutions are either complex clinical EHR tools or basic GPS tags that lack emotional connection and therapeutic stimulation.

SmritiSaathi bridges this gap through a dual-mode platform:
1. **Dignified Senior Portal**: Voice-first reminiscence therapy, personalized face-recognition games, temporal reality quest anchoring, and intuitive one-touch navigation.
2. **Caregiver & Clinic Safety Center**: Sub-second GPS geofence radar, autonomous WhatsApp/Voice alert dispatches upon safe zone breaches, cognitive trend analytics, and multi-tenant clinical coordination.

## 2. User Roles & Personas
- **Senior / Patient (e.g., Asha Devi, 72)**: Needs high-contrast, large-typography interface, gentle audio reassurance, familiar Indian cultural cues (chai, Lata Mangeshkar melodies, cricket 1983 memories), and distress SOS.
- **Primary Family Caregiver (e.g., Rohan Sharma, Son)**: Manages safe geofence radius, receives immediate WhatsApp notifications, customizes family face albums, and tracks 3-pillar cognitive trajectories (Memory, Attention, Planning).
- **Secondary Family Member / Viewer**: Grandchildren or relatives who can view progress, listen to voice greetings, and send audio blessings, but cannot modify safety coordinates or clinical thresholds.
- **Clinic Administrator / Care Coordinator**: Manages multiple senior accounts within an eldercare clinic or assisted living facility, monitoring aggregate compliance and alert dispatches.

## 3. Tenancy Model
- **Individual / Family Account**: Scoped to an `organization_id` (e.g., `org-family-sharma-101`) containing 1 patient profile and 1-5 family members.
- **Eldercare Facility / Clinic Account**: Scoped to an `organization_id` containing multiple senior profiles, care staff with role-based access control (`Owner`, `Admin`, `Member`, `Viewer`).
- **Data Isolation**: Strict multi-tenancy. Every tenant-owned document and API query is filtered by `organization_id`. Any query attempting to access resources belonging to a foreign tenant ID terminates in `404 Not Found` (never exposing resource existence).

## 4. Data Sensitivity & Regulatory Compliance
- **Sensitivity Level**: Protected Health Information (PHI) & Highly Sensitive Personal Data (SPDI).
- **Compliance Standards**:
  - **India DPDP Act 2023**: Digital Personal Data Protection Act compliance with explicit purpose limitation, cookie & tracking consent, right to correction, personal data export (`/api/user/export-data`), and right to erasure/forget (`/api/user/delete-account`).
  - **HIPAA & GDPR Principles**: Data minimization, encryption at rest and in transit, complete redaction of passwords, tokens, and PII from server logs.
  - **Emergency Health Disclaimers**: Explicit clinical use terms acknowledging SmritiSaathi is an assistive cognitive stimulation platform and not a replacement for emergency medical personnel.

## 5. Capacity & Load: Back-of-the-Envelope Math (Year One)
- **Active Patients**: 10,000 seniors
- **Daily Active Caregivers**: 15,000 users
- **Telemetry Pings**: 1 ping every 30 seconds per active wandering session = ~200,000 pings/day (peak 15 requests/sec). Handled easily by serverless/containerized Express node.
- **AI Conversations & Reminiscence**: Average 6 interactions/patient/day = 60,000 calls/day. Server-side caching & cooldown guard prevents quota exhaustion.
- **Storage Size**: Average 2MB per patient for compressed family face photos = ~20GB total storage in Year 1.
- **First Bottleneck**: GPS telemetry write volume and third-party WhatsApp API rate limits. Mitigated by debounce caching, in-memory queueing, and fallback carrier adapters (Meta Cloud, Twilio, OpenWA).

## 6. Out-of-Scope Boundaries (Preventing Feature Creep)
- Invasive biometric EEG headset hardware integration (out of scope).
- Automated pharmaceutical prescription dispensation or pharmacy payments (out of scope).
- Live video surveillance streaming (violates patient dignity and privacy; out of scope).
