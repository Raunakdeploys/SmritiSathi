// Lightweight, privacy-first in-app analytics tracker (zero 3rd-party cookie tracking)
// Implements REQ2 #14: UTM Tracking & Campaign Attribution
export interface AnalyticsEvent {
  id: string;
  name: string;
  category: 'navigation' | 'cognitive_game' | 'ai_chat' | 'safety' | 'consent' | 'system';
  timestamp: string;
  details?: Record<string, any>;
  utm?: Record<string, string>;
}

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  firstTouchTimestamp?: string;
}

const STORAGE_KEY = 'smritisathi_analytics_events';
const UTM_STORAGE_KEY = 'smritisathi_utm_attribution';

export const analytics = {
  // Capture & persist UTM campaign parameters from URL (REQ2 #14)
  initUtmTracking(): UtmParams {
    try {
      if (typeof window === 'undefined') return {};
      const urlParams = new URLSearchParams(window.location.search);
      const source = urlParams.get('utm_source');
      const medium = urlParams.get('utm_medium');
      const campaign = urlParams.get('utm_campaign');
      const term = urlParams.get('utm_term');
      const content = urlParams.get('utm_content');

      const existingRaw = localStorage.getItem(UTM_STORAGE_KEY);
      const existing: UtmParams = existingRaw ? JSON.parse(existingRaw) : {};

      if (source || medium || campaign) {
        const fresh: UtmParams = {
          source: source || existing.source || 'direct',
          medium: medium || existing.medium || 'organic',
          campaign: campaign || existing.campaign || 'general',
          term: term || existing.term,
          content: content || existing.content,
          firstTouchTimestamp: existing.firstTouchTimestamp || new Date().toISOString(),
        };
        localStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fresh));
        return fresh;
      }
      return existing;
    } catch {
      return {};
    }
  },

  getUtmParams(): UtmParams {
    try {
      const stored = localStorage.getItem(UTM_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  },

  logEvent(
    name: string,
    category: AnalyticsEvent['category'] = 'navigation',
    details?: Record<string, any>
  ) {
    try {
      const utm = this.getUtmParams();
      const existing = this.getEvents();
      const newEvent: AnalyticsEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        category,
        timestamp: new Date().toISOString(),
        details,
        ...(Object.keys(utm).length > 0 ? { utm: utm as Record<string, string> } : {}),
      };
      const updated = [newEvent, ...existing].slice(0, 100);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage unavailable or disabled
    }
  },

  getEvents(): AnalyticsEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  clearEvents() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  },
};

// Auto-initialize UTM tracking on script evaluation
if (typeof window !== 'undefined') {
  analytics.initUtmTracking();
}
