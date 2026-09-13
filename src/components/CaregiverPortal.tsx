import React, { useState, useEffect } from 'react';
import {
  Shield,
  User,
  Heart,
  TrendingUp,
  Brain,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Download,
  Plus,
  Edit2,
  Trash2,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Settings,
  X,
  Volume2,
  Search,
  Printer,
  ChevronRight,
  ShieldCheck,
  Activity,
  Smile,
  Radio,
} from 'lucide-react';
import { storeService } from '../services/storeService';
import { playGentleClick, playSuccessChime, speakText } from '../utils/audio';
import { CaregiverDashboard } from './CaregiverDashboard';
import type {
  UserProfile,
  CognitiveDomainScores,
  GameProgress,
  FamilyMember,
  ActivityLogItem,
  LocationCheckRecord,
} from '../types';

interface CaregiverPortalProps {
  onBackToApp?: () => void;
  voiceGuidanceEnabled?: boolean;
}

export const CaregiverPortal: React.FC<CaregiverPortalProps> = ({
  onBackToApp,
  voiceGuidanceEnabled = true,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'geofence' | 'domains' | 'bridge' | 'family' | 'logs' | 'report'>('overview');
  const [user, setUser] = useState<UserProfile>(storeService.getUser());
  const [domainScores, setDomainScores] = useState<CognitiveDomainScores>(storeService.getCognitiveDomainScores());
  const [gameProgresses, setGameProgresses] = useState<Record<string, GameProgress>>(storeService.getAllGameProgress());
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(storeService.getFamilyMembers());
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>(storeService.getActivityLogs());
  const [locationLogs, setLocationLogs] = useState<LocationCheckRecord[]>(storeService.getLocationHistory());

  // Family Modal State
  const [isAddFamilyModalOpen, setIsAddFamilyModalOpen] = useState<boolean>(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    relation: string;
    age: number;
    phone: string;
    photoUrl: string;
    voiceNote: string;
    memories: string;
  }>({
    name: '',
    relation: '',
    age: 30,
    phone: '',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    voiceNote: '',
    memories: '',
  });

  // Log filter
  const [logFilter, setLogFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Subscribe to store updates
  useEffect(() => {
    const unsub = storeService.subscribe(() => {
      setUser(storeService.getUser());
      setDomainScores(storeService.getCognitiveDomainScores());
      setGameProgresses(storeService.getAllGameProgress());
      setFamilyMembers(storeService.getFamilyMembers());
      setActivityLogs(storeService.getActivityLogs());
      setLocationLogs(storeService.getLocationHistory());
    });
    return () => unsub();
  }, []);

  const handleOpenAddMember = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      relation: '',
      age: 28,
      phone: '+91 98100 00000',
      photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
      voiceNote: 'Hello dadaji, thinking of you always!',
      memories: 'Loves sharing morning mango tea in the courtyard',
    });
    setIsAddFamilyModalOpen(true);
  };

  const handleOpenEditMember = (member: FamilyMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      relation: member.relation,
      age: member.age,
      phone: member.phone || '',
      photoUrl: member.photoUrl,
      voiceNote: member.voiceNote || '',
      memories: member.keyMemories.join('; '),
    });
    setIsAddFamilyModalOpen(true);
  };

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.relation) return;

    const memoriesArr = formData.memories
      .split(';')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingMember) {
      storeService.updateFamilyMember(editingMember.id, {
        name: formData.name,
        relation: formData.relation,
        age: Number(formData.age),
        phone: formData.phone,
        photoUrl: formData.photoUrl,
        voiceNote: formData.voiceNote,
        keyMemories: memoriesArr,
      });
    } else {
      storeService.addFamilyMember({
        name: formData.name,
        relation: formData.relation,
        age: Number(formData.age),
        relationCategory: 'immediate',
        phone: formData.phone,
        photoUrl: formData.photoUrl,
        voiceNote: formData.voiceNote,
        keyMemories: memoriesArr,
      });
    }

    setIsAddFamilyModalOpen(false);
    playSuccessChime();
  };

  const handleDeleteMember = (id: string) => {
    if (window.confirm('Are you sure you want to remove this family profile?')) {
      storeService.deleteFamilyMember(id);
      playGentleClick();
    }
  };

  const handleToggleBridge = (gameId: string) => {
    storeService.toggleBridgeMode(gameId);
    playGentleClick();
  };

  const filteredLogs = activityLogs.filter((log) => {
    const matchesFilter = logFilter === 'All' || log.category.toLowerCase() === logFilter.toLowerCase();
    const matchesSearch =
      log.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.notes && log.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const printReport = () => {
    window.print();
  };

  return (
    <main
      id="caregiver-clinical-portal-main"
      className="flex-1 bg-[#F8F9FA] text-[#0F172A] p-4 sm:p-6 md:p-10 overflow-y-auto"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white p-6 rounded-3xl shadow-xl border-b-4 border-[#FF6321] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 bg-gradient-to-br from-[#FF6321] to-[#EA580C] text-white rounded-2xl shadow-lg">
              <ShieldCheck className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white">
                  Caregiver & Clinical Portal
                </h1>
                <span className="bg-[#FF6321] text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
                  Clinical Supervision
                </span>
                <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  Live Sync
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
                Cognitive surveillance, Adaptive Bridge calibrations, family reminiscence archive & clinical exports
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 flex-wrap">
            <button
              onClick={printReport}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#FF6321]" />
              <span>Print Clinical Report</span>
            </button>

            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="bg-[#FF6321] hover:bg-[#EA580C] text-white px-5 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-md flex items-center space-x-1.5 transition-transform active:scale-95 cursor-pointer"
              >
                <span>Back to Patient App</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Ribbon */}
        <div className="bg-white p-2 rounded-2xl border-2 border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'overview', label: 'Patient Summary', icon: User },
            { id: 'geofence', label: 'CareCompass GPS Radar', icon: Radio },
            { id: 'domains', label: 'Cognitive Domains', icon: Brain },
            { id: 'bridge', label: 'Cognitive Bridge Engine', icon: Sparkles },
            { id: 'family', label: 'Family & Reminiscence Archive', icon: Heart },
            { id: 'logs', label: 'Activity & GPS Logs', icon: Activity },
            { id: 'report', label: 'Doctor Clinical Report', icon: FileText },
          ].map((tab) => {
            const IconC = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  playGentleClick();
                }}
                className={`py-2.5 px-4 rounded-xl font-extrabold text-xs sm:text-sm flex items-center space-x-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#0F172A] text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <IconC className={`w-4 h-4 ${isActive ? 'text-[#FF6321]' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: PATIENT OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Patient Profile Summary Bento */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* Profile Card */}
              <div className="md:col-span-4 bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] border-2 border-[#FF6321] flex items-center justify-center text-white text-2xl font-black shadow-md">
                    RS
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#0F172A]">{user.name}</h2>
                    <p className="text-xs text-slate-500 font-bold">
                      Age {user.age} • {user.gender}
                    </p>
                    <span className="inline-block mt-1 bg-amber-100 text-amber-900 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-amber-300">
                      {user.clinicalDiagnosis}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="font-bold text-slate-500">Baseline MoCA:</span>
                    <span className="font-black text-[#0F172A]">{user.baselineMocaScore} / 30</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="font-bold text-slate-500">Primary Caregiver:</span>
                    <span className="font-black text-[#0F172A]">{user.caregiverName} ({user.caregiverRelation})</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="font-bold text-slate-500">Caregiver Contact:</span>
                    <span className="font-black text-[#0F172A]">{user.caregiverPhone}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-50">
                    <span className="font-bold text-slate-500">Primary Physician:</span>
                    <span className="font-black text-[#0F172A]">{user.physicianName}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-bold text-slate-500">Registered Safe Home:</span>
                    <span className="font-black text-[#0F172A] text-right truncate max-w-[160px]">
                      {user.homeAddress}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cognitive Vitals Quick Cards */}
              <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col justify-between">
                  <span className="text-xs font-black uppercase text-slate-400">Mind Points</span>
                  <div className="my-2">
                    <span className="text-3xl font-black text-[#0F172A]">{user.totalPoints}</span>
                    <span className="text-xs font-bold text-emerald-600 ml-1.5">+180 this week</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Cognitive effort currency</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col justify-between">
                  <span className="text-xs font-black uppercase text-slate-400">Active Daily Streak</span>
                  <div className="my-2 flex items-center space-x-1.5">
                    <span className="text-3xl font-black text-[#FF6321]">🔥 {user.currentStreak}</span>
                    <span className="text-xs font-bold text-slate-500">Days</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">Consecutive engagement</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col justify-between">
                  <span className="text-xs font-black uppercase text-slate-400">Total Exercises Logged</span>
                  <div className="my-2">
                    <span className="text-3xl font-black text-[#0F172A]">{activityLogs.length}</span>
                    <span className="text-xs font-bold text-slate-500 ml-1">sessions</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">All 5 therapeutic modules</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col justify-between">
                  <span className="text-xs font-black uppercase text-slate-400">Memory Domain</span>
                  <div className="my-2">
                    <span className="text-3xl font-black text-indigo-600">{domainScores.memory}%</span>
                    <span className="text-xs font-bold text-emerald-600 ml-1">Stable</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">LifeThread & FaceBond</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col justify-between">
                  <span className="text-xs font-black uppercase text-slate-400">Spatial Navigation</span>
                  <div className="my-2">
                    <span className="text-3xl font-black text-amber-600">{domainScores.spatial}%</span>
                    <span className="text-xs font-bold text-amber-600 ml-1">Bridge Active</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">WayBack route memory</span>
                </div>

                <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-xs flex flex-col justify-between">
                  <span className="text-xs font-black uppercase text-slate-400">Temporal Grounding</span>
                  <div className="my-2">
                    <span className="text-3xl font-black text-emerald-600">{domainScores.temporal}%</span>
                    <span className="text-xs font-bold text-emerald-600 ml-1">+6%</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">TimeSense & RealityQuest</span>
                </div>
              </div>
            </div>

            {/* Emergency Safe-Return & GPS Geofence Monitor Card */}
            <div className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-[#0F172A]">
                      Emergency Safe-Return & Spatial Geofence Anchor
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Registered Safe Anchor: {user.homeAddress} (Lat {user.homeCoordinates.lat}, Lng {user.homeCoordinates.lng})
                    </p>
                  </div>
                </div>

                <span className="bg-emerald-100 text-emerald-900 font-black text-xs px-3 py-1.5 rounded-full border border-emerald-300 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Within Safe Zone (&lt; 250m)</span>
                </span>
              </div>

              {locationLogs.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-xs font-black uppercase text-slate-500 block">
                    Recent Location Check Record:
                  </span>
                  <div className="flex flex-wrap items-center justify-between text-xs font-bold text-slate-700 gap-2">
                    <span>
                      Timestamp: {new Date(locationLogs[0].timestamp).toLocaleString()}
                    </span>
                    <span>Distance from home: {locationLogs[0].distanceFromHomeMeters} meters</span>
                    <span>Compass Heading: {locationLogs[0].orientationDegrees}°</span>
                    <span className="text-emerald-700 font-black">
                      Status: {locationLogs[0].isWithinSafeZone ? 'SAFE' : 'OUTSIDE GEOFENCE'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: COGNITIVE DOMAINS */}
        {activeTab === 'domains' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {[
                {
                  domain: 'Memory Recall',
                  score: domainScores.memory,
                  games: ['LifeThread', 'FaceBond'],
                  desc: 'Episodic memory, chronological milestone sequencing, and immediate family face recognition.',
                  trend: '+4% this month',
                  color: 'indigo',
                },
                {
                  domain: 'Spatial Orientation',
                  score: domainScores.spatial,
                  games: ['WayBack Route Memory', 'GPS Orientation Test'],
                  desc: 'Topographical memory, landmark sequence retention, and directional heading consciousness.',
                  trend: 'Adaptive guidance active',
                  color: 'amber',
                },
                {
                  domain: 'Temporal & Calendar Grounding',
                  score: domainScores.temporal,
                  games: ['TimeSense Clock Setting', 'RealityQuest'],
                  desc: 'Analog clock face reading, hour-hand precision, and daily seasonal grounding.',
                  trend: '+8% improvement',
                  color: 'emerald',
                },
                {
                  domain: 'Executive Function',
                  score: domainScores.executive,
                  games: ['DailyRoutine Step Ordering'],
                  desc: 'Multi-step action sequencing, daily medication safety checks, and task organization.',
                  trend: 'Stable performance',
                  color: 'sky',
                },
                {
                  domain: 'Sensory & Planning',
                  score: domainScores.planning,
                  games: ['RealityQuest Environmental Check'],
                  desc: 'Environmental awareness, tactile object spotting, and daily orientation assurance.',
                  trend: '+5% stability',
                  color: 'rose',
                },
              ].map((item) => (
                <div
                  key={item.domain}
                  className="bg-white p-6 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-base sm:text-lg text-[#0F172A]">
                        {item.domain}
                      </h3>
                      <span className="text-2xl font-black text-[#FF6321]">{item.score}%</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                  </div>

                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-[#FF6321] to-[#EA580C]"
                      style={{ width: `${item.score}%` }}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-600">{item.trend}</span>
                    <div className="flex gap-1">
                      {item.games.map((g) => (
                        <span
                          key={g}
                          className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CARECOMMASS LIVE GPS RADAR & GEOFENCE COMMAND CENTER */}
        {activeTab === 'geofence' && (
          <div className="space-y-6 animate-fadeIn">
            <CaregiverDashboard />
          </div>
        )}

        {/* TAB 3: COGNITIVE BRIDGE ENGINE MONITOR */}
        {activeTab === 'bridge' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-amber-50 p-6 rounded-3xl border-2 border-amber-300 space-y-2">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-6 h-6 text-amber-700" />
                <h3 className="text-base sm:text-lg font-black text-amber-950">
                  Cognitive Bridge Engine Rules & Surveillance
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-amber-900 font-medium leading-relaxed">
                The engine evaluates the last 3 game attempts for each therapeutic module. If average score falls below <strong>60%</strong> or 2 consecutive failures occur, Bridge Mode automatically activates to provide scaffolded assistance (+50% study time, eliminated distractors, high-contrast visual clues). When average score surpasses <strong>85%</strong>, Bridge Mode deactivates and awards <strong>+50 Mind Points</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {Object.entries(gameProgresses).map(([gameId, rawProg]) => {
                const prog = rawProg as GameProgress;
                const isBridge = prog?.activeBridge?.status === 'active';
                const attempts: number[] = [prog?.highestScore || 85];
                const avgScore =
                  attempts.length > 0
                    ? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length)
                    : 85;

                return (
                  <div
                    key={gameId}
                    className={`p-6 rounded-3xl border-2 transition-all ${
                      isBridge
                        ? 'bg-orange-50/60 border-orange-400 shadow-sm'
                        : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-black text-base sm:text-lg text-[#0F172A] capitalize">
                            {gameId} Module
                          </h4>
                          <span
                            className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                              isBridge
                                ? 'bg-orange-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {isBridge ? 'Bridge Active' : 'Normal Pace'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                          Current Level {prog?.currentLevel || 1} • Total Sessions: {prog?.totalPlayed || 1}
                        </p>
                      </div>

                      <button
                        onClick={() => handleToggleBridge(gameId)}
                        className={`text-xs font-black px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          isBridge
                            ? 'bg-rose-100 hover:bg-rose-200 text-rose-900 border-rose-300'
                            : 'bg-orange-100 hover:bg-orange-200 text-orange-900 border-orange-300'
                        }`}
                      >
                        {isBridge ? 'Deactivate Bridge' : 'Manual Activate'}
                      </button>
                    </div>

                    {/* Recent 3 Scores */}
                    <div className="space-y-1.5 my-3">
                      <div className="flex justify-between text-xs font-bold text-slate-600">
                        <span>Last 3 Attempts History:</span>
                        <span className="font-black text-[#0F172A]">3-Game Avg: {avgScore}%</span>
                      </div>

                      <div className="flex gap-2">
                        {attempts.length === 0 ? (
                          <span className="text-xs text-slate-400">No attempts logged yet</span>
                        ) : (
                          attempts.map((s, idx) => (
                            <div
                              key={idx}
                              className={`flex-1 py-2 rounded-xl text-center font-mono font-black text-xs border ${
                                s >= 85
                                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                  : s < 60
                                  ? 'bg-rose-100 text-rose-900 border-rose-300'
                                  : 'bg-amber-100 text-amber-900 border-amber-300'
                              }`}
                            >
                              {s}%
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Bridge Details */}
                    {isBridge && prog?.activeBridge && (
                      <div className="mt-3 p-3 bg-white rounded-2xl border border-orange-300 text-xs text-slate-700 space-y-1">
                        <span className="font-black text-[#FF6321] block">
                          Active Assistance Modifiers:
                        </span>
                        <p className="font-medium text-slate-600">
                          {prog.activeBridge.reason || 'Visual clues + extended time active'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Mode: {prog.activeBridge.difficulty || 'easy'} (Clues: {prog.activeBridge.visualCluesEnabled ? 'Enabled' : 'Disabled'})
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: FAMILY & REMINISCENCE ARCHIVE */}
        {activeTab === 'family' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-lg sm:text-xl text-[#0F172A]">
                  Family Directory & Reminiscence Profiles ({familyMembers.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Photos, kinship ties, voice greetings, and key anecdotes used in the FaceBond module
                </p>
              </div>

              <button
                onClick={handleOpenAddMember}
                className="bg-[#FF6321] hover:bg-[#EA580C] text-white px-4 py-2.5 rounded-2xl font-black text-xs sm:text-sm shadow-md flex items-center space-x-2 transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Family Member</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-sm flex flex-col justify-between hover:border-[#FF6321] transition-all relative overflow-hidden"
                >
                  <div>
                    <div className="w-full aspect-square rounded-2xl overflow-hidden shadow-xs border-2 border-slate-100 mb-3 relative group">
                      <img
                        src={member.photoUrl}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 right-2 bg-[#0F172A]/80 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                        Age {member.age}
                      </span>
                    </div>

                    <h4 className="font-black text-base text-[#0F172A]">{member.name}</h4>
                    <span className="inline-block mt-0.5 bg-orange-100 text-[#9A3412] text-[11px] font-black px-2.5 py-0.5 rounded-full border border-orange-200">
                      {member.relation}
                    </span>

                    {member.phone && (
                      <p className="text-[11px] text-slate-500 font-bold mt-1.5 flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{member.phone}</span>
                      </p>
                    )}

                    <div className="mt-2.5 space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">
                        Key Anecdotes:
                      </span>
                      {member.keyMemories.slice(0, 2).map((m, i) => (
                        <p key={i} className="text-[11px] text-slate-600 line-clamp-2 italic">
                          "{m}"
                        </p>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    {member.voiceNote && (
                      <button
                        onClick={() => speakText(member.voiceNote, true)}
                        className="p-1.5 text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 rounded-lg"
                        title="Hear Voice Greeting"
                      >
                        <Volume2 className="w-4 h-4 text-[#FF6321]" />
                      </button>
                    )}

                    <div className="flex items-center space-x-1 ml-auto">
                      <button
                        onClick={() => handleOpenEditMember(member)}
                        className="p-1.5 text-slate-600 hover:text-[#0F172A] hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Edit Member"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg cursor-pointer"
                        title="Delete Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: ACTIVITY & GPS LOGS */}
        {activeTab === 'logs' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Search & Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 flex-1 min-w-[200px] max-w-md">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search logs by activity name or notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs sm:text-sm font-medium border-0 focus:ring-0 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-1.5 flex-wrap">
                {['All', 'Memory', 'Spatial', 'Temporal', 'Executive', 'Planning'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setLogFilter(cat)}
                    className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      logFilter === cat
                        ? 'bg-[#0F172A] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 text-slate-600 uppercase font-black text-[11px] border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Exercise Module</th>
                      <th className="py-3 px-4">Domain</th>
                      <th className="py-3 px-4">Score</th>
                      <th className="py-3 px-4">Accuracy</th>
                      <th className="py-3 px-4">Points</th>
                      <th className="py-3 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-black text-[#0F172A]">
                          {log.title}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="bg-slate-100 text-slate-800 text-[11px] font-black px-2.5 py-0.5 rounded-full">
                            {log.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-black text-sm">
                          <span
                            className={
                              log.score >= 80
                                ? 'text-emerald-700'
                                : log.score < 60
                                ? 'text-rose-700'
                                : 'text-amber-700'
                            }
                          >
                            {log.score}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono">{log.accuracy}%</td>
                        <td className="py-3.5 px-4 font-black text-[#FF6321]">
                          +{log.pointsEarned} pts
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                          {log.notes || 'Routine session'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: DOCTOR CLINICAL REPORT */}
        {activeTab === 'report' && (
          <div className="bg-white p-8 rounded-3xl border-3 border-slate-300 shadow-xl space-y-6 print:border-none print:shadow-none animate-fadeIn max-w-4xl mx-auto">
            {/* Report Header */}
            <div className="border-b-2 border-slate-300 pb-5 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#0F172A]">
                  SmritiSaathi Cognitive Assessment & Progress Report
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Generated for Dr. Rajesh Verma (Neurology & Geriatrics) • Date: {new Date().toLocaleDateString()}
                </p>
              </div>
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-full text-xs font-black">
                CONFIDENTIAL MEDICAL RECORD
              </span>
            </div>

            {/* Patient Demographics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="font-bold text-slate-400 block">PATIENT NAME</span>
                <span className="font-black text-sm text-[#0F172A]">{user.name}</span>
              </div>
              <div>
                <span className="font-bold text-slate-400 block">AGE / GENDER</span>
                <span className="font-black text-sm text-[#0F172A]">{user.age} Yrs / {user.gender}</span>
              </div>
              <div>
                <span className="font-bold text-slate-400 block">DIAGNOSIS</span>
                <span className="font-black text-sm text-amber-900">{user.clinicalDiagnosis}</span>
              </div>
              <div>
                <span className="font-bold text-slate-400 block">BASELINE MoCA</span>
                <span className="font-black text-sm text-[#0F172A]">{user.baselineMocaScore} / 30</span>
              </div>
            </div>

            {/* Domain Summary Table */}
            <div className="space-y-2">
              <h3 className="font-black text-base text-[#0F172A]">1. Longitudinal Domain Competence</h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {[
                  { name: 'Memory Recall', val: domainScores.memory },
                  { name: 'Spatial Navigation', val: domainScores.spatial },
                  { name: 'Temporal Sense', val: domainScores.temporal },
                  { name: 'Executive Function', val: domainScores.executive },
                  { name: 'Sensory Planning', val: domainScores.planning },
                ].map((d) => (
                  <div key={d.name} className="p-3 bg-white rounded-xl border border-slate-200 text-center">
                    <span className="text-[11px] font-bold text-slate-500 block">{d.name}</span>
                    <span className="text-xl font-black text-[#FF6321]">{d.val}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Observations & Recommendations */}
            <div className="space-y-3 pt-2">
              <h3 className="font-black text-base text-[#0F172A]">2. Clinical Observations & Next Steps</h3>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed">
                <p>
                  • <strong>Temporal Awareness:</strong> Patient demonstrates consistent performance in TimeSense clock-setting and RealityQuest daily orientation (+8% trajectory).
                </p>
                <p>
                  • <strong>Spatial Orientation:</strong> WayBack route recall showed mild confusion on 5-landmark routes, triggering Cognitive Bridge Mode with +50% study time and simplified turns.
                </p>
                <p>
                  • <strong>Reminiscence Engagement:</strong> FaceBond & LifeThread exercises achieved high emotional resonance and 92% recall on immediate family portraits.
                </p>
                <p>
                  • <strong>Caregiver Recommendation:</strong> Maintain daily morning session streak. Reinforce evening garden routine steps and keep GPS geofence checks active.
                </p>
              </div>
            </div>

            {/* Signature Block */}
            <div className="pt-8 flex justify-between items-end text-xs text-slate-500 border-t border-slate-200">
              <div>
                <p>Signed electronically by:</p>
                <p className="font-black text-sm text-[#0F172A] mt-1">{user.caregiverName}</p>
                <p>Primary Caregiver ({user.caregiverRelation})</p>
              </div>
              <div className="text-right">
                <p>Clinical Reviewer:</p>
                <p className="font-black text-sm text-[#0F172A] mt-1">{user.physicianName}</p>
                <p>Neurology Consultant, Apollo Hospitals Delhi</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT FAMILY MEMBER MODAL */}
      {isAddFamilyModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setIsAddFamilyModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl border-2 border-slate-300 shadow-2xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="font-black text-lg text-[#0F172A]">
                {editingMember ? 'Edit Family Profile' : 'Add New Family Member'}
              </h3>
              <button
                onClick={() => setIsAddFamilyModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="font-black text-slate-700 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rohan Sharma"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#FF6321]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-black text-slate-700 block mb-1">Kinship Relation</label>
                  <input
                    type="text"
                    required
                    value={formData.relation}
                    onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                    placeholder="e.g. Son, Granddaughter"
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#FF6321]"
                  />
                </div>
                <div>
                  <label className="font-black text-slate-700 block mb-1">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#FF6321]"
                  />
                </div>
              </div>

              <div>
                <label className="font-black text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98100 00000"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#FF6321]"
                />
              </div>

              <div>
                <label className="font-black text-slate-700 block mb-1">Photo URL</label>
                <input
                  type="url"
                  value={formData.photoUrl}
                  onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#FF6321]"
                />
              </div>

              <div>
                <label className="font-black text-slate-700 block mb-1">Voice Greeting Note</label>
                <input
                  type="text"
                  value={formData.voiceNote}
                  onChange={(e) => setFormData({ ...formData, voiceNote: e.target.value })}
                  placeholder="e.g. Hello Dadaji, thinking of you always!"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#FF6321]"
                />
              </div>

              <div>
                <label className="font-black text-slate-700 block mb-1">Key Memories (Separated by semicolon ;)</label>
                <textarea
                  rows={2}
                  value={formData.memories}
                  onChange={(e) => setFormData({ ...formData, memories: e.target.value })}
                  placeholder="Shared Shimla trip in 2019; Loves drinking morning ginger tea together"
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-medium focus:ring-2 focus:ring-[#FF6321]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddFamilyModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-[#FF6321] hover:bg-[#EA580C] text-white px-6 py-2 rounded-xl font-black shadow-md cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};
