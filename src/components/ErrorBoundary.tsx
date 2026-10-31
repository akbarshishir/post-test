import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetAndReload = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
          }
        });
      }
    } catch (e) {
      console.warn('Storage cleanup failed:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h2 className="text-xl font-bold text-white">
              অ্যাপ প্রদর্শনে সাময়িক সমস্যা হয়েছে
            </h2>

            <p className="text-xs text-slate-400 leading-relaxed">
              সাদা স্ক্রিন এড়াতে রিকভারি মোড চালু করা হয়েছে। নিচের বাটন চেপে অ্যাপ পুনরায় চালু করুন অথবা লোকাল ক্যাশে রিসেট করুন।
            </p>

            {this.state.error && (
              <div className="p-3 bg-slate-950/80 rounded-xl text-left border border-slate-700/50 text-[11px] font-mono text-rose-300 max-h-32 overflow-auto">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                <span>পুনরায় লোড করুন</span>
              </button>
              <button
                onClick={this.handleResetAndReload}
                className="flex-1 py-2.5 px-4 bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition border border-slate-600"
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>ডেটা রিসেট ও রিলোড</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
