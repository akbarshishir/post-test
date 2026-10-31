import React, { useState } from 'react';
import { Download, Smartphone, CheckCircle, Share, X, HelpCircle, Laptop } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  language: 'bn' | 'en';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ language }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  // If already installed and running standalone, show verified badge
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold">
        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
        <span>{language === 'bn' ? 'অ্যাপ ইনস্টল্ড' : 'App Installed'}</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (!success) {
        setShowGuideModal(true);
      }
    } else {
      setShowGuideModal(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-bold shadow-md transition border border-emerald-400/30 active:scale-95"
        title={language === 'bn' ? 'মোবাইলে বা কম্পিউটারে অ্যাপটি ইনস্টল করুন' : 'Install as Native App'}
      >
        <Download className="w-3.5 h-3.5 animate-bounce" />
        <span>{language === 'bn' ? 'অ্যাপ ইনস্টল' : 'Install App'}</span>
      </button>

      {/* Installation Guide Modal (For iOS or when browser hides automatic prompt) */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in text-slate-900 dark:text-slate-100">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">
                    {language === 'bn' ? 'অ্যাপ হিসেবে ফোনে ইনস্টল করুন' : 'Install Offline POS Manager'}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'bn' ? '১০০% অফলাইন, হোম স্ক্রিন থেকে এক ক্লিকে ওপেন হবে' : '100% Offline with home screen icon'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If direct browser prompt is available, show trigger button */}
            {isInstallable && (
              <button
                onClick={async () => {
                  await install();
                  setShowGuideModal(false);
                }}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>{language === 'bn' ? 'সরাসরি ইনস্টল নিশ্চিত করুন' : 'Click to Install Now'}</span>
              </button>
            )}

            {/* Step-by-step guides for different platforms */}
            <div className="space-y-2.5 text-xs">
              {/* Android Chrome Guide */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 mb-1">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span>অ্যান্ড্রয়েড ফোন (Google Chrome):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 text-[11px] pl-1">
                  <li>ব্রাউজারের উপরের ডান কোণায় <b>৩ ডট মেনু (⋮)</b> তে চাপ দিন।</li>
                  <li>তালিকা থেকে <b>"Install app"</b> অথবা <b>"Add to Home screen" (হোম স্ক্রিনে যোগ করুন)</b> অপশনটি চাপুন।</li>
                  <li>আপনার ফোনের অ্যাপ ড্রয়ারে ও হোম স্ক্রিনে আসল অ্যাপের মতো আইকন যুক্ত হবে।</li>
                </ol>
              </div>

              {/* iOS Safari Guide */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 mb-1">
                  <Share className="w-4 h-4 text-blue-500" />
                  <span>আইফোন বা আইপ্যাড (Safari Browser):</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 text-[11px] pl-1">
                  <li>সাফারি ব্রাউজারের নিচের <b>Share (শেয়ার)</b> আইকনে চাপ দিন।</li>
                  <li>স্ক্রোল করে <b>"Add to Home Screen"</b> এ চাপ দিন।</li>
                  <li>উপরে <b>"Add"</b> বাটনে চাপলেই আপনার আইফোনে অ্যাপ তৈরি হয়ে যাবে।</li>
                </ol>
              </div>

              {/* PC / Laptop Guide */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 mb-1">
                  <Laptop className="w-4 h-4 text-purple-500" />
                  <span>কম্পিউটার বা ল্যাপটপ (Chrome / Edge):</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                  অ্যাড্রেস বারের ডানপাশে থাকা <b>ইনস্টল আইকন</b> এ ক্লিক করুন, অথবা ৩ ডট মেনু ➔ <b>"Save and share" ➔ "Install Offline POS Manager"</b> নির্বাচন করুন।
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition"
              >
                ঠিক আছে, বুঝতে পেরেছি
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
