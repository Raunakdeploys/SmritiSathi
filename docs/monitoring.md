# SmritiSaathi – Layer 14: Monitoring & Health Strategy

## 1. Technical Health Check Endpoints
- **Deep Health Check**: `GET /api/health`
  - Verifies read/write access to storage/database
  - Memory heap usage (RSS and heapUsed)
  - Active background jobs in queue
  - Uptime in seconds
  - Gemini AI key availability and cooldown status
  - Returns `200 OK` when healthy, or `503 Service Unavailable` if core storage fails.
- **Lightweight Liveness Probe**: `GET /api/health/live`
  - Returns instant `200 OK` `{ status: "ok" }` for Docker/Kubernetes container orchestrators without querying downstream services.

## 2. Key Metrics & Alert Thresholds
| Metric | Healthy Range | Warning Threshold | Critical Incident Threshold |
| :--- | :--- | :--- | :--- |
| **API Error Rate (5xx)** | < 0.1% | > 1% over 5m | > 5% over 2m |
| **p95 Latency** | < 250ms | > 800ms | > 2000ms |
| **Active Wandering Alert Latency** | < 3 sec | > 10 sec | > 30 sec |
| **Container Memory** | < 70% | > 80% | > 90% |
| **WhatsApp Delivery Failure** | < 0.5% | > 3% | > 10% |

## 3. SLA Commitment
- Target Uptime: **99.9%** availability for critical CareCompass telemetry and emergency SOS channels.
