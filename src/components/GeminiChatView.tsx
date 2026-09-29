import React, { useState, useEffect, useRef } from 'react';
import type { UserProfile } from '../types';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Zap,
  Stethoscope,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  RotateCcw,
  Copy,
  Check,
  Trash2,
  Clock,
  Heart,
  ShieldCheck,
  ChevronRight,
  Info,
  AlertCircle,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  KeyRound,
  CheckCircle2,
  Music,
  Coffee,
  HelpCircle,
  Compass,
  CornerDownLeft,
  Eye,
  Globe,
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  roleUsed?: string;
  error?: boolean;
  isLiveAI?: boolean;
  source?: string;
  groundingSources?: Array<{ title?: string; uri?: string }>;
  webSearchQueries?: string[];
  webSearchUsed?: boolean;
}

export type ChatRole = 'companion' | 'quick' | 'complex';

interface GeminiChatViewProps {
  user: UserProfile | null;
  onNavigateTab?: (tab: string) => void;
}

const ROLE_CONFIGS: Record<
  ChatRole,
  {
    id: ChatRole;
    name: string;
    shortName: string;
    tagline: string;
    model: string;
    taskType: string;
    icon: typeof Heart;
    badgeColor: string;
    bgTint: string;
    borderColor: string;
    avatarBg: string;
    welcomeMessage: (name: string) => string;
    quickPrompts: { label: string; text: string; category: string }[];
  }
> = {
  companion: {
    id: 'companion',
    name: 'Saathi (Companion)',
    shortName: 'Companion',
    tagline: 'Warm memory friend & gentle conversational buddy (Live Web Search)',
    model: 'gemini-3.8-flash',
    taskType: 'General Memory Tasks',
    icon: Heart,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    bgTint: 'bg-rose-50/50',
    borderColor: 'border-rose-200',
    avatarBg: 'bg-[#002045] text-white',
    welcomeMessage: (name) =>
      `Namaste ${name || 'Asha ji'}! I am Saathi, your personal memory friend. I am equipped with live internal Google Search to check the web for any current facts or recent news beyond 2024, or we can talk about pleasant memories and classic songs. How are you feeling today?`,
    quickPrompts: [
      {
        label: 'Latest 2025/2026 News 🌐',
        text: 'Search the live web for the latest major news and events in India in 2025 and 2026 🌐',
        category: 'Live Search',
      },
      {
        label: 'Tea & Monsoons ☕',
        text: 'Tell me a nostalgic memory about classic Indian tea and rainy days ☕',
        category: 'Nostalgia',
      },
      {
        label: 'Old Classic Songs 🎵',
        text: 'What are some fond memories of Lata Mangeshkar & Rafi songs? 🎵',
        category: 'Music',
      },
      {
        label: '1983 World Cup 🏏',
        text: 'Tell me the story of Kapil Dev and India winning the 1983 Cricket World Cup! 🏏',
        category: 'Sports',
      },
      {
        label: 'Why is the sky blue? 🌌',
        text: 'Why is the sky blue? Can you explain in a simple, beautiful way? 🌌',
        category: 'Science',
      },
      {
        label: 'Gentle Comfort 🌸',
        text: 'I feel a little forgetful today, can you comfort and reassure me? 🌸',
        category: 'Comfort',
      },
    ],
  },
  quick: {
    id: 'quick',
    name: 'Quick Anchor',
    shortName: 'Quick',
    tagline: 'Lightning-fast temporal & routine orientation (Live Web Search)',
    model: 'gemini-3.8-flash',
    taskType: 'Tasks That Happen Fast',
    icon: Zap,
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    bgTint: 'bg-amber-50/50',
    borderColor: 'border-amber-200',
    avatarBg: 'bg-amber-600 text-white',
    welcomeMessage: (name) =>
      `Hello ${name || 'there'}! Quick Anchor active with live web search. I provide instant, snappy answers for dates, times, live weather, medicine routines, and emergency contacts. What do you need right now?`,
    quickPrompts: [
      {
        label: 'Live Headlines & Weather 🌐',
        text: 'Search the web for today\'s top news headlines and weather forecast 🌐',
        category: 'Live Search',
      },
      {
        label: 'Today’s Date & Day 📅',
        text: 'What day of the week and date is today? 📅',
        category: 'Orientation',
      },
      {
        label: 'Current Time ⏰',
        text: 'What time is it right now? ⏰',
        category: 'Orientation',
      },
      {
        label: 'Calculate 15 + 27 🧮',
        text: 'What is 15 + 27? 🧮',
        category: 'Math',
      },
      {
        label: 'Medicine Routine 💊',
        text: 'Did I take my morning medicine and drink water? 💊',
        category: 'Health',
      },
      {
        label: 'Emergency Contact 📞',
        text: 'Who is my primary emergency family contact? 📞',
        category: 'Safety',
      },
    ],
  },
  complex: {
    id: 'complex',
    name: 'Dr. Smriti (Clinical Specialist)',
    shortName: 'Clinical',
    tagline: 'Complex geriatric dementia & caregiver intelligence (Live Web Search)',
    model: 'gemini-3.8-flash',
    taskType: 'Caregiver & Clinical Advice',
    icon: Stethoscope,
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    bgTint: 'bg-blue-50/50',
    borderColor: 'border-blue-200',
    avatarBg: 'bg-blue-800 text-white',
    welcomeMessage: (name) =>
      `Welcome to the Clinical Caregiver Consultation. I am Dr. Smriti, specialized in geriatric neuropsychology, MCI progression, and non-pharmacological behavioral care. Live Google Search grounding is enabled for the latest 2025/2026 Alzheimer's trials and clinical approvals. How can I assist you today?`,
    quickPrompts: [
      {
        label: '2025/2026 Dementia Research 🌐',
        text: 'Search the web and explain the latest 2025-2026 FDA approvals and clinical dementia trials 🌐',
        category: 'Live Search',
      },
      {
        label: 'Sundowning Protocol 🌅',
        text: 'How do I handle evening agitation or sundowning syndrome? 🌅',
        category: 'Clinical',
      },
      {
        label: 'Forgetfulness vs MCI 🔬',
        text: 'Explain the difference between age-related forgetfulness and MCI 🔬',
        category: 'Diagnosis',
      },
      {
        label: 'Validation Therapy 🤝',
        text: 'What are evidence-based Validation Therapy techniques for family? 🤝',
        category: 'Caregiving',
      },
      {
        label: 'Wandering Prevention 🚪',
        text: 'How can we prevent nighttime wandering safely in our home? 🚪',
        category: 'Safety',
      },
      {
        label: 'Joint & Arthritis Care 🦵',
        text: 'What gentle daily habits help relieve elderly knee and joint aches? 🦵',
        category: 'Health',
      },
    ],
  },
};

