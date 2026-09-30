# SmritiSaathi – Layer 4: Role-Based Access Control (RBAC) & Permissions

## 1. Permissions Matrix

| Resource & Action | Owner | Admin | Member (Primary Caregiver) | Viewer (Secondary Relative) |
| :--- | :---: | :---: | :---: | :---: |
| **Cognitive Games & Progress** |
| `progress:read` | ✅ | ✅ | ✅ | ✅ |
| `progress:write` (record game scores, training) | ✅ | ✅ | ✅ | ❌ |
| `progress:reset` | ✅ | ✅ | ❌ | ❌ |
| **CareCompass & Geofence Safety** |
| `telemetry:read` (live map location) | ✅ | ✅ | ✅ | ✅ |
| `telemetry:update` (GPS pings) | ✅ | ✅ | ✅ | ❌ |
| `geofence:configure` (safe radius, coords) | ✅ | ✅ | ❌ | ❌ |
| `alert:dispatch` (trigger SOS) | ✅ | ✅ | ✅ | ❌ |
| `alert:acknowledge` | ✅ | ✅ | ✅ | ❌ |
| **Family Memory Bank** |
| `family:read` (photo album & greetings) | ✅ | ✅ | ✅ | ✅ |
| `family:create` (add family photos/notes) | ✅ | ✅ | ✅ | ❌ |
| `family:delete` | ✅ | ✅ | ❌ | ❌ |
| **Team & Organization** |
| `org:read` | ✅ | ✅ | ✅ | ✅ |
| `org:invite` | ✅ | ✅ | ❌ | ❌ |
| `org:change_role` | ✅ | ✅ | ❌ | ❌ |
| `org:remove_member` | ✅ (Cannot remove last owner) | ✅ (Only members/viewers) | ❌ | ❌ |
| `org:delete` | ✅ | ❌ | ❌ | ❌ |
| **Data Protection & Compliance** |
| `data:export` | ✅ | ✅ | ✅ | ❌ |
| `data:delete_account` | ✅ | ❌ | ❌ | ❌ |

## 2. Central `can(userRole, action, resource)` Contract
All endpoint handlers and mutations invoke the central authorization helper:
```typescript
export function can(role: UserRole, action: PermissionAction, resourceTenantId?: string, currentTenantId?: string): boolean {
  // Cross-tenant data boundary check
  if (resourceTenantId && currentTenantId && resourceTenantId !== currentTenantId) {
    return false; // Result will be translated to 404 on the API layer
  }
  
  const allowedRoles = ROLE_PERMISSIONS[action];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}
```

## 3. Server-Enforced Source of Truth
- Frontend UI components conditionally display or disable controls based on user role to provide clean UX.
- The Express server **always** performs the authoritative verification before processing any state-changing request.
- Attempting to bypass the UI using curl or DevTools returns `403 Forbidden` if unauthorized for that role, or `404 Not Found` if requesting a foreign tenant's resource.
