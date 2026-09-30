import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PasswordVisibilityInputProps {
  id?: string;
  name?: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  success?: boolean;
  required?: boolean;
  className?: string;
  helpText?: string;
}

export const PasswordVisibilityInput: React.FC<PasswordVisibilityInputProps> = ({
  id,
  name,
  label,
  placeholder = '••••••••',
  value,
  onChange,
  error,
  success,
  required,
  className = '',
  helpText,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || `pwd-input-${Math.random().toString(36).substring(2, 6)}`;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          id={inputId}
          name={name}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helpText ? `${inputId}-help` : undefined}
          className={`w-full px-4 py-2.5 pr-12 text-sm rounded-xl border transition-all outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
            error
              ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20'
              : success
              ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
              : 'border-slate-300 dark:border-slate-700 focus:border-[#002045] focus:ring-2 focus:ring-[#002045]/20'
          }`}
        />

        <div className="absolute right-2.5 flex items-center gap-1.5">
          {success && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
          {error && <AlertCircle className="w-4 h-4 text-rose-500" />}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? 'Hide password' : 'Show password'}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-1 flex items-center gap-1"
        >
          <span>{error}</span>
        </p>
      )}

      {!error && helpText && (
        <p id={`${inputId}-help`} className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {helpText}
        </p>
      )}
    </div>
  );
};
