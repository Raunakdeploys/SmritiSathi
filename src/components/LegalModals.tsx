import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  Mail,
  MapPin,
  PhoneCall,
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  Clock,
  HeartHandshake,
} from 'lucide-react';
import { analytics } from '../utils/analytics';

interface LegalModalProps {
  type: 'privacy' | 'terms' | 'contact' | null;
  onClose: () => void;
}

export function LegalModals({ type, onClose }: LegalModalProps) {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactTopic, setContactTopic] = useState('caregiver_support');
  const [submitted, setSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<{ name?: string; email?: string; message?: string }>({});

  if (!type) return null;

  const validateForm = () => {
    const errors: { name?: string; email?: string; message?: string } = {};
    if (!contactName.trim()) errors.name = 'Please provide your name';
    if (!contactEmail.trim() || !contactEmail.includes('@')) errors.email = 'Please provide a valid email address';
    if (!contactMessage.trim() || contactMessage.trim().length < 10) errors.message = 'Please provide at least 10 characters in your message';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    analytics.logEvent('contact_form_submitted', 'safety', {
      topic: contactTopic,
      name: contactName,
    });
    setSubmitted(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-[#0b1d3a] text-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-blue-900/60 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-[#00142b]/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#002045]/10 text-white flex items-center justify-center font-bold">
              {type === 'privacy' && <ShieldCheck className="w-5 h-5 text-emerald-600" />}
              {type === 'terms' && <FileText className="w-5 h-5 text-blue-600" />}
              {type === 'contact' && <Mail className="w-5 h-5 text-[#FF6321]" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {type === 'privacy' && 'Privacy Policy & Data Dignity'}
                {type === 'terms' && 'Terms of Service & Clinical Disclaimer'}
                {type === 'contact' && 'Contact Support & Emergency Helplines'}
              </h2>
              <p className="text-xs text-slate-500">SmritiSaathi Cognitive Health Platform</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-blue-950 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700 leading-relaxed">
          {type === 'privacy' && (
            <>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <p className="font-bold">Zero Commercial Health Data Selling</p>
                  <p className="text-emerald-800 text-xs mt-0.5">
                    Your family memories, GPS safe zones, and cognitive test scores are protected under Indian Digital Personal Data Protection (DPDP) standards.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1">1. Information We Collect</h4>
                <p className="text-xs text-slate-600">
                  • Cognitive scores &amp; activity history to calculate memory trends.<br />
                  • Live Geofence coordinates (optional) only when Caregiver Wandering Mode is activated.<br />
                  • Photos uploaded for FaceBond / Reminiscence therapy stored privately in your secure browser and cloud bucket.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1">2. AI &amp; Voice Audio Processing</h4>
                <p className="text-xs text-slate-600">
                  Conversations with Saathi AI companion are processed in real time via secure Google Gemini GenAI APIs with Google Search grounding for facts. Voice readouts are synthesized on-device or via secure text-to-speech models.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1">3. Data Deletion &amp; Export</h4>
                <p className="text-xs text-slate-600">
                  Caregivers have full authority to export clinical session history or wipe all profile data instantly from Settings at any time.
                </p>
              </div>
            </>
          )}

          {type === 'terms' && (
            <>
              <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm">
                  <p className="font-bold">Medical Disclaimer &amp; Safe Use</p>
                  <p className="text-blue-800 text-xs mt-0.5">
                    SmritiSaathi is a supportive cognitive stimulation and caregiver assistance platform, not a replacement for formal clinical psychiatric diagnostics.
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1">1. Platform Scope</h4>
                <p className="text-xs text-slate-600">
                  SmritiSaathi provides reminiscence therapy, memory stimulation games, and wandering risk assistance. It is designed to assist family caregivers and senior citizens.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1">2. Emergency Situations</h4>
                <p className="text-xs text-slate-600">
                  In acute medical or psychiatric emergencies, immediate physical assistance must be sought via national emergency lines (112 / 14567) or local hospitals.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white mb-1">3. Caregiver Responsibility</h4>
                <p className="text-xs text-slate-600">
                  Caregivers remain responsible for monitoring senior physical health, prescription intake schedules, and physical living safety.
                </p>
              </div>
            </>
          )}

          {type === 'contact' && (
            <>
              {submitted ? (
                <div className="p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-white">Thank You for Reaching Out!</h3>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-sm mx-auto">
                    Your support inquiry has been received by the SmritiSaathi Care Team. A dedicated caregiver specialist will contact you within 24 hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      onClose();
                    }}
                    className="px-5 py-2 rounded-xl bg-[#002045] text-white text-xs font-bold shadow-xs hover:bg-[#003366] transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <>
                  {/* Emergency Helpline Banner */}
                  <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <PhoneCall className="w-5 h-5 text-[#FF6321] shrink-0" />
                      <div>
                        <p className="font-bold text-xs sm:text-sm">National Elder Helpline (Govt. of India)</p>
                        <p className="text-orange-800 text-xs">Toll-free 24/7 senior assistance &amp; rescue</p>
                      </div>
                    </div>
                    <a
                      href="tel:14567"
                      className="px-3.5 py-1.5 rounded-xl bg-[#FF6321] text-white font-extrabold text-xs shadow-xs hover:bg-[#e04f11] transition-colors flex items-center gap-1.5 shrink-0"
                    >
                      <span>Dial 14567</span>
                    </a>
                  </div>

                  {/* Physical Address & Operational Hub */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-[#00142b] border border-blue-900/60 text-xs">
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-800">SmritiSaathi Health Labs</p>
                        <p className="text-slate-600">Cognitive Wellness &amp; Assistive Tech Centre</p>
                        <p className="text-slate-500">Bengaluru, Karnataka 560038, India</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-800">Support Hours</p>
                        <p className="text-slate-600">Caregiver Assistance: Mon-Sat, 8am-8pm IST</p>
                        <p className="text-emerald-700 font-semibold">SOS &amp; Helpline: 24/7</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Form with Inline Error Validation */}
                  <form onSubmit={handleContactSubmit} className="space-y-3 pt-2">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Send a Message to Support</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Your Name *</label>
                        <input
                          type="text"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          placeholder="e.g. Rohan Sharma"
                          className={`w-full px-3 py-2 text-xs rounded-xl border ${formErrors.name ? 'border-rose-500 bg-rose-50' : 'border-blue-800'} focus:outline-none focus:ring-2 focus:ring-[#002045]`}
                        />
                        {formErrors.name && <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.name}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder="caregiver@example.com"
                          className={`w-full px-3 py-2 text-xs rounded-xl border ${formErrors.email ? 'border-rose-500 bg-rose-50' : 'border-blue-800'} focus:outline-none focus:ring-2 focus:ring-[#002045]`}
                        />
                        {formErrors.email && <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.email}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Inquiry Topic</label>
                      <select
                        value={contactTopic}
                        onChange={(e) => setContactTopic(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-blue-800 focus:outline-none focus:ring-2 focus:ring-[#002045]"
                      >
                        <option value="caregiver_support">Family Caregiver Onboarding</option>
                        <option value="geofence_assistance">GPS Geofence &amp; Safety Setup</option>
                        <option value="clinical_feedback">Clinical / Doctor Partnership</option>
                        <option value="feature_request">Suggestion / Memory Feature</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Message *</label>
                      <textarea
                        rows={3}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="How can we help your family with dementia or cognitive care?"
                        className={`w-full px-3 py-2 text-xs rounded-xl border ${formErrors.message ? 'border-rose-500 bg-rose-50' : 'border-blue-800'} focus:outline-none focus:ring-2 focus:ring-[#002045]`}
                      />
                      {formErrors.message && <p className="text-[11px] text-rose-600 mt-0.5">{formErrors.message}</p>}
                    </div>

                    <div className="pt-2 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-blue-950 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-[#002045] hover:bg-[#003366] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Message</span>
                      </button>
                    </div>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
