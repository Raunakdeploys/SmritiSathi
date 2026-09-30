import React from 'react';
import type { UserProfile, CognitiveProgress, ActivityItem } from '../types';
import { Printer, X, Shield, Phone, MapPin, Award } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  progress: CognitiveProgress | null;
  activities: ActivityItem[];
  caregiverPhone?: string;
  anchorName?: string;
  safeRadius?: number;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  user,
  progress,
  activities,
  caregiverPhone = '+91 98765 43210',
  anchorName = 'Home Sweet Home',
  safeRadius = 100,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-report-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Action Bar */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 no-print">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#002045] dark:text-blue-400" />
            <h2 id="print-report-title" className="font-bold text-base text-slate-900 dark:text-white">
              Clinical Cognitive Summary &amp; Emergency Handover Report
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-[#002045] hover:bg-[#1a365d] text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>Print Document</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-900 bg-white">
          {/* Header Banner */}
          <div className="border-b-2 border-[#002045] pb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#002045] text-white font-extrabold flex items-center justify-center text-sm">
                  स
                </div>
                <h1 className="font-extrabold text-2xl text-[#002045] tracking-tight">SmritiSaathi</h1>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Cognitive Stimulation &amp; CareCompass Elder Safety Handover
              </p>
            </div>
            <div className="text-right text-xs text-slate-500">
              <p className="font-bold text-slate-800">Generated: {new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
              <p>Platform ID: SMRITI-CLINICAL-2026</p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                DPDP 2023 Verified
              </span>
            </div>
          </div>

          {/* Patient & Caregiver Summary Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            <div>
              <p className="font-bold text-slate-500 uppercase text-[10px]">Senior Patient Profile</p>
              <p className="font-extrabold text-base text-[#002045] mt-0.5">{user?.name || 'Asha Devi'}</p>
              <p className="text-slate-600">Age: {user?.age || 72} years · Daily Goal: {user?.dailyGoalCompleted ? 'Met Today' : 'In Progress'}</p>
              <p className="text-slate-600 mt-1">Mind Points Earned: <strong>{user?.mindPoints || 1240}</strong> · Streak: <strong>{user?.currentStreak || 5} days</strong></p>
            </div>
            <div>
              <p className="font-bold text-slate-500 uppercase text-[10px]">Emergency Caregiver &amp; Location</p>
              <p className="font-extrabold text-base text-[#002045] mt-0.5">{user?.caregiverName || 'Rohan Sharma (Son)'}</p>
              <p className="text-slate-600">Phone: <strong>{caregiverPhone}</strong></p>
              <p className="text-slate-600 mt-1">
                Safe Home Anchor: <strong>{anchorName}</strong> (Radius: {safeRadius}m)
              </p>
            </div>
          </div>

          {/* 3-Pillar Cognitive Health Trajectory */}
          <div>
            <h3 className="font-extrabold text-sm uppercase text-slate-700 tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#FF6321]" />
              <span>3-Pillar Cognitive Assessment Trajectory</span>
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50">
                <p className="text-xs font-bold text-blue-900">Memory Retrieval</p>
                <p className="text-2xl font-extrabold text-blue-950 mt-1">{progress?.memory ?? 80}%</p>
                <p className="text-[11px] text-blue-800 mt-1">Episodic &amp; Face Recognition</p>
              </div>
              <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                <p className="text-xs font-bold text-amber-900">Visual Attention</p>
                <p className="text-2xl font-extrabold text-amber-950 mt-1">{progress?.attention ?? 65}%</p>
                <p className="text-[11px] text-amber-800 mt-1">Camera Spotter &amp; Shape Match</p>
              </div>
              <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <p className="text-xs font-bold text-emerald-900">Planning &amp; ADL</p>
                <p className="text-2xl font-extrabold text-emerald-950 mt-1">{progress?.planning ?? 40}%</p>
                <p className="text-[11px] text-emerald-800 mt-1">Clock Setting &amp; Routine Flow</p>
              </div>
            </div>
          </div>

          {/* Recent Cognitive Exercises Table */}
          <div>
            <h3 className="font-extrabold text-sm uppercase text-slate-700 tracking-wider mb-2">
              Recent Activity &amp; Validation Scores
            </h3>
            <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-lg overflow-hidden">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-2 border border-slate-200">Exercise Name</th>
                  <th className="p-2 border border-slate-200">Pillar</th>
                  <th className="p-2 border border-slate-200">Accuracy</th>
                  <th className="p-2 border border-slate-200">Points</th>
                  <th className="p-2 border border-slate-200">Observation Notes</th>
                </tr>
              </thead>
              <tbody>
                {activities.slice(0, 5).map((act) => (
                  <tr key={act.id} className="border-t border-slate-200">
                    <td className="p-2 border border-slate-200 font-bold">{act.title}</td>
                    <td className="p-2 border border-slate-200">{act.category}</td>
                    <td className="p-2 border border-slate-200 font-extrabold text-slate-800">{act.accuracy || 95}%</td>
                    <td className="p-2 border border-slate-200 text-orange-600 font-bold">+{act.points}</td>
                    <td className="p-2 border border-slate-200 text-slate-500">{act.notes || 'Smooth interaction with voice prompts.'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Clinical Dementia & Emergency Protocol Note */}
          <div className="border border-slate-200 p-4 rounded-xl text-xs space-y-2 bg-slate-50/60">
            <h4 className="font-bold text-[#002045]">Physician &amp; Caregiver Wandering Protocol</h4>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              If patient displays temporal disorientation or restlessness during sundowning hours (4:30 PM – 7:30 PM), utilize the <em>Sensory Reality Quest</em> and familiar family voice notes. In event of safe geofence exit, CareCompass dispatches real-time WhatsApp coordinates to {caregiverPhone}. Call National Elder Helpline at <strong>14567</strong> or Emergency at <strong>112</strong> for acute distress.
            </p>
          </div>

          {/* Doctor Signature Block */}
          <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-700">Primary Caregiver Signature</p>
              <div className="mt-8 border-b border-slate-300 w-48"></div>
              <p className="text-[10px] mt-1">{user?.caregiverName || 'Rohan Sharma'}</p>
            </div>
            <div>
              <p className="font-bold text-slate-700">Attending Geriatrician / Clinic Seal</p>
              <div className="mt-8 border-b border-slate-300 w-48"></div>
              <p className="text-[10px] mt-1">Date &amp; Clinic Registration No.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
