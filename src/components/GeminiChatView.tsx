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
  Info
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  roleUsed?: string;
  error?: boolean;
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
    tagline: string;
    model: string;
    taskType: 'General Tasks' | 'Tasks That Happen Fast' | 'Particularly Complex Tasks';
    icon: typeof Heart;
    badgeColor: string;
    bgTint: string;
    borderColor: string;
    avatarBg: string;
    welcomeMessage: (name: string) => string;
    quickPrompts: string[];
  }
> = {
  companion: {
    id: 'companion',
    name: 'Saathi (Companion)',
    tagline: 'Warm memory friend & gentle conversational buddy',
    model: 'gemini-3.5-flash',
    taskType: 'General Tasks',
    icon: Heart,
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    bgTint: 'bg-rose-50/40',
    borderColor: 'border-rose-200',
    avatarBg: 'bg-[#002045] text-white',
    welcomeMessage: (name) =>
      `Namaste ${name || 'Asha ji'}! I am Saathi, your memory friend. I am right here with you to talk about pleasant memories, share warm stories of classic songs and seasons, or just keep you company. How are you feeling right now?`,
    quickPrompts: [
      'Tell me a nostalgic memory about classic Indian tea and rains ☕',
      'What are some fond memories of Lata Mangeshkar & Rafi songs? 🎵',
      'I feel a little forgetful today, can you comfort me? 🌸',
      'Suggest a peaceful memory exercise we can do together 🧠',
    ],
  },
  quick: {
    id: 'quick',
    name: 'Quick Anchor',
    tagline: 'Lightning-fast temporal & routine orientation',
    model: 'gemini-3.1-flash-lite',
    taskType: 'Tasks That Happen Fast',
    icon: Zap,
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    bgTint: 'bg-amber-50/40',
    borderColor: 'border-amber-200',
    avatarBg: 'bg-amber-600 text-white',
    welcomeMessage: (name) =>
      `Hello ${name || 'there'}! Quick Anchor active. I provide instant, snappy answers for dates, times, hydration, medicine routines, and emergency contacts. What do you need right now?`,
    quickPrompts: [
      'What day of the week and date is today? 📅',
      'What time is it right now? ⏰',
      'Did I take my morning medicine and water? 💊',
      'Who is my primary emergency family contact? 📞',
    ],
  },
  complex: {
    id: 'complex',
    name: 'Dr. Smriti (Clinical Specialist)',
    tagline: 'Complex geriatric dementia & caregiver intelligence',
    model: 'gemini-3.1-pro-preview',
    taskType: 'Particularly Complex Tasks',
    icon: Stethoscope,
    badgeColor: 'bg-blue-100 text-blue-900 border-blue-200',
    bgTint: 'bg-blue-50/40',
    borderColor: 'border-blue-200',
    avatarBg: 'bg-blue-800 text-white',
    welcomeMessage: (name) =>
      `Welcome to the Clinical Caregiver Consultation. I am Dr. Smriti, specialized in geriatric neuropsychology, MCI progression, and non-pharmacological behavioral care. How can I assist you with clinical guidance or caregiving today?`,
    quickPrompts: [
      'How do I handle evening agitation or sundowning syndrome? 🌅',
      'Explain the difference between age-related forgetfulness and MCI 🔬',
      'What are evidence-based Validation Therapy techniques for family? 🤝',
      'How can we prevent nighttime wandering in our home? 🚪',
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

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of chat thread
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
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
    if (window.confirm('Clear conversation history for this persona?')) {
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
        .slice(-12) // Keep last 12 turns for context continuity
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
        };
        setMessages((prev) => [...prev, botMessage]);

        // Auto-speak in companion mode if elder has voiceAssistance enabled
        if (activeRole === 'companion' && user?.preferences?.voiceAssistance) {
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
    utterance.rate = 0.9; // Slower, clear pace for seniors
    utterance.pitch = 1.0;

    // Try to pick an Indian English or warm English voice
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

  const currentConfig = ROLE_CONFIGS[activeRole];

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FA] h-[calc(100vh-72px)] overflow-hidden">
      {/* Top Bar: Persona Selection & Model Indicator */}
      <div className="bg-white border-b border-[#e2e8f0] px-4 sm:px-6 py-3 shrink-0 shadow-xs z-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Active persona header */}
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl ${currentConfig.avatarBg} flex items-center justify-center shadow-xs`}>
              <currentConfig.icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg text-[#002045] leading-tight">
                  {currentConfig.name}
                </h1>
                <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${currentConfig.badgeColor}`}>
                  {currentConfig.model}
                </span>
              </div>
              <p className="text-xs text-[#64748b] font-medium truncate max-w-md">
                {currentConfig.tagline} • <span className="text-[#002045] font-semibold">{currentConfig.taskType}</span>
              </p>
            </div>
          </div>

          {/* Role selector tabs */}
          <div className="flex items-center gap-1.5 bg-[#f1f5f9] p-1 rounded-xl self-start sm:self-auto border border-[#e2e8f0]">
            <button
              id="chat-role-companion"
              onClick={() => handleSelectRole('companion')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeRole === 'companion'
                  ? 'bg-white text-[#002045] shadow-xs border border-[#cbd5e1]'
                  : 'text-[#64748b] hover:text-[#002045]'
              }`}
            >
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>Companion (General)</span>
            </button>

            <button
              id="chat-role-quick"
              onClick={() => handleSelectRole('quick')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeRole === 'quick'
                  ? 'bg-white text-[#002045] shadow-xs border border-[#cbd5e1]'
                  : 'text-[#64748b] hover:text-[#002045]'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Anchor (Fast)</span>
            </button>

            <button
              id="chat-role-complex"
              onClick={() => handleSelectRole('complex')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeRole === 'complex'
                  ? 'bg-white text-[#002045] shadow-xs border border-[#cbd5e1]'
                  : 'text-[#64748b] hover:text-[#002045]'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
              <span>Clinical Specialist (Complex)</span>
            </button>

            <button
              id="chat-clear-history-btn"
              onClick={handleClearChat}
              title="Clear conversation"
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer ml-1"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Conversation Thread Container */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 scroll-smooth">
        <div className="max-w-3xl mx-auto space-y-5">
          {/* Persona System Role Card Notice */}
          <div className={`p-4 rounded-2xl border ${currentConfig.borderColor} ${currentConfig.bgTint} flex items-start gap-3 text-xs leading-relaxed text-[#334155]`}>
            <Sparkles className="w-5 h-5 text-[#002045] shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-[#002045] mb-0.5">
                Multi-Turn Intelligence Powered by {currentConfig.model}
              </p>
              <p className="text-[#475569]">
                Conversation history is continuously preserved across turns. Specific system instructions maintain the{' '}
                <strong>{currentConfig.name}</strong> role for {currentConfig.taskType.toLowerCase()}.
              </p>
            </div>
          </div>

          {/* Messages list */}
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isLastMessage = index === messages.length - 1;

            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${isUser ? 'flex-row-reverse' : 'flex-row'} group animate-fadeIn`}
              >
                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                    isUser ? 'bg-[#FF6321] text-white' : currentConfig.avatarBg
                  }`}
                >
                  {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>

                {/* Message Bubble Container */}
                <div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                  {/* Speaker Label & Timestamp */}
                  <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-[#64748b] font-medium">
                    <span>{isUser ? patientName : currentConfig.name}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                    {!isUser && msg.modelUsed && (
                      <span className="hidden sm:inline-block px-1.5 py-0.2 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[9px] font-mono">
                        {msg.modelUsed}
                      </span>
                    )}
                  </div>

                  {/* Bubble Content */}
                  <div
                    className={`relative p-4 sm:p-5 rounded-2xl shadow-xs text-sm sm:text-base leading-relaxed ${
                      isUser
                        ? 'bg-[#002045] text-white rounded-tr-xs font-medium'
                        : msg.error
                        ? 'bg-rose-50 border-2 border-rose-300 text-rose-900 rounded-tl-xs'
                        : 'bg-white border border-[#e2e8f0] text-[#0f172a] rounded-tl-xs font-normal'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>

                    {/* Action Bar for AI replies (Listen, Copy, Model info) */}
                    {!isUser && (
                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-[#64748b]">
                        <div className="flex items-center gap-2">
                          {/* Speak aloud button */}
                          <button
                            onClick={() => handleSpeak(msg.text, msg.id)}
                            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#002045] font-bold text-xs transition-colors cursor-pointer active:scale-95"
                            title="Read aloud"
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

                          {/* Copy button */}
                          <button
                            onClick={() => handleCopy(msg.text, msg.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="Copy message"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Retry button for error states */}
                        {msg.error && (
                          <button
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

          {/* Active Generation Indicator */}
          {loading && (
            <div className="flex gap-3 items-start animate-fadeIn">
              <div className={`w-9 h-9 rounded-2xl ${currentConfig.avatarBg} flex items-center justify-center shrink-0 shadow-xs`}>
                <Bot className="w-5 h-5 animate-spin" />
              </div>
              <div className="bg-white border border-[#e2e8f0] p-4 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#002045] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-[#FF6321] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs font-bold text-[#64748b]">
                  {currentConfig.name} is thinking via {currentConfig.model}...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Prompts Carousel */}
      <div className="px-4 sm:px-6 py-2 bg-white/90 border-t border-[#f1f5f9] shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <span className="text-[11px] font-extrabold uppercase text-[#94a3b8] tracking-wider shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#FF6321]" /> Suggested:
          </span>
          {currentConfig.quickPrompts.map((promptText, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(promptText)}
              disabled={loading}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-[#f8fafc] hover:bg-[#e2e8f0] text-[#1e293b] border border-[#cbd5e1] whitespace-nowrap transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {promptText}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Message Input Form */}
      <div className="p-4 sm:p-5 bg-white border-t border-[#e2e8f0] shrink-0 shadow-lg z-10">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 bg-[#f8fafc] border-2 border-[#cbd5e1] focus-within:border-[#002045] rounded-2xl p-1.5 transition-all shadow-inner"
          >
            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={handleToggleVoiceInput}
              title={isListening ? 'Stop listening' : 'Speak your message'}
              className={`p-3 rounded-xl transition-all cursor-pointer ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'text-[#64748b] hover:text-[#002045] hover:bg-[#e2e8f0]'
              }`}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input Field */}
            <input
              id="gemini-chat-input"
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening to your voice...'
                  : `Ask ${currentConfig.name} anything (multilingual)...`
              }
              disabled={loading}
              className="flex-1 bg-transparent px-2 py-2 text-sm sm:text-base text-[#0f172a] placeholder-[#94a3b8] font-medium focus:outline-none"
            />

            {/* Send Button */}
            <button
              id="gemini-chat-send-btn"
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="px-4 py-2.5 rounded-xl bg-[#002045] hover:bg-[#1a365d] disabled:opacity-40 text-white font-extrabold flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Elder Reassurance Footer Note */}
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-[#94a3b8]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Private & secure geriatric memory companion
            </span>
            <span>Active Model: <strong>{currentConfig.model}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
