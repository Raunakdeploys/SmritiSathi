# Runbook: Incident Management & Post-Mortem Process

## 1. Incident Severity Levels
- **SEV-1 (Critical)**: CareCompass wandering alerts or SOS dispatch unavailable; data breach or cross-tenant exposure.
- **SEV-2 (Major)**: Senior cannot play games or access reminiscence therapy; high API error rate (>5%).
- **SEV-3 (Minor)**: UI glitch, cosmetic issue, delayed non-critical analytics.

## 2. Incident Declaration & Communications
1. Declare incident in designated team channel (`#incident-active`).
2. Post status update to public status dashboard (or in-app banner):
   - *"We are actively investigating an issue affecting CareCompass GPS telemetry. Emergency direct calls via mobile carrier remain operational."*
3. Update every 30 minutes until resolution.

## 3. Post-Incident Review (PIR) Template
- **Incident Summary**: What happened, start time, end time, duration.
- **Customer Impact**: Number of patients/caregivers affected.
- **Root Cause Analysis (5 Whys)**: Deep causal investigation.
- **What Went Well**: Rapid detection, fast rollback.
- **What Went Poorly**: Delayed alert notification.
- **Action Items**: Preventative code updates, automated tests added to prevent recurrence.
