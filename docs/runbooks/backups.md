# Runbook: Database Backups & Point-in-Time Restore

## 1. Automated Schedule
- **Frequency**: Automated hourly snapshots of document stores; daily full cold backup to encrypted secondary cloud bucket.
- **Retention**: 30 days of daily snapshots, 12 monthly archives for clinical audit trails.

## 2. Point-in-Time Restore Procedure
1. Identify target timestamp of desired restore point.
2. Spin up an isolated staging database container:
   ```bash
   npm run db:restore -- --timestamp="2026-09-30T00:00:00Z" --target="staging"
   ```
3. Run automated verification suite against restored staging DB to ensure integrity of multi-tenant patient records.
4. If approved by Lead Engineer, switch connection strings with graceful 30-second maintenance window.
5. Notify caregivers upon completion.
