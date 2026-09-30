# Runbook: Alert Triage & Response

## Alert Matrix

### Alert 1: `HighApiErrorRate` (Error Rate > 1%)
- **What it means**: More than 1% of incoming API requests are returning 5xx responses.
- **Check impact**: Review `/api/health` status and inspect request logs for correlated `requestId`.
- **Likely causes**: Downstream Firebase credential expiry, Gemini API timeout, unhandled edge-case payload.
- **Fix**: Check server logs for stack trace, verify API key status in settings, rollback recent commit if regression.
- **Escalate to**: On-call Lead Engineer if unresolved within 10 minutes.

### Alert 2: `CareCompassAlertDeliveryFailure`
- **What it means**: Emergency WhatsApp/Voice dispatch failed across primary and secondary gateways.
- **Check impact**: Query `/api/sos/dispatches` to check count of failed dispatches.
- **Likely causes**: Meta Cloud API token expiration, Twilio balance exhaustion, recipient phone formatted without country code.
- **Fix**: Check fallback SMS channel, verify Meta token, trigger manual caregiver call modal in patient UI.
- **Escalate to**: Immediate emergency triage.
