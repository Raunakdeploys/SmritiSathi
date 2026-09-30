# SmritiSaathi – Layer 12: Caching & CDN Strategy

## 1. Principles of Caching in Multi-Tenant Healthcare
1. **Never Cache Cross-Tenant Data**: Any cache key holding patient data must be prefixed with `org_{organization_id}`.
2. **Never Cache Authenticated Responses on Shared CDN**: Responses containing user tokens, clinical scores, or GPS tracks include `Cache-Control: private, no-store, max-age=0`.
3. **Aggressively Cache Immutable Static Assets**: Bundled JS/CSS with content hashes (`assets/[name]-[hash].js`) receive `Cache-Control: public, max-age=31536000, immutable`.
4. **Cache-Aside for AI Responses**: Identical conversational questions and reminiscence trivia queries are cached in an in-memory TTL map (5-minute TTL) to conserve API quotas and reduce speech latency.

## 2. Invalidation Policy
- **On Score / Progress Update**: Invalidate cached cognitive radar summary for `org_{id}`.
- **On Safe Zone / Geofence Edit**: Immediately purge cached geofence radius so location checks reflect changes in real time.
- **On User Signout**: Clear client IndexedDB/localStorage temporary cache entries.
