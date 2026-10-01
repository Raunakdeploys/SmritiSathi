import { useEffect } from 'react';

const TAB_TITLES: Record<string, { title: string; description: string }> = {
  dashboard: {
    title: 'SmritiSaathi – Cognitive Dashboard & Daily Mind Care',
    description: 'Track daily cognitive workouts, memory milestones, and health reminders with SmritiSaathi.',
  },
  companion: {
    title: 'Saathi AI Companion – Live Memory Voice & Web Grounded AI',
    description: 'Empathetic AI conversation companion powered by Gemini with live real-time web search grounding.',
  },
  games: {
    title: 'Cognitive Brain Training – SmritiSaathi Mind Exercises',
    description: 'Play clinically-inspired cognitive stimulation drills for memory, attention, and executive function.',
  },
  reminiscence: {
    title: 'WayBack Reminiscence & Memory Exploration',
    description: 'Interactive neighborhood reminiscence explorer, family photo recall, and life milestones.',
  },
  caregiver: {
    title: 'CareCompass Portal – Live Geofencing & Wandering Safety',
    description: 'Real-time GPS geofencing, wandering risk detection, cognitive tracking, and caregiver alerts.',
  },
  patient: {
    title: 'Elder Senior Sanctuary – Large Font Distraction-Free Portal',
    description: 'Simplified, high-contrast, large-font senior portal with voice time orientation and family photos.',
  },
  history: {
    title: 'Cognitive Session History & Clinical Activity Logs',
    description: 'Detailed activity logs, game scores, memory accuracy trends, and milestone archives.',
  },
  settings: {
    title: 'Settings & Caregiver Preferences – SmritiSaathi',
    description: 'Configure high-contrast fonts, emergency contact numbers, voice speed, and GPS safe zones.',
  },
  help: {
    title: 'Help, Senior Safety Helplines & Caregiver Support',
    description: 'Access 24/7 Elder Helpline 14567, emergency 112, user guides, and FAQs.',
  },
  'android-app': {
    title: 'Download Android APK & App – SmritiSaathi',
    description: 'Install or download the SmritiSaathi native Android APK / TWA with live AI Chat, Firebase persistence, and GPS geofencing.',
  },
};

export function usePageSEO(currentTab: string) {
  useEffect(() => {
    const meta = TAB_TITLES[currentTab] || {
      title: 'SmritiSaathi – Cognitive Health & Memory Companion',
      description: 'Adaptive dementia care, AI companion with real-time web search, and caregiver GPS safety.',
    };

    document.title = meta.title;

    // Update meta description
    let descTag = document.querySelector('meta[name="description"]');
    if (descTag) {
      descTag.setAttribute('content', meta.description);
    } else {
      descTag = document.createElement('meta');
      descTag.setAttribute('name', 'description');
      descTag.setAttribute('content', meta.description);
      document.head.appendChild(descTag);
    }

    // Update OpenGraph Title
    const ogTitleTag = document.querySelector('meta[property="og:title"]');
    if (ogTitleTag) ogTitleTag.setAttribute('content', meta.title);

    // Update OpenGraph Description
    const ogDescTag = document.querySelector('meta[property="og:description"]');
    if (ogDescTag) ogDescTag.setAttribute('content', meta.description);
  }, [currentTab]);
}
