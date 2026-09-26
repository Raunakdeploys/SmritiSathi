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
  MessageSquare,
  CornerDownLeft,
  Calendar,
  Compass,
  Sliders,
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
    tagline: 'Warm memory friend & gentle conversational buddy',
    model: 'gemini-3.8-flash',
    taskType: 'General Memory Tasks',
    icon: Heart,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    bgTint: 'bg-rose-50/50',
    borderColor: 'border-rose-200',
    avatarBg: 'bg-[#002045] text-white',
    welcomeMessage: (name) =>
      `Namaste ${name || 'Asha ji'}! I am Saathi, your memory friend. I am right here with you to talk about pleasant memories, share warm stories of classic songs and seasons, or just keep you company. How are you feeling right now?`,
    quickPrompts: [
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
        label: 'Gentle Comfort 🌸',
        text: 'I feel a little forgetful today, can you comfort and reassure me? 🌸',
        category: 'Comfort',
      },
      {
        label: 'Mind Exercise 🧠',
        text: 'Suggest a peaceful memory exercise we can do together 🧠',
        category: 'Wellness',
      },
      {
        label: 'Childhood Games 🪁',
        text: 'Tell me about the games we played in childhood like carrom and flying kites 🪁',
        category: 'Nostalgia',
      },
    ],
  },
  quick: {
    id: 'quick',
    name: 'Quick Anchor',
    shortName: 'Quick',
    tagline: 'Lightning-fast temporal & routine orientation',
    model: 'gemini-3.8-flash',
    taskType: 'Tasks That Happen Fast',
    icon: Zap,
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    bgTint: 'bg-amber-50/50',
    borderColor: 'border-amber-200',
    avatarBg: 'bg-amber-600 text-white',
    welcomeMessage: (name) =>
      `Hello ${name || 'there'}! Quick Anchor active. I provide instant, snappy answers for dates, times, hydration, medicine routines, and emergency contacts. What do you need right now?`,
    quickPrompts: [
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
        label: 'Medicine Routine 💊',
        text: 'Did I take my morning medicine and drink water? 💊',
        category: 'Health',
      },
      {
        label: 'Emergency Contact 📞',
        text: 'Who is my primary emergency family contact? 📞',
        category: 'Safety',
      },
      {
        label: 'Next Meal 🍲',
        text: 'Is it time for lunch or afternoon tea? 🍲',
        category: 'Routine',
      },
    ],
  },
  complex: {
    id: 'complex',
    name: 'Dr. Smriti (Clinical Specialist)',
    shortName: 'Clinical',
    tagline: 'Complex geriatric dementia & caregiver intelligence',
    model: 'gemini-3.8-flash',
    taskType: 'Caregiver & Clinical Advice',
    icon: Stethoscope,
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    bgTint: 'bg-blue-50/50',
    borderColor: 'border-blue-200',
    avatarBg: 'bg-blue-800 text-white',
    welcomeMessage: (name) =>
      `Welcome to the Clinical Caregiver Consultation. I am Dr. Smriti, specialized in geriatric neuropsychology, MCI progression, and non-pharmacological behavioral care. How can I assist you with clinical guidance or caregiving today?`,
    quickPrompts: [
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
        label: 'Caregiver Fatigue 🧘',
        text: 'How can caregivers manage emotional burnout and stay patient? 🧘',
        category: 'Self-Care',
      },
    ],
  },
};

const STORAGE_KEY_PREFIX = 'smritisathi_gemini_chat_history_v2_';

