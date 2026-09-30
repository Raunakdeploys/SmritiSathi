# SmritiSaathi – Layer 5: API Conventions & Error Standards

## 1. RESTful URL Conventions
- Plural nouns for collections: `/api/activities`, `/api/family-members`, `/api/organization/members`
- Nested resources scoped by parent: `/api/organization/:orgId/members`
- Action RPC endpoints use explicit verb suffixes: `/api/auth/sync`, `/api/sos/dispatch-message`, `/api/jobs/trigger-export`

## 2. Standardized Response Envelope
Every API response strictly follows this uniform JSON schema:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "requestId": "req-1727715000000-abcd",
  "meta": {
    "total": 42,
    "hasMore": false,
    "nextCursor": null
  }
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid GPS coordinates provided. Latitude must be between -90 and 90.",
    "details": {
      "field": "latitude",
      "rejectedValue": 195.4
    }
  },
  "requestId": "req-1727715000000-abcd"
}
```

## 3. Standard HTTP Status Codes
| HTTP Code | Error Code | When Used |
| :--- | :--- | :--- |
| `200 OK` | - | Successful synchronous read or mutation |
| `201 Created` | - | Successfully created resource (e.g. new family member, activity) |
| `400 Bad Request` | `VALIDATION_ERROR` / `BAD_REQUEST` | Malformed JSON or input validation failure |
| `401 Unauthorized` | `UNAUTHORIZED` | Missing or invalid Bearer authentication token |
| `403 Forbidden` | `FORBIDDEN` | Authenticated user lacks required role/permission |
| `404 Not Found` | `NOT_FOUND` | Resource does not exist, or belongs to another tenant (IDOR prevention) |
| `429 Too Many Requests` | `RATE_LIMITED` | Rate limit window exceeded; returns `Retry-After: N` header |
| `500 Internal Error` | `INTERNAL_ERROR` | Unexpected server failure; error details redacted in production |

## 4. Cursor-Based Pagination
List endpoints support `limit` (default 20, max 100) and `cursor` (opaque base64 or ISO timestamp). Responses return `nextCursor` for sequential infinite scrolling without deep offset performance penalties.

## 5. Idempotent Processing
State-changing webhook and alert dispatch requests accept an `Idempotency-Key` or `event_id` header to guarantee that duplicate network transmissions do not result in repeated WhatsApp messages or double counting of game scores.
