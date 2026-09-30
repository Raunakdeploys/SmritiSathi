# ADR 0002: Multi-Tenant RBAC Security Model

## Status
Accepted

## Context
Senior cognitive health records and live wandering GPS tracks constitute sensitive personal and medical data. The system must support individual families as well as multi-patient clinics with multiple care workers. Data leaks between tenants (Insecure Direct Object Reference - IDOR) would cause catastrophic safety and legal violations.

## Decision
1. Implement a 4-tier Role-Based Access Control (RBAC) model:
   - `Owner`: Organization founder, billing manager, full admin powers.
   - `Admin`: Care coordinator, can invite caregivers, modify geofence coordinates, configure WhatsApp alerts.
   - `Member`: Primary family caregiver, can record cognitive scores, add family memories, trigger SOS.
   - `Viewer`: Secondary relative or observer, read-only access to progress reports and photo albums.
2. Centralize authorization in a single `can(role, action, resource)` evaluator.
3. Require `organization_id` on all tenant resources.
4. Ensure cross-tenant queries return `404 Not Found` (never `403 Forbidden`) so attackers cannot enumerate foreign IDs.

## Alternatives Considered
- *Single-tenant database per client*: Excessive operational cost and migration burden for small family plans.
- *Frontend-only role checks (hiding buttons)*: Severely insecure. The server must remain the sole source of truth.

## Consequences
- Guaranteed cryptographic and logical data isolation between eldercare facilities and families.
- Deterministic permission auditing and automated integration test coverage.
