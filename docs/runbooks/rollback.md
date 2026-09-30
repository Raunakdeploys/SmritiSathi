# Runbook: Production Deployment Rollback

## 1. Trigger Conditions
- 5xx error rate spikes above 2% following a deployment.
- CareCompass GPS telemetry failures or alert dispatcher delivery collapse.
- Regression in core cognitive games preventing patient interaction.

## 2. Immediate Rollback Steps
1. **Container / Cloud Run Rollback**:
   - Revert traffic immediately to previous revision in Cloud Run console or CLI:
     ```bash
     gcloud run services update-traffic smritisathi --to-revisions=PREVIOUS_REVISION=100
     ```
2. **Git Branch Revert**:
   - Create a rollback PR:
     ```bash
     git revert HEAD -m 1
     git push origin main
     ```
3. **Database Migration Verification**:
   - Ensure previous schema compatibility (all schema changes must be backward compatible for at least 1 release cycle).
4. **Post-Rollback Health Verification**:
   - Ping `https://<service-url>/api/health` to confirm all green statuses.
