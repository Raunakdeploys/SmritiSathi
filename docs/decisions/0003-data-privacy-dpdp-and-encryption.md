# ADR 0003: DPDP Act 2023 Compliance & Data Export

## Status
Accepted

## Context
Under India's Digital Personal Data Protection (DPDP) Act 2023 and global privacy standards (GDPR), elder users and their legally appointed guardians hold fundamental rights:
1. Right to know what personal health and location data is processed.
2. Right to download/export all personal records in a portable machine-readable format.
3. Right to complete data erasure (Right to be Forgotten).
4. Mandatory cookie and tracking transparency.

## Decision
1. Provide a comprehensive cookie consent banner with granular options (Essential, Performance, Reminiscence Cache) and zero third-party marketing cookies.
2. Implement `GET /api/user/export-data` returning an authenticated, tenant-scoped JSON archive containing all user profile details, cognitive activity logs, game scores, family face tags, and wandering alert records.
3. Implement `POST /api/user/delete-account` performing irreversible anonymization or complete erasure of patient records upon caregiver confirmation.
4. Redact sensitive credentials (passwords, tokens, bearer headers, credit card info, PINs) from server logs using an automated regex filter.

## Alternatives Considered
- *Third-party external analytics (Google Analytics / Facebook Pixel)*: Rejected to protect senior medical privacy and prevent third-party profiling.

## Consequences
- 100% compliant with DPDP Act 2023.
- Builds deep trust with families and healthcare providers.
