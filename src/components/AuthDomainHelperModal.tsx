import React, { useState } from 'react';
import { ShieldAlert, ExternalLink, X, Copy, Check, RefreshCw, AlertTriangle, CheckCircle2, KeyRound } from 'lucide-react';
import { getFirebaseProjectConsoleUrl, getGoogleCloudConsoleCredentialsUrl, signInWithGoogleSafe } from '../firebase';
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
  const [copiedWildcard, setCopiedWildcard] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const currentHost = domain || (typeof window !== 'undefined' ? window.location.hostname : 'your-app.vercel.app');
  const consoleUrl = getFirebaseProjectConsoleUrl();
  const gcpCredentialsUrl = getGoogleCloudConsoleCredentialsUrl();

  const handleCopyHost = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentHost);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2500);
    }
  };

  const handleCopyWildcard = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText('vercel.app');
      setCopiedWildcard(true);
      setTimeout(() => setCopiedWildcard(false), 2500);
    }
  };

  const handleRunTest = async () => {
    playGentleClick();
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await signInWithGoogleSafe();
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
            ? `Error [${res.errorCode}]: ${res.error}`
            : (res.error || 'Sign in failed. Check troubleshooting steps below.'),
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
                Fix Google Sign-In on Vercel
              </h3>
              <p className="text-xs text-[#43474e]">Step-by-step diagnostic & resolution checklist</p>
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
              <p className="mt-0.5 text-amber-800">{errorMessage || 'Google authentication rejected the domain or request.'}</p>
            </div>
          </div>
        )}

        {/* The 4 main reasons and fixes */}
        <div className="space-y-3 text-xs sm:text-sm text-slate-700">
          <p className="text-xs text-slate-600 font-semibold">
            If you already added your Vercel URL in Firebase Console but Google Sign-In still fails, here are the exact reasons why and how to fix them:
          </p>

          {/* Fix 1: Master Wildcard vercel.app */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#002045] flex items-center gap-1.5 text-xs sm:text-sm">
                <span className="w-5 h-5 rounded-full bg-[#002045] text-white text-[11px] flex items-center justify-center font-black">
                  1
                </span>
                Recommended: Add <code className="text-[#FF6321] font-mono">vercel.app</code>
              </span>
              <button
                onClick={handleCopyWildcard}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-xs font-bold text-[#002045] transition-colors cursor-pointer"
              >
                {copiedWildcard ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWildcard ? 'Copied!' : 'Copy vercel.app'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Vercel creates dynamic preview domains (e.g. <code>app-git-main.vercel.app</code>). Adding <strong><code>vercel.app</code></strong> authorizes <em>all</em> your past and future Vercel deployments in one single entry.
            </p>
          </div>

          {/* Fix 2: Protocol / Trailing slash syntax check */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#002045] flex items-center gap-1.5 text-xs sm:text-sm">
                <span className="w-5 h-5 rounded-full bg-[#002045] text-white text-[11px] flex items-center justify-center font-black">
                  2
                </span>
                Check URL Format (No <code className="text-rose-600">https://</code> or <code className="text-rose-600">/</code>)
              </span>
              <button
                onClick={handleCopyHost}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded-md text-xs font-bold text-[#002045] transition-colors cursor-pointer"
              >
                {copiedDomain ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedDomain ? 'Copied!' : 'Copy Host'}</span>
              </button>
            </div>
            <div className="text-xs space-y-1">
              <p className="text-slate-600">Firebase Authorized Domains rejects or ignores protocol prefixes:</p>
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2 rounded-lg">
                  ❌ https://{currentHost}/
                </div>
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2 rounded-lg font-bold">
                  ✅ {currentHost}
                </div>
              </div>
            </div>
          </div>

          {/* Fix 3: 2-5 minutes propagation delay */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 text-xs">
            <div className="font-bold text-[#002045] flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-[#002045] text-white text-[11px] flex items-center justify-center font-black">
                3
              </span>
              Propagation Cache (Wait 2 to 5 minutes)
            </div>
            <p className="text-slate-600 leading-relaxed pl-6">
              Google Auth servers cache authorized domain lists for 2–5 minutes. If you just added it, do a hard refresh (<code>Ctrl + Shift + R</code> or <code>Cmd + Shift + R</code>) or test in an <strong>Incognito Window</strong>.
            </p>
          </div>

          {/* Fix 4: Google Cloud Console OAuth Authorized Origins */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#002045] flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-[#002045] text-white text-[11px] flex items-center justify-center font-black">
                  4
                </span>
                Google Cloud Console OAuth Origin & Test Users
              </span>
              <a
                href={gcpCredentialsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-sky-700 hover:underline flex items-center gap-0.5 font-bold"
              >
                <span>Credentials</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-slate-600 leading-relaxed pl-6">
              In Google Cloud Console ➔ <strong>Credentials ➔ OAuth 2.0 Web Client</strong>, verify that <strong>Authorized JavaScript origins</strong> contains <code>https://{currentHost}</code>. If OAuth Consent Screen is in <em>Testing</em> mode, ensure your email is added under <em>Test Users</em>.
            </p>
          </div>
        </div>

        {/* Live Test Sign In Section */}
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
              className="py-2.5 px-4 bg-[#FF6321] hover:bg-[#EA580C] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98 disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing Sign-In...' : 'Test Google Sign-In Now'}</span>
            </button>

            <a
              href={consoleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 bg-[#002045] hover:bg-[#0b3366] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer text-center flex-1"
            >
              <span>Open Firebase Auth Settings</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