export const GeminiChatView: React.FC<GeminiChatViewProps> = ({ user, onNavigateTab }) => {
  const patientName = user?.name || 'Asha Devi';
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
  const [autoSpeakReplies, setAutoSpeakReplies] = useState<boolean>(() => {
    return user?.preferences?.voiceAssistance ?? true;
  });

  // Current temporal state for the anchor clock widget
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

  const [aiStatus, setAiStatus] = useState<{
    hasApiKey: boolean;
    keySource?: string | null;
    primaryModel?: string;
    isRender?: boolean;
    setupHelp?: string;
  } | null>(null);
  const [showRenderHelp, setShowRenderHelp] = useState(false);

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Update live clock every second
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

  // Check Gemini live status on mount
  useEffect(() => {
    let isMounted = true;
    fetch('/api/gemini/status')
      .then((r) => r.json())
      .then((data) => {
        if (isMounted && data.success) {
          setAiStatus(data);
          if (!data.hasApiKey) {
            setShowRenderHelp(true);
          }
        }
      })
      .catch((err) => console.warn('[Gemini Status Check]', err));
    return () => {
      isMounted = false;
    };
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

    // Stop ongoing speech
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

    // Default welcome if no history for this role
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

    // Optimistically update multi-turn thread
    const updatedHistory = [...messages, userMessage];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      // Prepare history payload for server-side @google/genai SDK
      const historyPayload = messages
        .filter((m) => !m.error)
        .slice(-12)
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
        };
        setMessages((prev) => [...prev, botMessage]);

        // Auto-speak in companion mode if voiceAssistance enabled
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

    // Clean markdown/bullet points for smooth spoken speech
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

  // Handle textarea key down: Enter to submit, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handle auto-expanding textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const currentConfig = ROLE_CONFIGS[activeRole];

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-[#F8F9FA] h-[calc(100dvh-72px)] sm:h-[calc(100vh-72px)] overflow-hidden relative">
      {/* =========================================================================
          MAIN CHAT PANE (Adaptive for Phone, Tablet, and PC)
         ========================================================================= */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#F8F9FA] relative">
        {/* TOP APP BAR / PERSONA HEADER */}
        {/* On Phone: Compact 56px sticky bar. On Tablet: Roomy segmented bar. On PC: Clean breadcrumb bar */}
        <header className="bg-white border-b border-[#e2e8f0] px-3 sm:px-5 lg:px-6 py-2.5 sm:py-3 shrink-0 shadow-xs z-20">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Left: Persona Avatar & Title */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div
                className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl ${currentConfig.avatarBg} flex items-center justify-center shrink-0 shadow-xs transition-transform`}
              >
                <currentConfig.icon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="font-extrabold text-sm sm:text-base lg:text-lg text-[#002045] truncate leading-tight">
                    {currentConfig.name}
                  </h1>
                  <span className="hidden sm:inline-flex text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-700 whitespace-nowrap">
                    gemini-3.8-flash
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-[#64748b] truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                  {currentConfig.tagline}
                </p>
              </div>
            </div>

            {/* Right: Controls & Persona Switcher */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Live Gemini AI Status Badge (Compact on mobile) */}
              <div
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] sm:text-xs font-bold"
                title="Powered by Gemini 3.8 Flash with Autonomous Backup"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span className="hidden sm:inline">Gemini Live</span>
              </div>

              {/* Persona Switcher Tabs (Segmented control) */}
              <div className="flex items-center bg-[#f1f5f9] p-0.5 sm:p-1 rounded-xl border border-[#e2e8f0]">
                <button
                  id="tab-role-companion"
                  onClick={() => handleSelectRole('companion')}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    activeRole === 'companion'
                      ? 'bg-white text-[#002045] shadow-xs border border-[#cbd5e1]'
                      : 'text-[#64748b] hover:text-[#002045]'
                  }`}
                  title="Saathi Memory Companion"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="hidden md:inline">Companion</span>
                </button>

                <button
                  id="tab-role-quick"
                  onClick={() => handleSelectRole('quick')}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    activeRole === 'quick'
                      ? 'bg-white text-[#002045] shadow-xs border border-[#cbd5e1]'
                      : 'text-[#64748b] hover:text-[#002045]'
                  }`}
                  title="Quick Temporal & Routine Anchor"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="hidden md:inline">Quick</span>
                </button>

                <button
                  id="tab-role-complex"
                  onClick={() => handleSelectRole('complex')}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    activeRole === 'complex'
                      ? 'bg-white text-[#002045] shadow-xs border border-[#cbd5e1]'
                      : 'text-[#64748b] hover:text-[#002045]'
                  }`}
                  title="Dr. Smriti Clinical Specialist"
                >
                  <Stethoscope className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="hidden md:inline">Clinical</span>
                </button>
              </div>

              {/* Clear History Button */}
              <button
                id="btn-clear-chat-history"
                onClick={handleClearChat}
                title="Clear chat history"
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* CONVERSATION MESSAGE THREAD CONTAINER */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5 scroll-smooth"
        >
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
            {/* Persona Role Banner */}
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
                <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">
                  {currentConfig.tagline}. Multi-turn memory is active across conversational turns.
                </p>
              </div>
            </div>

            {/* Render Setup Alert (if API key missing) */}
            {aiStatus?.hasApiKey === false && (
              <div className="p-3.5 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-amber-950 text-xs sm:text-sm">
                        Live Gemini AI: Autonomous Answering Active
                      </h4>
                      <p className="text-amber-900 text-xs mt-1">
                        To connect directly to your Gemini API key on Render, add <code className="font-mono bg-white px-1 py-0.5 rounded border border-amber-200">GEMINI_API_KEY</code> in your Render Environment settings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';

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
                      isUser ? 'bg-[#FF6321] text-white' : currentConfig.avatarBg
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
                      className={`relative p-3.5 sm:p-5 rounded-2xl shadow-xs text-sm sm:text-base leading-relaxed break-words ${
                        isUser
                          ? 'bg-[#002045] text-white rounded-tr-xs font-medium'
                          : msg.error
                          ? 'bg-rose-50 border-2 border-rose-300 text-rose-900 rounded-tl-xs'
                          : 'bg-white border border-[#e2e8f0] text-[#0f172a] rounded-tl-xs font-normal'
                      }`}
                    >
                      <div className="whitespace-pre-wrap select-text">{msg.text}</div>

                      {/* Bot Controls: Listen, Copy, Source */}
                      {!isUser && (
                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-[#64748b]">
                          <div className="flex items-center gap-2">
                            {/* Speak Aloud Button */}
                            <button
                              type="button"
                              onClick={() => handleSpeak(msg.text, msg.id)}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#002045] font-bold text-xs transition-colors cursor-pointer active:scale-95 min-h-[32px]"
                              title="Listen aloud"
                            >
                              {speakingId === msg.id ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                                  <span className="text-rose-600 font-extrabold">Stop</span>
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
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
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
                            {msg.isLiveAI || msg.source === 'gemini-live' || msg.source === 'gemini' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] sm:text-[11px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live AI
                              </span>
                            ) : (
                              <span className="text-[10px] sm:text-[11px] text-slate-400 font-medium">
                                {msg.modelUsed || 'Saathi'}
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
                <div className="bg-white border border-[#e2e8f0] p-3.5 sm:p-4 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-3">
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
                    {currentConfig.shortName} is thinking...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* QUICK SUGGESTIONS DRAWER / CHIPS CAROUSEL */}
        {showPromptsDrawer && (
          <div className="px-3 sm:px-6 py-2 bg-white/95 border-t border-[#f1f5f9] shrink-0">
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

        {/* BOTTOM MESSAGE INPUT BAR (Pinned & Responsive for Phone, Tablet, PC) */}
        <div className="p-2.5 sm:p-4 bg-white border-t border-[#e2e8f0] shrink-0 shadow-lg z-20 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="max-w-3xl mx-auto">
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
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'text-[#64748b] hover:text-[#002045] hover:bg-[#e2e8f0]'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>

              {/* Expanding Textarea / Input (text-base prevents iOS Safari zoom) */}
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
                    : `Ask ${currentConfig.shortName} anything (multilingual)...`
                }
                disabled={loading}
                className="flex-1 bg-transparent px-2 py-2.5 text-base sm:text-base text-[#0f172a] placeholder-[#94a3b8] font-medium resize-none max-h-32 focus:outline-none"
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
          DESKTOP WORKSTATION SIDEBAR (Visible on PC / lg screens >= 1024px)
          Provides dedicated companion commands, live temporal anchors, memory cues
         ========================================================================= */}
      <aside className="hidden lg:flex w-80 xl:w-96 flex-col border-l border-[#e2e8f0] bg-white h-full shrink-0 overflow-y-auto">
        {/* Sidebar Header */}
        <div className="p-5 border-b border-[#e2e8f0] bg-[#F8F9FA]">
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
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Temporal Anchor
              </span>
              <span className="text-[10px] uppercase font-bold bg-white/10 px-2 py-0.5 rounded">
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
                      : 'border-[#e2e8f0] bg-white hover:bg-slate-50'
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
          <div className="p-4 rounded-xl border border-[#e2e8f0] bg-slate-50 space-y-3">
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
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#002045]"></div>
              </label>
            </div>
            <p className="text-[11px] text-[#64748b]">
              Automatically speaks responses aloud at a gentle 0.9x speed suitable for seniors.
            </p>
          </div>

          {/* Quick Memory Bank Navigation Buttons */}
          {onNavigateTab && (
            <div className="space-y-2 pt-2 border-t border-[#e2e8f0]">
              <h3 className="text-xs font-extrabold uppercase text-[#64748b] tracking-wider">
                Elder Training Activities
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onNavigateTab('reality-quest')}
                  className="p-2.5 rounded-xl border border-[#cbd5e1] hover:border-[#002045] bg-white text-xs font-bold text-[#002045] transition-all text-center cursor-pointer hover:shadow-xs"
                >
                  RealityQuest
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('games')}
                  className="p-2.5 rounded-xl border border-[#cbd5e1] hover:border-[#002045] bg-white text-xs font-bold text-[#002045] transition-all text-center cursor-pointer hover:shadow-xs"
                >
                  Mind Games
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('carecompass')}
                  className="p-2.5 rounded-xl border border-[#cbd5e1] hover:border-[#002045] bg-white text-xs font-bold text-[#002045] transition-all text-center cursor-pointer hover:shadow-xs"
                >
                  CareCompass
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('history')}
                  className="p-2.5 rounded-xl border border-[#cbd5e1] hover:border-[#002045] bg-white text-xs font-bold text-[#002045] transition-all text-center cursor-pointer hover:shadow-xs"
                >
                  Activity Logs
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#e2e8f0] text-center text-[11px] text-[#94a3b8]">
          SmritiSaathi Cognitive Engine · Unified gemini-3.8-flash
        </div>
      </aside>
    </div>
  );
};