const STORAGE_KEY_PREFIX = 'smritisathi_gemini_chat_history_v2_';

export const GeminiChatView: React.FC<GeminiChatViewProps> = ({ user, onNavigateTab }) => {
  const patientName = user?.name || 'Roy';
  const caregiverName = user?.caregiverName || 'Rohan Sharma';

  const [activeRole, setActiveRole] = useState<ChatRole>('companion');
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}companion`);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load chat history from localStorage', e);
    }
    return [
      {
        id: 'initial-welcome',
        role: 'model',
        text: ROLE_CONFIGS.companion.welcomeMessage(patientName),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: ROLE_CONFIGS.companion.model,
        roleUsed: 'companion',
      },
    ];
  });

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showPromptsDrawer, setShowPromptsDrawer] = useState(true);
  const [showStationDrawer, setShowStationDrawer] = useState(false);
  const [autoSpeakReplies, setAutoSpeakReplies] = useState<boolean>(() => {
    return user?.preferences?.voiceAssistance ?? true;
  });

  // Senior Accessibility: Dynamic Font Size Selector
  const [fontSizeMode, setFontSizeMode] = useState<'normal' | 'large' | 'xlarge'>(() => {
    const saved = localStorage.getItem('smritisathi_chat_font_size');
    return (saved as any) || 'normal';
  });

  // Live clock
  const [currentTimeStr, setCurrentTimeStr] = useState(() =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [currentDateStr, setCurrentDateStr] = useState(() =>
    new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  );

  // Gemini Live AI Status
  const [aiStatus, setAiStatus] = useState<{
    hasApiKey: boolean;
    keySource?: string | null;
    primaryModel?: string;
  } | null>(null);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Save font size preference
  const handleToggleFontSize = () => {
    const nextMode = fontSizeMode === 'normal' ? 'large' : fontSizeMode === 'large' ? 'xlarge' : 'normal';
    setFontSizeMode(nextMode);
    localStorage.setItem('smritisathi_chat_font_size', nextMode);
  };

  // Update live clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setCurrentDateStr(
        now.toLocaleDateString('en-IN', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Gemini live status on mount
  const checkStatus = () => {
    fetch('/api/gemini/status')
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setAiStatus(data);
        }
      })
      .catch((err) => console.warn('[Gemini Status Check]', err));
  };

  useEffect(() => {
    checkStatus();
  }, []);

  // Auto-scroll inside chat thread smoothly
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior,
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Persist messages per role
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${activeRole}`, JSON.stringify(messages));
    } catch (e) {
      console.warn('Failed to save chat history to localStorage', e);
    }
  }, [messages, activeRole]);

  // Handle role switch
  const handleSelectRole = (newRole: ChatRole) => {
    if (newRole === activeRole) return;
    setActiveRole(newRole);

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }

    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${newRole}`);
      if (saved) {
        setMessages(JSON.parse(saved));
        return;
      }
    } catch (e) {
      console.warn('Failed to load role messages', e);
    }

    setMessages([
      {
        id: `welcome-${newRole}-${Date.now()}`,
        role: 'model',
        text: ROLE_CONFIGS[newRole].welcomeMessage(patientName),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: ROLE_CONFIGS[newRole].model,
        roleUsed: newRole,
      },
    ]);
  };

  // Clear conversation history
  const handleClearChat = () => {
    if (window.confirm(`Clear chat history for ${ROLE_CONFIGS[activeRole].name}?`)) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
      }
      const freshMessage: ChatMessage = {
        id: `fresh-${Date.now()}`,
        role: 'model',
        text: ROLE_CONFIGS[activeRole].welcomeMessage(patientName),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: ROLE_CONFIGS[activeRole].model,
        roleUsed: activeRole,
      };
      setMessages([freshMessage]);
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${activeRole}`);
    }
  };

  // Send message to Gemini server endpoint
  const handleSendMessage = async (textToSend?: string) => {
    const messageContent = (textToSend || inputMessage).trim();
    if (!messageContent || loading) return;

    setInputMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      // Send concise history (last 6 messages) to optimize token efficiency
      const historyPayload = messages
        .filter((m) => !m.error)
        .slice(-6)
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          history: historyPayload,
          role: activeRole,
          patientName,
          caregiverName,
          language: 'en-IN',
        }),
      });

      const data = await res.json();

      if (data.success && data.reply) {
        const botMessage: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'model',
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: data.modelUsed || ROLE_CONFIGS[activeRole].model,
          roleUsed: data.roleUsed || activeRole,
          isLiveAI: data.isLiveAI ?? (data.source === 'gemini-live' || data.source === 'gemini'),
          source: data.source || 'gemini-live',
          groundingSources: data.groundingSources,
          webSearchQueries: data.webSearchQueries,
          webSearchUsed: (data.groundingSources && data.groundingSources.length > 0) || (data.webSearchQueries && data.webSearchQueries.length > 0) || !!data.searchGroundingActive,
        };
        setMessages((prev) => [...prev, botMessage]);

        // Auto-speak reply if enabled
        if (autoSpeakReplies) {
          handleSpeak(botMessage.text, botMessage.id);
        }
      } else {
        throw new Error(data.error || 'Failed to receive response from Gemini');
      }
    } catch (err: any) {
      console.error('[Chat Error]', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: `I apologize, I experienced a brief connection flutter. Please tap retry to ask again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Text-to-Speech (TTS) Voice Readout for Seniors
  const handleSpeak = (text: string, id: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const cleanText = text.replace(/[*_#•-]/g, ' ').replace(/\s+/g, ' ').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice =
      voices.find((v) => v.lang.includes('en-IN')) ||
      voices.find((v) => v.name.toLowerCase().includes('natural')) ||
      voices.find((v) => v.lang.startsWith('en'));

    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Copy message text to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Speech-to-Text Voice Dictation
  const handleToggleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setInputMessage((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn('Speech recognition error:', e);
      setIsListening(false);
    }
  };

  // Textarea Enter key handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const currentConfig = ROLE_CONFIGS[activeRole];

  // Font size class mapping for high readability
  const fontClasses = {
    normal: 'text-sm sm:text-base leading-relaxed',
    large: 'text-base sm:text-lg leading-relaxed',
    xlarge: 'text-lg sm:text-xl leading-relaxed',
  }[fontSizeMode];

  return (
    <div className="flex-1 flex flex-col 2xl:flex-row bg-[#020d1c] h-[calc(100dvh-72px)] sm:h-[calc(100vh-72px)] overflow-hidden w-full min-w-0 max-w-full relative">
      {/* =========================================================================
          MAIN CHAT PANE (Adaptive for Phone, Tablet, and PC)
         ========================================================================= */}
      <div className="flex-1 flex flex-col h-full min-w-0 max-w-full bg-[#020d1c] relative overflow-hidden">
        {/* TOP APP BAR & STATUS BAR */}
        <header className="bg-[#0b1d3a]/95 backdrop-blur-md border-b border-blue-900/60 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 shrink-0 shadow-xs z-20 w-full min-w-0 max-w-full box-border overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 w-full min-w-0">
            {/* Top row on mobile / Left section on desktop */}
            <div className="flex items-center justify-between sm:justify-start gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl ${currentConfig.avatarBg} flex items-center justify-center shrink-0 shadow-xs`}
                >
                  <currentConfig.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h1 className="font-black text-sm sm:text-base text-[#002045] truncate leading-tight">
                      {currentConfig.name}
                    </h1>
                    <span className="hidden lg:inline-flex text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-blue-900/60 bg-[#00142b] text-blue-300 whitespace-nowrap shrink-0">
                      gemini-3.1-flash-lite
                    </span>
                  </div>
                  <p className="hidden xl:block text-[11px] text-[#64748b] truncate max-w-xs font-medium">
                    {currentConfig.tagline}
                  </p>
                </div>
              </div>

              {/* Mobile Right: Quick Actions */}
              <div className="flex items-center gap-1.5 sm:hidden shrink-0">
                <div
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold"
                  title="Gemini Live AI Active"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                  </span>
                  <span>Live</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowStationDrawer(true)}
                  title="Open Memory Station & Grounding Anchors"
                  className="p-1.5 rounded-lg border border-[#cbd5e1] bg-[#f8fafc] text-xs font-bold text-[#002045] hover:bg-[#e2e8f0] cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-[#FF6321]" />
                </button>

                <button
                  type="button"
                  onClick={handleClearChat}
                  title="Clear chat conversation"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom row on mobile / Right section on desktop */}
            <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 shrink-0 min-w-0 flex-wrap">
              {/* Persona Switcher Tabs */}
              <div className="flex items-center bg-[#f1f5f9] p-0.5 rounded-xl border border-blue-900/60 shrink-0">
                <button
                  id="tab-role-companion"
                  onClick={() => handleSelectRole('companion')}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    activeRole === 'companion'
                      ? 'bg-[#0b1d3a] text-[#002045] shadow-xs border border-[#cbd5e1]'
                      : 'text-[#64748b] hover:text-[#002045]'
                  }`}
                  title="Saathi Memory Companion"
                >
                  <Heart className="w-3 h-3 text-rose-500 shrink-0" />
                  <span>Companion</span>
                </button>

                <button
                  id="tab-role-quick"
                  onClick={() => handleSelectRole('quick')}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    activeRole === 'quick'
                      ? 'bg-[#0b1d3a] text-[#002045] shadow-xs border border-[#cbd5e1]'
                      : 'text-[#64748b] hover:text-[#002045]'
                  }`}
                  title="Quick Anchor"
                >
                  <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>Quick</span>
                </button>

                <button
                  id="tab-role-complex"
                  onClick={() => handleSelectRole('complex')}
                  className={`px-2 sm:px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    activeRole === 'complex'
                      ? 'bg-[#0b1d3a] text-[#002045] shadow-xs border border-[#cbd5e1]'
                      : 'text-[#64748b] hover:text-[#002045]'
                  }`}
                  title="Dr. Smriti Clinical Specialist"
                >
                  <Stethoscope className="w-3 h-3 text-blue-600 shrink-0" />
                  <span>Clinical</span>
                </button>
              </div>

              {/* Desktop-only action buttons */}
              <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                {/* Gemini Live AI Status Badge */}
                <div
                  className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold"
                  title="Gemini 3.1 Flash Lite Live AI Active"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>Gemini Live</span>
                </div>

                {/* Senior Font Size Switcher Toggle */}
                <button
                  type="button"
                  onClick={handleToggleFontSize}
                  title={`Change font size (Current: ${fontSizeMode})`}
                  className="px-2 py-1 rounded-lg border border-[#cbd5e1] hover:border-[#002045] bg-[#f8fafc] text-xs font-black text-[#002045] transition-colors cursor-pointer flex items-center gap-0.5"
                >
                  <Eye className="w-3 h-3 text-slate-500" />
                  <span>{fontSizeMode === 'normal' ? 'A' : fontSizeMode === 'large' ? 'A+' : 'A++'}</span>
                </button>

                {/* Memory Station Drawer Toggle Button */}
                <button
                  type="button"
                  onClick={() => setShowStationDrawer(!showStationDrawer)}
                  title="Open Memory Station & Anchors"
                  className={`px-2.5 py-1 rounded-lg border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    showStationDrawer
                      ? 'bg-[#002045] text-white border-[#002045]'
                      : 'border-[#cbd5e1] hover:border-[#002045] bg-[#f8fafc] text-[#002045]'
                  }`}
                >
                  <Compass className={`w-3.5 h-3.5 ${showStationDrawer ? 'text-[#FF6321]' : 'text-blue-300'}`} />
                  <span className="hidden xl:inline">Station</span>
                </button>

                {/* Clear History Button */}
                <button
                  id="btn-clear-chat-history"
                  onClick={handleClearChat}
                  title="Clear chat conversation"
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-blue-950 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* CONVERSATION MESSAGE THREAD CONTAINER */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5 scroll-smooth"
        >
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
            {/* Active Persona Banner */}
            <div
              className={`p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border ${currentConfig.borderColor} ${currentConfig.bgTint} flex items-start gap-3 text-xs sm:text-sm text-[#334155] shadow-xs`}
            >
              <currentConfig.icon className="w-5 h-5 text-[#002045] shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-extrabold text-[#002045]">
                    {currentConfig.name} Active
                  </p>
                  <span className="text-[11px] font-semibold text-slate-500">
                    Session preserved
                  </span>
                </div>
                <p className="text-blue-300 text-xs mt-0.5 leading-relaxed">
                  {currentConfig.tagline}. Everything you ask is answered with thoughtful care.
                </p>
              </div>
            </div>

            {/* Conversation Messages */}
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              const isCurrentlySpeaking = speakingId === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 sm:gap-3.5 items-start ${
                    isUser ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Speaker Avatar */}
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                      isUser
                        ? 'bg-gradient-to-br from-[#FF6321] to-[#e04f11] text-white ring-2 ring-orange-200'
                        : `${currentConfig.avatarBg} ring-2 ring-slate-200`
                    }`}
                  >
                    {isUser ? (
                      <User className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Bot className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </div>

                  {/* Message Bubble + Action Bar */}
                  <div
                    className={`flex flex-col max-w-[88%] sm:max-w-[80%] md:max-w-[75%] ${
                      isUser ? 'items-end' : 'items-start'
                    }`}
                  >
                    {/* Timestamp & Name */}
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-[#64748b] font-medium">
                      <span>{isUser ? patientName : currentConfig.shortName}</span>
                      <span>·</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Text Bubble */}
                    <div
                      className={`relative p-3.5 sm:p-5 rounded-2xl shadow-xs break-words ${fontClasses} ${
                        isUser
                          ? 'bg-gradient-to-r from-[#002045] to-[#12396b] text-white rounded-tr-xs font-medium shadow-sm'
                          : msg.error
                          ? 'bg-rose-50 border-2 border-rose-300 text-rose-900 rounded-tl-xs'
                          : 'bg-[#0b1d3a] border border-blue-900/60 text-[#0f172a] rounded-tl-xs font-normal shadow-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap select-text">{msg.text}</div>

                      {/* Grounding & Web Search Sources UI */}
                      {!isUser && msg.groundingSources && msg.groundingSources.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-sky-100 bg-sky-50/60 -mx-1 sm:-mx-2 px-2.5 py-2 rounded-xl">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-900 mb-1.5">
                            <Globe className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                            <span>Live Web Search Grounding</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-200/70 text-sky-800 font-extrabold">
                              {msg.groundingSources.length} source{msg.groundingSources.length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.groundingSources.map((source, sIdx) => {
                              let hostName = 'Web Source';
                              try {
                                if (source.uri) {
                                  hostName = new URL(source.uri).hostname.replace('www.', '');
                                }
                              } catch {
                                hostName = 'Web Source';
                              }
                              return (
                                <a
                                  key={sIdx}
                                  href={source.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0b1d3a] hover:bg-sky-100 text-sky-800 hover:text-sky-950 border border-sky-200 text-[11px] font-semibold transition-all shadow-2xs max-w-full truncate"
                                  title={source.title || source.uri}
                                >
                                  <span className="truncate max-w-[180px] sm:max-w-xs">{source.title || hostName}</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0 text-sky-500" />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Bot Controls: Listen Aloud, Copy, Source */}
                      {!isUser && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-[#64748b]">
                          <div className="flex items-center gap-2">
                            {/* Speak Aloud Button with Dancing Sound Wave Visualizer */}
                            <button
                              type="button"
                              onClick={() => handleSpeak(msg.text, msg.id)}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer active:scale-95 min-h-[32px] ${
                                isCurrentlySpeaking
                                  ? 'bg-rose-100 text-rose-700 ring-1 ring-rose-300'
                                  : 'bg-blue-950 hover:bg-slate-200 text-[#002045]'
                              }`}
                              title="Listen aloud with gentle voice readout"
                            >
                              {isCurrentlySpeaking ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                                  <span className="font-extrabold text-rose-700">Stop</span>
                                  {/* Dancing Audio Equalizer Wave Animation */}
                                  <div className="flex items-center gap-0.5 h-3 ml-1">
                                    <span className="w-0.5 bg-rose-600 rounded-full animate-bounce" style={{ height: '70%', animationDelay: '0ms' }} />
                                    <span className="w-0.5 bg-rose-600 rounded-full animate-bounce" style={{ height: '100%', animationDelay: '150ms' }} />
                                    <span className="w-0.5 bg-rose-600 rounded-full animate-bounce" style={{ height: '40%', animationDelay: '300ms' }} />
                                    <span className="w-0.5 bg-rose-600 rounded-full animate-bounce" style={{ height: '80%', animationDelay: '450ms' }} />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5 text-[#002045]" />
                                  <span>Listen</span>
                                </>
                              )}
                            </button>

                            {/* Copy Button */}
                            <button
                              type="button"
                              onClick={() => handleCopy(msg.text, msg.id)}
                              className="p-1.5 rounded-lg hover:bg-blue-950 text-slate-500 hover:text-white transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Source Model */}
                          <div className="flex items-center gap-1.5">
                            {msg.groundingSources && msg.groundingSources.length > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-50 text-sky-800 border border-sky-200 text-[10px] sm:text-[11px] font-bold">
                                <Globe className="w-3 h-3 text-sky-600" />
                                🌐 Web Grounded
                              </span>
                            ) : msg.isLiveAI || msg.source === 'gemini-live' || msg.source === 'gemini' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] sm:text-[11px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live AI
                              </span>
                            ) : (
                              <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                                {msg.modelUsed || 'Saathi Engine'}
                              </span>
                            )}
                          </div>

                          {/* Retry */}
                          {msg.error && (
                            <button
                              type="button"
                              onClick={() => {
                                const lastUserTurn = [...messages].reverse().find((m) => m.role === 'user');
                                if (lastUserTurn) handleSendMessage(lastUserTurn.text);
                              }}
                              className="flex items-center gap-1 text-rose-700 font-bold hover:underline cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Retry</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div className="flex gap-2.5 sm:gap-3.5 items-start">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl ${currentConfig.avatarBg} flex items-center justify-center shrink-0 shadow-xs`}
                >
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
                </div>
                <div className="bg-[#0b1d3a] border border-blue-900/60 p-3.5 sm:p-4 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <div
                      className="w-2 h-2 rounded-full bg-[#002045] animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-[#FF6321] animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    />
                    <div
                      className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#64748b]">
                    {currentConfig.shortName} is reflecting...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* QUICK SUGGESTIONS CAROUSEL */}
        {showPromptsDrawer && (
          <div className="px-3 sm:px-6 py-2 bg-[#0b1d3a]/95 border-t border-[#f1f5f9] shrink-0">
            <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase text-[#94a3b8] tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#FF6321]" /> Suggested:
              </span>
              {currentConfig.quickPrompts.map((promptItem, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(promptItem.text)}
                  disabled={loading}
                  className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#f8fafc] hover:bg-[#e2e8f0] text-[#1e293b] border border-[#cbd5e1] whitespace-nowrap transition-all cursor-pointer active:scale-95 disabled:opacity-50 shrink-0 min-h-[32px]"
                >
                  {promptItem.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* BOTTOM MESSAGE INPUT BAR (Pinned & Responsive) */}
        <div className="p-2.5 sm:p-4 bg-[#0b1d3a] border-t border-blue-900/60 shrink-0 shadow-lg z-20 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-3xl mx-auto">
            {/* Active Voice Listening Banner */}
            {isListening && (
              <div className="mb-2 p-2 bg-rose-50 border border-rose-300 rounded-xl flex items-center justify-between text-xs text-rose-900 animate-pulse">
                <span className="flex items-center gap-2 font-bold">
                  <Mic className="w-4 h-4 text-rose-600 animate-bounce" />
                  Listening to your voice... Speak naturally in English, Hindi, or regional languages.
                </span>
                <button
                  onClick={() => setIsListening(false)}
                  className="font-extrabold text-rose-700 underline cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2 bg-[#f8fafc] border-2 border-[#cbd5e1] focus-within:border-[#002045] rounded-2xl p-1.5 transition-all shadow-inner"
            >
              {/* Voice Dictation Button */}
              <button
                type="button"
                onClick={handleToggleVoiceInput}
                title={isListening ? 'Stop listening' : 'Voice dictation'}
                className={`p-2.5 sm:p-3 rounded-xl transition-all cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center shrink-0 ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse shadow-md'
                    : 'text-[#64748b] hover:text-[#002045] hover:bg-[#e2e8f0]'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              {/* Textarea Input (text-base prevents iOS Safari zoom) */}
              <textarea
                ref={textareaRef}
                id="gemini-chat-input"
                rows={1}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  isListening
                    ? 'Listening to your voice...'
                    : `Ask ${currentConfig.shortName} anything (science, songs, health, math)...`
                }
                disabled={loading}
                className="flex-1 min-w-0 bg-transparent px-2 py-2.5 text-base text-[#0f172a] placeholder-[#94a3b8] font-medium resize-none max-h-32 focus:outline-none"
              />

              {/* Submit Button */}
              <button
                id="gemini-chat-send-btn"
                type="submit"
                disabled={!inputMessage.trim() || loading}
                className="px-3.5 sm:px-4 py-2.5 rounded-xl bg-[#002045] hover:bg-[#1a365d] disabled:opacity-40 text-white font-extrabold flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 min-h-[44px] shrink-0"
                title="Send message (Enter)"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </form>

            {/* Bottom Status & Reassurance row */}
            <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-[#94a3b8]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Private & secure geriatric memory companion</span>
                <span className="sm:hidden">Secure memory companion</span>
              </span>
              <span className="hidden lg:flex items-center gap-1 font-medium text-slate-500">
                <CornerDownLeft className="w-3 h-3 text-slate-400" /> Enter to send, Shift+Enter for newline
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RESPONSIVE MEMORY STATION DRAWER (For Phone, Tablet & Laptop screens < 2xl)
         ========================================================================= */}
      {showStationDrawer && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Memory Station & Grounding Anchors"
          className="fixed inset-0 z-50 2xl:hidden flex justify-end bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowStationDrawer(false)}
        >
          <div
            className="w-full max-w-sm sm:max-w-md bg-[#0b1d3a] h-full flex flex-col shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-blue-900/60 bg-[#020d1c] flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-extrabold text-base text-[#002045] flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-[#FF6321]" /> Memory Station
                </h2>
                <p className="text-xs text-[#64748b]">
                  Companion controls and grounding anchors.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowStationDrawer(false)}
                className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                aria-label="Close Memory Station"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-5 flex-1">
              {/* Real-time Temporal Anchor Widget */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#002045] to-[#1a365d] text-white shadow-sm space-y-2">
                <div className="flex items-center justify-between text-xs text-blue-200">
                  <span className="flex items-center gap-1 font-bold">
                    <Clock className="w-3.5 h-3.5 text-blue-300" /> Temporal Anchor
                  </span>
                  <span className="text-[10px] uppercase font-bold bg-[#0b1d3a]/10 px-2 py-0.5 rounded">
                    Live
                  </span>
                </div>
                <div className="text-2xl font-black font-mono tracking-wider">
                  {currentTimeStr}
                </div>
                <div className="text-xs text-slate-200 font-medium">
                  {currentDateStr}
                </div>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-100">
                  <span>Patient: <strong>{patientName}</strong></span>
                  <span>Caregiver: <strong>{caregiverName}</strong></span>
                </div>
              </div>

              {/* Persona Switching Cards */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-extrabold uppercase text-[#64748b] tracking-wider">
                  Select AI Persona
                </h3>
                {(Object.keys(ROLE_CONFIGS) as ChatRole[]).map((roleKey) => {
                  const cfg = ROLE_CONFIGS[roleKey];
                  const isSelected = activeRole === roleKey;

                  return (
                    <button
                      key={roleKey}
                      type="button"
                      onClick={() => {
                        handleSelectRole(roleKey);
                        setShowStationDrawer(false);
                      }}
                      className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'border-[#002045] bg-[#002045]/5 shadow-xs ring-1 ring-[#002045]'
                          : 'border-blue-900/60 bg-[#0b1d3a] hover:bg-[#00142b]'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl ${cfg.avatarBg} flex items-center justify-center shrink-0 mt-0.5`}
                      >
                        <cfg.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-sm text-[#002045]">
                            {cfg.shortName}
                          </h4>
                          {isSelected && (
                            <span className="text-[10px] font-bold text-[#FF6321] uppercase">
                              Selected
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#64748b] mt-0.5 line-clamp-2">
                          {cfg.tagline}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Voice Assistance Auto-Readout Switch */}
              <div className="p-4 rounded-xl border border-blue-900/60 bg-[#00142b] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-[#002045]" />
                    <span className="text-xs font-bold text-[#002045]">
                      Auto-Readout Replies
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSpeakReplies}
                      onChange={(e) => setAutoSpeakReplies(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b1d3a] after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#002045]"></div>
                  </label>
                </div>
                <p className="text-[11px] text-[#64748b]">
                  Automatically speaks responses aloud at a gentle 0.9x speed suitable for seniors.
                </p>
              </div>

              {/* Quick Memory Bank Navigation Buttons */}
              {onNavigateTab && (
                <div className="space-y-2 pt-2 border-t border-blue-900/60">
                  <h3 className="text-xs font-extrabold uppercase text-[#64748b] tracking-wider">
                    Elder Training Activities
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowStationDrawer(false);
                        onNavigateTab('reality-quest');
                      }}
                      className="p-2.5 rounded-xl border border-[#cbd5e1] hover:border-[#002045] bg-[#0b1d3a] text-xs font-bold text-[#002045] transition-all text-center cursor-pointer hover:shadow-xs"
                    >
                      RealityQuest
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowStationDrawer(false);
                        onNavigateTab('games');
                      }}
                      className="p-2.5 rounded-xl border border-[#cbd5e1] hover:border-[#002045] bg-[#0b1d3a] text-xs font-bold text-[#002045] transition-all text-center cursor-pointer hover:shadow-xs"
                    >
                      Mind Games
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowStationDrawer(false);
                        onNavigateTab('carecompass');
                      }}
                      className="p-2.5 rounded-xl border border-[#cbd5e1] hover:border-[#002045] bg-[#0b1d3a] text-xs font-bold text-[#002045] transition-all text-center cursor-pointer hover:shadow-xs"
                    >
                      CareCompass
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowStationDrawer(false);
                        onNavigateTab('history');
                      }}
                      className="p-2.5 rounded-xl border border-[#cbd5e1] hover:border-[#002045] bg-[#0b1d3a] text-xs font-bold text-[#002045] transition-all text-center cursor-pointer hover:shadow-xs"
                    >
                      Activity Logs
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          PERSISTENT DESKTOP WORKSTATION SIDEBAR (Visible only on 2xl screens >= 1536px)
         ========================================================================= */}
      <aside className="hidden 2xl:flex w-80 flex-col border-l border-blue-900/60 bg-[#0b1d3a] h-full shrink-0 overflow-y-auto">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-blue-900/60 bg-[#020d1c]">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-extrabold text-sm text-[#002045] uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-[#FF6321]" /> Memory Station
            </h2>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active
            </span>
          </div>
          <p className="text-xs text-[#64748b]">
            Companion controls and dementia grounding anchors.
          </p>
        </div>

        <div className="p-5 space-y-6 flex-1">
          {/* Real-time Temporal Anchor Widget */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#002045] to-[#1a365d] text-white shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-blue-200">
              <span className="flex items-center gap-1 font-bold">
                <Clock className="w-3.5 h-3.5 text-blue-300" /> Temporal Anchor
              </span>
              <span className="text-[10px] uppercase font-bold bg-[#0b1d3a]/10 px-2 py-0.5 rounded">
                Live
              </span>
            </div>
            <div className="text-2xl font-black font-mono tracking-wider">
              {currentTimeStr}
            </div>
            <div className="text-xs text-slate-200 font-medium">
              {currentDateStr}
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-blue-100">
              <span>Patient: <strong>{patientName}</strong></span>
              <span>Caregiver: <strong>{caregiverName}</strong></span>
            </div>
          </div>

          {/* Persona Switching Cards */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-extrabold uppercase text-[#64748b] tracking-wider">
              Select AI Persona
            </h3>
            {(Object.keys(ROLE_CONFIGS) as ChatRole[]).map((roleKey) => {
              const cfg = ROLE_CONFIGS[roleKey];
              const isSelected = activeRole === roleKey;

              return (
                <button
                  key={roleKey}
                  type="button"
                  onClick={() => handleSelectRole(roleKey)}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    isSelected
                      ? 'border-[#002045] bg-[#002045]/5 shadow-xs ring-1 ring-[#002045]'
                      : 'border-blue-900/60 bg-[#0b1d3a] hover:bg-[#00142b]'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${cfg.avatarBg} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <cfg.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-sm text-[#002045]">
                        {cfg.shortName}
                      </h4>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-[#FF6321] uppercase">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#64748b] mt-0.5 line-clamp-2">
                      {cfg.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Voice Assistance Auto-Readout Switch */}
          <div className="p-4 rounded-xl border border-blue-900/60 bg-[#00142b] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#002045]" />
                <span className="text-xs font-bold text-[#002045]">
                  Auto-Readout Replies
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSpeakReplies}
                  onChange={(e) => setAutoSpeakReplies(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0b1d3a] after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#002045]"></div>
              </label>
            </div>
            <p className="text-[11px] text-[#64748b]">
              Automatically speaks responses aloud at a gentle 0.9x speed suitable for seniors.
            </p>
          </div>

          {/* Quick Memory Bank Navigation Buttons */}
          {onNavigateTab && (
            <div className="space-y-2 pt-2 border-t border-blue-900/60">
              <h3 className="text-xs font-extrabold uppercase text-[#64748b] tracking-wider">
                Elder Training Activities
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('reality-quest')}
                  className="p-2.5 rounded-xl border border-[#cbd5e1] hover:border-[#002045] bg-[#0b1d3a] text-xs font-bold text-[#002045] transition-all text-center cursor-pointer hover:shadow-xs"
                >
                  RealityQuest
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('games')}
                  className="p-2.5 rounded-xl border border-[#cbd5e1] hover:border-[#002045] bg-[#0b1d3a] text-xs font-bold text-[#002045] transition-all text-center cursor-pointer hover:shadow-xs"
                >
                  Mind Games
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('carecompass')}
                  className="p-2.5 rounded-xl border border-[#cbd5e1] hover:border-[#002045] bg-[#0b1d3a] text-xs font-bold text-[#002045] transition-all text-center cursor-pointer hover:shadow-xs"
                >
                  CareCompass
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('history')}
                  className="p-2.5 rounded-xl border border-[#cbd5e1] hover:border-[#002045] bg-[#0b1d3a] text-xs font-bold text-[#002045] transition-all text-center cursor-pointer hover:shadow-xs"
                >
                  Activity Logs
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-blue-900/60 text-center text-[11px] text-[#94a3b8]">
          SmritiSaathi Cognitive Engine · Unified gemini-3.1-flash-lite
        </div>
      </aside>
    </div>
  );
};
