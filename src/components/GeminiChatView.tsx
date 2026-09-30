import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { UserProfile, ChatMessage, ChatThread } from '../types';
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
  CheckCircle2,
  Compass,
  Eye,
  Globe,
  Plus,
  MessageSquare,
  Search,
  PanelLeftClose,
  PanelLeft,
  LogIn,
  Cloud,
  CloudOff,
  History,
  Lock,
} from 'lucide-react';
import { auth, signInWithGoogle, firestoreSyncService } from '../firebase';

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
    model: 'gemini-3.5-flash-lite',
    taskType: 'General Memory Tasks',
    icon: Heart,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    bgTint: 'bg-rose-50/50',
    borderColor: 'border-rose-200',
    avatarBg: 'bg-[#002045] text-white',
    welcomeMessage: (name) =>
      `Namaste ${name || 'Asha ji'}! I am Saathi, your personal memory friend. I am equipped with live internal Google Search to check the web for current facts, 2025/2026 news, or we can talk about pleasant memories and classic songs. How are you feeling today?`,
    quickPrompts: [
      {
        label: 'Who is the President of US? 🌐',
        text: 'Who is the president of the United States?',
        category: 'Live Search',
      },
      {
        label: 'Latest 2025/2026 News 🌐',
        text: 'Search the live web for the latest major news and events today 🌐',
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
    ],
  },
  quick: {
    id: 'quick',
    name: 'Quick Anchor',
    shortName: 'Quick',
    tagline: 'Lightning-fast temporal & routine orientation (Live Web Search)',
    model: 'gemini-3.5-flash-lite',
    taskType: 'Tasks That Happen Fast',
    icon: Zap,
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    bgTint: 'bg-amber-50/50',
    borderColor: 'border-amber-200',
    avatarBg: 'bg-amber-600 text-white',
    welcomeMessage: (name) =>
      `Hello ${name || 'there'}! Quick Anchor active with live web search. I provide instant answers for dates, times, live weather, medicine routines, and emergency contacts. What do you need right now?`,
    quickPrompts: [
      {
        label: 'Live Headlines & Weather 🌐',
        text: "Search the web for today's top news headlines and weather forecast 🌐",
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
    ],
  },
  complex: {
    id: 'complex',
    name: 'Dr. Smriti (Clinical Specialist)',
    shortName: 'Clinical',
    tagline: 'Complex geriatric dementia & caregiver intelligence (Live Web Search)',
    model: 'gemini-3.5-flash-lite',
    taskType: 'Caregiver & Clinical Advice',
    icon: Stethoscope,
    badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
    bgTint: 'bg-blue-50/50',
    borderColor: 'border-blue-200',
    avatarBg: 'bg-blue-800 text-white',
    welcomeMessage: (name) =>
      `Welcome to the Clinical Caregiver Consultation. I am Dr. Smriti, specialized in geriatric neuropsychology, MCI progression, and non-pharmacological behavioral care. Live Google Search grounding is enabled for the latest Alzheimer's trials and clinical approvals. How can I assist you today?`,
    quickPrompts: [
      {
        label: '2025/2026 Dementia Research 🌐',
        text: 'Search the web and explain the latest FDA approvals and clinical dementia trials 🌐',
        category: 'Live Search',
      },
      {
        label: 'Sundowning Protocol 🌅',
        text: 'How do I handle evening agitation or sundowning syndrome? 🌅',
        category: 'Clinical',
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
    ],
  },
};

export const GeminiChatView: React.FC<GeminiChatViewProps> = ({ user, onNavigateTab }) => {
  const patientName = user?.name || 'Asha Devi';
  const caregiverName = user?.caregiverName || 'Rohan Sharma';

  // Authentication State Detection: strictly distinguish between signed-in Google users vs guests
  const isUserLoggedIn = Boolean(
    (user?.isGoogleLinked && user?.email) || auth.currentUser?.email
  );
  const activeUserEmail = user?.email || auth.currentUser?.email || '';
  const activeUserId = auth.currentUser?.uid || user?.id || activeUserEmail;

  // ChatGPT-Style Thread Management
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string>('initial-thread');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  // Active Role and Messages for current conversation
  const [activeRole, setActiveRole] = useState<ChatRole>('companion');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial-welcome',
      role: 'model',
      text: ROLE_CONFIGS.companion.welcomeMessage(patientName),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: ROLE_CONFIGS.companion.model,
      roleUsed: 'companion',
    },
  ]);

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

  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  // Live clock timer
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

  // Responsive default sidebar visibility
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  }, []);

  // ============================================================================
  // DATABASE SYNCHRONIZATION FOR LOGGED-IN USERS (Firestore + Backend API)
  // Guests: strictly NOT saved to database. History is empty on other devices.
  // ============================================================================
  useEffect(() => {
    let isCancelled = false;

    async function loadUserThreads() {
      if (!isUserLoggedIn || !activeUserEmail) {
        // Guest: strictly clear database threads so guest session starts empty/transient
        setThreads([]);
        const initialThread: ChatThread = {
          id: `guest-${Date.now()}`,
          title: 'New Conversation',
          role: 'companion',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: [
            {
              id: 'initial-welcome',
              role: 'model',
              text: ROLE_CONFIGS.companion.welcomeMessage(patientName),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              modelUsed: ROLE_CONFIGS.companion.model,
              roleUsed: 'companion',
            },
          ],
        };
        setActiveThreadId(initialThread.id);
        setMessages(initialThread.messages);
        return;
      }

      setIsSyncing(true);
      try {
        // 1. Fetch from Firestore subcollection /users/{userId}/chatThreads
        const cloudThreads = await firestoreSyncService.getChatThreads(activeUserId);

        // 2. Fetch from Express Backend Scoped Database (/api/chat/threads)
        let backendThreads: ChatThread[] = [];
        try {
          const res = await fetch(`/api/chat/threads?email=${encodeURIComponent(activeUserEmail)}&userId=${encodeURIComponent(activeUserId)}`, {
            headers: {
              'x-user-email': activeUserEmail,
              'x-user-id': activeUserId,
            },
          });
          const data = await res.json();
          if (data.success && Array.isArray(data.threads)) {
            backendThreads = data.threads;
          }
        } catch (e) {
          console.warn('[Chat History] Backend threads notice:', e);
        }

        if (isCancelled) return;

        // Merge threads (deduplicating by ID, prioritizing newest updatedAt)
        const threadMap = new Map<string, ChatThread>();
        for (const t of [...cloudThreads, ...backendThreads]) {
          if (!t.id) continue;
          const existing = threadMap.get(t.id);
          if (!existing || new Date(t.updatedAt || t.createdAt).getTime() > new Date(existing.updatedAt || existing.createdAt).getTime()) {
            threadMap.set(t.id, t);
          }
        }

        const merged = Array.from(threadMap.values()).sort(
          (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        );

        if (merged.length > 0) {
          setThreads(merged);
          setActiveThreadId(merged[0].id);
          setMessages(merged[0].messages || []);
          setActiveRole(merged[0].role || 'companion');
        } else {
          // Initialize fresh first conversation for this user
          const newThread: ChatThread = {
            id: `thread-${Date.now()}`,
            title: 'Welcome to Saathi',
            role: 'companion',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            userEmail: activeUserEmail,
            userId: activeUserId,
            messages: [
              {
                id: 'welcome-init',
                role: 'model',
                text: ROLE_CONFIGS.companion.welcomeMessage(patientName),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                modelUsed: ROLE_CONFIGS.companion.model,
                roleUsed: 'companion',
              },
            ],
          };
          setThreads([newThread]);
          setActiveThreadId(newThread.id);
          setMessages(newThread.messages);
          // Save initial thread to cloud
          await saveThreadToDatabase(newThread);
        }
      } catch (err) {
        console.warn('[Chat History Load Error]:', err);
      } finally {
        if (!isCancelled) setIsSyncing(false);
      }
    }

    loadUserThreads();

    return () => {
      isCancelled = true;
    };
  }, [isUserLoggedIn, activeUserEmail, activeUserId]);

  // Persist updated thread to both Firestore and Backend database
  const saveThreadToDatabase = async (threadToSave: ChatThread) => {
    if (!isUserLoggedIn || !activeUserEmail) {
      // Guest: strictly do NOT save to database
      return;
    }

    try {
      // 1. Save to Cloud Firestore
      await firestoreSyncService.saveChatThread(threadToSave, activeUserId);

      // 2. Save to Express Backend DB
      await fetch('/api/chat/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': activeUserEmail,
          'x-user-id': activeUserId,
        },
        body: JSON.stringify({
          userEmail: activeUserEmail,
          userId: activeUserId,
          thread: threadToSave,
        }),
      });
    } catch (e) {
      console.warn('[Save Thread Notice]:', e);
    }
  };

  // Auto-scroll to bottom of messages container
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

  // Handle "+ New Chat" (ChatGPT style)
  const handleStartNewChat = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }

    const newThreadId = `thread-${Date.now()}`;
    const initialMsg: ChatMessage = {
      id: `welcome-${Date.now()}`,
      role: 'model',
      text: ROLE_CONFIGS[activeRole].welcomeMessage(patientName),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: ROLE_CONFIGS[activeRole].model,
      roleUsed: activeRole,
    };

    const newThread: ChatThread = {
      id: newThreadId,
      title: 'New Chat',
      role: activeRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      userEmail: isUserLoggedIn ? activeUserEmail : undefined,
      userId: isUserLoggedIn ? activeUserId : undefined,
      messages: [initialMsg],
    };

    setActiveThreadId(newThreadId);
    setMessages([initialMsg]);

    if (isUserLoggedIn) {
      setThreads((prev) => [newThread, ...prev]);
      saveThreadToDatabase(newThread);
    } else {
      setThreads([newThread]);
    }

    // Auto-close sidebar on mobile after starting new chat
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  // Switch to a previous conversation thread
  const handleSelectThread = (thread: ChatThread) => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }

    setActiveThreadId(thread.id);
    setMessages(thread.messages || []);
    if (thread.role && thread.role in ROLE_CONFIGS) {
      setActiveRole(thread.role);
    }

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  // Delete a conversation thread
  const handleDeleteThread = async (e: React.MouseEvent, threadId: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this chat conversation?')) return;

    if (isUserLoggedIn) {
      try {
        await firestoreSyncService.deleteChatThread(threadId, activeUserId);
        await fetch(`/api/chat/threads/${threadId}`, {
          method: 'DELETE',
          headers: {
            'x-user-email': activeUserEmail,
            'x-user-id': activeUserId,
          },
        });
      } catch (err) {
        console.warn('[Delete Thread Error]:', err);
      }
    }

    const remaining = threads.filter((t) => t.id !== threadId);
    setThreads(remaining);

    if (activeThreadId === threadId) {
      if (remaining.length > 0) {
        handleSelectThread(remaining[0]);
      } else {
        handleStartNewChat();
      }
    }
  };

  // Handle persona role change
  const handleSelectRole = (newRole: ChatRole) => {
    if (newRole === activeRole) return;
    setActiveRole(newRole);

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    }

    // Update active thread role
    if (threads.length > 0) {
      const updated = threads.map((t) => {
        if (t.id === activeThreadId) {
          const mod = { ...t, role: newRole, updatedAt: new Date().toISOString() };
          if (isUserLoggedIn) saveThreadToDatabase(mod);
          return mod;
        }
        return t;
      });
      setThreads(updated);
    }
  };

  // Send message to AI endpoint with real-time web grounding and thread persistence
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

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setLoading(true);

    // Auto-generate conversation title from the first query (OpenAI style)
    let currentThreadTitle = 'Conversation';
    const activeThread = threads.find((t) => t.id === activeThreadId);
    if (activeThread && activeThread.title && activeThread.title !== 'New Chat' && activeThread.title !== 'Welcome to Saathi') {
      currentThreadTitle = activeThread.title;
    } else {
      const cleanSnippet = messageContent.replace(/[?!.,]/g, '').trim();
      currentThreadTitle = cleanSnippet.length > 40 ? cleanSnippet.slice(0, 38) + '...' : cleanSnippet;
      currentThreadTitle = currentThreadTitle.charAt(0).toUpperCase() + currentThreadTitle.slice(1);
    }

    try {
      // Send concise history (last 6 turns)
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
          'x-user-email': activeUserEmail,
          'x-user-id': activeUserId,
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
      let botReplyText = '';
      let groundingSources: Array<{ title?: string; uri?: string }> = [];
      let modelUsed = ROLE_CONFIGS[activeRole].model;

      if (data.success && data.reply) {
        botReplyText = data.reply;
        groundingSources = data.groundingSources || [];
        modelUsed = data.modelUsed || modelUsed;
      } else {
        botReplyText = data.reply || 'Namaste! I am right here listening. Please ask again and we will explore it together.';
      }

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'model',
        text: botReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed,
        roleUsed: activeRole,
        isLiveAI: data.isLiveAI !== false,
        source: data.source || 'gemini-live',
        groundingSources,
        webSearchQueries: data.webSearchQueries || [],
      };

      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);

      // Update thread state
      const updatedThread: ChatThread = {
        id: activeThreadId,
        title: currentThreadTitle,
        role: activeRole,
        createdAt: activeThread?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastMessage: botReplyText.slice(0, 80),
        userEmail: isUserLoggedIn ? activeUserEmail : undefined,
        userId: isUserLoggedIn ? activeUserId : undefined,
        messages: finalMessages,
      };

      setThreads((prev) => {
        const filtered = prev.filter((t) => t.id !== activeThreadId);
        return [updatedThread, ...filtered];
      });

      // Save to database only if user is logged in
      if (isUserLoggedIn) {
        await saveThreadToDatabase(updatedThread);
      }

      // Auto-speak if speech synthesis is enabled
      if (autoSpeakReplies && botReplyText) {
        handleSpeak(botReplyText, botMessage.id);
      }
    } catch (err: any) {
      console.error('[Chat Error]:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        text: 'I am here with you, Asha ji. Please take a gentle sip of warm water and try asking again.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        error: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Web Speech Synthesis (Listen Aloud)
  const handleSpeak = (text: string, messageId: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setSpeakingId(messageId);

    const cleanText = text
      .replace(/[*_#`~]/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/\[VERIFIED REAL-TIME.*?\]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.lang = 'en-IN';

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

  // Copy message text to clipboard
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Web Speech Recognition (Mic Input)
  const handleToggleMic = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
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

  // Font size toggle
  const handleToggleFontSize = () => {
    const nextMode = fontSizeMode === 'normal' ? 'large' : fontSizeMode === 'large' ? 'xlarge' : 'normal';
    setFontSizeMode(nextMode);
    localStorage.setItem('smritisathi_chat_font_size', nextMode);
  };

  const currentConfig = ROLE_CONFIGS[activeRole];

  const fontClasses = {
    normal: 'text-sm sm:text-base leading-relaxed',
    large: 'text-base sm:text-lg leading-relaxed',
    xlarge: 'text-lg sm:text-xl leading-relaxed',
  }[fontSizeMode];

  // Group threads chronologically like ChatGPT ("Today", "Previous 7 Days", "Older")
  const groupedThreads = useMemo(() => {
    const filtered = threads.filter((t) =>
      t.title.toLowerCase().includes(searchFilter.toLowerCase())
    );

    const now = new Date();
    const today: ChatThread[] = [];
    const pastWeek: ChatThread[] = [];
    const older: ChatThread[] = [];

    const oneDayMs = 24 * 60 * 60 * 1000;
    const sevenDaysMs = 7 * oneDayMs;

    for (const t of filtered) {
      const date = new Date(t.updatedAt || t.createdAt);
      const diff = now.getTime() - date.getTime();
      if (diff < oneDayMs && now.getDate() === date.getDate()) {
        today.push(t);
      } else if (diff < sevenDaysMs) {
        pastWeek.push(t);
      } else {
        older.push(t);
      }
    }

    return { today, pastWeek, older };
  }, [threads, searchFilter]);

  return (
    <div className="flex-1 flex bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 h-[calc(100dvh-72px)] sm:h-[calc(100vh-72px)] overflow-hidden w-full relative transition-colors">
      {/* =========================================================================
          OPENAI CHATGPT-STYLE CONVERSATIONS SIDEBAR (Collapsible & Responsive)
         ========================================================================= */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-72 sm:w-80 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col h-full border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out shrink-0 shadow-lg lg:shadow-none ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'
        }`}
      >
        {/* Sidebar Header: Brand & New Chat */}
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-3 bg-white/70 dark:bg-slate-900/90">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FF6321] to-[#e04f11] flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">Chat History</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">ChatGPT-Style Sessions</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* "+ New Chat" Button */}
          <button
            type="button"
            onClick={handleStartNewChat}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#FF6321] to-[#ea580c] hover:from-[#e04f11] hover:to-[#c2410c] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          {/* Search conversations */}
          {threads.length > 3 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-[#FF6321]"
              />
            </div>
          )}
        </div>

        {/* Sidebar Middle: Conversation Thread List or Guest Promotion */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-4">
          {!isUserLoggedIn ? (
            /* GUEST MODE: Prominently explain that history is not saved across devices */
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 space-y-3">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-bold">
                <Lock className="w-4 h-4" />
                <span>Guest Mode (Not Saved)</span>
              </div>
              <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
                You are chatting as a <strong>guest</strong>. Your chat history is temporary and will <strong>not</strong> be saved to the database or synced to other devices.
              </p>
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="w-full py-2 px-3 rounded-lg bg-[#002045] dark:bg-white hover:bg-[#1a365d] dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400 dark:text-blue-600" />
                <span>Sign in with Google</span>
              </button>
            </div>
          ) : (
            /* AUTHENTICATED USER: Full ChatGPT history grouped by date */
            <>
              {isSyncing && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 px-2 py-1 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Syncing with Cloud Firestore...</span>
                </div>
              )}

              {threads.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
                  <p className="font-semibold">No saved conversations yet.</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Start chatting to automatically save your conversation!</p>
                </div>
              ) : (
                <>
                  {/* Today Group */}
                  {groupedThreads.today.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider px-2 py-0.5">Today</p>
                      {groupedThreads.today.map((thread) => (
                        <div
                          key={thread.id}
                          onClick={() => handleSelectThread(thread)}
                          className={`group flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                            activeThreadId === thread.id
                              ? 'bg-[#002045] dark:bg-blue-600 text-white shadow-xs'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${activeThreadId === thread.id ? 'text-[#FF6321] dark:text-amber-300' : 'text-slate-400 dark:text-slate-500'}`} />
                            <span className="truncate">{thread.title || 'Conversation'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteThread(e, thread.id)}
                            title="Delete conversation"
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Previous 7 Days Group */}
                  {groupedThreads.pastWeek.length > 0 && (
                    <div className="space-y-1 pt-2">
                      <p className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider px-2 py-0.5">Previous 7 Days</p>
                      {groupedThreads.pastWeek.map((thread) => (
                        <div
                          key={thread.id}
                          onClick={() => handleSelectThread(thread)}
                          className={`group flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                            activeThreadId === thread.id
                              ? 'bg-[#002045] dark:bg-blue-600 text-white shadow-xs'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${activeThreadId === thread.id ? 'text-[#FF6321] dark:text-amber-300' : 'text-slate-400 dark:text-slate-500'}`} />
                            <span className="truncate">{thread.title || 'Conversation'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteThread(e, thread.id)}
                            title="Delete conversation"
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Older Group */}
                  {groupedThreads.older.length > 0 && (
                    <div className="space-y-1 pt-2">
                      <p className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider px-2 py-0.5">Older</p>
                      {groupedThreads.older.map((thread) => (
                        <div
                          key={thread.id}
                          onClick={() => handleSelectThread(thread)}
                          className={`group flex items-center justify-between p-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                            activeThreadId === thread.id
                              ? 'bg-[#002045] dark:bg-blue-600 text-white shadow-xs'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${activeThreadId === thread.id ? 'text-[#FF6321] dark:text-amber-300' : 'text-slate-400 dark:text-slate-500'}`} />
                            <span className="truncate">{thread.title || 'Conversation'}</span>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteThread(e, thread.id)}
                            title="Delete conversation"
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-md transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Sidebar Footer: User Account Info */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {isUserLoggedIn ? (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {activeUserEmail.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-slate-900 dark:text-white font-bold truncate text-[11px]">{activeUserEmail}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                    <Cloud className="w-3 h-3 shrink-0" />
                    <span>Cloud Synced</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center py-1 flex items-center justify-center gap-1.5 font-medium">
              <CloudOff className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>Guest session: Not saved</span>
            </div>
          )}
        </div>
      </aside>

      {/* =========================================================================
          MAIN CHAT AREA (Adaptive for all devices)
         ========================================================================= */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-slate-50 dark:bg-slate-950 relative overflow-hidden transition-colors">
        {/* TOP APP BAR */}
        <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-3 sm:px-5 py-2.5 shrink-0 shadow-xs z-20 w-full box-border transition-colors">
          <div className="flex items-center justify-between gap-2 w-full">
            {/* Left: Sidebar Toggle, Persona Name & Title */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                title={isSidebarOpen ? 'Hide Chat History' : 'Show Chat History'}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
              >
                {isSidebarOpen ? (
                  <PanelLeftClose className="w-4 h-4" />
                ) : (
                  <PanelLeft className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={handleStartNewChat}
                title="Start a new chat conversation"
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-[#FF6321] hover:text-[#FF6321] transition-colors cursor-pointer shrink-0 hidden sm:flex items-center gap-1 text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5 text-[#FF6321]" />
                <span>New Chat</span>
              </button>

              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-8 h-8 rounded-xl ${currentConfig.avatarBg} flex items-center justify-center shrink-0 shadow-xs`}
                >
                  <currentConfig.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h1 className="font-extrabold text-xs sm:text-sm text-[#002045] dark:text-white truncate">
                      {threads.find((t) => t.id === activeThreadId)?.title || currentConfig.name}
                    </h1>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate hidden md:block font-medium">
                    {currentConfig.tagline}
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Persona Switcher, Senior Font Size & Cloud Status */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Persona Switcher Tabs */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
                <button
                  onClick={() => handleSelectRole('companion')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    activeRole === 'companion'
                      ? 'bg-white dark:bg-slate-700 text-[#002045] dark:text-white shadow-xs border border-slate-200 dark:border-slate-600'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#002045] dark:hover:text-white'
                  }`}
                  title="Saathi Memory Companion"
                >
                  <Heart className="w-3 h-3 text-rose-500 shrink-0" />
                  <span className="hidden sm:inline">Companion</span>
                </button>

                <button
                  onClick={() => handleSelectRole('quick')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    activeRole === 'quick'
                      ? 'bg-white dark:bg-slate-700 text-[#002045] dark:text-white shadow-xs border border-slate-200 dark:border-slate-600'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#002045] dark:hover:text-white'
                  }`}
                  title="Quick Anchor"
                >
                  <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                  <span className="hidden sm:inline">Quick</span>
                </button>

                <button
                  onClick={() => handleSelectRole('complex')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    activeRole === 'complex'
                      ? 'bg-white dark:bg-slate-700 text-[#002045] dark:text-white shadow-xs border border-slate-200 dark:border-slate-600'
                      : 'text-slate-600 dark:text-slate-400 hover:text-[#002045] dark:hover:text-white'
                  }`}
                  title="Clinical Specialist"
                >
                  <Stethoscope className="w-3 h-3 text-blue-600 shrink-0" />
                  <span className="hidden sm:inline">Clinical</span>
                </button>
              </div>

              {/* Cloud Sync Status / Sign In Button */}
              {isUserLoggedIn ? (
                <div
                  className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold"
                  title={`Chat history saved under ${activeUserEmail}`}
                >
                  <Cloud className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate max-w-[120px]">{activeUserEmail}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => signInWithGoogle()}
                  className="px-2.5 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  title="Sign in with Google to save chat history across devices"
                >
                  <LogIn className="w-3 h-3 text-[#4285F4]" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Senior Font Size Selector */}
              <button
                type="button"
                onClick={handleToggleFontSize}
                title={`Change font size (Current: ${fontSizeMode})`}
                className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#002045] dark:hover:border-blue-400 bg-slate-100 dark:bg-slate-800 text-xs font-black text-[#002045] dark:text-white transition-colors cursor-pointer flex items-center gap-0.5"
              >
                <Eye className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                <span>{fontSizeMode === 'normal' ? 'A' : fontSizeMode === 'large' ? 'A+' : 'A++'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* GUEST WARNING NOTIFICATION BANNER (When not logged in) */}
        {!isUserLoggedIn && (
          <div className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-xs text-amber-950 dark:text-amber-200 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>Guest Mode:</strong> Your chat history is temporary. To save and sync your conversations across devices, sign in with your Google account.
              </span>
            </div>
            <button
              type="button"
              onClick={() => signInWithGoogle()}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer transition-colors shadow-2xs"
            >
              Sign In with Google
            </button>
          </div>
        )}

        {/* CONVERSATION MESSAGE THREAD CONTAINER */}
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5 scroll-smooth bg-slate-50 dark:bg-slate-950 transition-colors"
        >
          <div className="max-w-3xl mx-auto space-y-4 sm:space-y-5">
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
                        ? 'bg-gradient-to-br from-[#FF6321] to-[#e04f11] text-white ring-2 ring-orange-200 dark:ring-orange-900/60'
                        : `${currentConfig.avatarBg} ring-2 ring-slate-200 dark:ring-slate-700`
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
                    <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <span>{isUser ? patientName : currentConfig.shortName}</span>
                      <span>·</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Text Bubble */}
                    <div
                      className={`relative p-3.5 sm:p-5 rounded-2xl shadow-xs break-words ${fontClasses} ${
                        isUser
                          ? 'bg-[#002045] dark:bg-blue-600 text-white rounded-tr-xs font-medium shadow-sm'
                          : msg.error
                          ? 'bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-200 rounded-tl-xs'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-xs font-normal shadow-xs'
                      }`}
                    >
                      <div className="whitespace-pre-wrap select-text leading-relaxed">{msg.text}</div>

                      {/* Grounding & Web Search Sources UI */}
                      {!isUser && msg.groundingSources && msg.groundingSources.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-sky-100 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/50 -mx-1 sm:-mx-2 px-2.5 py-2 rounded-xl">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-900 dark:text-sky-200 mb-1.5">
                            <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                            <span>Live Web Search Grounding</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-200/70 dark:bg-sky-800/60 text-sky-800 dark:text-sky-200 font-extrabold">
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
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-800 dark:text-sky-200 border border-sky-200 dark:border-sky-700 text-[11px] font-semibold transition-all shadow-2xs max-w-full truncate"
                                  title={source.title || source.uri}
                                >
                                  <span className="truncate max-w-[180px] sm:max-w-xs">{source.title || hostName}</span>
                                  <ExternalLink className="w-2.5 h-2.5 shrink-0 text-sky-500 dark:text-sky-400" />
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Bot Controls: Listen Aloud, Copy */}
                      {!isUser && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSpeak(msg.text, msg.id)}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-bold text-xs transition-all cursor-pointer active:scale-95 min-h-[32px] ${
                                isCurrentlySpeaking
                                  ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 ring-1 ring-rose-300 dark:ring-rose-700'
                                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[#002045] dark:text-white'
                              }`}
                              title="Listen aloud with gentle voice readout"
                            >
                              {isCurrentlySpeaking ? (
                                <>
                                  <VolumeX className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 animate-pulse" />
                                  <span className="font-extrabold text-rose-700 dark:text-rose-300">Stop</span>
                                  <div className="flex items-center gap-0.5 ml-1">
                                    <span className="w-1 h-3 bg-rose-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1 h-4 bg-rose-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1 h-2 bg-rose-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                  </div>
                                </>
                              ) : (
                                <>
                                  <Volume2 className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                                  <span>Listen</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopy(msg.text, msg.id)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Copy response"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
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
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-[#FF6321] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-[#002045] dark:bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                    Saathi is searching the live web and thinking...
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PROMPTS DRAWER & INPUT BAR */}
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4 z-20 shrink-0 transition-colors">
          <div className="max-w-3xl mx-auto space-y-2.5">
            {/* Quick Prompts Bar */}
            {showPromptsDrawer && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {currentConfig.quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(p.text)}
                    disabled={loading}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-[#002045] dark:hover:bg-blue-600 hover:text-white dark:hover:text-white text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs font-semibold"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input Form */}
            <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-slate-800/90 border-2 border-slate-200 dark:border-slate-700 focus-within:border-[#002045] dark:focus-within:border-blue-500 rounded-2xl p-1.5 shadow-xs transition-colors">
              <button
                type="button"
                onClick={handleToggleMic}
                className={`p-2.5 rounded-xl transition-all cursor-pointer shrink-0 ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'text-slate-500 dark:text-slate-400 hover:text-[#002045] dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title={isListening ? 'Stop listening' : 'Speak your question'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${currentConfig.shortName} anything (e.g. news, weather, dates, memories)...`}
                rows={1}
                className={`flex-1 bg-transparent border-0 outline-none resize-none py-2 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 max-h-32 ${fontClasses}`}
              />

              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || loading}
                className="p-2.5 rounded-xl bg-[#002045] hover:bg-[#12396b] dark:bg-blue-600 dark:hover:bg-blue-500 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shrink-0 shadow-xs"
                title="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
              <span>Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for new line</span>
              <span>
                {isUserLoggedIn ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Cloud className="w-3 h-3" /> Synced across your devices
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-medium">Guest mode: Not saved to database</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

