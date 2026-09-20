import React from 'react';
import { ShieldAlert, ExternalLink, X, Copy, Check } from 'lucide-react';
import { getFirebaseProjectConsoleUrl } from '../firebase';

interface AuthDomainHelperModalProps {
  isOpen: boolean;
  domain: string;
  onClose: () => void;
}

export const AuthDomainHelperModal: React.FC<AuthDomainHelperModalProps> = ({
  isOpen,
  domain,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const currentHost = domain || (typeof window !== 'undefined' ? window.location.hostname : 'your-domain.vercel.app');
  const consoleUrl = getFirebaseProjectConsoleUrl();

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentHost);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#002045]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl border-2 border-amber-400 p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-800">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-[20px] text-[#002045]">Authorize Domain in Firebase</h3>
              <p className="text-xs text-[#43474e]">Required 1-time setup for Vercel / custom domains</p>
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

        <p className="text-sm text-[#334155] leading-relaxed">
          Google Sign-In blocked this request because your current domain isn't on Firebase's authorized list yet.
          The rest of SmritiSathi is working normally in local mode.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
            Domain to add in Firebase:
          </label>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-3 py-2 rounded-lg border border-slate-300 font-mono text-sm text-[#002045] select-all truncate font-bold">
              {currentHost}
            </code>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-[#002045] transition-colors cursor-pointer shrink-0"
              title="Copy domain"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-2 text-xs text-[#475569]">
          <p className="font-bold text-[#002045]">Quick 3-step fix (takes 30 seconds):</p>
          <ol className="list-decimal list-inside space-y-1 pl-1">
            <li>Open your <strong>Firebase Console ➔ Authentication</strong> settings</li>
            <li>Click the <strong>Authorized domains</strong> tab</li>
            <li>Click <strong>Add domain</strong> and paste <code>{currentHost}</code></li>
          </ol>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          <a
            href={consoleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 px-4 bg-[#002045] hover:bg-[#0b3366] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
          >
            <span>Open Firebase Settings</span>
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors cursor-pointer"
          >
            Continue in Guest Mode
          </button>
        </div>
      </div>
    </div>
  );
};
