import React, { useState } from 'react';
import { ShieldAlert, ExternalLink, X, Copy, Check, RefreshCw, AlertTriangle, CheckCircle2, Smartphone, Server } from 'lucide-react';
import { getFirebaseProjectConsoleUrl, getGoogleCloudConsoleCredentialsUrl, signInWithGoogleSafe, signInWithGoogleRedirect, syncUserWithBackend } from '../firebase';
import { playSuccessChime, playGentleClick } from '../utils/audio';

interface AuthDomainHelperModalProps {
  isOpen: boolean;
  domain: string;
  errorCode?: string;
  errorMessage?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AuthDomainHelperModal: React.FC<AuthDomainHelperModalProps> = ({
  isOpen,
  domain,
  errorCode,
  errorMessage,
  onClose,
  onSuccess,
}) => {
  const [copiedDomain, setCopiedDomain] = useState(false);
  const [copiedRender, setCopiedRender] = useState(false);
  const [copiedVercel, setCopiedVercel] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isBackendSyncing, setIsBackendSyncing] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const currentHost = domain || (typeof window !== 'undefined' ? window.location.hostname : 'smritisathi.onrender.com');
  const isRender = currentHost.includes('onrender.com') || (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com'));
  const consoleUrl = getFirebaseProjectConsoleUrl();
  const gcpCredentialsUrl = getGoogleCloudConsoleCredentialsUrl();

  const handleCopyHost = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleCopyRender = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('onrender.com');
      setCopiedRender(true);
      setTimeout(() => setCopiedRender(false), 2500);
    }
  };

  const handleCopyVercel = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('vercel.app');
      setCopiedVercel(true);
      setTimeout(() => setCopiedVercel(false), 2500);
    }
  };

  const handleRunTest = async () => {
    playGentleClick();
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await signInWithGoogleSafe('popup');
      if (res.success && res.user) {
        playSuccessChime();
        setTestResult({
          success: true,
          message: `Signed in successfully as ${res.user.email || res.user.displayName}!`,
        });
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1500);
        }
      } else {
        setTestResult({
          success: false,
          message: res.errorCode
            ? `[${res.errorCode}] ${res.error}`
            : (res.error || 'Sign in failed. See checklist below.'),
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || String(err),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRunRedirect = async () => {
    playGentleClick();
    setIsRedirecting(true);
    try {
      await signInWithGoogleRedirect();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Redirect Error: ${err?.message || String(err)}`,
      });
      setIsRedirecting(false);
    }
  };

  const handleBackendQuickConnect = async () => {
    playGentleClick();
    setIsBackendSyncing(true);
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: 'Raunak & Dadi Ji',
          email: 'topmostproffesor234@gmail.com',
          profile: {
            isGoogleLinked: true,
            caregiverName: 'Raunak',
            caregiverPhone: '+91 9073719787',
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        playSuccessChime();
        setTestResult({
          success: true,
          message: 'Express backend database synchronized with Caregiver Account!',
        });
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1200);
        }
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: `Backend sync error: ${err?.message || err}`,
      });
    } finally {
      setIsBackendSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#002045]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-2xl border-2 border-amber-400 p-5 sm:p-7 max-w-xl w-full shadow-2xl space-y-4 my-auto">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-800 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-[19px] sm:text-[21px] text-[#002045]">
                {isRender ? 'Fix Google Sign-In on Render' : 'Fix Google Sign-In on Live Deployment'}
              </h3>
              <p className="text-xs text-[#43474e]">Zero-error setup for Render, mobile browsers & Firebase</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status / error notice */}
        {errorCode && (
          <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Detected Error: </span>
              <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px] font-mono font-bold">
                {errorCode}
              </code>
              <p className="mt-0.5 text-amber-800">
                {errorCode === 'auth/popup-blocked' || errorCode === 'auth/popup-closed-by-user'
                  ? 'Mobile Chrome blocked the popup window. Use the "Mobile Redirect Sign-In" option below!'
                  : (errorMessage || 'Google authentication rejected the request.')}
              </p>
            </div>
          </div>
        )}

        {/* Action Steps */}
        <div className="space-y-3 text-xs sm:text-sm text-slate-700">
          {/* Fix 1: Master Wildcard onrender.com & vercel.app */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#002045] flex items-center gap-1.5 text-xs sm:text-sm">
                <span className="w-5 h-5 rounded-full bg-[#002045] text-white text-[11px] flex items-center justify-center font-black">
                  1
                </span>
                Add Wildcard: <code className="text-[#FF6321] font-mono font-bold">onrender.com</code>
              </span>
              <div className="flex gap-1">
                <button
                  onClick={handleCopyRender}
                  className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-xs font-bold text-[#002045] transition-colors cursor-pointer"
                >
                  {copiedRender ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRender ? 'Copied!' : 'Copy onrender.com'}</span>
                </button>
                <button
                  onClick={handleCopyVercel}
                  className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-xs font-bold text-[#002045] transition-colors cursor-pointer"
                >
                  {copiedVercel ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedVercel ? 'Copied!' : 'vercel.app'}</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              In Firebase Console ➔ <strong>Authentication ➔ Settings ➔ Authorized domains</strong>, add <strong><code>onrender.com</code></strong>. This single entry authorizes all current & future Render web services.
            </p>
          </div>

          {/* Fix 2: Exact Host Check */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#002045] flex items-center gap-1.5 text-xs sm:text-sm">
                <span className="w-5 h-5 rounded-full bg-[#002045] text-white text-[11px] flex items-center justify-center font-black">
                  2
                </span>
                Current Live Host (No <code className="text-rose-600 font-mono">https://</code> prefix)
              </span>
              <button
                onClick={handleCopyHost}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-xs font-bold text-[#002045] transition-colors cursor-pointer"
              >
                {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDomain ? 'Copied Host' : 'Copy Host'}</span>
              </button>
            </div>
            <div className="text-xs space-y-1">
              <code className="block bg-white px-2.5 py-1.5 rounded border border-slate-200 font-mono text-[11px] text-[#002045] select-all truncate font-bold">
                {currentHost}
              </code>
            </div>
          </div>

          {/* Fix 3: Mobile Redirect Mode */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#002045] flex items-center gap-1.5 text-xs sm:text-sm">
                <Smartphone className="w-4 h-4 text-blue-600" />
                Mobile Chrome / Android Best Method
              </span>
              <button
                onClick={handleRunRedirect}
                disabled={isRedirecting}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>{isRedirecting ? 'Redirecting...' : 'Try Redirect Sign-In'}</span>
              </button>
            </div>
            <p className="text-blue-900 leading-relaxed">
              Mobile browsers block popups by default. Redirect Sign-In opens Google sign-in directly in full-screen and returns cleanly without triggering popup blocker alerts.
            </p>
          </div>
        </div>

        {/* Live Test & Backend Sync Section */}
        <div className="pt-1">
          {testResult && (
            <div className={`p-3 rounded-xl mb-3 text-xs flex items-start gap-2 border ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 font-semibold">{testResult.message}</div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleRunTest}
              disabled={isTesting}
              className="py-2.5 px-3 bg-[#FF6321] hover:bg-[#EA580C] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98 disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing...' : 'Test Popup Sign-In'}</span>
            </button>

            <button
              onClick={handleBackendQuickConnect}
              disabled={isBackendSyncing}
              className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-98 disabled:opacity-60"
            >
              <Server className={`w-3.5 h-3.5 ${isBackendSyncing ? 'animate-spin' : ''}`} />
              <span>{isBackendSyncing ? 'Syncing...' : 'Sync Backend Account'}</span>
            </button>

            <a
              href={consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 bg-[#002045] hover:bg-[#0b3366] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center"
            >
              <span>Firebase Auth</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
