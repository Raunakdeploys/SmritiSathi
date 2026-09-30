# SmritiSaathi – Layer 15: Scaling & Load Testing Plan

## 1. Stateless Architecture Checklist
- [x] Sessions stored in client tokens / Firebase Admin verified claims (zero sticky server memory).
- [x] Uploads stored in object storage / Firestore documents, never local container filesystem.
- [x] Dynamic rate limit sliding window supports distributed shared counters.
- [x] Zero state preventing multiple container nodes running behind load balancer.

## 2. Load Testing Profile (k6 Test Script)
Run load simulation against staging:
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },  // ramp-up to 50 concurrent users
    { duration: '5m', target: 200 }, // hold at 200 concurrent users
    { duration: '2m', target: 0 },   // ramp-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% of requests must complete below 300ms
    http_req_failed: ['rate<0.01'],   // error rate must remain under 1%
  },
};

export default function () {
  const res = http.get('https://smritisathi.in/api/health');
  check(res, { 'status was 200': (r) => r.status === 200 });
  sleep(1);
}
```

## 3. Targeted Optimizations for 10x Scale
1. **Database Read Reduction**: In-memory LRU cache for static game catalogs and FAQ.
2. **GPS Ping Throttling**: Ignore consecutive identical stationary coordinates (within 2 meters) to save 80% of database write volume.
3. **Connection Pooling**: Keep-Alive HTTP agent on third-party API dispatchers.
