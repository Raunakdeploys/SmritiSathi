# SmritiSaathi – Layer 10: Security & Threat Model

## 1. High-Value Assets
1. **Patient Location & Geofence Coordinates**: Sensitive real-time physical whereabouts of vulnerable elders.
2. **Cognitive Health Trajectories & Memory Albums**: Private medical and family records.
3. **Emergency Contact Numbers & WhatsApp Channels**: Communication channels that must not be hijacked or spammed.
4. **Caregiver Authentication Tokens**: Access tokens granting access to patient portals.

## 2. Threat Analysis (OWASP Top 10)

| OWASP Threat | Risk Level | Attack Vector | Implemented Mitigation |
| :--- | :---: | :--- | :--- |
| **A01: Broken Access Control (IDOR)** | **Critical** | Caregiver in Org A alters URL to fetch Org B patient's GPS track. | Mandatory server-side `can()` check and `organization_id` query scoping returning `404 Not Found`. |
| **A02: Cryptographic Failures** | High | Leaked bearer tokens, unencrypted network transmissions. | Forced HTTPS, strict TLS 1.3, secrets stored exclusively in environment variables, sensitive token redaction in logs. |
| **A03: Injection (SQL / NoSQL / Command)** | High | Malicious script payload in family member name or notes. | Strict JSON schema parsing, type coercion, parameterized NoSQL queries, DOM-safe React text rendering. |
| **A04: Insecure Design** | Medium | Replaying SMS/WhatsApp emergency alerts causing carrier spam or cost runaways. | Idempotency keys, sliding window rate limits, cooldown timer on alert triggers. |
| **A05: Security Misconfiguration** | Medium | Missing security headers, exposed stack traces in production. | Helmet-style security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`), sanitized error envelopes. |
| **A07: Identification & Auth Failures** | High | Brute-force guessing of login credentials. | Delegated to Firebase Auth & Google Identity Services; per-IP and per-email rate limiting. |

## 3. Log Redaction Standard
The structured logger automatically filters key names matching:
- `/password/i`
- `/token/i`
- `/secret/i`
- `/authorization/i`
- `/apiKey/i`
- `/creditCard/i`
- `/pin/i`
Sensitive values are replaced with `"[REDACTED]"`.
