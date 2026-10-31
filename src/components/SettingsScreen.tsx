import React, { useState, useRef } from 'react';
import {
  Settings,
  Store,
  Globe,
  Database,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  CheckCircle,
  Camera,
  Trash2,
  RefreshCw,
  GitBranch,
} from 'lucide-react';
import { BusinessSettings, Currency } from '../types/pos';
import { translations } from '../i18n/translations';
import { PWAInstallButton } from './PWAInstallButton';
import { formatDate } from '../services/pdfReceipt';
import { ConfirmModal } from './FeedbackModal';

interface SettingsScreenProps {
  settings: BusinessSettings;
  onSaveSettings: (settings: BusinessSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (jsonContent: string) => { success: boolean; error?: string };
  onResetDemoData: () => void;
  onBumpVersion?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onSaveSettings,
  onExportBackup,
  onImportBackup,
  onResetDemoData,
  onBumpVersion,
}) => {
  const t = translations[settings.language];
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<BusinessSettings>({ ...settings });
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [pendingRestoreContent, setPendingRestoreContent] = useState<string | null>(null);
  const [restoreSuccessNotice, setRestoreSuccessNotice] = useState(false);

  // Logo file upload handler
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setImportNotice('লোগো ফাইলের সাইজ সর্বোচ্চ ২ মেগাবাইট (2MB) হতে পারবে!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setForm((prev) => ({ ...prev, logoUrl: event.target?.result as string }));
      setImportNotice(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(form);
    setSaveSuccessNotice(true);
    setTimeout(() => setSaveSuccessNotice(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setPendingRestoreContent(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmRestoreBackup = () => {
    if (!pendingRestoreContent) return;
    const res = onImportBackup(pendingRestoreContent);
    setPendingRestoreContent(null);
    if (res.success) {
      setRestoreSuccessNotice(true);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setImportNotice(res.error || 'ব্যাকআপ রিস্টোর ব্যর্থ হয়েছে');
    }
  };

  return (
    <div className="space-y-4 pb-24 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <span>{t.businessSettings}</span>
        </h2>
        <p className="text-xs text-slate-500">
          দোকানের নাম, ঠিকানা, লোগো, অ্যাপ ভার্শন ও ব্যাকআপ ব্যবস্থাপনা
        </p>
      </div>

      {saveSuccessNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t.savedSuccessfully} (নতুন ভার্শন {settings.appVersion} সফলভাবে আপডেট হয়েছে!)</span>
        </div>
      )}

      {importNotice && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center justify-between">
          <span>{importNotice}</span>
          <button onClick={() => setImportNotice(null)}>✕</button>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-4 text-xs">
        {/* Business Info Section */}
        <div>
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Store className="w-3.5 h-3.5 text-blue-500" />
            <span>দোকানের বিবরণ ও যোগাযোগ</span>
          </h3>

          {/* Logo Upload Box */}
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-750 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {form.logoUrl ? (
                <img
                  src={form.logoUrl}
                  alt="Shop Logo"
                  className="w-12 h-12 object-contain rounded-lg border border-slate-200 dark:border-slate-600 bg-white p-0.5"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-xl">
                  📦
                </div>
              )}
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                  দোকানের লোগো / ব্রান্ড ছবি
                </span>
                <span className="text-[11px] text-slate-400 block">
                  রসিদ ও হেডারে প্রদর্শিত হবে (PNG, JPG, সর্বোচ্চ 2MB)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{form.logoUrl ? 'পরিবর্তন' : 'আপলোড'}</span>
              </button>
              {form.logoUrl && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, logoUrl: '' })}
                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                  title="লোগো মুছুন"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                দোকানের নাম (বাংলা) *
              </label>
              <input
                type="text"
                required
                value={form.businessNameBn}
                onChange={(e) => setForm({ ...form, businessNameBn: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                দোকানের নাম (English)
              </label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => setForm({ ...form, businessName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                দোকানের স্লোগান / ট্যাগলাইন
              </label>
              <input
                type="text"
                value={form.slogan || ''}
                onChange={(e) => setForm({ ...form, slogan: e.target.value })}
                placeholder="যেমন: বিশ্বস্ত কোয়ালিটি পেপার ও কার্টুন বক্স"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                মালিকের নাম
              </label>
              <input
                type="text"
                value={form.ownerName}
                onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                মোবাইল নম্বর *
              </label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                ইমেইল ঠিকানা
              </label>
              <input
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="shop@example.com"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                চালান প্রিফিক্স
              </label>
              <input
                type="text"
                value={form.invoicePrefix}
                onChange={(e) => setForm({ ...form, invoicePrefix: e.target.value })}
                placeholder="KB"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-mono font-bold"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                দোকানের পূর্ণ ঠিকানা (রসিদে প্রদর্শিত হবে) *
              </label>
              <textarea
                required
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="দোকান নং, মার্কেট/রোড, থানা, জেলা"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs resize-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                রসিদের নিচের ধন্যবাদ বার্তা
              </label>
              <input
                type="text"
                value={form.receiptFooterMessage}
                onChange={(e) => setForm({ ...form, receiptFooterMessage: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
              />
            </div>
          </div>
        </div>

        {/* Currency & Appearance Section */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>মুদ্রা, ভাষা ও মোড</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                মুদ্রা প্রতীক (Currency)
              </label>
              <select
                value={form.currencyCode}
                onChange={(e) => {
                  const code = e.target.value as Currency;
                  const symMap: Record<Currency, string> = { BDT: '৳', USD: '$', EUR: '€', INR: '₹', GBP: '£' };
                  setForm({ ...form, currencyCode: code, currencySymbol: symMap[code] || '৳' });
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
              >
                <option value="BDT">টাকা - BDT (৳)</option>
                <option value="USD">US Dollar - USD ($)</option>
                <option value="EUR">Euro - EUR (€)</option>
                <option value="INR">Indian Rupee - INR (₹)</option>
                <option value="GBP">British Pound - GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                ডিফল্ট ভাষা
              </label>
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value as 'bn' | 'en' })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
              >
                <option value="bn">বাংলা (Bengali)</option>
                <option value="en">English</option>
              </select>
            </div>

            <div>
              <label className="font-semibold block text-slate-700 dark:text-slate-300 mb-1">
                থিম মোড (দিন ও রাত)
              </label>
              <select
                value={form.themeMode || 'light'}
                onChange={(e) => setForm({ ...form, themeMode: e.target.value as 'light' | 'dark' })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
              >
                <option value="light">দিন মোড ☀️ (Light Mode)</option>
                <option value="dark">রাত মোড 🌙 (Dark Mode)</option>
              </select>
            </div>
          </div>
        </div>

        {/* POS Options */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.allowNegativeStock}
              onChange={(e) => setForm({ ...form, allowNegativeStock: e.target.checked })}
              className="rounded text-blue-600"
            />
            <span className="text-slate-700 dark:text-slate-300">
              মজুদ শেষ হলেও ঋণাত্মক (Negative) স্টকে বিক্রয় করার অনুমতি দিন
            </span>
          </label>
        </div>

        {/* Save button */}
        <button
          type="submit"
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow cursor-pointer transition active:scale-[0.99]"
        >
          {t.saveChanges} (স্বয়ংক্রিয় ভার্শন আপডেট হবে)
        </button>
      </form>

      {/* App Version & Dynamic Revision Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                অ্যাপ ভার্শন ও স্বয়ংক্রিয় রিভিশন ট্র্যাকার
              </h3>
              <p className="text-[11px] text-slate-500">
                প্রতিটি এডিট বা ডাটা পরিবর্তনের সাথে সাথে ভার্শন স্বয়ংক্রিয়ভাবে বৃদ্ধি পায়
              </p>
            </div>
          </div>

          {onBumpVersion && (
            <button
              onClick={onBumpVersion}
              type="button"
              className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-indigo-100 cursor-pointer transition"
              title="ভার্শন রিভিশন বৃদ্ধি করুন"
            >
              <RefreshCw className="w-3 h-3" />
              <span>+১ ভার্শন বাড়ান</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-0.5">বর্তমান ভার্শন</span>
            <span className="font-bold font-mono text-indigo-600 dark:text-indigo-400 text-sm">
              {settings.appVersion || `v1.2.${settings.revisionCount || 1}`}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-0.5">মোট এডিট রিভিশন</span>
            <span className="font-bold font-mono text-slate-800 dark:text-slate-200 text-sm">
              #{settings.revisionCount || 1}
            </span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-750 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] text-slate-400 block mb-0.5">সর্বশেষ এডিট</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] block truncate">
              {settings.lastEditedAt ? formatDate(settings.lastEditedAt, 'bn-BD') : 'আজ'}
            </span>
          </div>
        </div>
      </div>

      {/* Backup and Restore Box */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-xs space-y-3">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-blue-500" />
          <span>{t.backupAndRestore}</span>
        </h3>
        <p className="text-xs text-slate-500">
          সম্পূর্ণ অফলাইন ডাটাবেজের (পণ্য, কাস্টমার, বিক্রয়, স্টক ও বাকি খাতা) ব্যাকআপ ফাইল ডাউনলোড ও রিস্টোর করুন।
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <button
            onClick={onExportBackup}
            className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>{t.exportBackup}</span>
          </button>

          <label className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-750 text-slate-700 dark:text-slate-200 font-semibold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer border border-slate-200 dark:border-slate-600 text-center">
            <Upload className="w-4 h-4 text-blue-500" />
            <span>{t.importBackup}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Reset Demo Data Button */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="py-2 px-3 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t.resetDemoData}</span>
          </button>
        </div>
      </div>

      {/* Android Debug APK Download Box */}
      <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-xl border border-blue-500/30 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              📦
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300">
                Android ইনস্টলেবল অ্যাপ (Debug APK)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Android SDK দিয়ে বিল্ড করা আসল সাইনড APK ফাইল। সাইজ: ~4.8 MB।
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-blue-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
              Offline POS Manager Debug APK
            </span>
            <p className="text-[11px] text-slate-500">
              ফোনে সরাসরি ইনস্টল করুন। Room Database ও SQLite সহ 100% অফলাইন কার্যকর।
            </p>
          </div>
          <a
            href="./downloads/app-debug.apk"
            download="app-debug.apk"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold rounded-lg flex items-center gap-2 transition shadow-xs text-xs whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>APK ডাউনলোড করুন (6.6 MB)</span>
          </a>
        </div>
      </div>

      {/* Complete Project ZIP Download Card */}
      <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-500/30 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold">
              🗜️
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-purple-700 dark:text-purple-300">
                সম্পূর্ণ প্রজেক্ট জিপ (Complete Project ZIP)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                সব সোর্স কোড, বিল্ট APK, কনফিগারেশন ও রিসোর্স ফাইল সহ সম্পূর্ণ প্রজেক্ট আর্কাইভ
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-purple-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
              Kagoj_Box_POS_Complete_Project.zip
            </span>
            <p className="text-[11px] text-slate-500">
              সমস্ত কোডবেস, APK_DOWNLOAD ফোল্ডার এবং প্রয়োজনীয় সমস্ত ফাইল একসাথে (22 MB)।
            </p>
          </div>
          <a
            href="./downloads/Kagoj_Box_POS_Complete_Project.zip"
            download="Kagoj_Box_POS_Complete_Project.zip"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-bold rounded-lg flex items-center gap-2 transition shadow-xs text-xs whitespace-nowrap cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>সব ফাইল জিপ ডাউনলোড (ZIP)</span>
          </a>
        </div>
      </div>

      {/* PWA & Mobile Installation Box */}
      <div className="bg-gradient-to-r from-emerald-900/20 to-teal-900/20 rounded-xl border border-emerald-500/30 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
              📱
            </div>
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                মোবাইলে ইনস্টল (PWA)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                ফোনের হোম স্ক্রিনে আসল অ্যাপের মতো আইকন রাখুন এবং ইন্টারনেট ছাড়া ব্যবহার করুন।
              </p>
            </div>
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-800 rounded-lg border border-emerald-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">
              স্বয়ংক্রিয় অফলাইন ক্যাশিং সক্রিয়
            </span>
            <p className="text-[11px] text-slate-500">
              সার্ভিস ওয়ার্কার ব্যাকগ্রাউন্ডে প্রি-ক্যাশ করা আছে। নেট না থাকলেও অ্যাপ খুলবে।
            </p>
          </div>
          <PWAInstallButton language={settings.language} />
        </div>
      </div>

      {/* App Info Box */}
      <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>কাগজ বক্স - Offline POS Manager ({settings.appVersion || 'v1.2.1'})</span>
        </div>
        <span className="text-emerald-600 font-semibold">100% Offline Ready</span>
      </div>

      {/* Reset Demo Data Modal */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="ডেমো ডাটা রিসেট করবেন?"
        message="আপনি কি নিশ্চিত সব ডাটা মুছে প্রাথমিক ডেমো ডাটায় ফিরিয়ে নিতে চান? আপনার বর্তমান সমস্ত কাস্টম পণ্য ও বিক্রয়ের হিসাব মুছে যাবে।"
        confirmText="হ্যাঁ, রিসেট করুন"
        cancelText="বাতিল"
        tone="danger"
        onConfirm={() => {
          setIsResetConfirmOpen(false);
          onResetDemoData();
          window.location.reload();
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Restore Backup Modal */}
      <ConfirmModal
        isOpen={Boolean(pendingRestoreContent)}
        title="ব্যাকআপ ফাইল রিস্টোর নিশ্চিতকরণ"
        message="আপনি কি নিশ্চিত এই ব্যাকআপ ফাইলটি রিস্টোর করতে চান? পূর্বের সমস্ত ডাটা এই ফাইলের ডাটা দিয়ে প্রতিস্থাপিত হবে।"
        confirmText="হ্যাঁ, রিস্টোর করুন"
        cancelText="বাতিল"
        tone="warning"
        onConfirm={confirmRestoreBackup}
        onCancel={() => setPendingRestoreContent(null)}
      />

      {/* Restore Success Modal */}
      <ConfirmModal
        isOpen={restoreSuccessNotice}
        title="ডাটাবেজ রিস্টোর সফল হয়েছে!"
        message="আপনার সমস্ত পণ্য, কাস্টমার ও বিক্রয় রেকর্ড সফলভাবে রিস্টোর হয়েছে। অ্যাপটি রিলোড হচ্ছে..."
        confirmText="ঠিক আছে"
        cancelText=""
        tone="primary"
        onConfirm={() => window.location.reload()}
        onCancel={() => window.location.reload()}
      />
    </div>
  );
};
