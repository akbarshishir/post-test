import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  X,
  HelpCircle,
} from 'lucide-react';

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  tone?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface PromptDialogState {
  isOpen: boolean;
  title: string;
  message?: string;
  inputLabel?: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (val: string) => void;
  onCancel?: () => void;
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

export const ConfirmModal: React.FC<ConfirmDialogState> = ({
  isOpen,
  title,
  message,
  confirmText = 'নিশ্চিত করুন',
  cancelText = 'বাতিল',
  tone = 'primary',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const toneStyles = {
    danger: {
      btn: 'bg-rose-600 hover:bg-rose-700 text-white',
      iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
      icon: AlertTriangle,
    },
    warning: {
      btn: 'bg-amber-600 hover:bg-amber-700 text-white',
      iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
      icon: AlertTriangle,
    },
    primary: {
      btn: 'bg-blue-600 hover:bg-blue-700 text-white',
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
      icon: HelpCircle,
    },
  }[tone];

  const Icon = toneStyles.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up space-y-4"
      >
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${toneStyles.iconBg}`}
          >
            <Icon className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition active:scale-[0.98] ${toneStyles.btn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export const PromptModal: React.FC<PromptDialogState> = ({
  isOpen,
  title,
  message,
  inputLabel,
  placeholder,
  defaultValue = '',
  confirmText = 'দাখিল করুন',
  cancelText = 'বাতিল',
  onConfirm,
  onCancel,
}) => {
  const [val, setVal] = useState(defaultValue);

  useEffect(() => {
    setVal(defaultValue);
  }, [defaultValue, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up space-y-4"
      >
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            {title}
          </h3>
          {message && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {message}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {inputLabel && (
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {inputLabel}
            </label>
          )}
          <input
            type="text"
            autoFocus
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {cancelText}
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition active:scale-[0.98]"
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const ToastContainer: React.FC<{
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-3 sm:right-6 z-50 space-y-2 max-w-sm w-full pointer-events-none px-2 sm:px-0">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
          error: <XCircle className="w-4 h-4 text-rose-500 shrink-0" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
          info: <Info className="w-4 h-4 text-blue-500 shrink-0" />,
        };

        const bg = {
          success: 'bg-white dark:bg-slate-900 border-emerald-500/40 text-slate-800 dark:text-slate-100',
          error: 'bg-white dark:bg-slate-900 border-rose-500/40 text-slate-800 dark:text-slate-100',
          warning: 'bg-white dark:bg-slate-900 border-amber-500/40 text-slate-800 dark:text-slate-100',
          info: 'bg-white dark:bg-slate-900 border-blue-500/40 text-slate-800 dark:text-slate-100',
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3 rounded-xl border shadow-xl flex items-center justify-between gap-3 text-xs animate-slide-in backdrop-blur-md ${bg}`}
          >
            <div className="flex items-center gap-2">
              {icons[toast.type]}
              <span className="font-medium leading-tight">{toast.message}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
