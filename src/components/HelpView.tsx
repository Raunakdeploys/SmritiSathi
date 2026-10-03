import React, { useState } from 'react';
import type { UserProfile } from '../types';
import { speakText } from '../utils/audio';
import {
  ChevronDown,
  ChevronUp,
  Search,
  Volume2,
  ShieldCheck,
  Phone,
  HelpCircle,
  FolderGit2,
  Copy,
  Check,
  Terminal,
  Download,
  ArrowRight,
} from 'lucide-react';

import { ViewNavigationBar } from './ViewNavigationBar';

interface HelpViewProps {
  user: UserProfile | null;
  onBackToDashboard?: () => void;
}

interface FaqItem {
  id: string;
  category: 'Daily Use' | 'Safety' | 'Family Photos' | 'Mind Points' | 'Clinical' | 'GitHub & Code';
  question: string;
  answer: string;
  speechText: string;
}

export const HelpView: React.FC<HelpViewProps> = ({ user, onBackToDashboard }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({ 'faq-1': true, 'faq-github': true });
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const faqs: FaqItem[] = [
    {
      id: 'faq-1',
      category: 'Daily Use',
      question: 'How often should seniors engage in daily cognitive stimulation?',
      answer:
        'Just 5 to 10 minutes once per day (preferably in the morning following tea) is ideal. SmritiSaathi targets neuroplasticity across three fundamental pillars: spatial navigation (WayBack), kinship recognition (FaceBond), and executive sequencing (DailyRoutine).',
      speechText:
        'Engaging in 5 to 10 minutes of cognitive exercises each morning keeps neural plasticity stimulated and provides daily orientation.',
    },
    {
      id: 'faq-2',
      category: 'Safety',
      question: 'How does CareCompass GPS geofencing protect seniors from wandering?',
      answer:
        'CareCompass creates a safe metric perimeter around the home anchor. If patient coordinates exceed this threshold, the system immediately plays a gentle soothing audio reassurance on the patient’s tablet ("You are safe, Rohan is notified") and dispatches real-time WhatsApp coordinates to the family caregiver.',
      speechText:
        'CareCompass continuously monitors distance from home. If you step outside the safe zone, it reassures you and messages your family caregiver.',
    },
    {
      id: 'faq-3',
      category: 'Mind Points',
      question: 'What are Mind Points and how do I redeem them?',
      answer:
        'Mind Points are positive reinforcement earned upon completing memory drills, daily workouts, and reality quests. They can be redeemed in the Rewards Store for therapeutic herbal teas, large-print puzzle books, custom wooden-framed family prints, or eldercare charity meals.',
      speechText:
        'You earn Mind Points after each cognitive exercise. Click Redeem Rewards to claim tea packs or family prints.',
    },
    {
      id: 'faq-4',
      category: 'Family Photos',
      question: 'Can our family upload our own custom photos and voice greetings?',
      answer:
        'Yes! In the Settings tab under the Family Memory Album Database, caregivers can upload cherished photos of grandchildren, children, and spouses with personalized names, hints, and recorded audio greetings. These automatically appear in the FaceBond recognition game.',
      speechText:
        'Yes! Family members can add custom family photos and recorded greetings in the Settings tab.',
    },
    {
      id: 'faq-5',
      category: 'Clinical',
      question: 'What should we do during evening sundowning confusion?',
      answer:
        'Sundowning typically occurs between 4:30 PM and 7:30 PM. Geriatricians recommend turning on warm diffuse interior lighting before natural daylight fades, playing familiar classical melodies (Lata Mangeshkar, Santoor), validating feelings without arguing, and launching the Sensory Reality Quest.',
      speechText:
        'During evening sundowning, turn on warm lighting, play gentle music, and use the Sensory Reality Quest for comforting reassurance.',
    },
    {
      id: 'faq-6',
      category: 'Safety',
      question: 'What emergency hotlines can we call if we need immediate assistance?',
      answer:
        'In India, call the National Elder Helpline at toll-free 14567 for elder support, healthcare guidance, and rescue assistance. For acute medical emergencies or police assistance, dial 112 directly.',
      speechText:
        'Call the National Elder Helpline at 14567 or emergency services at 112 for immediate assistance.',
    },
    {
      id: 'faq-github',
      category: 'GitHub & Code',
      question: 'Why do folders like src/ not upload when pasting files into my friend’s GitHub repo?',
      answer:
        'When you use the web browser interface on GitHub.com ("Upload files"), GitHub’s web form does not support nested folder trees and silently ignores folders like src/, public/, and components/. To upload the complete project with all src/ files intact, use Git CLI in your terminal: `git init && git add . && git commit -m "Upload full project" && git remote add origin <repo-url> && git push -u origin main`. See the step-by-step GitHub Upload Guide above for copy-paste commands!',
      speechText:
        'GitHub web drag and drop skips nested folders like src. Use the 3 terminal Git commands shown in the guide above to upload the full repository.',
    },
  ];

  const categories = ['All', 'Daily Use', 'Safety', 'Mind Points', 'Family Photos', 'Clinical', 'GitHub & Code'];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const toggleAccordion = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <main
      id="help-view-main"
      className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 bg-white dark:bg-[#0a1128] text-[#002045] dark:text-slate-100 overflow-y-auto w-full min-w-0 max-w-full overflow-x-hidden box-border transition-colors pb-24"
    >
      {/* Universal Navigation Bar with Back & Close */}
      {onBackToDashboard && (
        <ViewNavigationBar
          title="Help & FAQ"
          breadcrumbs={[{ label: 'Dashboard', onClick: onBackToDashboard }]}
          onBack={onBackToDashboard}
          onClose={onBackToDashboard}
        />
      )}

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header with Last Updated Date */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-[#1e3a6a]">
          <div>
            <h1 className="font-extrabold text-[28px] md:text-[34px] leading-tight text-[#002045] dark:text-white">
              Help &amp; Clinical Assistance
            </h1>
            <p className="font-normal text-[16px] md:text-[18px] text-slate-600 dark:text-slate-300 mt-1">
              Accessible guidance for seniors, family caregivers, and clinical coordinators.
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">
              Last updated: September 30, 2026
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Geriatrician Reviewed</span>
            </span>
          </div>
        </div>

        {/* Quick Emergency / Caregiver Direct Dial Card */}
        <div className="p-6 bg-orange-50 dark:bg-[#251810] rounded-2xl border-2 border-orange-200 dark:border-[#853e1a] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-[#FF6321] text-white flex items-center justify-center shrink-0 shadow-md">
              <Phone className="w-7 h-7" />
            </div>
            <div>
              <h2 className="font-extrabold text-[20px] text-[#002045] dark:text-white">
                Primary Family Caregiver
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Contact: <strong>{user?.caregiverName || 'Rohan Sharma'}</strong> ({user?.caregiverPhone || '+91 98765 43210'})
              </p>
            </div>
          </div>
          <a
            href={`tel:${user?.caregiverPhone || '+919876543210'}`}
            className="bg-[#002045] dark:bg-blue-600 hover:bg-[#1a365d] dark:hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold text-base whitespace-nowrap cursor-pointer transition-transform active:scale-95 shadow-sm"
          >
            📞 Direct Call Caregiver
          </a>
        </div>

        {/* GitHub Repository Upload Guide Card (REQ: Fix folder upload issues) */}
        <div className="p-6 sm:p-7 bg-slate-900 text-white rounded-3xl border-2 border-blue-500/40 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <FolderGit2 className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-extrabold text-lg sm:text-xl text-white">
                    Uploading SmritiSaathi to Your Friend's GitHub Repo
                  </h2>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    Fix Missing Folders
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                  Why web drag-and-drop skips <code className="text-amber-300 bg-slate-800 px-1 py-0.5 rounded">src/</code> and how to upload the entire codebase flawlessly.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-3 text-xs sm:text-sm">
            <p className="text-slate-300 leading-relaxed">
              <strong className="text-white">Why folders don't upload:</strong> When you drag-and-drop or paste files directly into GitHub's website (<code className="text-sky-300">github.com</code>), the web browser upload form only accepts individual flat files and <strong className="text-rose-400">silently skips entire directories like src/, public/, and components/</strong>.
            </p>

            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4" />
                  <span>The 100% Reliable Fix (3-Step Git Terminal Command)</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const cmd = `git init\ngit add .\ngit commit -m "Upload complete SmritiSaathi codebase with src and public folders"\ngit branch -M main\ngit remote add origin https://github.com/YOUR_FRIEND_USERNAME/REPO_NAME.git\ngit push -u origin main --force`;
                    navigator.clipboard.writeText(cmd);
                    setCopiedSnippet('git');
                    setTimeout(() => setCopiedSnippet(null), 2500);
                  }}
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                >
                  {copiedSnippet === 'git' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Commands</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-sky-200 overflow-x-auto leading-relaxed select-all">
                {`# 1. Initialize git and include ALL src/ and nested folders
git init
git add .
git commit -m "Upload complete SmritiSaathi codebase with src and public folders"
git branch -M main

# 2. Link your friend's GitHub repo URL (replace with her repo URL)
git remote add origin https://github.com/FRIEND_USERNAME/REPO_NAME.git

# 3. Push all folders directly into main branch
git push -u origin main --force`}
              </pre>
            </div>

            <div className="pt-2 text-xs text-slate-400 flex items-center gap-2">
              <span className="text-amber-400">💡 Tip:</span>
              <span>Running these 3 commands pushes all <strong>src/</strong>, <strong>public/</strong>, and configuration files into her repository in less than 5 seconds without missing a single folder.</span>
            </div>
          </div>
        </div>

        {/* Expandable Accordion FAQ Section */}
        <div className="bg-white dark:bg-[#111e38] p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-[#1e3a6a] space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-[#002045] dark:text-blue-400" />
              <h2 className="font-extrabold text-[22px] text-[#002045] dark:text-white">
                Expandable Knowledge Base
              </h2>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#002045] dark:bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-[#0d182e] text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#162544]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Search FAQ bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions by topic (e.g. wandering, points, sundowning)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1e3a6a] bg-white dark:bg-[#0d182e] text-[#002045] dark:text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Accordion List */}
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="py-8 text-center text-slate-500 dark:text-slate-400">
                <p className="text-sm font-semibold">No questions matched your search.</p>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isExpanded = !!expandedIds[faq.id];
                return (
                  <div
                    key={faq.id}
                    className="border border-slate-200 dark:border-[#1e3a6a] rounded-xl bg-slate-50/50 dark:bg-[#0d182e] overflow-hidden transition-all shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => toggleAccordion(faq.id)}
                      aria-expanded={isExpanded}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-[#162544] transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-extrabold uppercase px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shrink-0">
                          {faq.category}
                        </span>
                        <span className="font-bold text-base sm:text-lg text-[#002045] dark:text-white truncate">
                          {faq.question}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            speakText(faq.speechText);
                          }}
                          title="Read question and answer aloud"
                          className="p-1.5 text-slate-500 hover:text-[#002045] dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
                        >
                          <Volume2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed border-t border-slate-200/60 dark:border-[#1e3a6a]">
                        <p>{faq.answer}</p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </main>
  );
};
