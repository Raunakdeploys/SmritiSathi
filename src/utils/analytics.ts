// Lightweight, privacy-first in-app analytics tracker (zero 3rd-party cookie tracking)
export interface AnalyticsEvent {
  id: string;
  name: string;
  category: 'navigation' | 'cognitive_game' | 'ai_chat' | 'safety' | 'consent';
  timestamp: string;
  details?: Record<string, any>;
}

const STORAGE_KEY = 'smritisathi_analytics_events';

export const analytics = {
  logEvent(name: string, category: AnalyticsEvent['category'] = 'navigation', details?: Record<string, any>) {
    try {
      const existing = this.getEvents();
      const newEvent: AnalyticsEvent = {
        id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        category,
        timestamp: new Date().toISOString(),
        details,
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
