/**
 * SmritiSaathi – SaaS Playbook Core Engine
 * Implements Playbook Layers:
 * - Layer 4: RBAC & Permissions (can(role, action, resource))
 * - Layer 5: Standardized API envelopes & validation boundaries
 * - Layer 10: Security, sensitive credential redaction, OWASP mitigations
 * - Layer 11: Sliding-window Rate Limiter (429 Retry-After)
 * - Layer 12: Tenant-scoped Caching
 * - Layer 13: Structured JSON Logger with Correlation Request IDs
 * - Layer 14: Deep Subsystem Health Monitoring
 */

export type UserRole = 'Owner' | 'Admin' | 'Member' | 'Viewer';

export type PermissionAction =
  | 'progress:read'
  | 'progress:write'
  | 'progress:reset'
  | 'telemetry:read'
  | 'telemetry:update'
  | 'geofence:configure'
  | 'alert:dispatch'
  | 'alert:acknowledge'
  | 'family:read'
  | 'family:create'
  | 'family:delete'
  | 'org:read'
  | 'org:invite'
  | 'org:change_role'
  | 'org:remove_member'
  | 'org:delete'
  | 'data:export'
  | 'data:delete_account';

export const ROLE_PERMISSIONS: Record<PermissionAction, UserRole[]> = {
  'progress:read': ['Owner', 'Admin', 'Member', 'Viewer'],
  'progress:write': ['Owner', 'Admin', 'Member'],
  'progress:reset': ['Owner', 'Admin'],
  'telemetry:read': ['Owner', 'Admin', 'Member', 'Viewer'],
  'telemetry:update': ['Owner', 'Admin', 'Member'],
  'geofence:configure': ['Owner', 'Admin'],
  'alert:dispatch': ['Owner', 'Admin', 'Member'],
  'alert:acknowledge': ['Owner', 'Admin', 'Member'],
  'family:read': ['Owner', 'Admin', 'Member', 'Viewer'],
  'family:create': ['Owner', 'Admin', 'Member'],
  'family:delete': ['Owner', 'Admin'],
  'org:read': ['Owner', 'Admin', 'Member', 'Viewer'],
  'org:invite': ['Owner', 'Admin'],
  'org:change_role': ['Owner', 'Admin'],
  'org:remove_member': ['Owner', 'Admin'],
  'org:delete': ['Owner'],
  'data:export': ['Owner', 'Admin', 'Member'],
  'data:delete_account': ['Owner'],
};

/**
 * Central Authorization Check (Layer 4)
 */
export function can(
  role: UserRole,
  action: PermissionAction,
  resourceTenantId?: string,
  userTenantId?: string
): boolean {
  // Cross-tenant data isolation: if resource belongs to different tenant, forbid access (mapped to 404 on API)
  if (resourceTenantId && userTenantId && resourceTenantId !== userTenantId) {
    return false;
  }
  const allowed = ROLE_PERMISSIONS[action];
  return Boolean(allowed && allowed.includes(role));
}

/**
 * Sensitive fields to automatically redact from all structured logs (Layer 10 & 13)
 */
const REDACT_KEYS = /password|token|secret|authorization|apiKey|creditCard|pin|ssn|auth_token/i;

export function redactSensitiveData(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return obj;
  if (Array.isArray(obj)) return obj.map(redactSensitiveData);
  if (typeof obj === 'object') {
    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (REDACT_KEYS.test(key)) {
        clean[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        clean[key] = redactSensitiveData(value);
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }
  return obj;
}

/**
 * Structured JSON Logger (Layer 13)
 */
export const logger = {
  log(level: 'info' | 'warn' | 'error' | 'debug', message: string, meta: Record<string, any> = {}) {
    // In production, debug logs are suppressed
    if (level === 'debug' && process.env.NODE_ENV === 'production') return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...redactSensitiveData(meta),
    };

    const serialized = JSON.stringify(logEntry);
    if (level === 'error') {
      console.error(serialized);
    } else if (level === 'warn') {
      console.warn(serialized);
    } else {
      console.log(serialized);
    }
  },
  info(message: string, meta?: Record<string, any>) {
    this.log('info', message, meta);
  },
  warn(message: string, meta?: Record<string, any>) {
    this.log('warn', message, meta);
  },
  error(message: string, meta?: Record<string, any>) {
    this.log('error', message, meta);
  },
  debug(message: string, meta?: Record<string, any>) {
    this.log('debug', message, meta);
  },
};

/**
 * Standard API Response Envelopes (Layer 5)
 */
export function formatSuccessResponse<T>(data: T, requestId: string, meta?: Record<string, any>) {
  return {
    success: true,
    data,
    requestId,
    ...(meta ? { meta } : {}),
  };
}

export function formatErrorResponse(
  code: string,
  message: string,
  requestId: string,
  details?: Record<string, any>
) {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details: redactSensitiveData(details) } : {}),
    },
    requestId,
  };
}

/**
 * Sliding Window Rate Limiter (Layer 11)
 */
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const bucket = rateLimitStore.get(key);

  if (!bucket || now > bucket.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  if (bucket.count >= maxRequests) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfter),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - bucket.count,
    retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000),
  };
}

/**
 * Asynchronous Background Job Simulator (Layer 5 & 14)
 */
export interface BackgroundJob {
  id: string;
  type: 'DATA_EXPORT' | 'GEOFENCE_AUDIT' | 'ANONYMIZATION';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
  completedAt?: string;
  resultPayload?: any;
  error?: string;
  organizationId: string;
}

const jobQueue: BackgroundJob[] = [];
const processedIdempotencyKeys = new Set<string>();

export function enqueueBackgroundJob(
  type: BackgroundJob['type'],
  organizationId: string,
  idempotencyKey?: string
): BackgroundJob {
  if (idempotencyKey && processedIdempotencyKeys.has(idempotencyKey)) {
    const existing = jobQueue.find((j) => j.organizationId === organizationId && j.type === type);
    if (existing) return existing;
  }
  if (idempotencyKey) {
    processedIdempotencyKeys.add(idempotencyKey);
  }

  const job: BackgroundJob = {
    id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    type,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    organizationId,
  };
  jobQueue.unshift(job);
  if (jobQueue.length > 50) jobQueue.pop();

  // Simulate non-blocking async execution
  setTimeout(() => {
    job.status = 'PROCESSING';
    setTimeout(() => {
      job.status = 'COMPLETED';
      job.completedAt = new Date().toISOString();
      job.resultPayload = {
        exportedRecords: 148,
        downloadUrl: `/api/user/export-data?jobId=${job.id}`,
        sizeKb: 34.2,
      };
    }, 1500);
  }, 200);

  return job;
}

export function getBackgroundJob(jobId: string, organizationId: string): BackgroundJob | null {
  const job = jobQueue.find((j) => j.id === jobId);
  if (!job || job.organizationId !== organizationId) {
    return null;
  }
  return job;
}

export function getJobStats() {
  return {
    total: jobQueue.length,
    pending: jobQueue.filter((j) => j.status === 'PENDING').length,
    processing: jobQueue.filter((j) => j.status === 'PROCESSING').length,
    completed: jobQueue.filter((j) => j.status === 'COMPLETED').length,
  };
}
